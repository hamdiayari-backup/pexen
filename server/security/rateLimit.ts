/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Compteurs en mémoire à fenêtre fixe (processus unique sous PM2). */
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../http';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const sweep = setInterval(() => {
  const now = Date.now();
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
}, 5 * 60_000);
sweep.unref();

export interface LimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
}

/** Compte un appel ; `max <= 0` = illimité. */
export function hit(key: string, max: number, windowMs: number): LimitResult {
  if (max <= 0) return { ok: true, remaining: Infinity, retryAfterSec: 0 };
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  if (b.count >= max) return { ok: false, remaining: 0, retryAfterSec };
  b.count++;
  return { ok: true, remaining: max - b.count, retryAfterSec };
}

/** Vérifie sans compter (verrouillage après échecs de connexion). */
export function peek(key: string, max: number): LimitResult {
  const b = buckets.get(key);
  const now = Date.now();
  if (!b || b.resetAt <= now || max <= 0) return { ok: true, remaining: max, retryAfterSec: 0 };
  const retryAfterSec = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  return b.count >= max ? { ok: false, remaining: 0, retryAfterSec } : { ok: true, remaining: max - b.count, retryAfterSec };
}

export function reset(key: string) {
  buckets.delete(key);
}

export function resetPrefix(prefix: string) {
  for (const k of buckets.keys()) if (k.startsWith(prefix)) buckets.delete(k);
}

export function formatWait(sec: number): string {
  if (sec < 60) return `${sec} s`;
  const min = Math.ceil(sec / 60);
  return min < 60 ? `${min} min` : `${Math.ceil(min / 60)} h`;
}

export function rateLimitError(res: Response, r: LimitResult, message = 'Trop de requêtes'): HttpError {
  res.setHeader('Retry-After', String(r.retryAfterSec));
  return new HttpError(429, `${message}. Réessayez dans ${formatWait(r.retryAfterSec)}.`);
}

/** Middleware : `limit` est relu à chaque requête pour suivre les réglages. */
export function rateLimit(name: string, limit: () => Promise<{ max: number; windowMs: number }>, key: (req: Request) => string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { max, windowMs } = await limit();
      const r = hit(`${name}:${key(req)}`, max, windowMs);
      if (!r.ok) return next(rateLimitError(res, r));
      next();
    } catch (e) {
      next(e);
    }
  };
}
