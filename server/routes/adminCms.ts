import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { loadSnapshot, updateSnapshot, getDataPaths } from '../cms/store';
import {
  checkLoginThrottle,
  clearLoginFailures,
  createToken,
  hashPassword,
  recordLoginFailure,
  validatePasswordStrength,
  verifyPassword,
} from '../cms/auth';
import { requireAdmin, canEdit, canSeo, superOnly, type AuthedRequest } from '../middleware/adminAuth';
import { analyzePageSeo, analyzePostSeo } from '../cms/seoAnalyzer';
import { saveRevision, listRevisions, getRevision } from '../cms/revisions';
import { summarizeAnalytics } from '../cms/analyticsStore';
import { asyncRouter, HttpError } from '../http';
import type { AdminUser, BlogPost, CmsPage, CmsSnapshot, MenuItem, RedirectRule } from '../cms/types';
import { defaultSeoForPath } from '../cms/defaults';
import { aiUsageToday } from '../aiLimits';
import { PEXEN_SYSTEM_INSTRUCTION } from '../aiPrompt';

const ALLOWED_MIME = /^(image\/(png|jpe?g|webp|gif|svg\+xml|avif)|video\/(mp4|webm)|application\/pdf)$/;
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

function publicUser(u: AdminUser) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, lastLoginAt: u.lastLoginAt };
}

function pick<T extends object>(source: unknown, keys: (keyof T)[]): Partial<T> {
  const out: Partial<T> = {};
  if (!source || typeof source !== 'object') return out;
  for (const k of keys) {
    if (k in (source as object)) out[k] = (source as T)[k];
  }
  return out;
}

export function normalizePath(input: string): string {
  const cleaned = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9/-]+/g, '-')
    .replace(/\/{2,}/g, '/')
    .replace(/-{2,}/g, '-');
  const withSlashes = `/${cleaned.replace(/^\/+|\/+$/g, '')}/`;
  return withSlashes === '//' ? '/' : withSlashes;
}

