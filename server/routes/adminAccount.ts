/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Connexion, double authentification, mots de passe oubliés / invitations et espace « Mon profil ». */
import QRCode from 'qrcode';
import { loadSnapshot, updateSnapshot } from '../cms/store';
import {
  burnPasswordCheck,
  createChallenge,
  createToken,
  hashPassword,
  validatePassword,
  verifyChallenge,
  verifyPassword,
  tokenMatchesUser,
} from '../cms/auth';
import type { AdminUser, CmsSnapshot } from '../cms/types';
import { asyncRouter, HttpError, paging } from '../http';
import { pendingRequirements, requireAuth, type AuthedRequest } from '../middleware/adminAuth';
import { adminUrl, EMAIL_RE, meView, sendSecurityAlert, startSession } from '../security/accounts';
import { audit, queryAudit } from '../security/audit';
import { consumeAuthToken, findAuthToken, issueAuthToken } from '../security/authTokens';
import { clientIp, describeUserAgent } from '../security/ip';
import { hit, peek, rateLimitError, reset } from '../security/rateLimit';
import { decryptSecret, encryptSecret } from '../security/secrets';
import { getSession, listActiveSessions, revokeSession, revokeUserSessions } from '../security/sessions';
import { consumeTotp, generateRecoveryCodes, generateTotpSecret, matchRecoveryCode, otpauthUrl } from '../security/totp';
import { renderEmail, sendMail } from '../mail';
import { decodeImage, ImageError, removeImage, saveImage } from '../media/images';

const AVATAR_DIR = 'avatars';
const AVATAR_MAX_BYTES = 1024 * 1024;

const findUser = (s: CmsSnapshot, id: string) => {
  const u = s.users.find((x) => x.id === id);
  if (!u) throw new HttpError(404, 'Utilisateur introuvable');
  return u;
};

async function patchUser(id: string, mutate: (u: AdminUser, s: CmsSnapshot) => void) {
  const s = await updateSnapshot((snap) => mutate(findUser(snap, id), snap));
  return { s, user: findUser(s, id) };
}

const policyOf = (s: CmsSnapshot) => s.system.security;

