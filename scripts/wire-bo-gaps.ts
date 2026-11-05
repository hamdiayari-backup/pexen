import 'dotenv/config';
import { readFileSync } from 'fs';
import { uid, type ProjectMeta } from '../server/cms/blocks';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';
import { ULTRA_CASE_STUDIES } from '../server/themes/ultraContent';

const brief = JSON.parse(readFileSync('/home/pexen/tmp/brief-amina/export/pages.json', 'utf-8')) as Record<string, (string | null)[][]>;
const seed = JSON.parse(readFileSync('/home/pexen/server/themes/briefV5Seed.json', 'utf-8')) as {
  pages: { path: string; seoTitle: string; metaDescription: string; h1: string; noindex?: boolean }[];
};

function tabKv(tab: string) {
  const out: Record<string, string> = {};
  for (const row of brief[tab] || []) {
    const k = row[0];
    const v = row[1];
    if (typeof k === 'string' && typeof v === 'string') out[k] = v;
  }
  return out;
}

const SEO_BY_PATH: Record<string, { title: string; meta: string; kw: string }> = {};
for (const tab of Object.keys(brief)) {
  const kv = tabKv(tab);
  if (kv.URL && kv['Titre SEO']) {
    SEO_BY_PATH[kv.URL] = { title: kv['Titre SEO'], meta: kv['Méta-description'] || '', kw: kv['Mot-clé principal'] || '' };
  }
}

const OLD_PAGES: [string, string][] = [
  ['/realisations/agro-froid-bretagne/', '/realisations/'],
  ['/realisations/campus-tertiaire-lyon/', '/realisations/'],
  ['/realisations/carrefour-market/', '/realisations/carrefour-market-recuperation-de-chaleur/'],
  ['/realisations/cedim/', '/realisations/cedim-destratification/'],
  ['/realisations/colorcon-bazainville/', '/realisations/colorcon-efficacite-energetique-industrielle/'],
  ['/realisations/intermarche-trevenans/', '/realisations/intermarche-sortie-du-fioul/'],
  ['/secteurs/renovation-energetique-copropriete/', '/secteurs/batiments-collectifs/'],
];

const PROJECT_PATH_ALIAS: Record<string, string> = {
  '/realisations/carrefour-market/': '/realisations/carrefour-market-recuperation-de-chaleur/',
  '/realisations/intermarche-trevenans/': '/realisations/intermarche-sortie-du-fioul/',
  '/realisations/cedim/': '/realisations/cedim-destratification/',
  '/realisations/colorcon-bazainville/': '/realisations/colorcon-efficacite-energetique-industrielle/',
};

function parentCrumb(path: string): { label: string; link: string } | null {
  if (path.startsWith('/solutions/') && path !== '/solutions/') return { label: 'Solutions', link: '/solutions/' };
  if (path.startsWith('/secteurs/') && path !== '/secteurs/') return { label: 'Secteurs', link: '/secteurs/' };
  if (path.startsWith('/realisations/') && path !== '/realisations/') return { label: 'Réalisations', link: '/realisations/' };
  if (['/accompagnement-travaux/', '/contrat-de-performance-energetique/', '/decret-tertiaire-decret-bacs/'].includes(path)) {
    return { label: 'Expertises', link: '/etudes-ingenierie-energetique/' };
  }
  return null;
}

const FOOTER_LINKS: { label: string; path: string }[] = [
  { label: 'Réalisations', path: '/realisations/' },
  { label: 'Notre approche', path: '/notre-approche/' },
  { label: 'Estimer le financement', path: '/estimation-financement/' },
  { label: 'Contact', path: '/contact/' },
  { label: 'Mentions légales', path: '/mentions-legales/' },
  { label: 'Confidentialité', path: '/politique-de-confidentialite/' },
  { label: 'Cookies', path: '/cookies/' },
];

const snap = await updateSnapshot((s) => {
  s.settings.seo.gaMeasurementId = s.settings.seo.gaMeasurementId || 'G-GRR10GDECY';

  const projectByPath = new Map<string, ProjectMeta>();
  for (const cs of ULTRA_CASE_STUDIES) {
    projectByPath.set(PROJECT_PATH_ALIAS[cs.path] || cs.path, cs.project);
  }

  for (const page of s.pages) {
    const fromBrief = SEO_BY_PATH[page.path];
    const fromSeed = seed.pages.find((p) => p.path === page.path);
    if (fromBrief?.title) page.seo.seoTitle = fromBrief.title;
    else if (fromSeed?.seoTitle) page.seo.seoTitle = fromSeed.seoTitle;
    if (fromBrief?.meta) page.seo.metaDescription = fromBrief.meta;
    else if (fromSeed?.metaDescription) page.seo.metaDescription = fromSeed.metaDescription;
    if (fromBrief?.kw && fromBrief.kw !== '—') page.seo.focusKeyphrase = fromBrief.kw;
    if (fromSeed?.noindex) page.seo.noindex = true;

    const header = page.blocks.find((b) => b.type === 'pageHeader');
    if (header) {
      header.data.breadcrumb = true;
      const parent = parentCrumb(page.path);
      header.data.parentLabel = parent?.label || '';
      header.data.parentLink = parent?.link || '';
      if (!header.data.image && header.data.backgroundImage) header.data.image = header.data.backgroundImage;
    }

    for (const block of page.blocks) {
      if ((block.type === 'contactForm' || block.type === 'simulator') && !block.data.formId) {
        block.data.formId = 'contact-main';
      }
    }

    const seededProject = projectByPath.get(page.path);
    if (seededProject && (page.template === 'project' || page.path.startsWith('/realisations/'))) {
      page.template = 'project';
      const image = (typeof header?.data.image === 'string' && header.data.image) || seededProject.image;
      page.project = { ...seededProject, image };
    }
  }

  const footer = s.menus.find((m) => m.id === 'footer');
  if (footer) {
    footer.items = FOOTER_LINKS.map((link) => {
      const existing = footer.items.find((i) => i.path === link.path || i.label === link.label);
      return existing ? { ...existing, label: link.label, path: link.path, children: undefined } : { id: uid('m'), label: link.label, path: link.path };
    });
  }

  for (const rule of s.redirects) {
    if (rule.to === '/expertises/' || rule.to === '/expertises') rule.to = '/solutions/';
  }

  const redir = new Map((s.redirects || []).map((r) => [r.from, r]));
  for (const [from, to] of OLD_PAGES) {
    redir.set(from, { from, to, permanent: true });
    const old = s.pages.find((p) => p.path === from);
    if (old) old.status = 'draft';
  }
  s.redirects = [...redir.values()];
});

const check = ['/', '/contact/', '/realisations/', '/notre-approche/', '/etudes-ingenierie-energetique/'];
for (const p of check) {
  const page = snap.pages.find((x) => x.path === p);
  console.log(p, page?.seo.seoTitle, '|', page?.seo.focusKeyphrase);
}
console.log('ga', snap.settings.seo.gaMeasurementId);
console.log(
  'projects',
  snap.pages.filter((p) => p.template === 'project' && p.project).map((p) => [p.path, p.status, p.seo.noindex, p.project?.client])
);
console.log('footer', snap.menus.find((m) => m.id === 'footer')?.items.map((i) => [i.label, i.path]));
console.log(
  'drafts',
  snap.pages.filter((p) => p.status !== 'published').map((p) => p.path)
);
await pool.end();
