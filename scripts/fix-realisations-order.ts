import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const ORDER = [
  '/realisations/carrefour-market-recuperation-de-chaleur/',
  '/realisations/intermarche-sortie-du-fioul/',
  '/realisations/cedim-destratification/',
];

const snap = await updateSnapshot((s) => {
  for (const page of s.pages) {
    if (page.template !== 'project' || !page.project) continue;
    const idx = ORDER.indexOf(page.path);
    if (idx >= 0) {
      (page.project as { sortOrder?: number }).sortOrder = idx;
      page.project.featured = true;
    }
  }
  const byPath = new Map(s.pages.map((p) => [p.path, p]));
  const ordered = ORDER.map((path) => byPath.get(path)).filter(Boolean);
  const rest = s.pages.filter((p) => !ORDER.includes(p.path));
  s.pages = [...ordered!, ...rest] as typeof s.pages;
});

console.log(
  'order',
  snap.pages.filter((p) => ORDER.includes(p.path)).map((p) => p.project?.client || p.path)
);
await pool.end();
