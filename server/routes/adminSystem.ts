/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Paramètres avancés : e-mails (SMTP), sécurité, limites, médias, données, informations système. */
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { sql } from 'drizzle-orm';
import { loadSnapshot, updateSnapshot, getDataPaths } from '../cms/store';
import type { RateWindow, SystemSettings } from '../cms/types';
import { db } from '../db/client';
import { asyncRouter, HttpError, paging } from '../http';
import { requirePerm, type AuthedRequest } from '../middleware/adminAuth';
import { EMAIL_RE } from '../security/accounts';
import { clientIp, ipAllowed, isValidIpRule } from '../security/ip';
import { encryptSecret } from '../security/secrets';
import { runRetention } from '../security/retention';
import { listMailLog, smtpSource, testSmtp } from '../mail';

const int = (v: unknown, min: number, max: number, label: string): number => {
  const n = Number(v);
  if (!Number.isFinite(n) || Math.round(n) !== n || n < min || n > max) throw new HttpError(400, `${label} : valeur entre ${min} et ${max} attendue`);
  return n;
};
const bool = (v: unknown, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const str = (v: unknown, max: number, fallback = '') => (typeof v === 'string' ? v.trim().slice(0, max) : fallback);

function windowOf(v: unknown, current: RateWindow, label: string): RateWindow {
  const w = (v ?? {}) as Partial<RateWindow>;
  return {
    max: int(w.max ?? current.max, 1, 10_000, `${label} (nombre)`),
    windowMinutes: int(w.windowMinutes ?? current.windowMinutes, 1, 1440, `${label} (durée)`),
  };
}

function emails(list: unknown, label: string): string[] {
  if (!Array.isArray(list)) return [];
  const out = [...new Set(list.map((e) => String(e).trim().toLowerCase()).filter(Boolean))];
  for (const e of out) if (!EMAIL_RE.test(e)) throw new HttpError(400, `${label} : adresse invalide « ${e} »`);
  return out.slice(0, 20);
}

/** Valide et fusionne un envoi partiel du formulaire avec les réglages en place. */
function mergeSystem(cur: SystemSettings, body: Record<string, unknown>): SystemSettings {
  const smtpIn = (body.smtp ?? {}) as Partial<SystemSettings['smtp']> & { password?: string; clearPassword?: boolean };
  const secIn = (body.security ?? {}) as Partial<SystemSettings['security']>;
  const limIn = (body.limits ?? {}) as Partial<SystemSettings['limits']>;
  const upIn = (body.uploads ?? {}) as Partial<SystemSettings['uploads']>;
  const prIn = (body.privacy ?? {}) as Partial<SystemSettings['privacy']>;
  const notIn = (body.notifications ?? {}) as Partial<SystemSettings['notifications']>;
  const perfIn = (body.performance ?? {}) as Partial<SystemSettings['performance']>;

  const smtp: SystemSettings['smtp'] = {
    enabled: bool(smtpIn.enabled, cur.smtp.enabled),
    host: str(smtpIn.host, 200, cur.smtp.host),
    port: int(smtpIn.port ?? cur.smtp.port, 1, 65535, 'Port SMTP'),
    security: ['starttls', 'ssl', 'none'].includes(String(smtpIn.security)) ? smtpIn.security! : cur.smtp.security,
    username: str(smtpIn.username, 200, cur.smtp.username),
    passwordEnc: smtpIn.clearPassword ? undefined : smtpIn.password ? encryptSecret(String(smtpIn.password)) : cur.smtp.passwordEnc,
    fromName: str(smtpIn.fromName, 120, cur.smtp.fromName),
    fromEmail: str(smtpIn.fromEmail, 200, cur.smtp.fromEmail).toLowerCase(),
    replyTo: str(smtpIn.replyTo, 200, cur.smtp.replyTo).toLowerCase(),
    timeoutSec: int(smtpIn.timeoutSec ?? cur.smtp.timeoutSec, 3, 120, 'Délai SMTP'),
    allowSelfSigned: bool(smtpIn.allowSelfSigned, cur.smtp.allowSelfSigned),
  };
  if (smtp.enabled) {
    if (!smtp.host) throw new HttpError(400, 'Indiquez le serveur SMTP');
    if (!EMAIL_RE.test(smtp.fromEmail || smtp.username)) throw new HttpError(400, 'Indiquez une adresse d’expédition valide');
  }
  if (smtp.fromEmail && !EMAIL_RE.test(smtp.fromEmail)) throw new HttpError(400, 'Adresse d’expédition invalide');
  if (smtp.replyTo && !EMAIL_RE.test(smtp.replyTo)) throw new HttpError(400, 'Adresse de réponse invalide');

  const allowlist = Array.isArray(secIn.adminIpAllowlist)
    ? [...new Set(secIn.adminIpAllowlist.map((r) => String(r).trim()).filter(Boolean))]
    : cur.security.adminIpAllowlist;
  for (const r of allowlist) if (!isValidIpRule(r)) throw new HttpError(400, `Adresse IP ou plage invalide : « ${r} »`);

  const security: SystemSettings['security'] = {
    passwordMinLength: int(secIn.passwordMinLength ?? cur.security.passwordMinLength, 8, 64, 'Longueur minimale du mot de passe'),
    requireUppercase: bool(secIn.requireUppercase, cur.security.requireUppercase),
    requireNumber: bool(secIn.requireNumber, cur.security.requireNumber),
    requireSymbol: bool(secIn.requireSymbol, cur.security.requireSymbol),
    passwordExpiryDays: int(secIn.passwordExpiryDays ?? cur.security.passwordExpiryDays, 0, 730, 'Expiration du mot de passe'),
    sessionHours: int(secIn.sessionHours ?? cur.security.sessionHours, 1, 168, 'Durée de session'),
    rememberDays: int(secIn.rememberDays ?? cur.security.rememberDays, 1, 90, 'Durée « Rester connecté »'),
    idleMinutes: int(secIn.idleMinutes ?? cur.security.idleMinutes, 0, 1440, 'Déconnexion après inactivité'),
    maxLoginAttempts: int(secIn.maxLoginAttempts ?? cur.security.maxLoginAttempts, 3, 50, 'Tentatives de connexion'),
    lockoutMinutes: int(secIn.lockoutMinutes ?? cur.security.lockoutMinutes, 1, 1440, 'Durée de blocage'),
    twoFactor: ['optional', 'superadmins', 'all'].includes(String(secIn.twoFactor)) ? secIn.twoFactor! : cur.security.twoFactor,
    adminIpAllowlist: allowlist,
    hsts: bool(secIn.hsts, cur.security.hsts),
  };

  const limits: SystemSettings['limits'] = {
    publicApiPerMinute: int(limIn.publicApiPerMinute ?? cur.limits.publicApiPerMinute, 0, 100_000, 'API publique'),
    adminApiPerMinute: int(limIn.adminApiPerMinute ?? cur.limits.adminApiPerMinute, 0, 100_000, 'API administration'),
    formSubmissions: windowOf(limIn.formSubmissions, cur.limits.formSubmissions, 'Formulaires'),
    newsletter: windowOf(limIn.newsletter, cur.limits.newsletter, 'Newsletter'),
    passwordReset: windowOf(limIn.passwordReset, cur.limits.passwordReset, 'Mot de passe oublié'),
  };
  if (limits.publicApiPerMinute > 0 && limits.publicApiPerMinute < 30) throw new HttpError(400, 'API publique : 30 requêtes / minute minimum (ou 0 pour illimité)');
  if (limits.adminApiPerMinute > 0 && limits.adminApiPerMinute < 60) throw new HttpError(400, 'API administration : 60 requêtes / minute minimum (ou 0 pour illimité)');

  const uploads: SystemSettings['uploads'] = {
    maxSizeMb: int(upIn.maxSizeMb ?? cur.uploads.maxSizeMb, 1, 100, 'Taille maximale des fichiers'),
    allowImages: bool(upIn.allowImages, cur.uploads.allowImages),
    allowSvg: bool(upIn.allowSvg, cur.uploads.allowSvg),
    allowVideo: bool(upIn.allowVideo, cur.uploads.allowVideo),
    allowPdf: bool(upIn.allowPdf, cur.uploads.allowPdf),
  };

  const privacy: SystemSettings['privacy'] = {
    analyticsRetentionDays: int(prIn.analyticsRetentionDays ?? cur.privacy.analyticsRetentionDays, 30, 3650, 'Conservation des statistiques'),
    submissionsRetentionDays: int(prIn.submissionsRetentionDays ?? cur.privacy.submissionsRetentionDays, 0, 3650, 'Conservation des messages'),
    auditRetentionDays: int(prIn.auditRetentionDays ?? cur.privacy.auditRetentionDays, 30, 3650, 'Conservation du journal'),
    mailLogRetentionDays: int(prIn.mailLogRetentionDays ?? cur.privacy.mailLogRetentionDays, 7, 3650, 'Conservation du journal des e-mails'),
    storeSubmitterIp: bool(prIn.storeSubmitterIp, cur.privacy.storeSubmitterIp),
  };

  return {
    smtp,
    notifications: {
      securityAlerts: bool(notIn.securityAlerts, cur.notifications.securityAlerts),
      accountChanges: bool(notIn.accountChanges, cur.notifications.accountChanges),
      adminEmails: notIn.adminEmails !== undefined ? emails(notIn.adminEmails, 'Notifications') : cur.notifications.adminEmails,
    },
    security,
    limits,
    uploads,
    privacy,
    performance: { publicCacheSeconds: int(perfIn.publicCacheSeconds ?? cur.performance.publicCacheSeconds, 0, 3600, 'Cache public') },
  };
}

function clientView(system: SystemSettings) {
  const { passwordEnc, ...smtp } = system.smtp;
  return { ...system, smtp: { ...smtp, hasPassword: !!passwordEnc } };
}

async function dirSize(dir: string): Promise<{ files: number; bytes: number }> {
  let files = 0;
  let bytes = 0;
  try {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      if (!e.isFile()) continue;
      files++;
      bytes += (await fs.stat(path.join(dir, e.name))).size;
    }
  } catch {
    /* dossier absent */
  }
  return { files, bytes };
}

