/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import crypto from 'crypto';
import type { AdminUser, SystemSettings } from './types';

function jwtSecret(): string {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('ADMIN_JWT_SECRET doit être défini en production');
  }
  return secret || 'dev-only-secret-pexen-cms';
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { hash, salt: s };
}

function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function verifyPassword(password: string, user: AdminUser): boolean {
  const { hash } = hashPassword(password, user.salt);
  return safeEqual(Buffer.from(hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

/** Empreinte factice : même coût de calcul quand le compte n'existe pas (pas d'énumération par le temps de réponse). */
let dummy: AdminUser | null = null;
export function burnPasswordCheck(password: string) {
  if (!dummy) {
    const { hash, salt } = hashPassword(crypto.randomUUID());
    dummy = { id: '', email: '', name: '', role: '', passwordHash: hash, salt };
  }
  verifyPassword(password, dummy);
}

/** Mot de passe inutilisable (comptes invités, réinitialisés). */
export function unusablePassword(): { hash: string; salt: string } {
  return hashPassword(crypto.randomBytes(32).toString('hex'));
}

type PasswordPolicy = Pick<SystemSettings['security'], 'passwordMinLength' | 'requireUppercase' | 'requireNumber' | 'requireSymbol'>;

export function validatePassword(password: string, policy: PasswordPolicy, user?: { email?: string; name?: string }): string | null {
  if (password.length < policy.passwordMinLength) return `Le mot de passe doit contenir au moins ${policy.passwordMinLength} caractères.`;
  if (password.length > 200) return 'Le mot de passe est trop long (200 caractères max).';
  if (!/[a-zA-Z]/.test(password)) return 'Le mot de passe doit contenir au moins une lettre.';
  if (policy.requireUppercase && (!/[A-Z]/.test(password) || !/[a-z]/.test(password))) return 'Le mot de passe doit mêler majuscules et minuscules.';
  if (policy.requireNumber && !/\d/.test(password)) return 'Le mot de passe doit contenir au moins un chiffre.';
  if (policy.requireSymbol && !/[^a-zA-Z0-9]/.test(password)) return 'Le mot de passe doit contenir au moins un caractère spécial.';
  const lower = password.toLowerCase();
  const local = user?.email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && lower.includes(local)) return 'Le mot de passe ne doit pas contenir votre adresse e-mail.';
  if (/^(.)\1+$/.test(password) || /^(?:0123456789|1234567890|azertyuiop|qwertyuiop|password|motdepasse)/i.test(password)) {
    return 'Ce mot de passe est trop facile à deviner.';
  }
  return null;
}

/** Le mot de passe a-t-il dépassé la durée de validité de la politique ? */
export function passwordExpired(user: AdminUser, expiryDays: number): boolean {
  if (expiryDays <= 0) return false;
  const since = user.passwordChangedAt || user.createdAt;
  return !!since && Date.now() - new Date(since).getTime() > expiryDays * 86400_000;
}

/* ---------- Jetons signés ---------- */

function sign(payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', jwtSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function unsign<T extends { exp: number }>(token: string): T | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', jwtSecret()).update(body).digest('base64url');
  if (!safeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as T;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export interface TokenPayload {
  typ: 'session';
  sub: string;
  /** Identifiant de session (table admin_sessions), révocable. */
  sid: string;
  exp: number;
  /** Empreinte du hash : un changement de mot de passe invalide les jetons existants. */
  pv: string;
}

const passwordVersion = (user: AdminUser) => user.passwordHash.slice(0, 12);

export function createToken(user: AdminUser, sid: string, expiresAt: Date): string {
  return sign({ typ: 'session', sub: user.id, sid, exp: expiresAt.getTime(), pv: passwordVersion(user) } satisfies TokenPayload);
}

export function verifyToken(token: string): TokenPayload | null {
  const p = unsign<TokenPayload>(token);
  return p?.typ === 'session' && p.sid ? p : null;
}

export const tokenMatchesUser = (payload: { pv: string }, user: AdminUser) => payload.pv === passwordVersion(user);

/** Étape intermédiaire de connexion : mot de passe validé, code 2FA attendu (5 min). */
export interface ChallengePayload {
  typ: '2fa';
  sub: string;
  remember: boolean;
  exp: number;
  pv: string;
}

export const createChallenge = (user: AdminUser, remember: boolean) =>
  sign({ typ: '2fa', sub: user.id, remember, exp: Date.now() + 5 * 60_000, pv: passwordVersion(user) } satisfies ChallengePayload);

export function verifyChallenge(token: string): ChallengePayload | null {
  const p = unsign<ChallengePayload>(token);
  return p?.typ === '2fa' ? p : null;
}

export async function ensureDefaultAdmin(users: AdminUser[]): Promise<AdminUser[]> {
  if (users.length > 0) return users;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD requis pour créer le premier compte administrateur');
  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  return [
    {
      id: 'admin-1',
      email: process.env.ADMIN_EMAIL || 'admin@pexen.fr',
      passwordHash: hash,
      salt,
      role: 'superadmin',
      name: 'Administrateur Pexen',
      status: 'active',
      passwordChangedAt: now,
      createdAt: now,
    },
  ];
}
