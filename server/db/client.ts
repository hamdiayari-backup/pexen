import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from './schema';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL manquant : configurez PostgreSQL dans .env');
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => console.error('[db] erreur du pool PostgreSQL', err));

export const db = drizzle(pool, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

let migrated: Promise<void> | null = null;

/** Applique les migrations SQL versionnées (dossier drizzle/) une seule fois par processus. */
export function runMigrations(): Promise<void> {
  migrated ??= migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  return migrated;
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
