/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Comptes d'administration, rôles & permissions, journal d'activité. */
import crypto from 'crypto';
import type { Request } from 'express';
import { loadSnapshot, updateSnapshot } from '../cms/store';
import { hashPassword, unusablePassword, validatePassword } from '../cms/auth';
import type { AdminUser, CmsSnapshot } from '../cms/types';
import {
  createDefaultRoles,
  isPermission,
  rolePermissions,
  SUPERADMIN_ROLE,
  type RoleDefinition,
  type RoleTone,
} from '../cms/permissions';
import { asyncRouter, HttpError, paging } from '../http';
import { requireAuth, requirePerm, type AuthedRequest } from '../middleware/adminAuth';
import { adminUrl, EMAIL_RE, notifyAccountChange, publicUser, superadminCount } from '../security/accounts';
import { queryAudit } from '../security/audit';
import { issueAuthToken, pendingInvite, revokeAuthTokens, TOKEN_TTL } from '../security/authTokens';
import { describeUserAgent } from '../security/ip';
import { activeSessionCounts, listActiveSessions, revokeSession, revokeUserSessions } from '../security/sessions';
import { renderEmail, sendMail } from '../mail';
import { removeImage } from '../media/images';

const TONES: RoleTone[] = ['brand', 'info', 'warning', 'success', 'danger', 'neutral'];

function findUser(s: CmsSnapshot, id: string): AdminUser {
  const u = s.users.find((x) => x.id === id);
  if (!u) throw new HttpError(404, 'Utilisateur introuvable');
  return u;
}

/** Un rôle n'est attribuable que s'il ne donne pas plus de droits que ceux de la personne qui l'attribue. */
function assertAssignable(req: AuthedRequest, s: CmsSnapshot, roleId: string) {
  const role = s.roles.find((r) => r.id === roleId);
  if (!role) throw new HttpError(400, 'Rôle inconnu');
  if (req.admin!.isSuper) return;
  const mine = new Set(req.admin!.permissions);
  if (roleId === SUPERADMIN_ROLE || !rolePermissions(s.roles, roleId).every((p) => mine.has(p))) {
    throw new HttpError(403, 'Vous ne pouvez pas attribuer un rôle disposant de plus de droits que le vôtre', 'FORBIDDEN');
  }
}

/** Modifier un compte suppose d'avoir au moins tous ses droits. */
function assertManageable(req: AuthedRequest, s: CmsSnapshot, target: AdminUser) {
  if (req.admin!.isSuper) return;
  const mine = new Set(req.admin!.permissions);
  if (target.role === SUPERADMIN_ROLE || !rolePermissions(s.roles, target.role).every((p) => mine.has(p))) {
    throw new HttpError(403, 'Ce compte dispose de droits supérieurs aux vôtres', 'FORBIDDEN');
  }
}

function assertNotSelf(req: AuthedRequest, id: string, message: string) {
  if (req.admin!.sub === id) throw new HttpError(400, message);
}

function assertKeepsSuperadmin(s: CmsSnapshot, target: AdminUser) {
  if (target.role === SUPERADMIN_ROLE && target.status !== 'suspended' && superadminCount(s) <= 1) {
    throw new HttpError(400, 'Il doit rester au moins un super administrateur actif');
  }
}

async function sendInvite(req: Request, s: CmsSnapshot, user: AdminUser, invitedBy: string) {
  const { token, expiresAt } = await issueAuthToken(user.id, 'invite', invitedBy);
  const url = adminUrl(req, s, `/reset-password?token=${token}`);
  const role = s.roles.find((r) => r.id === user.role)?.name ?? user.role;
  const { html, text } = renderEmail(s, {
    title: `Invitation à rejoindre ${s.branding.siteName}`,
    intro: `Bonjour ${user.name}, vous êtes invité(e) à accéder à l’administration de ${s.branding.siteName} avec le rôle « ${role} ».`,
    button: { label: 'Activer mon compte', url },
    outro: `Ce lien est valable ${TOKEN_TTL.invite / 86400_000} jours.`,
  });
  const mail = await sendMail({ to: user.email, subject: `Invitation — ${s.branding.siteName}`, html, text, kind: 'invite' });
  return { url, expiresAt: expiresAt.toISOString(), emailSent: mail.sent, emailError: mail.reason };
}

