/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import { and, desc, eq, gt, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { db } from '../db/client';
import { adminSessions } from '../db/schema';
import { randomToken } from './secrets';

export type SessionRow = typeof adminSessions.$inferSelect;

const CACHE_MS = 30_000;
const FLUSH_MS = 60_000;

const cache = new Map<string, { row: SessionRow | null; at: number }>();
/** Dernière activité connue en mémoire ; écrite en base au plus une fois par minute. */
const seen = new Map<string, { at: number; flushedAt: number }>();

export async function createSession(input: { userId: string; ip: string; userAgent?: string; remember: boolean; ttlMs: number }): Promise<SessionRow> {
  const now = new Date();
  const [row] = await db
    .insert(adminSessions)
    .values({
      id: randomToken(18),
      userId: input.userId,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: new Date(now.getTime() + input.ttlMs),
      ip: input.ip,
      userAgent: input.userAgent?.slice(0, 400),
      remember: input.remember,
    })
    .returning();
  cache.set(row.id, { row, at: Date.now() });
  seen.set(row.id, { at: Date.now(), flushedAt: Date.now() });
  return row;
}

export async function getSession(id: string): Promise<SessionRow | null> {
  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.row;
  const [row] = await db.select().from(adminSessions).where(eq(adminSessions.id, id)).limit(1);
  cache.set(id, { row: row ?? null, at: Date.now() });
  return row ?? null;
}

export function lastActivity(row: SessionRow): number {
  return Math.max(seen.get(row.id)?.at ?? 0, row.lastSeenAt.getTime());
}

export function isSessionActive(row: SessionRow | null, idleMinutes: number): boolean {
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) return false;
  if (idleMinutes > 0 && Date.now() - lastActivity(row) > idleMinutes * 60_000) return false;
  return true;
}

export function touchSession(id: string, ip?: string) {
  const now = Date.now();
  const s = seen.get(id) ?? { at: now, flushedAt: 0 };
  s.at = now;
  seen.set(id, s);
  if (now - s.flushedAt < FLUSH_MS) return;
  s.flushedAt = now;
  void db
    .update(adminSessions)
    .set({ lastSeenAt: new Date(now), ...(ip ? { ip } : {}) })
    .where(eq(adminSessions.id, id))
    .catch((e) => console.error('[sessions] mise à jour impossible', e));
}

function forget(ids: string[]) {
  for (const id of ids) {
    cache.delete(id);
    seen.delete(id);
  }
}

export async function revokeSession(id: string, userId?: string): Promise<boolean> {
  const rows = await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.id, id), isNull(adminSessions.revokedAt), userId ? eq(adminSessions.userId, userId) : undefined))
    .returning({ id: adminSessions.id });
  forget([id]);
  return rows.length > 0;
}

/** Révoque toutes les sessions d'un compte, sauf éventuellement `exceptId`. Renvoie le nombre de sessions fermées. */
export async function revokeUserSessions(userId: string, exceptId?: string): Promise<number> {
  const rows = await db
    .update(adminSessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(adminSessions.userId, userId), isNull(adminSessions.revokedAt), exceptId ? ne(adminSessions.id, exceptId) : undefined))
    .returning({ id: adminSessions.id });
  forget(rows.map((r) => r.id));
  return rows.length;
}

export async function listActiveSessions(userId: string): Promise<SessionRow[]> {
  const rows = await db
    .select()
    .from(adminSessions)
    .where(and(eq(adminSessions.userId, userId), isNull(adminSessions.revokedAt), gt(adminSessions.expiresAt, new Date())))
    .orderBy(desc(adminSessions.lastSeenAt));
  return rows.map((r) => ({ ...r, lastSeenAt: new Date(lastActivity(r)) }));
}

/** Nombre de sessions actives par utilisateur. */
export async function activeSessionCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ userId: adminSessions.userId, n: sql<number>`count(*)::int` })
    .from(adminSessions)
    .where(and(isNull(adminSessions.revokedAt), gt(adminSessions.expiresAt, new Date())))
    .groupBy(adminSessions.userId);
  return new Map(rows.map((r) => [r.userId, r.n]));
}

export async function hasUsedIp(userId: string, ip: string): Promise<boolean> {
  const rows = await db
    .select({ id: adminSessions.id })
    .from(adminSessions)
    .where(and(eq(adminSessions.userId, userId), eq(adminSessions.ip, ip)))
    .limit(1);
  return rows.length > 0;
}

/** Supprime les sessions expirées ou révoquées depuis plus de 30 jours. */
export async function purgeSessions(): Promise<number> {
  const limit = new Date(Date.now() - 30 * 86400_000);
  const rows = await db
    .delete(adminSessions)
    .where(or(lt(adminSessions.expiresAt, limit), lt(adminSessions.revokedAt, limit)))
    .returning({ id: adminSessions.id });
  return rows.length;
}

export const sessionTtlMs = (security: { sessionHours: number; rememberDays: number }, remember: boolean) =>
  remember ? security.rememberDays * 86400_000 : security.sessionHours * 3600_000;
