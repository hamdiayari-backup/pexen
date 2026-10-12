import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { BlogPost, CmsPage, ContentRevision } from './types';
import { db, type Tx } from '../db/client';
import { revisions } from '../db/schema';

const MAX_REVISIONS_PER_ENTITY = 50;

const toRevision = (r: typeof revisions.$inferSelect): ContentRevision => ({
  id: r.id,
  entityType: r.entityType,
  entityId: r.entityId,
  label: r.label,
  snapshot: r.snapshot,
  createdAt: r.createdAt.toISOString(),
  ...(r.authorEmail ? { authorEmail: r.authorEmail } : {}),
});

export async function saveRevision(params: {
  entityType: 'page' | 'post';
  entityId: string;
  label: string;
  snapshot: CmsPage | BlogPost;
  authorEmail?: string;
}): Promise<ContentRevision> {
  const [row] = await db
    .insert(revisions)
    .values({
      id: crypto.randomUUID(),
      entityType: params.entityType,
      entityId: params.entityId,
      label: params.label,
      snapshot: structuredClone(params.snapshot),
      authorEmail: params.authorEmail ?? null,
    })
    .returning();

  const stale = await db
    .select({ id: revisions.id })
    .from(revisions)
    .where(and(eq(revisions.entityType, params.entityType), eq(revisions.entityId, params.entityId)))
    .orderBy(desc(revisions.createdAt))
    .offset(MAX_REVISIONS_PER_ENTITY);
  if (stale.length) await db.delete(revisions).where(inArray(revisions.id, stale.map((s) => s.id)));

  return toRevision(row);
}

export async function listRevisions(entityType: 'page' | 'post', entityId: string): Promise<ContentRevision[]> {
  const rows = await db
    .select()
    .from(revisions)
    .where(and(eq(revisions.entityType, entityType), eq(revisions.entityId, entityId)))
    .orderBy(desc(revisions.createdAt));
  return rows.map(toRevision);
}

export async function getRevision(id: string): Promise<ContentRevision | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await db.select().from(revisions).where(eq(revisions.id, id));
  return row ? toRevision(row) : null;
}

/** Import unique des révisions stockées en fichiers JSON avant le passage à PostgreSQL. */
export async function importLegacyRevisions(tx: Tx, dir: string): Promise<void> {
  let files: string[];
  try {
    files = (await fs.readdir(dir)).filter((f) => f.endsWith('.json'));
  } catch {
    return;
  }
  for (const f of files) {
    try {
      const rev = JSON.parse(await fs.readFile(path.join(dir, f), 'utf-8')) as ContentRevision;
      await tx
        .insert(revisions)
        .values({
          id: rev.id,
          entityType: rev.entityType,
          entityId: rev.entityId,
          label: rev.label,
          snapshot: rev.snapshot,
          authorEmail: rev.authorEmail ?? null,
          createdAt: new Date(rev.createdAt),
        })
        .onConflictDoNothing();
    } catch (e) {
      console.warn(`[cms] révision ignorée (${f})`, e);
    }
  }
}