export function createAdminAccountRouter() {
  const router = asyncRouter();

  /* ---------- Connexion ---------- */

  router.post('/login', async (req, res) => {
    res.locals.audit = false;
    const { email: rawEmail, password, remember } = req.body as { email?: string; password?: string; remember?: boolean };
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!email || !password) throw new HttpError(400, 'Identifiants requis');
    const s = await loadSnapshot();
    const { maxLoginAttempts, lockoutMinutes } = policyOf(s);
    const ip = clientIp(req);
    const key = `login:${ip}:${email}`;
    const ipKey = `login-ip:${ip}`;
    for (const [k, max] of [[key, maxLoginAttempts], [ipKey, maxLoginAttempts * 5]] as const) {
      const r = peek(k, max);
      if (!r.ok) throw rateLimitError(res, r, 'Trop de tentatives de connexion');
    }

    const user = s.users.find((u) => u.email.toLowerCase() === email);
    const valid = user ? verifyPassword(password, user) : (burnPasswordCheck(password), false);
    if (!user || !valid || user.status === 'invited') {
      hit(key, maxLoginAttempts, lockoutMinutes * 60_000);
      hit(ipKey, maxLoginAttempts * 5, lockoutMinutes * 60_000);
      await audit(req, { action: 'auth.login_failed', target: email, userId: user?.id, userEmail: email });
      throw new HttpError(401, 'E-mail ou mot de passe incorrect');
    }
    if (user.status === 'suspended') {
      await audit(req, { action: 'auth.login_blocked', target: email, userId: user.id, userEmail: user.email });
      throw new HttpError(403, 'Ce compte est suspendu. Contactez un administrateur.', 'ACCOUNT_SUSPENDED');
    }
    reset(key);

    if (user.totpEnabled) {
      return res.json({ twoFactor: true, challenge: createChallenge(user, !!remember) });
    }
    const result = await startSession(req, s, user, !!remember);
    await audit(req, { action: 'auth.login', userId: user.id, userEmail: user.email, detail: { remember: !!remember } });
    res.json(result);
  });

  router.post('/login/2fa', async (req, res) => {
    res.locals.audit = false;
    const { challenge, code } = req.body as { challenge?: string; code?: string };
    const payload = challenge ? verifyChallenge(challenge) : null;
    if (!payload) throw new HttpError(401, 'Étape expirée : reconnectez-vous', 'CHALLENGE_EXPIRED');
    const s = await loadSnapshot();
    const user = s.users.find((u) => u.id === payload.sub);
    if (!user || user.status !== 'active' || !tokenMatchesUser(payload, user) || !user.totpEnabled) {
      throw new HttpError(401, 'Étape expirée : reconnectez-vous', 'CHALLENGE_EXPIRED');
    }
    const { maxLoginAttempts, lockoutMinutes } = policyOf(s);
    const key = `2fa:${user.id}`;
    const lock = peek(key, maxLoginAttempts);
    if (!lock.ok) throw rateLimitError(res, lock, 'Trop de codes erronés');

    const input = String(code || '').trim();
    const secret = decryptSecret(user.totpSecret);
    let usedRecovery = false;
    let ok = !!secret && /^\d{6}$/.test(input.replace(/\s/g, '')) && consumeTotp(user.id, secret, input);
    if (!ok && input.length >= 8) {
      const idx = matchRecoveryCode(user.recoveryCodes ?? [], input);
      if (idx !== -1) {
        ok = true;
        usedRecovery = true;
        await patchUser(user.id, (u) => {
          u.recoveryCodes = (u.recoveryCodes ?? []).filter((_, i) => i !== idx);
        });
      }
    }
    if (!ok) {
      hit(key, maxLoginAttempts, lockoutMinutes * 60_000);
      await audit(req, { action: 'auth.2fa_failed', userId: user.id, userEmail: user.email });
      throw new HttpError(401, 'Code invalide ou déjà utilisé');
    }
    reset(key);
    reset(`login:${clientIp(req)}:${user.email.toLowerCase()}`);
    const result = await startSession(req, await loadSnapshot(), user, payload.remember);
    await audit(req, { action: 'auth.login', userId: user.id, userEmail: user.email, detail: { twoFactor: true, recoveryCode: usedRecovery } });
    if (usedRecovery) {
      void sendSecurityAlert(s, user, 'Code de secours utilisé', [
        `Codes de secours restants : ${(user.recoveryCodes?.length ?? 1) - 1}`,
        `Adresse IP : ${clientIp(req)}`,
      ]);
    }
    res.json(result);
  });

  router.post('/logout', requireAuth({ allowPending: true }), async (req: AuthedRequest, res) => {
    res.locals.audit = { action: 'auth.logout' };
    await revokeSession(req.admin!.sid);
    res.json({ ok: true });
  });

  /* ---------- Mot de passe oublié & invitations ---------- */

  router.post('/password/forgot', async (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'E-mail invalide');
    const s = await loadSnapshot();
    const { max, windowMinutes } = s.system.limits.passwordReset;
    for (const k of [`pwreset-ip:${clientIp(req)}`, `pwreset:${email}`]) {
      const r = hit(k, max, windowMinutes * 60_000);
      if (!r.ok) throw rateLimitError(res, r, 'Trop de demandes de réinitialisation');
    }
    const user = s.users.find((u) => u.email.toLowerCase() === email);
    if (user && user.status === 'active') {
      const { token } = await issueAuthToken(user.id, 'reset');
      const { html, text } = renderEmail(s, {
        title: 'Réinitialisation de votre mot de passe',
        intro: `Bonjour ${user.name}, une demande de réinitialisation du mot de passe a été faite pour votre compte ${s.branding.siteName}.`,
        button: { label: 'Choisir un nouveau mot de passe', url: adminUrl(req, s, `/reset-password?token=${token}`) },
        outro: 'Ce lien est valable 1 heure et ne peut servir qu’une fois. Si vous n’êtes pas à l’origine de cette demande, ignorez ce message.',
      });
      await sendMail({ to: user.email, subject: `Réinitialisation du mot de passe — ${s.branding.siteName}`, html, text, kind: 'reset' });
      await audit(req, { action: 'auth.reset_requested', userId: user.id, userEmail: user.email });
    }
    // Même réponse que le compte existe ou non.
    res.json({ ok: true });
  });

  router.get('/password/token', async (req, res) => {
    const token = String(req.query.token || '');
    const row = await findAuthToken(token);
    const s = await loadSnapshot();
    const user = row ? s.users.find((u) => u.id === row.userId) : undefined;
    if (!row || !user || user.status === 'suspended') throw new HttpError(404, 'Ce lien est invalide ou a expiré.', 'TOKEN_INVALID');
    const p = policyOf(s);
    res.json({
      kind: row.kind,
      email: user.email,
      name: user.name,
      expiresAt: row.expiresAt.toISOString(),
      policy: { passwordMinLength: p.passwordMinLength, requireUppercase: p.requireUppercase, requireNumber: p.requireNumber, requireSymbol: p.requireSymbol },
    });
  });

  router.post('/password/reset', async (req, res) => {
    const { token, password, name } = req.body as { token?: string; password?: string; name?: string };
    const row = await findAuthToken(String(token || ''));
    const s = await loadSnapshot();
    const user = row ? s.users.find((u) => u.id === row.userId) : undefined;
    if (!row || !user || user.status === 'suspended') throw new HttpError(404, 'Ce lien est invalide ou a expiré.', 'TOKEN_INVALID');
    const weak = validatePassword(password || '', policyOf(s), user);
    if (weak) throw new HttpError(400, weak);
    if (!(await consumeAuthToken(token!))) throw new HttpError(404, 'Ce lien a déjà été utilisé.', 'TOKEN_INVALID');

    const { hash, salt } = hashPassword(password!);
    await patchUser(user.id, (u) => {
      u.passwordHash = hash;
      u.salt = salt;
      u.passwordChangedAt = new Date().toISOString();
      u.mustChangePassword = false;
      if (row.kind === 'invite') {
        u.status = 'active';
        if (name?.trim()) u.name = name.trim().slice(0, 120);
      }
    });
    await revokeUserSessions(user.id);
    await audit(req, {
      action: row.kind === 'invite' ? 'auth.invite_accepted' : 'auth.password_reset',
      userId: user.id,
      userEmail: user.email,
    });
    if (row.kind === 'reset') void sendSecurityAlert(s, user, 'Votre mot de passe a été réinitialisé', [`Adresse IP : ${clientIp(req)}`]);
    res.json({ ok: true, email: user.email });
  });

  /* ---------- Mon profil ---------- */

  router.get('/me', requireAuth({ allowPending: true }), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    res.json({ user: meView(s, findUser(s, req.admin!.sub)) });
  });

  router.patch('/me', requireAuth(), async (req: AuthedRequest, res) => {
    const body = req.body as { name?: string; title?: string; phone?: string; email?: string; currentPassword?: string };
    const s = await loadSnapshot();
    const me = findUser(s, req.admin!.sub);
    const changes: string[] = [];
    let email: string | undefined;
    if (body.email !== undefined && body.email.trim().toLowerCase() !== me.email) {
      email = body.email.trim().toLowerCase();
      if (!EMAIL_RE.test(email)) throw new HttpError(400, 'E-mail invalide');
      if (!body.currentPassword || !verifyPassword(body.currentPassword, me)) throw new HttpError(400, 'Confirmez avec votre mot de passe actuel pour changer d’e-mail');
      if (s.users.some((u) => u.id !== me.id && u.email.toLowerCase() === email)) throw new HttpError(409, 'Cet e-mail est déjà utilisé');
      changes.push('email');
    }
    if (body.name !== undefined && !body.name.trim()) throw new HttpError(400, 'Le nom est requis');
    const { s: next, user } = await patchUser(me.id, (u) => {
      if (body.name !== undefined) u.name = body.name.trim().slice(0, 120);
      if (body.title !== undefined) u.title = body.title.trim().slice(0, 120) || undefined;
      if (body.phone !== undefined) u.phone = body.phone.trim().slice(0, 40) || undefined;
      if (email) u.email = email;
    });
    res.locals.audit = { action: 'profile.update', detail: { fields: Object.keys(body).filter((k) => k !== 'currentPassword') } };
    if (email) void sendSecurityAlert(s, me, 'Adresse e-mail modifiée', [`Nouvelle adresse : ${email}`, `Ancienne adresse : ${me.email}`]);
    res.json({ user: meView(next, user) });
  });

  router.post('/me/avatar', requireAuth(), async (req: AuthedRequest, res) => {
    let image: { buf: Buffer; ext: string };
    try {
      image = decodeImage(req.body ?? {}, AVATAR_MAX_BYTES);
    } catch (e) {
      if (e instanceof ImageError) throw new HttpError(e.status, e.message);
      throw e;
    }
    const url = await saveImage(AVATAR_DIR, req.admin!.sub, image.buf, image.ext);
    let previous: string | undefined;
    const { s, user } = await patchUser(req.admin!.sub, (u) => {
      previous = u.avatarUrl;
      u.avatarUrl = url;
    });
    await removeImage(AVATAR_DIR, previous);
    res.locals.audit = { action: 'profile.update', detail: { fields: ['avatar'] } };
    res.json({ user: meView(s, user) });
  });

  router.delete('/me/avatar', requireAuth(), async (req: AuthedRequest, res) => {
    let previous: string | undefined;
    const { s, user } = await patchUser(req.admin!.sub, (u) => {
      previous = u.avatarUrl;
      delete u.avatarUrl;
    });
    await removeImage(AVATAR_DIR, previous);
    res.locals.audit = { action: 'profile.update', detail: { fields: ['avatar'] } };
    res.json({ user: meView(s, user) });
  });

  router.put('/me/password', requireAuth({ allowPending: true }), async (req: AuthedRequest, res) => {
    const { current, next } = req.body as { current?: string; next?: string };
    const s = await loadSnapshot();
    const me = findUser(s, req.admin!.sub);
    if (!current || !verifyPassword(current, me)) throw new HttpError(400, 'Mot de passe actuel incorrect');
    if (current === next) throw new HttpError(400, 'Le nouveau mot de passe doit être différent de l’actuel');
    const weak = validatePassword(next || '', policyOf(s), me);
    if (weak) throw new HttpError(400, weak);
    const { hash, salt } = hashPassword(next!);
    const { s: snap, user } = await patchUser(me.id, (u) => {
      u.passwordHash = hash;
      u.salt = salt;
      u.passwordChangedAt = new Date().toISOString();
      u.mustChangePassword = false;
    });
    const closed = await revokeUserSessions(me.id, req.admin!.sid);
    const session = await getSession(req.admin!.sid);
    res.locals.audit = { action: 'profile.password', detail: { closedSessions: closed } };
    void sendSecurityAlert(s, me, 'Mot de passe modifié', [`Adresse IP : ${clientIp(req)}`, `Autres sessions fermées : ${closed}`]);
    res.json({ token: createToken(user, req.admin!.sid, session!.expiresAt), user: meView(snap, user), closedSessions: closed });
  });

  /* ---------- Double authentification ---------- */

  router.post('/me/2fa/setup', requireAuth({ allowPending: true }), async (req: AuthedRequest, res) => {
    res.locals.audit = false;
    const s = await loadSnapshot();
    const me = findUser(s, req.admin!.sub);
    if (me.totpEnabled) throw new HttpError(400, 'La double authentification est déjà active');
    const secret = generateTotpSecret();
    await patchUser(me.id, (u) => {
      u.totpSecret = encryptSecret(secret);
    });
    const url = otpauthUrl(secret, me.email, s.branding.siteName || 'Pexen');
    res.json({ secret, otpauthUrl: url, qrDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 220 }) });
  });

  router.post('/me/2fa/enable', requireAuth({ allowPending: true }), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const me = findUser(s, req.admin!.sub);
    if (me.totpEnabled) throw new HttpError(400, 'La double authentification est déjà active');
    const secret = decryptSecret(me.totpSecret);
    if (!secret) throw new HttpError(400, 'Recommencez la configuration');
    if (!consumeTotp(me.id, secret, String(req.body?.code || ''))) throw new HttpError(400, 'Code incorrect : vérifiez l’heure de votre téléphone et réessayez');
    const codes = generateRecoveryCodes();
    const { s: snap, user } = await patchUser(me.id, (u) => {
      u.totpEnabled = true;
      u.recoveryCodes = codes.hashes;
    });
    res.locals.audit = { action: 'profile.2fa_enabled' };
    void sendSecurityAlert(s, me, 'Double authentification activée', [`Adresse IP : ${clientIp(req)}`]);
    res.json({ recoveryCodes: codes.plain, user: meView(snap, user) });
  });

  router.post('/me/2fa/disable', requireAuth(), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const me = findUser(s, req.admin!.sub);
    if (!me.totpEnabled) throw new HttpError(400, 'La double authentification n’est pas active');
    if (pendingRequirements(s, me).twoFactorRequired) throw new HttpError(400, 'La politique de sécurité impose la double authentification pour votre compte');
    if (!verifyPassword(String(req.body?.password || ''), me)) throw new HttpError(400, 'Mot de passe incorrect');
    const { s: snap, user } = await patchUser(me.id, (u) => {
      u.totpEnabled = false;
      u.totpSecret = undefined;
      u.recoveryCodes = [];
    });
    res.locals.audit = { action: 'profile.2fa_disabled' };
    void sendSecurityAlert(s, me, 'Double authentification désactivée', [`Adresse IP : ${clientIp(req)}`]);
    res.json({ user: meView(snap, user) });
  });

  router.post('/me/2fa/recovery-codes', requireAuth(), async (req: AuthedRequest, res) => {
    const s = await loadSnapshot();
    const me = findUser(s, req.admin!.sub);
    if (!me.totpEnabled) throw new HttpError(400, 'La double authentification n’est pas active');
    if (!verifyPassword(String(req.body?.password || ''), me)) throw new HttpError(400, 'Mot de passe incorrect');
    const codes = generateRecoveryCodes();
    const { s: snap, user } = await patchUser(me.id, (u) => {
      u.recoveryCodes = codes.hashes;
    });
    res.locals.audit = { action: 'profile.recovery_codes' };
    res.json({ recoveryCodes: codes.plain, user: meView(snap, user) });
  });

  /* ---------- Sessions & activité ---------- */

  router.get('/me/sessions', requireAuth({ allowPending: true }), async (req: AuthedRequest, res) => {
    const rows = await listActiveSessions(req.admin!.sub);
    res.json(
      rows.map((r) => ({
        id: r.id,
        current: r.id === req.admin!.sid,
        device: describeUserAgent(r.userAgent),
        userAgent: r.userAgent,
        ip: r.ip,
        createdAt: r.createdAt.toISOString(),
        lastSeenAt: r.lastSeenAt.toISOString(),
        expiresAt: r.expiresAt.toISOString(),
        remember: r.remember,
      }))
    );
  });

  router.delete('/me/sessions/:id', requireAuth(), async (req: AuthedRequest, res) => {
    if (req.params.id === req.admin!.sid) throw new HttpError(400, 'Utilisez « Se déconnecter » pour fermer la session en cours');
    if (!(await revokeSession(req.params.id, req.admin!.sub))) throw new HttpError(404, 'Session introuvable');
    res.locals.audit = { action: 'profile.session_revoked' };
    res.json({ ok: true });
  });

  router.post('/me/sessions/revoke-others', requireAuth(), async (req: AuthedRequest, res) => {
    const closed = await revokeUserSessions(req.admin!.sub, req.admin!.sid);
    res.locals.audit = { action: 'profile.sessions_revoked', detail: { count: closed } };
    res.json({ closed });
  });

  router.get('/me/activity', requireAuth(), async (req: AuthedRequest, res) => {
    const { page, pageSize } = paging(req.query);
    const { items, total } = await queryAudit({ userId: req.admin!.sub, page, pageSize });
    res.json({ items, total, page, pageSize });
  });

  return router;
}