export function createAdminSystemRouter() {
  const router = asyncRouter();

  router.get('/system', requirePerm('settings.manage'), async (req, res) => {
    const s = await loadSnapshot();
    res.json({
      system: clientView(s.system),
      meta: {
        clientIp: clientIp(req),
        smtpSource: smtpSource(s),
        envSmtp: !!process.env.SMTP_HOST,
        ipBypass: process.env.PEXEN_ADMIN_IP_BYPASS === 'true',
        dedicatedSecretKey: !!process.env.PEXEN_SECRET_KEY,
      },
    });
  });

  router.put('/system', requirePerm('settings.manage'), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const next = mergeSystem(s.system, (req.body ?? {}) as Record<string, unknown>);
    const ip = clientIp(req);
    if (process.env.PEXEN_ADMIN_IP_BYPASS !== 'true' && !ipAllowed(ip, next.security.adminIpAllowlist)) {
      throw new HttpError(400, `Votre adresse actuelle (${ip}) doit figurer dans la liste, sinon vous perdriez l’accès`);
    }
    const me = s.users.find((u) => u.id === req.admin!.sub);
    const appliesToMe = next.security.twoFactor === 'all' || (next.security.twoFactor === 'superadmins' && req.admin!.isSuper);
    if (appliesToMe && next.security.twoFactor !== s.system.security.twoFactor && !me?.totpEnabled) {
      throw new HttpError(400, 'Activez d’abord la double authentification sur votre propre compte (Mon profil › Sécurité)');
    }
    const sections = (Object.keys(next) as (keyof SystemSettings)[]).filter((k) => JSON.stringify(next[k]) !== JSON.stringify(s.system[k]));
    const updated = await updateSnapshot((snap) => {
      snap.system = next;
    });
    res.locals.audit = sections.length ? { action: 'settings.system', detail: { sections } } : false;
    res.json({ system: clientView(updated.system), meta: { clientIp: ip, smtpSource: smtpSource(updated) } });
  });

  router.post('/system/smtp/test', requirePerm('settings.manage'), async (req: AuthedRequest, res) => {
    const to = String(req.body?.to || req.admin!.email).trim().toLowerCase();
    if (!EMAIL_RE.test(to)) throw new HttpError(400, 'Adresse de test invalide');
    const s = await loadSnapshot();
    const draft = req.body?.smtp ? mergeSystem(s.system, { smtp: { ...req.body.smtp, password: undefined } }).smtp : s.system.smtp;
    const password = typeof req.body?.smtp?.password === 'string' && req.body.smtp.password ? req.body.smtp.password : undefined;
    const result = await testSmtp(draft, to, password);
    res.locals.audit = { action: 'settings.smtp_test', target: to, detail: { ok: result.ok } };
    res.json(result);
  });

  router.get('/system/mail-log', requirePerm('settings.manage'), async (req, res) => {
    const { page, pageSize } = paging(req.query);
    const { items, total } = await listMailLog(page, pageSize);
    res.json({ items, total, page, pageSize });
  });

  router.get('/system/info', requirePerm('settings.manage'), async (_req, res) => {
    const pkg = JSON.parse(await fs.readFile(path.resolve(process.cwd(), 'package.json'), 'utf-8')) as { version?: string };
    const [dbInfo] = (
      await db.execute(sql`select
        pg_database_size(current_database())::bigint as size,
        current_setting('server_version') as version,
        (select count(*) from analytics_events)::int as analytics,
        (select count(*) from audit_log)::int as audit,
        (select count(*) from mail_log)::int as mail,
        (select count(*) from admin_sessions where revoked_at is null and expires_at > now())::int as sessions,
        (select count(*) from revisions)::int as revisions`)
    ).rows as { size: string; version: string; analytics: number; audit: number; mail: number; sessions: number; revisions: number }[];
    const s = await loadSnapshot();
    const uploads = await dirSize(getDataPaths().UPLOADS_DIR);
    const mem = process.memoryUsage();
    res.json({
      app: { name: 'Pexen', version: pkg.version ?? '—', environment: process.env.NODE_ENV || 'development' },
      runtime: { node: process.version, platform: `${os.type()} ${os.release()}`, uptimeSec: Math.round(process.uptime()), memoryMb: Math.round(mem.rss / 1048576), cpus: os.cpus().length },
      database: { version: dbInfo.version, sizeBytes: Number(dbInfo.size), analyticsEvents: dbInfo.analytics, auditEntries: dbInfo.audit, mailLog: dbInfo.mail, activeSessions: dbInfo.sessions, revisions: dbInfo.revisions },
      content: { pages: s.pages.length, posts: s.posts.length, media: s.media.length, submissions: s.formSubmissions.length, subscribers: s.subscribers.length, users: s.users.length },
      uploads,
    });
  });

  router.post('/system/retention/run', requirePerm('settings.manage'), async (_req, res) => {
    const report = await runRetention();
    res.locals.audit = { action: 'settings.retention_run', detail: { ...report } };
    res.json(report);
  });

  return router;
}