async function sendResetLink(req: Request, s: CmsSnapshot, user: AdminUser, by: string, email: boolean) {
  const { token, expiresAt } = await issueAuthToken(user.id, 'reset', by);
  const url = adminUrl(req, s, `/reset-password?token=${token}`);
  if (!email) return { url, expiresAt: expiresAt.toISOString(), emailSent: false };
  const { html, text } = renderEmail(s, {
    title: 'Réinitialisation de votre mot de passe',
    intro: `Bonjour ${user.name}, un administrateur a demandé la réinitialisation du mot de passe de votre compte ${s.branding.siteName}.`,
    button: { label: 'Choisir un nouveau mot de passe', url },
    outro: 'Ce lien est valable 1 heure et ne peut servir qu’une fois.',
  });
  const mail = await sendMail({ to: user.email, subject: `Réinitialisation du mot de passe — ${s.branding.siteName}`, html, text, kind: 'reset' });
  return { url, expiresAt: expiresAt.toISOString(), emailSent: mail.sent, emailError: mail.reason };
}

function sanitizeRole(body: Partial<RoleDefinition>, base?: RoleDefinition): Omit<RoleDefinition, 'id'> {
  const name = String(body.name ?? base?.name ?? '').trim().slice(0, 60);
  if (!name) throw new HttpError(400, 'Le nom du rôle est requis');
  const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.filter(isPermission))] : (base?.permissions ?? []);
  return {
    name,
    description: String(body.description ?? base?.description ?? '').trim().slice(0, 240),
    tone: TONES.includes(body.tone as RoleTone) ? (body.tone as RoleTone) : (base?.tone ?? 'neutral'),
    permissions,
    ...(base?.builtin ? { builtin: true } : {}),
  };
}

