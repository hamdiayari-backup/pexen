/**
 * Recette Phase 2 — Priorité 2 : atterrissage /solutions/ + SEO fiches solutions.
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

const contactBtn = (label = 'Parler de votre projet'): ButtonData => button(label, '/contact/');
const estimBtn = (): ButtonData => button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none');
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');
const phoneBtn = (): ButtonData => button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone');

const finalCta = () =>
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
  );

function upsertPage(pages: CmsPage[], path: string, title: string, blocks: CmsBlock[], seo: Partial<CmsPage['seo']>) {
  let page = pages.find((p) => p.path === path);
  if (!page) {
    page = {
      id: uid('p'),
      path,
      title,
      status: 'published',
      publishedAt: now(),
      createdAt: now(),
      updatedAt: now(),
      template: 'default',
      contentSource: 'cms',
      blocks: [],
      seo: {
        focusKeyphrase: '',
        seoTitle: title,
        metaDescription: '',
        slug: path.replace(/\//g, ''),
        noindex: false,
        nofollow: false,
        twitterCard: 'summary_large_image',
        schemaType: 'WebPage',
      },
    };
    pages.push(page);
  }
  page.title = title;
  page.status = 'published';
  page.publishedAt = page.publishedAt || now();
  page.blocks = blocks;
  page.seo = { ...page.seo, ...seo, seoTitle: seo.seoTitle || page.seo.seoTitle };
  page.updatedAt = now();
  return page;
}

function zigRow(opts: {
  id: string;
  num: string;
  title: string;
  lead: string;
  bullets: string[];
  moreHref: string;
  flip?: boolean;
  card: { href: string; image: string; imageAlt: string; tag: string; title: string; metrics: string[] };
}) {
  const bullets = opts.bullets.map((x) => `<li>${x}</li>`).join('');
  const metrics = opts.card.metrics.map((m) => `<span>${m}</span>`).join('');
  return `<article id="${opts.id}" class="px-ultra-zig${opts.flip ? ' px-ultra-zig--flip' : ''}">
  <div class="px-ultra-zig__copy">
    <span class="px-ultra-zig__num">${opts.num}</span>
    <h2 class="px-ultra-zig__title">${opts.title}</h2>
    <p class="px-ultra-zig__lead">${opts.lead}</p>
    <ul class="px-ultra-zig__list">${bullets}</ul>
    <a class="px-ultra-zig__more" href="${opts.moreHref}">En savoir plus <span aria-hidden="true">→</span></a>
  </div>
  <a class="px-ultra-zig__card" href="${opts.card.href}">
    <div class="px-ultra-zig__card-media"><img src="${opts.card.image}" alt="${opts.card.imageAlt}" loading="lazy" width="640" height="400" /></div>
    <div class="px-ultra-zig__card-body">
      <p class="px-ultra-zig__card-tag">${opts.card.tag}</p>
      <h3 class="px-ultra-zig__card-title">${opts.card.title}</h3>
      <div class="px-ultra-zig__card-metrics">${metrics}</div>
    </div>
  </a>
</article>`;
}

function solutionsLanding(): CmsBlock[] {
  const zigHtml = `<nav class="px-ultra-zig-nav" aria-label="Solutions">
  <a href="#froid"><span class="px-ultra-zig-nav__n">01</span> Froid commercial</a>
  <a href="#chaleur"><span class="px-ultra-zig-nav__n">02</span> Récupération de chaleur</a>
  <a href="#pac"><span class="px-ultra-zig-nav__n">03</span> Chauffage &amp; air</a>
  <a href="#gtb"><span class="px-ultra-zig-nav__n">04</span> Pilotage GTB</a>
  <a href="#isolation"><span class="px-ultra-zig-nav__n">05</span> Isolation technique</a>
</nav>
<div class="px-ultra-zig-list">
${zigRow({
  id: 'froid',
  num: '01',
  title: 'Optimiser les installations frigorifiques',
  lead: 'Dans un supermarché, le froid représente 45 à 75 % des dépenses d’énergie. Régulation, condensation et variation de vitesse réduisent la facture sans arrêter l’exploitation.',
  bullets: [
    'Haute et basse pression flottante',
    'Condensation haute efficacité',
    'Variation électronique de vitesse',
    'Fermeture des meubles frigorifiques',
  ],
  moreHref: '/solutions/froid-commercial-industriel/',
  card: {
    href: '/realisations/carrefour-market-recuperation-de-chaleur/',
    image: IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
    imageAlt: 'Centrale froid Carrefour Market',
    tag: 'Grande distribution',
    title: 'Carrefour Market : froid, chaleur et toiture sous CPE',
    metrics: ['30,6 GWh cumac*', 'Objectif −40 %'],
  },
})}
${zigRow({
  id: 'chaleur',
  num: '02',
  title: 'Récupérer la chaleur disponible',
  lead: 'Un groupe froid rejette en continu la chaleur extraite des meubles et des chambres. Récupérée, elle chauffe la surface de vente ou l’eau chaude sanitaire.',
  bullets: [
    'Évaluation de la chaleur récupérable',
    'Couverture chauffage et ECS',
    'Intégration des CEE dès la conception',
  ],
  moreHref: '/solutions/recuperation-de-chaleur/',
  flip: true,
  card: {
    href: '/realisations/carrefour-market-recuperation-de-chaleur/',
    image: IMG('drive-recuperateur-de-chaleur.webp'),
    imageAlt: 'Récupérateur de chaleur',
    tag: 'Réalisation',
    title: 'Récupération de chaleur sur centrale froid',
    metrics: ['535 kW', '30,6 GWh cumac*'],
  },
})}
${zigRow({
  id: 'pac',
  num: '03',
  title: 'Décarboner la production de chaleur',
  lead: 'Remplacement des chaudières fioul ou gaz par des pompes à chaleur performantes, et déstratification des grands volumes.',
  bullets: [
    'PAC air/eau, eau/eau, géothermie',
    'Bonifications Coup de pouce selon le cas',
    'Déstratification des volumes > 4 m',
  ],
  moreHref: '/solutions/pompe-a-chaleur-tertiaire/',
  card: {
    href: '/realisations/intermarche-sortie-du-fioul/',
    image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
    imageAlt: 'PAC Intermarché',
    tag: 'Grande distribution',
    title: 'Intermarché : sortie du fioul et optimisation du froid',
    metrics: ['1 650 m²', '14,8 GWh cumac*'],
  },
})}
${zigRow({
  id: 'gtb',
  num: '04',
  title: 'Piloter les consommations',
  lead: 'GTB de classe A ou B, conformité au décret BACS, suivi des indicateurs pour les équipes techniques.',
  bullets: [
    'Classes A et B (NF EN ISO 52120-1)',
    'Mise en conformité décret BACS',
    'Tableaux de bord et alertes de dérive',
  ],
  moreHref: '/solutions/gtb-tertiaire-gtc/',
  flip: true,
  card: {
    href: '/realisations/intermarche-sortie-du-fioul/',
    image: IMG('pilotage-gtb-decret-bacs-pexen.webp'),
    imageAlt: 'Supervision GTB',
    tag: 'Pilotage',
    title: 'GTB de classe B associée à la PAC et au froid',
    metrics: ['Classe B', 'BAT-TH-116'],
  },
})}
${zigRow({
  id: 'isolation',
  num: '05',
  title: 'Limiter les pertes thermiques',
  lead: 'Calorifugeage des réseaux, matelas isolants sur points singuliers, isolation des toitures-terrasses.',
  bullets: [
    'Réseaux et équipements (IND-UT-131)',
    'Matelas démontables (IND-UT-121)',
    'Toitures-terrasses (BAT-EN-107)',
  ],
  moreHref: '/solutions/isolation-technique/',
  card: {
    href: '/realisations/cedim-destratification/',
    image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'),
    imageAlt: 'Déstratification CEDIM',
    tag: 'Négoce',
    title: 'CEDIM : ramener la chaleur au sol',
    metrics: ['2,1 GWh cumac*', 'BAT-TH-142'],
  },
})}
</div>`;

  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Solutions',
        title: 'Des solutions de décarbonation adaptées aux enjeux de votre bâtiment',
        intro:
          'Production de froid, chaleur récupérée, chauffage, pilotage et isolation : nous identifions les solutions pertinentes pour votre site et intégrons dès l’amont les aides mobilisables, dont les CEE.',
        image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
        imageAlt: 'Ingénierie énergétique PEXEN',
        buttons: [etudeBtn(), estimBtn()],
        metrics: [
          { value: '5 leviers', label: 'froid · chaleur · PAC · GTB · isolation' },
          { value: 'CEE intégrés', label: 'dès l’étude, avant devis' },
          { value: 'Sans arrêt', label: 'exploitation maintenue' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b('richText', { html: zigHtml, size: 'normal' }, { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }),
    b(
      'textMedia',
      {
        eyebrow: 'Financement',
        title: 'Une ingénierie énergétique financée par les CEE',
        html: `<p>Chaque solution correspond à une ou plusieurs fiches d'opérations standardisées. Nous calculons le volume de kWh cumac dès l'étude, engageons le dossier avant signature et préparons les pièces du contrôle.</p>`,
        bullets: ['Note de calcul avant devis', 'Dossier engagé avant signature', 'Pièces prêtes pour le contrôle COFRAC'],
        buttons: [button('Réglementation et financement CEE', '/expertises/financement-cee-reglementation/', 'primary', 'arrow')],
        mediaType: 'image',
        image: IMG('cee-tertiaire.webp'),
        imageAlt: 'Financement CEE des travaux énergétiques',
        mediaPosition: 'right',
        mediaStyle: 'framed',
        ratio: 'landscape',
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'richText',
      {
        html: `<h2>De l'audit à la mesure des économies</h2><p>Prévisite et audit, dimensionnement et ingénierie technico-financière, installation et mise en service, puis contrôle COFRAC et suivi des performances : quatre étapes, un livrable à chacune. Les travaux se déroulent en site ouvert, en coordination avec votre exploitation.</p><p><a href="/notre-approche/">Notre approche</a></p>`,
        size: 'normal',
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        eyebrow: '',
        title: 'Par où commencer selon votre site',
        intro: '',
        cards: [
          {
            id: uid('ck'),
            title: '',
            icon: 'fa-map-marker',
            entries: [
              { id: uid('e'), title: 'Supermarché : régulation du froid, fermeture des meubles, récupération de chaleur sur la centrale froid.' },
              { id: uid('e'), title: 'Bureaux : GTB de classe A ou B, pompe à chaleur, équilibrage des réseaux.' },
              { id: uid('e'), title: 'Entrepôt ou magasin de grande hauteur : déstratification d’air, isolation de la toiture-terrasse.' },
              { id: uid('e'), title: 'Site industriel : froid process, air comprimé, chaufferie vapeur, calorifugeage des réseaux.' },
              { id: uid('e'), title: 'Résidence collective : chaufferie, sortie du fioul, équilibrage, rénovation globale.' },
            ],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'centered',
        title: 'Parlons de votre site',
        text: '',
        buttons: [contactBtn()],
      },
      { background: 'white', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        eyebrow: '',
        title: 'Ce que contient chaque étude PEXEN',
        intro: '',
        cards: [
          {
            id: uid('ck'),
            title: '',
            icon: 'fa-file-text',
            entries: [
              { id: uid('e'), title: 'L’état initial : équipements, consommations, temps de fonctionnement.' },
              { id: uid('e'), title: 'Le gisement par action, en kWh et en euros par an.' },
              { id: uid('e'), title: 'Le coût des travaux et le montant estimé des CEE.' },
              { id: uid('e'), title: 'Le temps de retour, CEE déduits.' },
              { id: uid('e'), title: 'Le planning d’intervention et les contraintes d’exploitation.' },
            ],
          },
        ],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        eyebrow: '',
        title: 'Les repères qui guident nos priorités',
        intro: '',
        cards: [
          {
            id: uid('ck'),
            title: '',
            icon: 'fa-bar-chart',
            entries: [
              { id: uid('e'), title: '45 à 75 % : part du froid alimentaire dans les dépenses d’énergie d’un supermarché (Perifem).' },
              { id: uid('e'), title: 'Jusqu’à 30 % : économie sur la consommation d’un groupe froid ancien avec une haute pression flottante.' },
              { id: uid('e'), title: '15 à 30 % : économie sur les consommations pilotées par une GTB (ADEME).' },
              { id: uid('e'), title: 'Jusqu’à 30 % : économie sur le coût du chauffage d’un local de grande hauteur déstratifié (EDF).' },
              { id: uid('e'), title: '3 à 4 kWh de chaleur produits par une pompe à chaleur pour 1 kWh d’électricité consommé.' },
            ],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'centered',
        title: 'Demander une étude',
        text: '',
        buttons: [etudeBtn()],
      },
      { background: 'white', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    finalCta(),
  ];
}

const SOLUTION_SEO: Record<string, { title: string; focus: string; seoTitle: string; meta: string }> = {
  '/solutions/froid-commercial-industriel/': {
    title: 'Froid commercial et industriel',
    focus: 'froid commercial',
    seoTitle: 'Froid commercial et industriel : régulation et modernisation | PEXEN',
    meta: 'Optimisation des centrales froid : haute et basse pression flottante, condenseurs, VEV, fermeture des meubles. Étude, travaux et suivi PEXEN.',
  },
  '/solutions/recuperation-de-chaleur/': {
    title: 'Récupération de chaleur',
    focus: 'récupération de chaleur',
    seoTitle: 'Récupération de chaleur sur groupe froid et process | PEXEN',
    meta: 'Récupérer la chaleur des groupes froids, compresseurs d’air et process pour chauffer locaux et ECS. Dimensionnement et installation PEXEN.',
  },
  '/solutions/pompe-a-chaleur-tertiaire/': {
    title: 'Chauffage et traitement d’air',
    focus: 'pompe à chaleur tertiaire',
    seoTitle: 'Pompe à chaleur tertiaire et déstratification | PEXEN',
    meta: 'Pompes à chaleur air/eau, déstratification des grands volumes, sortie du fioul. Étude RGE QualiPAC et travaux PEXEN.',
  },
  '/solutions/gtb-tertiaire-gtc/': {
    title: 'Pilotage GTB / GTC',
    focus: 'GTB tertiaire',
    seoTitle: 'GTB tertiaire, GTC et conformité décret BACS | PEXEN',
    meta: 'Gestion technique du bâtiment classe A ou B, décret BACS, supervision et indicateurs. Audit, installation et suivi PEXEN.',
  },
  '/solutions/isolation-technique/': {
    title: 'Isolation technique',
    focus: 'isolation technique',
    seoTitle: 'Isolation technique : toitures-terrasses et calorifugeage | PEXEN',
    meta: 'Isolation des toitures-terrasses, calorifugeage des réseaux, matelas isolants. Étude et pose PEXEN.',
  },
};

const snap = await updateSnapshot((s) => {
  upsertPage(s.pages, '/solutions/', 'Solutions', solutionsLanding(), {
    focusKeyphrase: 'ingénierie énergétique',
    seoTitle: 'Ingénierie énergétique : nos 5 solutions | PEXEN',
    metaDescription:
      'Ingénierie énergétique PEXEN : froid commercial et industriel, récupération de chaleur, pompes à chaleur, GTB/GTC, isolation technique. Étude, travaux, suivi.',
  });

  for (const [path, seo] of Object.entries(SOLUTION_SEO)) {
    const page = s.pages.find((p) => p.path === path);
    if (!page) continue;
    page.title = seo.title;
    page.status = 'published';
    page.seo.focusKeyphrase = seo.focus;
    page.seo.seoTitle = seo.seoTitle;
    page.seo.metaDescription = seo.meta;
    const h = page.blocks.find((x) => x.type === 'pageHeader');
    if (h) {
      const d = h.data as { parentLabel?: string; parentLink?: string; breadcrumb?: boolean };
      d.breadcrumb = true;
      d.parentLabel = 'Solutions';
      d.parentLink = '/solutions/';
    }
    /* rewrite old GTB links inside blocks */
    const raw = JSON.stringify(page.blocks);
    page.blocks = JSON.parse(raw.split('/solutions/pilotage-gtb-decret-bacs/').join('/solutions/gtb-tertiaire-gtc/')) as CmsBlock[];
    page.updatedAt = now();
  }

  /* Publish collectifs renamed page */
  const col = s.pages.find((p) => p.path === '/secteurs/renovation-energetique-copropriete/');
  if (col) {
    col.status = 'published';
    col.title = 'Bâtiments collectifs';
    const h = col.blocks.find((x) => x.type === 'pageHeader');
    if (h) {
      const d = h.data as { parentLabel?: string; parentLink?: string; title?: string };
      d.parentLabel = 'Secteurs';
      d.parentLink = '/secteurs/';
      if (d.title) d.title = d.title.replace(/Bâtiments collectifs.*/i, 'Bâtiments collectifs') || 'Bâtiments collectifs';
    }
    col.updatedAt = now();
  }

  /* Draft obsolete LED / rénovation globale if still present as solutions */
  for (const dead of ['/solutions/renovation-globale-tertiaire/', '/solutions/eclairage-led/']) {
    const p = s.pages.find((x) => x.path === dead);
    if (p) {
      p.status = 'draft';
      p.updatedAt = now();
    }
  }
});

for (const path of ['/solutions/', ...Object.keys(SOLUTION_SEO), '/secteurs/renovation-energetique-copropriete/']) {
  const p = snap.pages.find((x) => x.path === path);
  console.log(path, p ? `${p.status} · ${p.blocks.length} blocs · ${p.seo.seoTitle}` : 'MISSING');
}
await pool.end();
