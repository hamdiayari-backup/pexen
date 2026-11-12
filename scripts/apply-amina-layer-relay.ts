/**
 * Relais Hamdi après Amina :
 * - retire le <style> injecté sur la home (désormais dans ultra.css)
 * - corrige les liens #ancres → pages réalisation dédiées
 * - harmonise padding lg sur Solutions / Secteurs / Réalisations / Notre approche
 */
import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const ANCHOR_TO_PATH: Record<string, string> = {
  '/realisations/#intermarche': '/realisations/intermarche-sortie-du-fioul/',
  '/realisations/#carrefour-market': '/realisations/carrefour-market-recuperation-de-chaleur/',
  '/realisations/#cedim': '/realisations/cedim-destratification/',
  '/realisations/#colorcon': '/realisations/colorcon-efficacite-energetique-industrielle/',
};

const RELAY_PATHS = [
  '/solutions/',
  '/solutions/froid-commercial-industriel/',
  '/solutions/pompe-a-chaleur-tertiaire/',
  '/solutions/recuperation-de-chaleur/',
  '/solutions/gtb-tertiaire-gtc/',
  '/solutions/isolation-technique/',
  '/solutions/renovation-globale-tertiaire/',
  '/secteurs/',
  '/secteurs/efficacite-energetique-industrielle/',
  '/secteurs/efficacite-energetique-tertiaire/',
  '/secteurs/renovation-energetique-copropriete/',
  '/realisations/',
  '/notre-approche/',
];

const now = () => new Date().toISOString();

const snap = await updateSnapshot((s) => {
  /* 1) Strip homepage inline design <style> (moved to ultra.css) */
  const home = s.pages.find((p) => p.path === '/');
  if (home) {
    let stripped = 0;
    home.blocks = home.blocks.map((bl) => {
      if (bl.type !== 'html') return bl;
      const html = String((bl.data as { html?: string }).html || '');
      if (!html.includes('couche design')) return bl;
      stripped++;
      return {
        ...bl,
        data: {
          ...bl.data,
          html: '<!-- couche design Amina → ultra.css (relais Hamdi) -->',
        },
      };
    });
    if (stripped) {
      home.updatedAt = now();
      console.log('home: removed', stripped, 'inline design style block(s)');
    }
  }

  /* 2) Replace #anchor realisation links everywhere */
  let pagesPatched = 0;
  for (const page of s.pages) {
    const raw = JSON.stringify(page.blocks);
    let next = raw;
    for (const [from, to] of Object.entries(ANCHOR_TO_PATH)) {
      next = next.split(from).join(to);
    }
    if (next !== raw) {
      page.blocks = JSON.parse(next);
      page.updatedAt = now();
      pagesPatched++;
      console.log('anchors→pages', page.path);
    }
  }
  console.log('pages with anchor fixes:', pagesPatched);

  /* 3) Normalize paddings on relay pages (lg/lg except pageHeader bottom md) */
  for (const path of RELAY_PATHS) {
    const page = s.pages.find((p) => p.path === path);
    if (!page) continue;
    let changed = false;
    for (const bl of page.blocks) {
      const st = (bl.style ||= {}) as { paddingTop?: string; paddingBottom?: string; background?: string };
      if (bl.type === 'pageHeader') {
        if (st.paddingBottom !== 'md') {
          st.paddingBottom = 'md';
          changed = true;
        }
        continue;
      }
      if (bl.type === 'cta' && st.background === 'navy') {
        if (st.paddingTop !== 'lg' || st.paddingBottom !== 'lg') {
          st.paddingTop = 'lg';
          st.paddingBottom = 'lg';
          changed = true;
        }
        continue;
      }
      /* Keep intentional none tops on stacked CTAs after soft sections */
      if (bl.type === 'cta' && st.paddingTop === 'none') continue;
      if (st.paddingTop === 'md' || st.paddingBottom === 'md' || !st.paddingTop || !st.paddingBottom) {
        if (st.paddingTop !== 'lg' || st.paddingBottom !== 'lg') {
          st.paddingTop = 'lg';
          st.paddingBottom = 'lg';
          changed = true;
        }
      }
    }
    if (changed) {
      page.updatedAt = now();
      console.log('padding lg', path);
    }
  }
});

console.log('done · pages', snap.pages.length);
await pool.end();
