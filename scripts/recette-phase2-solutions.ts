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

function solutionsLanding(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Solutions',
        title: "Nos solutions d'ingénierie énergétique",
        intro:
          "L'ingénierie énergétique de PEXEN couvre les cinq postes qui concentrent les consommations d'un site professionnel : la production de froid, la chaleur perdue, le chauffage des grands volumes, le pilotage et les pertes thermiques. Chaque expertise associe une étude chiffrée, des travaux réalisés par nos équipes et un suivi des résultats.",
        image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
        imageAlt: 'Ingénierie énergétique PEXEN',
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { value: 'Jusqu’à 30 %', label: 'par groupe froid (haute pression flottante)' },
          { value: '15 à 30 %', label: 'sur les consommations pilotées par GTB (ADEME)' },
          { value: '3 à 4 kWh', label: 'de chaleur par kWh électrique (PAC)' },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Solutions',
        title: 'Cinq solutions, un seul interlocuteur',
        intro: '',
        columns: 3,
        style: 'hoverDark',
        items: [
          {
            id: uid('c'),
            icon: 'snowflake',
            image: IMG('drive-froid-commercial-industriel.webp'),
            imageAlt: 'Ingénierie énergétique du froid commercial',
            title: 'Froid commercial et industriel',
            text: 'Haute et basse pression flottante, condensation haute efficacité, variation électronique de vitesse, fermeture des meubles frigorifiques. Dans un supermarché, le froid représente 45 à 75 % des dépenses d’énergie : c’est le premier gisement.',
            bullets: [],
            link: '/solutions/froid-commercial-industriel/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            icon: 'flame',
            image: IMG('drive-recuperateur-de-chaleur.webp'),
            imageAlt: 'Récupération de chaleur sur groupe froid',
            title: 'Récupération de chaleur',
            text: 'Un groupe froid rejette en continu la chaleur extraite des meubles et des chambres froides. Récupérée, elle chauffe la surface de vente, l’eau chaude sanitaire ou un process.',
            bullets: [],
            link: '/solutions/recuperation-de-chaleur/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            icon: 'wind',
            image: IMG('drive-chauffage-traitement-dair.webp'),
            imageAlt: 'Pompe à chaleur tertiaire',
            title: 'Chauffage et traitement d’air',
            text: 'Pompes à chaleur air/eau, eau/eau et géothermie en remplacement du fioul ou du gaz, déstratification des volumes de plus de 4 mètres sous plafond.',
            bullets: [],
            link: '/solutions/pompe-a-chaleur-tertiaire/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            icon: 'cpu',
            image: IMG('drive-pilotage-gtb-gtc.webp'),
            imageAlt: 'GTB tertiaire',
            title: 'Pilotage GTB / GTC',
            text: 'Gestion technique du bâtiment de classe A ou B selon la norme NF EN ISO 52120-1, conformité au décret BACS, suivi des indicateurs de performance.',
            bullets: [],
            link: '/solutions/gtb-tertiaire-gtc/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            icon: 'shieldCheck',
            image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp'),
            imageAlt: 'Isolation technique des réseaux',
            title: 'Isolation technique',
            text: 'Isolation des toitures-terrasses, calorifugeage des réseaux, matelas isolants sur vannes et points singuliers.',
            bullets: [],
            link: '/solutions/isolation-technique/',
            linkLabel: 'Découvrir la solution',
          },
        ],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'richText',
      {
        html: `<h2>Une ingénierie énergétique financée par les CEE</h2><p>Chaque solution correspond à une ou plusieurs fiches d'opérations standardisées des certificats d'économies d'énergie (CEE). Nous calculons le volume de kWh cumac dès l'étude, nous engageons le dossier avant la signature du devis et nous préparons les pièces exigées au contrôle. Les fiches mobilisées sont publiées sur le <a href="https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie" target="_blank" rel="noopener noreferrer">site du ministère</a>.</p><p><a href="/expertises/financement-cee-reglementation/">Réglementation et financement CEE</a></p>`,
        size: 'normal',
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'centered',
        title: 'Financer votre projet',
        text: 'Demandez une étude : gisement, CEE et planning sur votre site.',
        buttons: [etudeBtn()],
      },
      { background: 'white', paddingTop: 'none', paddingBottom: 'lg' }
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
