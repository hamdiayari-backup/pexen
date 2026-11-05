/**
 * Désactive Contrat de performance : draft + hors menus + 301 → /expertises/
 */
import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const CPE = '/expertises/contrat-performance-energetique/';
const OLD = '/contrat-de-performance-energetique/';

const snap = await updateSnapshot((s) => {
  const page = s.pages.find((p) => p.path === CPE);
  if (page) {
    page.status = 'draft';
    page.updatedAt = new Date().toISOString();
  }

  for (const mid of ['primary', 'mobile', 'footer'] as const) {
    const m = s.menus.find((x) => x.id === mid);
    if (!m) continue;
    m.items = m.items.map((it) => ({
      ...it,
      children: (it.children || []).filter((c) => c.path !== CPE && c.path !== OLD),
    }));
  }

  const upsert = (from: string, to: string) => {
    const i = s.redirects.findIndex((r) => r.from === from);
    if (i >= 0) s.redirects[i] = { from, to, permanent: true };
    else s.redirects.push({ from, to, permanent: true });
  };
  upsert(CPE, '/expertises/');
  upsert(OLD, '/expertises/');
});

const p = snap.pages.find((x) => x.path === CPE);
const menu = snap.menus.find((m) => m.id === 'primary')?.items.find((i) => i.path === '/expertises/');
console.log('CPE status', p?.status);
console.log(
  'Expertises children',
  (menu?.children || []).map((c) => c.label).join(' · ')
);
await pool.end();
