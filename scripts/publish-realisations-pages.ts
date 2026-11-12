/**
 * Republie 4 pages réalisation dédiées + retire les redirects vers #ancres.
 * Met à jour le listing /realisations/ pour pointer vers ces URLs.
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock, CmsPage } from '../server/cms/types';
import { pool } from '../server/db/client';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;
const now = () => new Date().toISOString();

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (): ButtonData => button('Parler de votre projet', '/contact/');
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');
const phoneBtn = (): ButtonData => button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone');
const estimBtn = (): ButtonData => button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none');

const CUMAC =
  '* Estimation calculée selon les fiches d’opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
}

type Chantier = {
  path: string;
  anchor: string;
  title: string;
  client: string;
  location: string;
  sector: string;
  meta: string;
  image: string;
  imageAlt: string;
  enjeu: string;
  solutionsTitle: string;
  solutions: string[];
  ceeTitle: string;
  cee: string[];
  result?: string;
  cumac: string;
  seoTitle: string;
  metaDescription: string;
  focus: string;
  sortOrder: number;
};

const CHANTIERS: Chantier[] = [
  {
    path: '/realisations/intermarche-sortie-du-fioul/',
    anchor: 'intermarche',
    title: 'Intermarché : sortir du fioul et optimiser le froid',
    client: 'Intermarché',
    location: 'Bourgogne-Franche-Comté',
    sector: 'Grande distribution',
    meta: 'Bourgogne-Franche-Comté · Grande distribution',
    image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
    imageAlt: 'Pompe à chaleur air/eau installée par PEXEN chez Intermarché',
    enjeu:
      'Un supermarché chauffé par deux chaudières fioul vétustes, une production de froid commercial énergivore et un objectif de décarbonation.',
    solutionsTitle: 'Les solutions',
    solutions: [
      'Pompe à chaleur air/eau en remplacement du fioul',
      'Récupération de chaleur sur le groupe froid',
      'Déstratification d’air de la surface de vente',
      'GTB de classe B',
      'Fermeture des meubles frigorifiques et haute pression flottante',
    ],
    ceeTitle: 'Fiches CEE mobilisées',
    cee: ['BAT-TH-163 (Coup de pouce)', 'BAT-TH-139', 'BAT-TH-134', 'BAT-TH-116', 'BAT-TH-142', 'BAT-EQ-124'],
    result: '14,8 GWh cumac d’économies d’énergie estimées* · sortie complète du fioul',
    cumac: '14,8 GWh cumac',
    seoTitle: 'Intermarché : sortie du fioul et optimisation du froid | PEXEN',
    metaDescription:
      'Projet Intermarché : pompe à chaleur air/eau, récupération de chaleur, déstratification et GTB. 14,8 GWh cumac estimés*',
    focus: 'sortie du fioul Intermarché',
    sortOrder: 1,
  },
  {
    path: '/realisations/carrefour-market-recuperation-de-chaleur/',
    anchor: 'carrefour-market',
    title: 'Carrefour Market : froid, chaleur et toiture sous contrat de performance',
    client: 'Carrefour Market',
    location: 'Île-de-France',
    sector: 'Grande distribution',
    meta: 'Île-de-France · Grande distribution',
    image: IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
    imageAlt: 'Centrale de froid commercial chez Carrefour Market, projet d’efficacité énergétique PEXEN',
    enjeu:
      'Une centrale de froid commercial de sept compresseurs, le premier poste électrique du magasin, et un objectif de réduction garanti par contrat.',
    solutionsTitle: 'Les solutions',
    solutions: [
      'Récupération de chaleur sur la centrale froid',
      'Régulation haute pression flottante',
      'Isolation de la toiture-terrasse',
      'Fermeture des meubles à température positive et négative',
    ],
    ceeTitle: 'Fiches CEE mobilisées',
    cee: ['BAT-TH-139', 'BAT-TH-134', 'BAT-EN-107', 'BAT-EQ-124', 'BAT-EQ-125', 'Bonification CPE'],
    result: '30,6 GWh cumac d’économies d’énergie estimées* · objectif contractuel −40 % sur le périmètre traité',
    cumac: '30,6 GWh cumac',
    seoTitle: 'Carrefour Market : récupération de chaleur et CPE | PEXEN',
    metaDescription:
      'Projet Carrefour Market : récupération de chaleur, régulation, isolation toiture et fermeture des meubles. 30,6 GWh cumac estimés*',
    focus: 'récupération de chaleur Carrefour Market',
    sortOrder: 2,
  },
  {
    path: '/realisations/cedim-destratification/',
    anchor: 'cedim',
    title: 'CEDIM : ramener la chaleur au sol',
    client: 'CEDIM',
    location: 'Centre-Val de Loire',
    sector: 'Négoce et entrepôt',
    meta: 'Centre-Val de Loire · Négoce et entrepôt',
    image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'),
    imageAlt: 'Déstratificateurs d’air installés par PEXEN chez CEDIM',
    enjeu:
      'Un magasin de plus de 5 mètres sous plafond, chauffé par aérothermes gaz : l’air chaud stagne sous la toiture, le sol reste froid.',
    solutionsTitle: 'La solution',
    solutions: ['Trois déstratificateurs d’air qui renvoient la chaleur vers la zone occupée'],
    ceeTitle: 'Fiche CEE mobilisée',
    cee: ['BAT-TH-142'],
    result: '2,1 GWh cumac d’économies d’énergie estimées*',
    cumac: '2,1 GWh cumac',
    seoTitle: 'CEDIM : déstratification d’air en magasin | PEXEN',
    metaDescription: 'Projet CEDIM : déstratificateurs d’air en grande hauteur. 2,1 GWh cumac estimés*',
    focus: 'déstratification CEDIM',
    sortOrder: 3,
  },
  {
    path: '/realisations/colorcon-efficacite-energetique-industrielle/',
    anchor: 'colorcon',
    title: 'Colorcon : chaufferie vapeur et froid process',
    client: 'Colorcon',
    location: 'Île-de-France',
    sector: 'Industrie',
    meta: 'Île-de-France · Industrie pharmaceutique',
    image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp'),
    imageAlt: 'Chaufferie vapeur du site Colorcon, projet d’efficacité énergétique industrielle',
    enjeu:
      'Un site de production pharmaceutique dont les utilités tournent en continu : chaufferie vapeur, production de froid, réseaux de distribution.',
    solutionsTitle: 'Les pistes étudiées',
    solutions: [
      'Récupération de chaleur',
      'Pompe à chaleur en rehausse de chaleur fatale',
      'Régulation du groupe froid',
      'Brûleur micro-modulant',
      'Calorifugeage des réseaux',
    ],
    ceeTitle: 'Fiches CEE étudiées',
    cee: ['IND-UT-137', 'IND-UT-103', 'IND-UT-116', 'IND-UT-105', 'IND-UT-131'],
    cumac: '',
    seoTitle: 'Colorcon : efficacité énergétique industrielle | PEXEN',
    metaDescription:
      'Projet Colorcon : chaufferie vapeur, froid process et utilités industrielles. Fiches CEE IND-UT étudiées.',
    focus: 'efficacité énergétique industrielle Colorcon',
    sortOrder: 4,
  },
];

const ALIAS_REDIRECTS: [string, string][] = [
  ['/realisations/intermarche-trevenans/', '/realisations/intermarche-sortie-du-fioul/'],
  ['/realisations/carrefour-market/', '/realisations/carrefour-market-recuperation-de-chaleur/'],
  ['/realisations/cedim/', '/realisations/cedim-destratification/'],
  ['/realisations/colorcon-bazainville/', '/realisations/colorcon-efficacite-energetique-industrielle/'],
];

function caseStoryHtml(c: Chantier): string {
  const ops = c.solutions
    .map(
      (s, i) => `<article class="px-ultra-op">
      <span class="px-ultra-op__num">${String(i + 1).padStart(2, '0')}</span>
      <h3 class="px-ultra-op__title">${s}</h3>
    </article>`
    )
    .join('');
  const tags = c.cee.map((t) => `<span class="px-ultra-case__tag">${t}</span>`).join('');
  const kpi = c.result
    ? `<div class="px-ultra-case__kpi"><span class="px-ultra-case__kpi-label">Résultat</span><p class="px-ultra-case__kpi-value">${c.result}</p></div>`
    : '';
  return `<article class="px-ultra-case">
  ${kpi}
  <div class="px-ultra-case__grid">
    <section class="px-ultra-case__panel">
      <span class="px-ultra-case__num" aria-hidden="true">01</span>
      <h3 class="px-ultra-case__h">L’enjeu</h3>
      <p class="px-ultra-case__p">${c.enjeu}</p>
    </section>
    <section class="px-ultra-case__panel">
      <span class="px-ultra-case__num" aria-hidden="true">02</span>
      <h3 class="px-ultra-case__h">Client &amp; site</h3>
      <p class="px-ultra-case__p"><strong>${c.client}</strong><br/>${c.location}<br/>${c.meta}</p>
    </section>
    <section class="px-ultra-case__panel">
      <span class="px-ultra-case__num" aria-hidden="true">03</span>
      <h3 class="px-ultra-case__h">${c.ceeTitle}</h3>
      <div class="px-ultra-case__tags">${tags}</div>
    </section>
  </div>
  <section class="px-ultra-ops">
    <header class="px-ultra-ops__head">
      <span class="px-ultra-ops__eyebrow">Travaux</span>
      <h2 class="px-ultra-ops__title">${c.solutionsTitle}</h2>
      <p class="px-ultra-ops__lead">Plusieurs opérations combinées sur un même site, dimensionnées pour rester éligibles CEE.</p>
    </header>
    <div class="px-ultra-ops__grid">${ops}</div>
  </section>
</article>`;
}

function chantierBlocks(c: Chantier): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Réalisations',
        title: c.title,
        highlight: '',
        intro: c.meta,
        image: c.image,
        imageAlt: c.imageAlt,
        buttons: [etudeBtn(), contactBtn()],
        parentLink: '/realisations/',
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Mission PEXEN',
        title: 'De l’étude au dossier CEE',
        intro: '',
        items: [
          { id: uid('s'), num: '01', title: 'Relevé sur site', text: 'Inventaire des équipements, consommations et contraintes d’exploitation.' },
          { id: uid('s'), num: '02', title: 'Dimensionnement', text: 'Bouquet d’actions et fiches CEE mobilisables, avant devis.' },
          { id: uid('s'), num: '03', title: 'Travaux', text: 'Installation sans fermer le magasin ni arrêter la production.' },
          { id: uid('s'), num: '04', title: 'Dossier CEE', text: 'Pièces constituées pour le contrôle et le versement de la prime.' },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    rich(caseStoryHtml(c)),
    rich(`<p class="text-xs text-slate-500 px-ultra-legal-note">${CUMAC}</p>`),
    b(
      'cta',
      {
        variant: 'dark',
        layout: 'centered',
        title: 'Un projet similaire ?',
        text: 'Un ingénieur PEXEN étudie votre site et vous répond sous 48 h ouvrées.',
        buttons: [etudeBtn(), phoneBtn()],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
  ];
}

function caseCard(c: Chantier): string {
  return `<a id="${c.anchor}" class="px-ultra-case-card" href="${c.path}">
    <div class="px-ultra-case-card__media"><img src="${c.image}" alt="${c.imageAlt}" loading="lazy" width="640" height="400" /></div>
    <div class="px-ultra-case-card__body">
      <p class="px-ultra-case-card__meta">${c.meta}</p>
      <h3 class="px-ultra-case-card__title">${c.title}</h3>
      <p class="px-ultra-case-card__enjeu">${c.enjeu}</p>
      <p class="px-ultra-case-card__result">${c.result || 'Étude d’efficacité énergétique industrielle · fiches IND-UT'}</p>
      <span class="px-ultra-case-card__cta">Ouvrir la fiche projet <span aria-hidden="true">→</span></span>
    </div>
  </a>`;
}

function listingBlocks(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Réalisations',
        title: 'Nos réalisations',
        highlight: '',
        intro:
          "Quatre projets d'efficacité énergétique, quatre configurations. Cliquez une fiche pour ouvrir le détail complet.",
        image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
        imageAlt: "Projets d'efficacité énergétique réalisés par PEXEN",
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: '4 projets', label: '4 configurations' },
          { id: uid('m'), value: '47,5 GWh cumac*', label: "estimés sur l'ensemble" },
          { id: uid('m'), value: '3 régions', label: '2 secteurs' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'projects',
      {
        eyebrow: 'Références',
        title: 'Quatre configurations, un même niveau d’exigence',
        intro: 'Filtrez par secteur, puis ouvrez la fiche projet.',
        layout: 'grid',
        filter: 'all',
        showFilters: true,
        limit: 0,
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    rich(
      `<div class="px-ultra-center-intro"><h2>Fiches projets</h2><p>Chaque carte ouvre la page dédiée : enjeu, solutions, fiches CEE et résultat.</p></div><div class="px-ultra-case-list">${CHANTIERS.map(caseCard).join('')}</div>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Comment lire nos chiffres</h2><p>Les volumes affichés sont exprimés en kWh cumac, l'unité officielle des certificats d'économies d'énergie. Ils sont calculés hors bonifications, à partir des fiches standardisées mobilisées sur chaque projet.</p>`,
      'soft'
    ),
    b(
      'checklist',
      {
        title: 'Ce que ces projets ont en commun',
        intro: '',
        cards: [
          {
            id: uid('ck'),
            title: '',
            icon: 'fa-check',
            entries: [
              { id: uid('e'), title: 'Un relevé sur site avant toute préconisation.' },
              { id: uid('e'), title: 'Plusieurs actions combinées sur un même site, rarement une seule.' },
              { id: uid('e'), title: 'Des travaux menés sans fermer le magasin ni arrêter la production.' },
              { id: uid('e'), title: 'Un dossier CEE engagé avant la signature des devis.' },
            ],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    rich(`<p class="text-xs text-slate-500 px-ultra-legal-note">${CUMAC}</p>`),
    b(
      'cta',
      {
        variant: 'dark',
        layout: 'centered',
        title: 'Un projet ? Parlons-en.',
        text: 'Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.',
        buttons: [contactBtn(), phoneBtn()],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
  ];
}

function ensureRedirect(
  list: { from: string; to: string; permanent: boolean }[],
  from: string,
  to: string
) {
  const i = list.findIndex((r) => r.from === from);
  if (i >= 0) list[i] = { from, to, permanent: true };
  else list.push({ from, to, permanent: true });
}

const snap = await updateSnapshot((s) => {
  /* 1) Publish 4 dedicated project pages */
  for (const c of CHANTIERS) {
    let page = s.pages.find((p) => p.path === c.path);
    if (!page) {
      page = {
        id: uid('p'),
        path: c.path,
        title: c.title,
        status: 'published',
        publishedAt: now(),
        createdAt: now(),
        updatedAt: now(),
        template: 'project',
        contentSource: 'cms',
        blocks: [],
        project: undefined,
        seo: {
          focusKeyphrase: c.focus,
          seoTitle: c.seoTitle,
          metaDescription: c.metaDescription,
          slug: c.path.replace(/\//g, ''),
          noindex: false,
          nofollow: false,
          twitterCard: 'summary_large_image',
          schemaType: 'WebPage',
        },
      } as CmsPage;
      s.pages.push(page);
    }
    page.title = c.title;
    page.status = 'published';
    page.publishedAt = page.publishedAt || now();
    page.template = 'project';
    page.blocks = chantierBlocks(c);
    page.project = {
      client: c.client,
      location: c.location,
      sector: c.sector,
      cumac: c.cumac,
      solution: c.title.includes(':') ? c.title.split(':').slice(1).join(':').trim() : c.title,
      summary: c.meta,
      image: c.image,
      results: c.result ? [c.result] : ['Étude d’efficacité énergétique industrielle · fiches IND-UT'],
      featured: true,
      sortOrder: c.sortOrder,
    };
    page.seo = {
      ...page.seo,
      focusKeyphrase: c.focus,
      seoTitle: c.seoTitle,
      metaDescription: c.metaDescription,
      noindex: false,
    };
    page.updatedAt = now();
    console.log('published', c.path);
  }

  /* 2) Listing */
  const listing = s.pages.find((p) => p.path === '/realisations/');
  if (listing) {
    listing.blocks = listingBlocks();
    listing.status = 'published';
    listing.updatedAt = now();
    console.log('updated listing /realisations/');
  }

  /* 3) Redirects: remove self-redirects on canonicals; alias → full page */
  const canonical = new Set(CHANTIERS.map((c) => c.path));
  s.redirects = s.redirects.filter((r) => !canonical.has(r.from));
  for (const [from, to] of ALIAS_REDIRECTS) {
    ensureRedirect(s.redirects, from, to);
  }
  /* Keep other old demo projects redirected to listing */
  for (const from of ['/realisations/agro-froid-bretagne/', '/realisations/campus-tertiaire-lyon/']) {
    ensureRedirect(s.redirects, from, '/realisations/');
  }

  console.log(
    'redirects réalisations',
    s.redirects.filter((r) => r.from.includes('/realisations/')).map((r) => `${r.from} → ${r.to}`)
  );
});

for (const c of CHANTIERS) {
  const p = snap.pages.find((x) => x.path === c.path);
  console.log(c.path, p?.status, p?.blocks.length, 'blocs');
}
await pool.end();