export function createAdminUsersRouter() {
  const router = asyncRouter();

  /* ---------- Utilisateurs ---------- */

  router.get('/users', requirePerm('users.view'), async (_req, res) => {
    const s = await loadSnapshot();
    const counts = await activeSessionCounts();
    const invites = await Promise.all(s.users.map((u) => (u.status === 'invited' ? pendingInvite(u.id) : null)));
    res.json(
      s.users.map((u, i) => ({
        ...publicUser(u),
        roleName: s.roles.find((r) => r.id === u.role)?.name ?? u.role,
        activeSessions: counts.get(u.id) ?? 0,
        inviteExpiresAt: invites[i]?.expiresAt.toISOString(),
      }))
    );
  });

  router.post('/users', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const body = req.body as {
      email?: string; name?: string; role?: string; title?: string; mode?: 'invite' | 'password'; password?: string; mustChangePassword?: boolean;
    };
    const email = String(body.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'E-mail invalide');
    const name = String(body.name || '').trim();
    if (!name) throw new HttpError(400, 'Nom requis');
    const s = await loadSnapshot();
    assertAssignable(req, s, String(body.role || ''));
    if (s.users.some((u) => u.email.toLowerCase() === email)) throw new HttpError(409, 'Cet e-mail a déjà un compte');
    const invite = body.mode !== 'password';
    if (!invite) {
      const weak = validatePassword(body.password || '', s.system.security, { email, name });
      if (weak) throw new HttpError(400, weak);
    }
    const { hash, salt } = invite ? unusablePassword() : hashPassword(body.password!);
    const now = new Date().toISOString();
    const user: AdminUser = {
      id: crypto.randomUUID(),
      email,
      name: name.slice(0, 120),
      role: body.role!,
      title: body.title?.trim().slice(0, 120) || undefined,
      passwordHash: hash,
      salt,
      status: invite ? 'invited' : 'active',
      mustChangePassword: invite ? false : body.mustChangePassword !== false,
      passwordChangedAt: invite ? undefined : now,
      invitedBy: req.admin!.email,
      createdAt: now,
    };
    const next = await updateSnapshot((snap) => {
      if (snap.users.some((u) => u.email.toLowerCase() === email)) throw new HttpError(409, 'Cet e-mail a déjà un compte');
      snap.users.push(user);
    });
    const delivery = invite ? await sendInvite(req, next, user, req.admin!.email) : undefined;
    res.locals.audit = { action: invite ? 'user.invite' : 'user.create', target: email, detail: { role: user.role } };
    void notifyAccountChange(next, 'Nouveau compte', [`Compte : ${name} <${email}>`, `Rôle : ${next.roles.find((r) => r.id === user.role)?.name}`, `Créé par : ${req.admin!.email}`]);
    res.status(201).json({ user: publicUser(user), invite: delivery });
  });

  router.patch('/users/:id', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const body = req.body as { name?: string; title?: string; phone?: string; role?: string; email?: string };
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    const changes: Record<string, unknown> = {};
    if (body.role !== undefined && body.role !== target.role) {
      assertNotSelf(req, target.id, 'Vous ne pouvez pas modifier votre propre rôle');
      assertAssignable(req, s, body.role);
      assertKeepsSuperadmin(s, target);
      changes.role = { from: target.role, to: body.role };
    }
    let email: string | undefined;
    if (body.email !== undefined && body.email.trim().toLowerCase() !== target.email) {
      assertNotSelf(req, target.id, 'Modifiez votre propre adresse depuis Mon profil (mot de passe requis)');
      email = body.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(400, 'E-mail invalide');
      if (s.users.some((u) => u.id !== target.id && u.email.toLowerCase() === email)) throw new HttpError(409, 'Cet e-mail est déjà utilisé');
      changes.email = { from: target.email, to: email };
    }
    if (body.name !== undefined && !body.name.trim()) throw new HttpError(400, 'Le nom est requis');
    const next = await updateSnapshot((snap) => {
      const u = findUser(snap, target.id);
      if (body.name !== undefined) u.name = body.name.trim().slice(0, 120);
      if (body.title !== undefined) u.title = body.title.trim().slice(0, 120) || undefined;
      if (body.phone !== undefined) u.phone = body.phone.trim().slice(0, 40) || undefined;
      if (changes.role) u.role = body.role!;
      if (email) u.email = email;
    });
    res.locals.audit = { action: changes.role ? 'user.role' : 'user.update', target: target.email, detail: changes };
    res.json({ user: publicUser(findUser(next, target.id)) });
  });

  router.post('/users/:id/status', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const status = req.body?.status as 'active' | 'suspended';
    if (status !== 'active' && status !== 'suspended') throw new HttpError(400, 'Statut invalide');
    assertNotSelf(req, req.params.id, 'Vous ne pouvez pas suspendre votre propre compte');
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    if (status === 'suspended') assertKeepsSuperadmin(s, target);
    if (status === 'active' && target.status !== 'suspended') throw new HttpError(400, 'Ce compte n’est pas suspendu');
    const next = await updateSnapshot((snap) => {
      findUser(snap, target.id).status = status;
    });
    if (status === 'suspended') {
      await revokeUserSessions(target.id);
      await revokeAuthTokens(target.id);
    }
    res.locals.audit = { action: status === 'suspended' ? 'user.suspend' : 'user.reactivate', target: target.email };
    res.json({ user: publicUser(findUser(next, target.id)) });
  });

  router.post('/users/:id/password', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const { password, mustChangePassword } = req.body as { password?: string; mustChangePassword?: boolean };
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    if (target.status === 'invited') throw new HttpError(400, 'Ce compte n’a pas encore été activé : renvoyez l’invitation');
    const weak = validatePassword(password || '', s.system.security, target);
    if (weak) throw new HttpError(400, weak);
    const { hash, salt } = hashPassword(password!);
    await updateSnapshot((snap) => {
      const u = findUser(snap, target.id);
      u.passwordHash = hash;
      u.salt = salt;
      u.passwordChangedAt = new Date().toISOString();
      u.mustChangePassword = req.admin!.sub !== target.id && mustChangePassword !== false;
    });
    const closed = await revokeUserSessions(target.id, req.admin!.sub === target.id ? req.admin!.sid : undefined);
    res.locals.audit = { action: 'user.password', target: target.email, detail: { closedSessions: closed } };
    res.json({ ok: true, closedSessions: closed });
  });

  router.post('/users/:id/reset-link', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    if (target.status === 'suspended') throw new HttpError(400, 'Réactivez d’abord ce compte');
    const send = req.body?.send !== false;
    const result = target.status === 'invited' ? await sendInvite(req, s, target, req.admin!.email) : await sendResetLink(req, s, target, req.admin!.email, send);
    res.locals.audit = { action: target.status === 'invited' ? 'user.invite_resent' : 'user.reset_link', target: target.email, detail: { emailSent: result.emailSent } };
    res.json(result);
  });

  router.post('/users/:id/2fa/reset', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    if (!target.totpEnabled) throw new HttpError(400, 'La double authentification n’est pas active sur ce compte');
    await updateSnapshot((snap) => {
      const u = findUser(snap, target.id);
      u.totpEnabled = false;
      u.totpSecret = undefined;
      u.recoveryCodes = [];
    });
    await revokeUserSessions(target.id, req.admin!.sub === target.id ? req.admin!.sid : undefined);
    res.locals.audit = { action: 'user.2fa_reset', target: target.email };
    res.json({ ok: true });
  });

  router.get('/users/:id/sessions', requirePerm('users.view'), async (req: AuthedRequest, res) => {
    const rows = await listActiveSessions(req.params.id);
    res.json(
      rows.map((r) => ({
        id: r.id,
        current: r.id === req.admin!.sid,
        device: describeUserAgent(r.userAgent),
        ip: r.ip,
        createdAt: r.createdAt.toISOString(),
        lastSeenAt: r.lastSeenAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
        remember: r.remember,
      }))
    );
  });

  router.post('/users/:id/sessions/revoke', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    const sid = req.body?.sessionId as string | undefined;
    const closed = sid
      ? Number(await revokeSession(sid, target.id))
      : await revokeUserSessions(target.id, req.admin!.sub === target.id ? req.admin!.sid : undefined);
    res.locals.audit = { action: 'user.sessions_revoked', target: target.email, detail: { count: closed } };
    res.json({ closed });
  });

  router.get('/users/:id/activity', requirePerm('users.view'), async (req, res) => {
    const { page, pageSize } = paging(req.query);
    const { items, total } = await queryAudit({ userId: req.params.id, page, pageSize });
    res.json({ items, total, page, pageSize });
  });

  router.delete('/users/:id', requirePerm('users.manage'), async (req: AuthedRequest, res) => {
    assertNotSelf(req, req.params.id, 'Vous ne pouvez pas supprimer votre propre compte');
    const s = await loadSnapshot();
    const target = findUser(s, req.params.id);
    assertManageable(req, s, target);
    assertKeepsSuperadmin(s, target);
    await updateSnapshot((snap) => {
      snap.users = snap.users.filter((u) => u.id !== target.id);
    });
    await revokeUserSessions(target.id);
    await revokeAuthTokens(target.id);
    await removeImage('avatars', target.avatarUrl);
    res.locals.audit = { action: 'user.delete', target: target.email };
    void notifyAccountChange(s, 'Compte supprimé', [`Compte : ${target.name} <${target.email}>`, `Supprimé par : ${req.admin!.email}`]);
    res.json({ ok: true });
  });

  /* ---------- Rôles ---------- */

  const superOnly = (req: AuthedRequest) => {
    if (!req.admin!.isSuper) throw new HttpError(403, 'Seul un super administrateur peut gérer les rôles', 'FORBIDDEN');
  };

  router.get('/roles', requireAuth(), async (_req, res) => {
    const s = await loadSnapshot();
    const defaults = new Map(createDefaultRoles().map((r) => [r.id, r]));
    res.json(
      s.roles.map((r) => ({
        ...r,
        locked: r.id === SUPERADMIN_ROLE,
        hasDefault: defaults.has(r.id) && r.id !== SUPERADMIN_ROLE,
        userCount: s.users.filter((u) => u.role === r.id).length,
      }))
    );
  });

  router.post('/roles', requireAuth(), async (req: AuthedRequest, res) => {
    superOnly(req);
    const data = sanitizeRole(req.body);
    let id = data.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'role';
    const s = await loadSnapshot();
    if (s.roles.some((r) => r.name.toLowerCase() === data.name.toLowerCase())) throw new HttpError(409, 'Un rôle porte déjà ce nom');
    const base = id;
    for (let n = 2; s.roles.some((r) => r.id === id); n++) id = `${base}-${n}`;
    const role: RoleDefinition = { id, ...data };
    delete role.builtin;
    await updateSnapshot((snap) => {
      snap.roles.push(role);
    });
    res.locals.audit = { action: 'role.create', target: role.name, detail: { permissions: role.permissions.length } };
    res.status(201).json(role);
  });

  router.put('/roles/:id', requireAuth(), async (req: AuthedRequest, res) => {
    superOnly(req);
    if (req.params.id === SUPERADMIN_ROLE) throw new HttpError(400, 'Le rôle super administrateur n’est pas modifiable');
    const s = await loadSnapshot();
    const current = s.roles.find((r) => r.id === req.params.id);
    if (!current) throw new HttpError(404, 'Rôle introuvable');
    const data = sanitizeRole(req.body, current);
    if (s.roles.some((r) => r.id !== current.id && r.name.toLowerCase() === data.name.toLowerCase())) throw new HttpError(409, 'Un rôle porte déjà ce nom');
    const added = data.permissions.filter((p) => !current.permissions.includes(p));
    const removed = current.permissions.filter((p) => !data.permissions.includes(p));
    const next = await updateSnapshot((snap) => {
      const idx = snap.roles.findIndex((r) => r.id === current.id);
      snap.roles[idx] = { id: current.id, ...data };
    });
    res.locals.audit = { action: 'role.update', target: data.name, detail: { added, removed } };
    res.json(next.roles.find((r) => r.id === current.id));
  });

  router.post('/roles/:id/reset', requireAuth(), async (req: AuthedRequest, res) => {
    superOnly(req);
    const def = createDefaultRoles().find((r) => r.id === req.params.id && r.id !== SUPERADMIN_ROLE);
    if (!def) throw new HttpError(400, 'Ce rôle n’a pas de configuration par défaut');
    const next = await updateSnapshot((snap) => {
      const idx = snap.roles.findIndex((r) => r.id === def.id);
      if (idx === -1) snap.roles.push(def);
      else snap.roles[idx] = def;
    });
    res.locals.audit = { action: 'role.reset', target: def.name };
    res.json(next.roles.find((r) => r.id === def.id));
  });

  router.delete('/roles/:id', requireAuth(), async (req: AuthedRequest, res) => {
    superOnly(req);
    const s = await loadSnapshot();
    const role = s.roles.find((r) => r.id === req.params.id);
    if (!role) throw new HttpError(404, 'Rôle introuvable');
    if (role.builtin || role.id === SUPERADMIN_ROLE) throw new HttpError(400, 'Les rôles fournis par Pexen ne peuvent pas être supprimés');
    const members = s.users.filter((u) => u.role === role.id);
    const reassignTo = String(req.query.reassignTo || req.body?.reassignTo || '');
    if (members.length) {
      if (!reassignTo || reassignTo === role.id || !s.roles.some((r) => r.id === reassignTo)) {
        throw new HttpError(400, `${members.length} compte(s) utilisent ce rôle : choisissez un rôle de remplacement`);
      }
    }
    await updateSnapshot((snap) => {
      snap.roles = snap.roles.filter((r) => r.id !== role.id);
      for (const u of snap.users) if (u.role === role.id) u.role = reassignTo;
    });
    res.locals.audit = { action: 'role.delete', target: role.name, detail: { reassigned: members.length, reassignTo: reassignTo || undefined } };
    res.json({ ok: true });
  });

  /* ---------- Journal d'activité ---------- */

  const parseAuditQuery = (q: Record<string, unknown>, pageSize: number) => ({
    userId: q.userId ? String(q.userId) : undefined,
    action: q.action ? String(q.action) : undefined,
    q: q.q ? String(q.q).slice(0, 100) : undefined,
    from: q.from ? new Date(String(q.from)) : undefined,
    to: q.to ? new Date(`${String(q.to)}T23:59:59.999`) : undefined,
    page: paging(q).page,
    pageSize,
  });

  router.get('/audit', requirePerm('audit.view'), async (req, res) => {
    const { pageSize } = paging(req.query, 50);
    const qry = parseAuditQuery(req.query, pageSize);
    if ((qry.from && isNaN(qry.from.getTime())) || (qry.to && isNaN(qry.to.getTime()))) throw new HttpError(400, 'Date invalide');
    const { items, total } = await queryAudit(qry);
    res.json({ items, total, page: qry.page, pageSize });
  });

  router.get('/audit/export', requirePerm('audit.view'), async (req, res) => {
    const { items } = await queryAudit({ ...parseAuditQuery(req.query, 10_000), page: 1 });
    const cell = (v: unknown) => {
      const str = v === null || v === undefined ? '' : typeof v === 'object' ? JSON.stringify(v) : String(v);
      const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const lines = [
      ['date', 'utilisateur', 'action', 'cible', 'ip', 'navigateur', 'details'].join(';'),
      ...items.map((r) => [r.ts.toISOString(), r.userEmail, r.action, r.target, r.ip, r.userAgent, r.detail].map(cell).join(';')),
    ];
    res.locals.audit = false;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="journal-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`\uFEFF${lines.join('\n')}`);
  });

  return router;
}
