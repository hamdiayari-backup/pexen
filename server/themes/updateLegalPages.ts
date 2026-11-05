import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateSnapshot } from '../cms/store';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEGAL = JSON.parse(fs.readFileSync(path.join(__dirname, 'legalHtml.json'), 'utf-8')) as {
  mentionsHtml: string;
  confHtml: string;
  cookiesHtml: string;
};

const PAGES: { path: string; title: string; seoTitle: string; meta: string; html: string }[] = [
  {
    path: '/mentions-legales/',
    title: 'Mentions légales',
    seoTitle: 'Mentions légales | PEXEN',
    meta: 'Mentions légales du site pexen.fr : éditeur, directeur de la publication, hébergeur.',
    html: LEGAL.mentionsHtml,
  },
  {
    path: '/politique-de-confidentialite/',
    title: 'Politique de confidentialité',
    seoTitle: 'Politique de confidentialité | PEXEN',
    meta: 'Comment PEXEN collecte, utilise et protège vos données personnelles.',
    html: LEGAL.confHtml,
  },
  {
    path: '/cookies/',
    title: 'Cookies',
    seoTitle: 'Cookies | PEXEN',
    meta: 'Les cookies utilisés sur pexen.fr et comment gérer vos choix.',
    html: LEGAL.cookiesHtml,
  },
];

async function run() {
  await updateSnapshot((snap) => {
    const now = new Date().toISOString();
    for (const spec of PAGES) {
      const page = snap.pages.find((p) => p.path === spec.path);
      if (!page) {
        console.warn('missing page', spec.path);
        continue;
      }
      page.title = spec.title;
      page.template = 'legal';
      page.status = 'published';
      page.publishedAt = page.publishedAt || now;
      page.updatedAt = now;
      page.seo = {
        ...page.seo,
        seoTitle: spec.seoTitle,
        metaDescription: spec.meta,
        noindex: true,
        nofollow: false,
        schemaType: 'WebPage',
      };
      const rich = page.blocks.find((b) => b.type === 'richText');
      if (rich) {
        rich.data = { ...rich.data, html: spec.html, size: 'normal' };
        rich.style = { ...(rich.style || {}), width: 'narrow', background: 'white' };
      } else {
        console.warn('no richText on', spec.path);
      }
      const header = page.blocks.find((b) => b.type === 'pageHeader');
      if (header) {
        header.data = {
          ...header.data,
          title: spec.title,
          intro: '',
          breadcrumb: true,
          parentLabel: 'Accueil',
          parentLink: '/',
          buttons: [],
        };
      }
    }

    const footer = snap.menus.find((m) => m.id === 'footer');
    if (footer) {
      const labels = new Set(footer.items.map((i) => i.path));
      const extra = [
        { id: 'f-ml', label: 'Mentions légales', path: '/mentions-legales/' },
        { id: 'f-pc', label: 'Politique de confidentialité', path: '/politique-de-confidentialite/' },
        { id: 'f-ck', label: 'Cookies', path: '/cookies/' },
      ];
      for (const it of extra) {
        if (!labels.has(it.path)) footer.items.push(it);
      }
    }
  });
  console.log('Legal pages updated from Google Doc / docx');
}

run()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
