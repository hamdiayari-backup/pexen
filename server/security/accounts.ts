/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import type { Request } from 'express';
import { createToken } from '../cms/auth';
import { updateSnapshot } from '../cms/store';
import type { AdminUser, CmsSnapshot } from '../cms/types';
import { SUPERADMIN_ROLE } from '../cms/permissions';
import { pendingRequirements, permissionsOf } from '../middleware/adminAuth';
import { renderEmail, sendMail } from '../mail';
import { clientIp, describeUserAgent } from './ip';
import { createSession, hasUsedIp, sessionTtlMs } from './sessions';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function publicUser(u: AdminUser) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    status: u.status ?? 'active',
    title: u.title,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    totpEnabled: !!u.totpEnabled,
    mustChangePassword: !!u.mustChangePassword,
    passwordChangedAt: u.passwordChangedAt,
    lastLoginAt: u.lastLoginAt,
    lastLoginIp: u.lastLoginIp,
    loginCount: u.loginCount ?? 0,
    invitedBy: u.invitedBy,
    createdAt: u.createdAt,
  };
}

export function meView(s: CmsSnapshot, u: AdminUser) {
  const role = s.roles.find((r) => r.id === u.role);
  const pending = pendingRequirements(s, u);
  const policy = s.system.security;
  return {
    ...publicUser(u),
    roleName: role?.name ?? u.role,
    isSuper: u.role === SUPERADMIN_ROLE,
    permissions: permissionsOf(s, u),
    recoveryCodesLeft: u.recoveryCodes?.length ?? 0,
    mustChangePassword: pending.mustChangePassword,
    mustSetup2fa: pending.mustSetup2fa,
    twoFactorRequired: pending.twoFactorRequired,
    policy: {
      passwordMinLength: policy.passwordMinLength,
      requireUppercase: policy.requireUppercase,
      requireNumber: policy.requireNumber,
      requireSymbol: policy.requireSymbol,
      idleMinutes: policy.idleMinutes,
    },
  };
}

export const superadminCount = (s: CmsSnapshot) => s.users.filter((u) => u.role === SUPERADMIN_ROLE && u.status !== 'suspended').length;

/**
 * Adresse de l'administration pour les liens envoyés par e-mail. L'en-tête Host n'est repris que s'il correspond
 * à l'URL publique ou à un poste local, pour empêcher l'empoisonnement des liens de réinitialisation.
 */
export function adminUrl(req: Request, s: CmsSnapshot, path: string): string {
  const configured = process.env.PEXEN_ADMIN_URL?.replace(/\/$/, '');
  if (configured) return `${configured}${path}`;
  const publicUrl = new URL(s.settings.publicUrl);
  const host = String(req.headers.host || '');
  const hostname = host.replace(/:\d+$/, '');
  const trusted = hostname === publicUrl.hostname || hostname === 'localhost' || hostname === '127.0.0.1';
  const origin = trusted ? `${req.protocol}://${host}` : publicUrl.origin;
  return `${origin}/administrator${path}`;
}

/** Ouvre une session, met à jour les compteurs de connexion et prévient en cas de nouvelle adresse IP. */
export async function startSession(req: Request, s: CmsSnapshot, user: AdminUser, remember: boolean) {
  const ip = clientIp(req);
  const userAgent = String(req.headers['user-agent'] || '');
  const knownIp = user.loginCount ? await hasUsedIp(user.id, ip) : true;
  const session = await createSession({ userId: user.id, ip, userAgent, remember, ttlMs: sessionTtlMs(s.system.security, remember) });
  const updated = await updateSnapshot((snap) => {
    const u = snap.users.find((x) => x.id === user.id);
    if (!u) return;
    u.lastLoginAt = new Date().toISOString();
    u.lastLoginIp = ip;
    u.loginCount = (u.loginCount ?? 0) + 1;
  });
  const fresh = updated.users.find((u) => u.id === user.id)!;
  if (!knownIp) {
    void sendSecurityAlert(s, fresh, 'Nouvelle connexion à votre compte', [
      `Appareil : ${describeUserAgent(userAgent)}`,
      `Adresse IP : ${ip}`,
      `Date : ${new Date().toLocaleString('fr-FR', { timeZone: s.general.timezone || 'Europe/Paris' })}`,
    ]);
  }
  return { token: createToken(fresh, session.id, session.expiresAt), user: meView(updated, fresh), expiresAt: session.expiresAt.toISOString() };
}

export async function sendSecurityAlert(s: CmsSnapshot, user: AdminUser, title: string, lines: string[]) {
  if (!s.system.notifications.securityAlerts) return;
  const { html, text } = renderEmail(s, {
    title,
    intro: `Bonjour ${user.name}, une opération de sécurité vient d’avoir lieu sur votre compte ${s.branding.siteName}.`,
    lines,
    outro: 'Si vous n’êtes pas à l’origine de cette action, changez immédiatement votre mot de passe et prévenez un administrateur.',
  });
  await sendMail({ to: user.email, subject: `${title} — ${s.branding.siteName}`, html, text, kind: 'security' });
}

/** Prévient les adresses de notification lors des créations / suppressions de comptes. */
export async function notifyAccountChange(s: CmsSnapshot, title: string, lines: string[]) {
  const to = s.system.notifications.adminEmails;
  if (!s.system.notifications.accountChanges || !to.length) return;
  const { html, text } = renderEmail(s, { title, intro: `Modification des accès à l’administration de ${s.branding.siteName}.`, lines });
  await sendMail({ to, subject: `${title} — ${s.branding.siteName}`, html, text, kind: 'notification' });
}
