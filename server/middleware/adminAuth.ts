import type { Request, Response, NextFunction } from 'express';
import { tokenMatchesUser, verifyToken } from '../cms/auth';
import { loadSnapshot } from '../cms/store';
import type { AdminUser } from '../cms/types';

export interface AuthedRequest extends Request {
  admin?: { sub: string; email: string; role: AdminUser['role']; name: string };
}

export type Role = AdminUser['role'];

/** `roles` absent = tout utilisateur connecté. Le superadmin passe toujours. Le rôle est relu en base. */
export function requireAdmin(roles?: Role[]) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
      if (!token) return res.status(401).json({ error: 'Non authentifié' });

      const payload = verifyToken(token);
      if (!payload) return res.status(401).json({ error: 'Session expirée' });

      const snap = await loadSnapshot();
      const user = snap.users.find((u) => u.id === payload.sub);
      if (!user || !tokenMatchesUser(payload, user)) {
        return res.status(401).json({ error: 'Session expirée' });
      }
      if (roles && user.role !== 'superadmin' && !roles.includes(user.role)) {
        return res.status(403).json({ error: 'Droits insuffisants' });
      }
      req.admin = { sub: user.id, email: user.email, role: user.role, name: user.name };
      next();
    } catch (e) {
      next(e);
    }
  };
}

/** Écritures interdites au rôle lecteur. */
export const canEdit = requireAdmin(['editor']);
export const canSeo = requireAdmin(['editor', 'seo']);
export const superOnly = requireAdmin(['superadmin']);
