/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import type { Request, Response, NextFunction } from 'express';
import { passwordExpired, tokenMatchesUser, verifyToken } from '../cms/auth';
import { loadSnapshot } from '../cms/store';
import type { AdminUser, CmsSnapshot } from '../cms/types';
import { rolePermissions, SUPERADMIN_ROLE, type Permission } from '../cms/permissions';
import { HttpError } from '../http';
import { getSession, isSessionActive, touchSession } from '../security/sessions';
import { clientIp, ipAllowed } from '../security/ip';
import { hit, rateLimitError } from '../security/rateLimit';

export interface AdminContext {
  sub: string;
  email: string;
  name: string;
  role: string;
  sid: string;
  isSuper: boolean;
  permissions: Permission[];
}

export interface AuthedRequest extends Request {
  admin?: AdminContext;
}

export function permissionsOf(s: CmsSnapshot, user: AdminUser): Permission[] {
  return rolePermissions(s.roles, user.role);
}

/** Étapes obligatoires avant d'accéder à l'administration. */
export function pendingRequirements(s: CmsSnapshot, user: AdminUser) {
  const policy = s.system.security;
  const twoFactorRequired = policy.twoFactor === 'all' || (policy.twoFactor === 'superadmins' && user.role === SUPERADMIN_ROLE);
  return {
    mustChangePassword: !!user.mustChangePassword || passwordExpired(user, policy.passwordExpiryDays),
    mustSetup2fa: twoFactorRequired && !user.totpEnabled,
    twoFactorRequired,
  };
}

const unauthorized = (message = 'Session expirée') => new HttpError(401, message, 'SESSION_EXPIRED');

async function authenticate(req: AuthedRequest, res: Response): Promise<{ user: AdminUser; snap: CmsSnapshot }> {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (!token) throw new HttpError(401, 'Non authentifié', 'SESSION_EXPIRED');

  const payload = verifyToken(token);
  if (!payload) throw unauthorized();

  const snap = await loadSnapshot();
  const user = snap.users.find((u) => u.id === payload.sub);
  if (!user || !tokenMatchesUser(payload, user)) throw unauthorized();
  if (user.status !== 'active') throw unauthorized(user.status === 'suspended' ? 'Compte suspendu' : 'Session expirée');

  const session = await getSession(payload.sid);
  if (!session || session.userId !== user.id || !isSessionActive(session, snap.system.security.idleMinutes)) {
    throw unauthorized(session && !session.revokedAt && session.expiresAt.getTime() > Date.now() ? 'Session fermée après inactivité' : 'Session expirée');
  }
  touchSession(session.id, clientIp(req));

  const quota = hit(`admin:${user.id}`, snap.system.limits.adminApiPerMinute, 60_000);
  if (!quota.ok) throw rateLimitError(res, quota, 'Trop de requêtes');

  req.admin = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    sid: session.id,
    isSuper: user.role === SUPERADMIN_ROLE,
    permissions: permissionsOf(snap, user),
  };
  return { user, snap };
}

/**
 * Toute personne connectée. Tant qu'un changement de mot de passe ou l'activation de la 2FA est exigé,
 * seules les routes marquées `allowPending` (profil, déconnexion) répondent.
 */
export function requireAuth(opts: { allowPending?: boolean } = {}) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const { user, snap } = await authenticate(req, res);
      if (!opts.allowPending) {
        const pending = pendingRequirements(snap, user);
        if (pending.mustChangePassword) throw new HttpError(403, 'Vous devez changer votre mot de passe', 'PASSWORD_CHANGE_REQUIRED');
        if (pending.mustSetup2fa) throw new HttpError(403, 'Activez la double authentification pour continuer', 'TWO_FACTOR_REQUIRED');
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Au moins une des permissions demandées (le super administrateur les a toutes). */
export function requirePerm(...perms: Permission[]) {
  const auth = requireAuth();
  return (req: AuthedRequest, res: Response, next: NextFunction) =>
    auth(req, res, (err?: unknown) => {
      if (err) return next(err);
      if (!perms.some((p) => req.admin!.permissions.includes(p))) return next(new HttpError(403, 'Droits insuffisants', 'FORBIDDEN'));
      next();
    });
}

export const requireAdmin = () => requireAuth();

export const hasPerm = (req: AuthedRequest, ...perms: Permission[]) => perms.some((p) => !!req.admin?.permissions.includes(p));

export function assertPerm(req: AuthedRequest, perm: Permission, message = 'Droits insuffisants') {
  if (!hasPerm(req, perm)) throw new HttpError(403, message, 'FORBIDDEN');
}

/** Restreint toute l'API d'administration aux adresses autorisées (contournement : PEXEN_ADMIN_IP_BYPASS=true). */
export async function adminIpGuard(req: Request, _res: Response, next: NextFunction) {
  try {
    if (process.env.PEXEN_ADMIN_IP_BYPASS === 'true') return next();
    const s = await loadSnapshot();
    const ip = clientIp(req);
    if (!ipAllowed(ip, s.system.security.adminIpAllowlist)) {
      return next(new HttpError(403, `Administration inaccessible depuis votre adresse IP (${ip})`, 'IP_BLOCKED'));
    }
    next();
  } catch (e) {
    next(e);
  }
}
