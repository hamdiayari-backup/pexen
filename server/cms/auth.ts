import crypto from 'crypto';
import type { AdminUser } from './types';

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

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

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 10) return 'Le mot de passe doit contenir au moins 10 caractères.';
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Le mot de passe doit mêler lettres et chiffres.';
  return null;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: AdminUser['role'];
  exp: number;
  /** Empreinte du hash : un changement de mot de passe invalide les sessions existantes. */
  pv: string;
}

function passwordVersion(user: AdminUser): string {
  return user.passwordHash.slice(0, 12);
}

export function createToken(user: AdminUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
    pv: passwordVersion(user),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', jwtSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', jwtSecret()).update(body).digest('base64url');
  if (!safeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as TokenPayload;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function tokenMatchesUser(payload: TokenPayload, user: AdminUser): boolean {
  return payload.pv === passwordVersion(user);
}

export async function ensureDefaultAdmin(users: AdminUser[]): Promise<AdminUser[]> {
  if (users.length > 0) return users;
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('ADMIN_PASSWORD requis pour créer le premier compte administrateur');
  const { hash, salt } = hashPassword(password);
  return [
    {
      id: 'admin-1',
      email: process.env.ADMIN_EMAIL || 'admin@pexen.fr',
      passwordHash: hash,
      salt,
      role: 'superadmin',
      name: 'Administrateur PEXEN',
    },
  ];
}

const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 15 * 60_000;

export function checkLoginThrottle(key: string): { ok: boolean; retryInSec?: number } {
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || row.resetAt < now) return { ok: true };
  if (row.count >= MAX_ATTEMPTS) return { ok: false, retryInSec: Math.ceil((row.resetAt - now) / 1000) };
  return { ok: true };
}

export function recordLoginFailure(key: string) {
  const now = Date.now();
  const row = attempts.get(key);
  if (!row || row.resetAt < now) attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else row.count++;
}

export function clearLoginFailures(key: string) {
  attempts.delete(key);
}