export function slugify(input: string): string {
  return normalizePath(input).replace(/^\/|\/$/g, '').replace(/\//g, '-');
}

function sanitizeMenuItems(items: unknown, depth = 0): MenuItem[] {
  if (!Array.isArray(items)) throw new HttpError(400, 'Menu invalide');
  return items.map((raw) => {
    const it = raw as MenuItem;
    if (!it.label?.trim() || !it.path?.trim()) throw new HttpError(400, 'Chaque lien doit avoir un libellé et une destination');
    return {
      id: it.id || crypto.randomUUID(),
      label: it.label.trim(),
      path: it.path.trim(),
      openInNewTab: !!it.openInNewTab,
      highlight: !!it.highlight,
      children: depth === 0 && it.children?.length ? sanitizeMenuItems(it.children, 1) : undefined,
    };
  });
}

function sanitizeSnapshotForClient(s: CmsSnapshot) {
  const { oauthRefreshToken, ...google } = s.google;
  return {
    ...s,
    google: { ...google, hasRefreshToken: !!oauthRefreshToken },
    users: s.users.map(publicUser),
    formSubmissions: undefined,
    subscribers: undefined,
  };
}

export function createAdminCmsRouter() {
  const router = asyncRouter();

  /* ---------- Authentification ---------- */

  router.post('/login', async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) throw new HttpError(400, 'Identifiants requis');
    const key = `${req.ip}:${email.toLowerCase()}`;
    const throttle = checkLoginThrottle(key);
    if (!throttle.ok) {
      throw new HttpError(429, `Trop de tentatives. Réessayez dans ${Math.ceil(throttle.retryInSec! / 60)} min.`);
    }
    const s = await loadSnapshot();
    const user = s.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user || !verifyPassword(password, user)) {
      recordLoginFailure(key);
      throw new HttpError(401, 'E-mail ou mot de passe incorrect');
    }
    clearLoginFailures(key);
    await updateSnapshot((snap) => {
      const u = snap.users.find((x) => x.id === user.id);
      if (u) u.lastLoginAt = new Date().toISOString();
    });
    res.json({ token: createToken(user), user: publicUser(user) });
  });

  router.get('/me', requireAdmin(), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const user = s.users.find((u) => u.id === req.admin!.sub);
    if (!user) throw new HttpError(404, 'Utilisateur introuvable');
    res.json({ user: publicUser(user) });
  });

  router.put('/me/password', requireAdmin(), async (req: AuthedRequest, res) => {
    const { current, next } = req.body as { current?: string; next?: string };
    const s = await loadSnapshot();
    const user = s.users.find((u) => u.id === req.admin!.sub);
    if (!user || !current || !verifyPassword(current, user)) throw new HttpError(400, 'Mot de passe actuel incorrect');
    const weak = validatePasswordStrength(next || '');
    if (weak) throw new HttpError(400, weak);
    const { hash, salt } = hashPassword(next!);
    const updated = await updateSnapshot((snap) => {
      const u = snap.users.find((x) => x.id === user.id)!;
      u.passwordHash = hash;
      u.salt = salt;
    });
    res.json({ token: createToken(updated.users.find((u) => u.id === user.id)!) });
  });

  /* ---------- Lecture globale & tableau de bord ---------- */

  router.get('/snapshot', requireAdmin(), async (_req, res) => {
    res.json(sanitizeSnapshotForClient(await loadSnapshot()));
  });

  router.get('/dashboard', requireAdmin(), async (_req, res) => {
    const s = await loadSnapshot();
    const analytics = await summarizeAnalytics(30, new URL(s.settings.publicUrl).hostname);
    const seoScores = [
      ...s.pages.filter((p) => p.status === 'published').map((p) => analyzePageSeo(p).score),
      ...s.posts.filter((p) => p.status === 'published').map((p) => analyzePostSeo(p).score),
    ];
    res.json({
      analytics,
      counts: {
        pages: s.pages.length,
        publishedPages: s.pages.filter((p) => p.status === 'published').length,
        posts: s.posts.length,
        draftPosts: s.posts.filter((p) => p.status === 'draft').length,
        unreadSubmissions: s.formSubmissions.filter((x) => !x.read).length,
        submissions: s.formSubmissions.length,
        subscribers: s.subscribers.filter((x) => x.status === 'active').length,
        media: s.media.length,
      },
      seoAverage: seoScores.length ? Math.round(seoScores.reduce((a, b) => a + b, 0) / seoScores.length) : 0,
      recentSubmissions: s.formSubmissions.slice(0, 5),
      maintenance: s.settings.maintenance.enabled,
      health: {
        smtp: !!process.env.SMTP_HOST,
        gemini: !!process.env.GEMINI_API_KEY,
        google: s.google.connected,
        googleOAuthConfigured: !!process.env.GOOGLE_CLIENT_ID,
      },
    });
  });

  /* ---------- Réglages ---------- */

  router.put('/general', canEdit, async (req, res) => {
    const patch = pick<CmsSnapshot['general']>(req.body, [
      'legalName', 'baseline', 'slogan', 'phone', 'phoneClean', 'contactEmail', 'slaHours', 'address', 'timezone', 'locale',
    ]);
    if (patch.phone && !patch.phoneClean) {
      const digits = patch.phone.replace(/\D/g, '');
      patch.phoneClean = patch.phone.trim().startsWith('+') ? `+${digits}` : digits.startsWith('00') ? `+${digits.slice(2)}` : `+33${digits.replace(/^0/, '')}`;
    }
    await updateSnapshot((s) => {
      s.general = { ...s.general, ...patch };
    });
    res.json({ ok: true });
  });

  router.put('/branding', canEdit, async (req, res) => {
    const body = req.body as Partial<CmsSnapshot['branding']>;
    const patch = pick<CmsSnapshot['branding']>(body, ['siteName', 'tagline', 'logoUrl', 'logoDarkUrl', 'faviconUrl']);
    await updateSnapshot((s) => {
      s.branding = {
        ...s.branding,
        ...patch,
        colors: { ...s.branding.colors, ...(body.colors || {}) },
        fonts: { ...s.branding.fonts, ...(body.fonts || {}) },
      };
    });
    res.json({ ok: true });
  });

  router.put('/settings', superOnly, async (req, res) => {
    const body = req.body as Partial<CmsSnapshot['settings']>;
    const patch = pick<CmsSnapshot['settings']>(body, [
      'publicUrl', 'cookieBannerEnabled', 'analyticsEnabled', 'robotsTxtExtra', 'sitemapAuto',
    ]);
    if (patch.publicUrl) {
      try {
        new URL(patch.publicUrl);
      } catch {
        throw new HttpError(400, 'URL publique invalide');
      }
    }
    await updateSnapshot((s) => {
      s.settings = {
        ...s.settings,
        ...patch,
        maintenance: { ...s.settings.maintenance, ...(body.maintenance || {}) },
        seo: { ...s.settings.seo, ...(body.seo || {}) },
      };
    });
    res.json({ ok: true });
  });

  router.put('/seo-settings', canSeo, async (req, res) => {
    const patch = pick<CmsSnapshot['settings']['seo']>(req.body || {}, [
      'titleSeparator', 'titleSuffix', 'defaultOgImage', 'organizationName', 'organizationLogo', 'socialProfiles', 'googleVerification', 'bingVerification',
    ]);
    if (patch.socialProfiles && !Array.isArray(patch.socialProfiles)) throw new HttpError(400, 'Profils sociaux invalides');
    await updateSnapshot((s) => {
      s.settings.seo = { ...s.settings.seo, ...patch };
      if (typeof req.body?.robotsTxtExtra === 'string') s.settings.robotsTxtExtra = req.body.robotsTxtExtra.slice(0, 5000);
    });
    res.json({ ok: true });
  });

  router.put('/whatsapp', canEdit, async (req, res) => {
    const patch = pick<CmsSnapshot['whatsapp']>(req.body, [
      'enabled', 'number', 'defaultMessage', 'showOnMobile', 'showOnDesktop', 'position',
    ]);
    if (patch.number !== undefined && patch.number.replace(/\D/g, '').length < 8) throw new HttpError(400, 'Numéro WhatsApp invalide');
    await updateSnapshot((s) => {
      s.whatsapp = { ...s.whatsapp, ...patch };
    });
    res.json({ ok: true });
  });

  router.put('/floating-buttons', canEdit, async (req, res) => {
    const list = Array.isArray(req.body?.buttons) ? req.body.buttons : [];
    await updateSnapshot((s) => {
      s.floatingButtons = list.map((b: CmsSnapshot['floatingButtons'][number]) => ({
        id: b.id || crypto.randomUUID(),
        label: String(b.label || '').trim(),
        path: String(b.path || '').trim(),
        style: b.style || 'primary',
        enabled: !!b.enabled,
      }));
    });
    res.json({ ok: true });
  });

  router.get('/ai/info', superOnly, async (_req, res) => {
    res.json({ usage: aiUsageToday(), defaultSystemInstruction: PEXEN_SYSTEM_INSTRUCTION, configured: !!process.env.GEMINI_API_KEY });
  });

  router.put('/ai', superOnly, async (req, res) => {
    const patch = pick<CmsSnapshot['ai']>(req.body, [
      'enabled', 'model', 'temperature', 'maxMessagesPerSession', 'maxSessionsPerDayPerIp', 'maxTokensPerDayGlobal',
      'systemInstructionOverride', 'showOnPages',
    ]);
    if (patch.temperature !== undefined && (patch.temperature < 0 || patch.temperature > 1)) {
      throw new HttpError(400, 'La température doit être comprise entre 0 et 1');
    }
    await updateSnapshot((s) => {
      s.ai = { ...s.ai, ...patch };
    });
    res.json({ ok: true });
  });

  router.put('/newsletter', canEdit, async (req, res) => {
    const patch = pick<CmsSnapshot['newsletter']>(req.body, ['enabled', 'provider', 'doubleOptIn', 'welcomeEmailSubject', 'listId']);
    await updateSnapshot((s) => {
      s.newsletter = { ...s.newsletter, ...patch };
    });
    res.json({ ok: true });
  });

  router.put('/google', canSeo, async (req, res) => {
    const patch = pick<CmsSnapshot['google']>(req.body, ['searchConsoleProperty', 'analyticsPropertyId']);
    await updateSnapshot((s) => {
      s.google = { ...s.google, ...patch };
    });
    res.json({ ok: true });
  });

  router.put('/menus/:menuId', canEdit, async (req, res) => {
    const items = sanitizeMenuItems(req.body.items);
    await updateSnapshot((s) => {
      const menu = s.menus.find((m) => m.id === req.params.menuId);
      if (!menu) throw new HttpError(404, 'Menu introuvable');
      menu.items = items;
    });
    res.json({ ok: true });
  });

  router.put('/redirects', canSeo, async (req, res) => {
    const list = (Array.isArray(req.body?.redirects) ? req.body.redirects : []) as RedirectRule[];
    const seen = new Set<string>();
    const redirects = list.map((r) => {
      const from = normalizePath(String(r.from || ''));
      const to = String(r.to || '').trim();
      if (!to) throw new HttpError(400, `Destination manquante pour ${from}`);
      if (seen.has(from)) throw new HttpError(400, `Redirection en double : ${from}`);
      if (from === normalizePath(to)) throw new HttpError(400, `Redirection en boucle : ${from}`);
      seen.add(from);
      return { from, to: to.startsWith('http') ? to : normalizePath(to), permanent: r.permanent !== false };
    });
    await updateSnapshot((s) => {
      s.redirects = redirects;
    });
    res.json({ ok: true });
  });

  /* ---------- Pages ---------- */

  router.get('/pages', requireAdmin(), async (_req, res) => {
    const s = await loadSnapshot();
    res.json(s.pages.map((p) => ({ ...p, seoScore: analyzePageSeo(p).score })));
  });

  router.post('/pages', canEdit, async (req, res) => {
    const body = req.body as Partial<CmsPage>;
    if (!body.title?.trim()) throw new HttpError(400, 'Titre requis');
    const pagePath = normalizePath(body.path || body.title);
    const s = await loadSnapshot();
    if (s.pages.some((p) => p.path === pagePath)) throw new HttpError(409, `L'adresse ${pagePath} est déjà utilisée`);
    const t = new Date().toISOString();
    const page: CmsPage = {
      id: crypto.randomUUID(),
      path: pagePath,
      title: body.title.trim(),
      status: 'draft',
      contentSource: 'cms',
      template: body.template || 'default',
      blocks: body.blocks || [],
      seo: body.seo || defaultSeoForPath(pagePath, body.title.trim()),
      ...(body.project ? { project: body.project } : {}),
      createdAt: t,
      updatedAt: t,
    };
    await updateSnapshot((snap) => {
      snap.pages.push(page);
    });
    res.status(201).json(page);
  });

  router.put('/pages/:id', canSeo, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    const s = await loadSnapshot();
    const before = s.pages.find((p) => p.id === id);
    if (!before) throw new HttpError(404, 'Page introuvable');
    const body = req.body as Partial<CmsPage>;

    // Le rôle SEO ne peut modifier que les métadonnées.
    const patch: Partial<CmsPage> =
      req.admin!.role === 'seo'
        ? { seo: body.seo }
        : pick<CmsPage>(body, ['title', 'path', 'status', 'scheduledAt', 'contentSource', 'template', 'blocks', 'seo', 'project']);

    if (patch.path) {
      patch.path = normalizePath(patch.path);
      if (s.pages.some((p) => p.id !== id && p.path === patch.path)) throw new HttpError(409, `L'adresse ${patch.path} est déjà utilisée`);
    }
    if (patch.status === 'scheduled' && !(patch.scheduledAt || before.scheduledAt)) {
      throw new HttpError(400, 'Indiquez une date de publication');
    }

    await saveRevision({ entityType: 'page', entityId: id, label: before.title, snapshot: before, authorEmail: req.admin?.email });
    const updated = await updateSnapshot((snap) => {
      const idx = snap.pages.findIndex((p) => p.id === id);
      const next = { ...snap.pages[idx], ...patch, updatedAt: new Date().toISOString() };
      if (next.status === 'published' && !next.publishedAt) next.publishedAt = next.updatedAt;
      snap.pages[idx] = next;
    });
    const page = updated.pages.find((p) => p.id === id)!;
    res.json({ ...page, seoScore: analyzePageSeo(page).score });
  });

  router.delete('/pages/:id', superOnly, async (req, res) => {
    await updateSnapshot((s) => {
      const page = s.pages.find((p) => p.id === req.params.id);
      if (!page) throw new HttpError(404, 'Page introuvable');
      if (page.path === '/') throw new HttpError(400, "La page d'accueil ne peut pas être supprimée");
      s.pages = s.pages.filter((p) => p.id !== req.params.id);
    });
    res.json({ ok: true });
  });

  router.get('/pages/:id/revisions', requireAdmin(), async (req, res) => {
    const revs = await listRevisions('page', req.params.id);
    res.json(revs.map(({ snapshot, ...r }) => ({ ...r, title: snapshot.title })));
  });

  router.post('/pages/:id/revisions/:revId/restore', canEdit, async (req: AuthedRequest, res) => {
    const rev = await getRevision(req.params.revId);
    if (!rev || rev.entityType !== 'page' || rev.entityId !== req.params.id) throw new HttpError(404, 'Révision introuvable');
    const current = (await loadSnapshot()).pages.find((p) => p.id === req.params.id);
    if (current) await saveRevision({ entityType: 'page', entityId: current.id, label: current.title, snapshot: current, authorEmail: req.admin?.email });
    const updated = await updateSnapshot((s) => {
      const idx = s.pages.findIndex((p) => p.id === req.params.id);
      if (idx === -1) throw new HttpError(404, 'Page introuvable');
      s.pages[idx] = { ...(rev.snapshot as CmsPage), updatedAt: new Date().toISOString() };
    });
    res.json(updated.pages.find((p) => p.id === req.params.id));
  });

  /* ---------- Articles ---------- */

  router.get('/posts', requireAdmin(), async (_req, res) => {
    const s = await loadSnapshot();
    res.json(s.posts.map((p) => ({ ...p, seoScore: analyzePostSeo(p).score })));
  });

  router.post('/posts', canEdit, async (req: AuthedRequest, res) => {
    const body = req.body as Partial<BlogPost>;
    const title = body.title?.trim() || 'Nouvel article';
    const s = await loadSnapshot();
    let slug = slugify(body.slug || title);
    let n = 2;
    while (s.posts.some((p) => p.slug === slug)) slug = `${slugify(body.slug || title)}-${n++}`;
    const t = new Date().toISOString();
    const post: BlogPost = {
      id: crypto.randomUUID(),
      slug,
      title,
      excerpt: body.excerpt || '',
      coverImage: body.coverImage,
      blocks: body.blocks || [],
      seo: { ...defaultSeoForPath(`/blog/${slug}/`, title), slug, schemaType: 'Article' },
      status: 'draft',
      author: req.admin?.name,
      tags: body.tags || [],
      createdAt: t,
      updatedAt: t,
    };
    await updateSnapshot((snap) => {
      snap.posts.unshift(post);
    });
    res.status(201).json(post);
  });

  router.put('/posts/:id', canSeo, async (req: AuthedRequest, res) => {
    const id = req.params.id;
    const s = await loadSnapshot();
    const before = s.posts.find((p) => p.id === id);
    if (!before) throw new HttpError(404, 'Article introuvable');
    const body = req.body as Partial<BlogPost>;
    const patch: Partial<BlogPost> =
      req.admin!.role === 'seo'
        ? { seo: body.seo }
        : pick<BlogPost>(body, ['title', 'slug', 'excerpt', 'coverImage', 'blocks', 'seo', 'status', 'publishedAt', 'tags', 'author']);
    if (patch.slug) {
      patch.slug = slugify(patch.slug);
      if (s.posts.some((p) => p.id !== id && p.slug === patch.slug)) throw new HttpError(409, 'Ce slug est déjà utilisé');
    }
    await saveRevision({ entityType: 'post', entityId: id, label: before.title, snapshot: before, authorEmail: req.admin?.email });
    const updated = await updateSnapshot((snap) => {
      const idx = snap.posts.findIndex((p) => p.id === id);
      const next = { ...snap.posts[idx], ...patch, updatedAt: new Date().toISOString() };
      if (next.status === 'published' && !next.publishedAt) next.publishedAt = next.updatedAt;
      snap.posts[idx] = next;
    });
    const post = updated.posts.find((p) => p.id === id)!;
    res.json({ ...post, seoScore: analyzePostSeo(post).score });
  });

  router.delete('/posts/:id', canEdit, async (req, res) => {
    await updateSnapshot((s) => {
      if (!s.posts.some((p) => p.id === req.params.id)) throw new HttpError(404, 'Article introuvable');
      s.posts = s.posts.filter((p) => p.id !== req.params.id);
    });
    res.json({ ok: true });
  });

  router.get('/posts/:id/revisions', requireAdmin(), async (req, res) => {
    const revs = await listRevisions('post', req.params.id);
    res.json(revs.map(({ snapshot, ...r }) => ({ ...r, title: snapshot.title })));
  });

  router.post('/posts/:id/revisions/:revId/restore', canEdit, async (req, res) => {
    const rev = await getRevision(req.params.revId);
    if (!rev || rev.entityType !== 'post' || rev.entityId !== req.params.id) throw new HttpError(404, 'Révision introuvable');
    const updated = await updateSnapshot((s) => {
      const idx = s.posts.findIndex((p) => p.id === req.params.id);
      if (idx === -1) throw new HttpError(404, 'Article introuvable');
      s.posts[idx] = { ...(rev.snapshot as BlogPost), updatedAt: new Date().toISOString() };
    });
    res.json(updated.posts.find((p) => p.id === req.params.id));
  });

  /* ---------- SEO ---------- */

  router.get('/seo/overview', requireAdmin(), async (_req, res) => {
    const s = await loadSnapshot();
    res.json([
      ...s.pages.map((p) => ({ kind: 'page' as const, id: p.id, title: p.title, url: p.path, status: p.status, seo: p.seo, analysis: analyzePageSeo(p) })),
      ...s.posts.map((p) => ({ kind: 'post' as const, id: p.id, title: p.title, url: `/blog/${p.slug}/`, status: p.status, seo: p.seo, analysis: analyzePostSeo(p) })),
    ]);
  });

  /* ---------- Formulaires ---------- */

  router.get('/forms', requireAdmin(), async (_req, res) => {
    const s = await loadSnapshot();
    res.json({ forms: s.forms, submissions: s.formSubmissions });
  });

  router.put('/forms/:id', canEdit, async (req, res) => {
    const body = req.body as CmsSnapshot['forms'][number];
    const names = new Set<string>();
    for (const f of body.fields || []) {
      if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(f.name)) throw new HttpError(400, `Identifiant de champ invalide : « ${f.name} »`);
      if (names.has(f.name)) throw new HttpError(400, `Champ en double : ${f.name}`);
      names.add(f.name);
    }
    for (const e of body.recipientEmails || []) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new HttpError(400, `E-mail destinataire invalide : ${e}`);
    }
    await updateSnapshot((s) => {
      const idx = s.forms.findIndex((f) => f.id === req.params.id);
      if (idx === -1) throw new HttpError(404, 'Formulaire introuvable');
      s.forms[idx] = {
        ...s.forms[idx],
        ...pick<CmsSnapshot['forms'][number]>(body, ['name', 'recipientEmails', 'successPath', 'fields', 'enabled']),
      };
    });
    res.json({ ok: true });
  });

  router.patch('/submissions/:id', canEdit, async (req, res) => {
    await updateSnapshot((s) => {
      const sub = s.formSubmissions.find((x) => x.id === req.params.id);
      if (!sub) throw new HttpError(404, 'Message introuvable');
      if (typeof req.body.read === 'boolean') sub.read = req.body.read;
    });
    res.json({ ok: true });
  });

  router.delete('/submissions/:id', canEdit, async (req, res) => {
    await updateSnapshot((s) => {
      s.formSubmissions = s.formSubmissions.filter((x) => x.id !== req.params.id);
    });
    res.json({ ok: true });
  });

  /* ---------- Statistiques ---------- */

  router.get('/analytics', requireAdmin(), async (req, res) => {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);
    const s = await loadSnapshot();
    res.json(await summarizeAnalytics(days, new URL(s.settings.publicUrl).hostname));
  });

  /* ---------- Médias ---------- */

  router.get('/media', requireAdmin(), async (_req, res) => {
    res.json((await loadSnapshot()).media);
  });

  router.post('/media/upload', canEdit, async (req, res) => {
    const { filename, dataBase64, mimeType, alt } = req.body as { filename?: string; dataBase64?: string; mimeType?: string; alt?: string };
    if (!filename || !dataBase64 || !mimeType) throw new HttpError(400, 'Fichier requis');
    if (!ALLOWED_MIME.test(mimeType)) throw new HttpError(415, 'Format non pris en charge (images, MP4/WebM, PDF)');
    const buf = Buffer.from(dataBase64, 'base64');
    if (buf.length > MAX_UPLOAD_BYTES) throw new HttpError(413, 'Fichier trop lourd (15 Mo max)');
    const { UPLOADS_DIR } = getDataPaths();
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const ext = path.extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, '');
    const base = slugify(path.basename(filename, path.extname(filename))).slice(0, 60) || 'fichier';
    const safeName = `${base}-${crypto.randomBytes(4).toString('hex')}${ext}`;
    await fs.writeFile(path.join(UPLOADS_DIR, safeName), buf);
    const asset = {
      id: crypto.randomUUID(),
      filename: safeName,
      url: `/uploads/${safeName}`,
      mimeType,
      sizeBytes: buf.length,
      alt: alt || '',
      createdAt: new Date().toISOString(),
    };
    await updateSnapshot((s) => {
      s.media.unshift(asset);
    });
    res.status(201).json(asset);
  });

  router.patch('/media/:id', canEdit, async (req, res) => {
    await updateSnapshot((s) => {
      const m = s.media.find((x) => x.id === req.params.id);
      if (!m) throw new HttpError(404, 'Média introuvable');
      if (typeof req.body.alt === 'string') m.alt = req.body.alt;
    });
    res.json({ ok: true });
  });

  router.delete('/media/:id', canEdit, async (req, res) => {
    const s = await loadSnapshot();
    const asset = s.media.find((x) => x.id === req.params.id);
    if (!asset) throw new HttpError(404, 'Média introuvable');
    await updateSnapshot((snap) => {
      snap.media = snap.media.filter((x) => x.id !== asset.id);
    });
    await fs.unlink(path.join(getDataPaths().UPLOADS_DIR, path.basename(asset.filename))).catch(() => undefined);
    res.json({ ok: true });
  });

  /* ---------- Newsletter ---------- */

  router.get('/subscribers', canEdit, async (_req, res) => {
    res.json((await loadSnapshot()).subscribers.map(({ confirmToken, ...rest }) => rest));
  });

  router.patch('/subscribers/:id', canEdit, async (req, res) => {
    const status = req.body.status;
    if (!['pending', 'active', 'unsubscribed'].includes(status)) throw new HttpError(400, 'Statut invalide');
    await updateSnapshot((s) => {
      const sub = s.subscribers.find((x) => x.id === req.params.id);
      if (!sub) throw new HttpError(404, 'Abonné introuvable');
      sub.status = status;
    });
    res.json({ ok: true });
  });

  router.delete('/subscribers/:id', canEdit, async (req, res) => {
    await updateSnapshot((s) => {
      s.subscribers = s.subscribers.filter((x) => x.id !== req.params.id);
    });
    res.json({ ok: true });
  });

  /* ---------- Utilisateurs ---------- */

  router.get('/users', superOnly, async (_req, res) => {
    res.json((await loadSnapshot()).users.map(publicUser));
  });

  router.post('/users', superOnly, async (req, res) => {
    const { email, name, role, password } = req.body as { email?: string; name?: string; role?: AdminUser['role']; password?: string };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'E-mail invalide');
    if (!name?.trim()) throw new HttpError(400, 'Nom requis');
    if (!role || !['superadmin', 'editor', 'seo', 'viewer'].includes(role)) throw new HttpError(400, 'Rôle invalide');
    const weak = validatePasswordStrength(password || '');
    if (weak) throw new HttpError(400, weak);
    const s = await loadSnapshot();
    if (s.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new HttpError(409, 'Cet e-mail a déjà un compte');
    const { hash, salt } = hashPassword(password!);
    const user: AdminUser = { id: crypto.randomUUID(), email: email.toLowerCase(), name: name.trim(), role, passwordHash: hash, salt };
    await updateSnapshot((snap) => {
      snap.users.push(user);
    });
    res.status(201).json(publicUser(user));
  });

  router.patch('/users/:id', superOnly, async (req: AuthedRequest, res) => {
    const { name, role, password } = req.body as { name?: string; role?: AdminUser['role']; password?: string };
    if (password) {
      const weak = validatePasswordStrength(password);
      if (weak) throw new HttpError(400, weak);
    }
    await updateSnapshot((s) => {
      const u = s.users.find((x) => x.id === req.params.id);
      if (!u) throw new HttpError(404, 'Utilisateur introuvable');
      if (role && role !== u.role && u.role === 'superadmin' && s.users.filter((x) => x.role === 'superadmin').length === 1) {
        throw new HttpError(400, 'Il doit rester au moins un super administrateur');
      }
      if (name?.trim()) u.name = name.trim();
      if (role) u.role = role;
      if (password) {
        const { hash, salt } = hashPassword(password);
        u.passwordHash = hash;
        u.salt = salt;
      }
    });
    res.json({ ok: true });
  });

  router.delete('/users/:id', superOnly, async (req: AuthedRequest, res) => {
    if (req.params.id === req.admin!.sub) throw new HttpError(400, 'Vous ne pouvez pas supprimer votre propre compte');
    await updateSnapshot((s) => {
      const u = s.users.find((x) => x.id === req.params.id);
      if (!u) throw new HttpError(404, 'Utilisateur introuvable');
      if (u.role === 'superadmin' && s.users.filter((x) => x.role === 'superadmin').length === 1) {
        throw new HttpError(400, 'Il doit rester au moins un super administrateur');
      }
      s.users = s.users.filter((x) => x.id !== req.params.id);
    });
    res.json({ ok: true });
  });

  return router;
}
