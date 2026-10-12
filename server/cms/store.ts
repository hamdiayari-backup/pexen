import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CmsSnapshot } from './types';
import { createEmptySnapshot } from './defaults';
import { ensureSeeded } from './seed';
import { applyScheduledPublishing, migrateSnapshot } from './scheduler';
import { db, runMigrations } from '../db/client';
import { loadFromDatabase, persistSnapshot } from '../db/repository';
import { importLegacyAnalytics } from './analyticsStore';
import { importLegacyRevisions } from './revisions';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data/cms');
const LEGACY_SNAPSHOT = path.join(DATA_DIR, 'snapshot.json');

/*
 * PostgreSQL est la source de vérité. L'état est gardé en mémoire (processus unique sous PM2)
 * et chaque mutation est écrite en transaction avant de remplacer le cache : une écriture
 * en échec laisse le cache intact.
 */
let cache: CmsSnapshot | null = null;
let loading: Promise<CmsSnapshot> | null = null;
let mutationQueue: Promise<unknown> = Promise.resolve();
let lastScheduleCheck = 0;

async function readLegacySnapshot(): Promise<CmsSnapshot | null> {
  try {
    return JSON.parse(await fs.readFile(LEGACY_SNAPSHOT, 'utf-8')) as CmsSnapshot;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

async function initialLoad(): Promise<CmsSnapshot> {
  await runMigrations();

  const stored = await loadFromDatabase();
  if (stored) {
    const migrated = structuredClone(stored);
    migrateSnapshot(migrated);
    await db.transaction((tx) => persistSnapshot(tx, stored, migrated));
    return migrated;
  }

  // Base vide : import de l'ancien fichier JSON s'il existe, sinon contenu initial.
  const legacy = await readLegacySnapshot();
  const snapshot = legacy ?? createEmptySnapshot();
  if (!legacy) await ensureSeeded(snapshot);
  migrateSnapshot(snapshot);
  const legacyEvents = snapshot.analyticsEvents;
  delete snapshot.analyticsEvents;

  await db.transaction(async (tx) => {
    await persistSnapshot(tx, null, snapshot);
    await importLegacyRevisions(tx, path.join(DATA_DIR, 'revisions'));
    await importLegacyAnalytics(tx, path.join(DATA_DIR, 'analytics.jsonl'), legacyEvents);
  });

  if (legacy) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    await fs.rename(LEGACY_SNAPSHOT, `${LEGACY_SNAPSHOT}.imported-${stamp}`);
    console.log('[cms] snapshot.json importé dans PostgreSQL (copie conservée)');
  }
  return snapshot;
}

async function ensureLoaded(): Promise<CmsSnapshot> {
  if (!cache) {
    loading ??= initialLoad().catch((e) => {
      loading = null;
      throw e;
    });
    cache = await loading;
  }
  return cache;
}

export async function loadSnapshot(): Promise<CmsSnapshot> {
  const snapshot = await ensureLoaded();
  if (Date.now() - lastScheduleCheck > 60_000) {
    lastScheduleCheck = Date.now();
    if (applyScheduledPublishing(structuredClone(snapshot))) {
      return updateSnapshot((s) => {
        applyScheduledPublishing(s);
      });
    }
  }
  return snapshot;
}

/** Mutations sérialisées : chaque mutateur part de la dernière version persistée. */
export function updateSnapshot(mutator: (s: CmsSnapshot) => void): Promise<CmsSnapshot> {
  const run = mutationQueue.then(async () => {
    const current = await ensureLoaded();
    const next = structuredClone(current);
    mutator(next);
    await db.transaction((tx) => persistSnapshot(tx, current, next));
    cache = next;
    return next;
  });
  mutationQueue = run.catch(() => undefined);
  return run;
}

export function getDataPaths() {
  return { DATA_DIR, UPLOADS_DIR: path.resolve(__dirname, '../../public/uploads') };
}
