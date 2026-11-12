/**
 * Retours Amina — layouts pro + sous-pages chantier réactivées
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { normalizePageCtas } from '../server/cms/normalizeCtas';
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
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');
const phoneBtn = (): ButtonData => button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone');

const CUMAC =
  '* Estimation calculée selon les fiches d’opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
}

function upsert(pages: CmsPage[], path: string, title: string, blocks: CmsBlock[], seo: Partial<CmsPage['seo']>, template: CmsPage['template'] = 'default') {
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
      template,
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
  page.template = template;
  page.blocks = blocks;
  page.seo = { ...page.seo, ...seo, seoTitle: seo.seoTitle || page.seo.seoTitle };
  page.updatedAt = now();
}

type Chantier = {
  path: string;
  anchor: string;
  title: string;
  client: string;
  location: string;
  meta: string;
  image: string;
  imageAlt: string;
  enjeu: string;
  solutionsTitle: string;
  solutions: string[];
  ceeTitle: string;
  cee: string[];
  result?: string;
  seoTitle: string;
  metaDescription: string;
  focus: string;
};

const CHANTIERS: Chantier[] = [
  {
    path: '/realisations/intermarche-sortie-du-fioul/',
    anchor: 'intermarche',
    title: 'Intermarché : sortir du fioul et optimiser le froid',
    client: 'Intermarché',
    location: 'Bourgogne-Franche-Comté',
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
    seoTitle: 'Intermarché : sortie du fioul et optimisation du froid | PEXEN',
    metaDescription:
      'Projet Intermarché : pompe à chaleur air/eau, récupération de chaleur, déstratification et GTB. 14,8 GWh cumac estimés*',
    focus: 'sortie du fioul Intermarché',
  },
  {
    path: '/realisations/carrefour-market-recuperation-de-chaleur/',
    anchor: 'carrefour-market',
    title: 'Carrefour Market : froid, chaleur et toiture sous contrat de performance',
    client: 'Carrefour Market',
    location: 'Île-de-France',
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
    seoTitle: 'Carrefour Market : récupération de chaleur et CPE | PEXEN',
    metaDescription:
      'Projet Carrefour Market : récupération de chaleur, régulation, isolation toiture et fermeture des meubles. 30,6 GWh cumac estimés*',
    focus: 'récupération de chaleur Carrefour Market',
  },
  {
    path: '/realisations/cedim-destratification/',
    anchor: 'cedim',
    title: 'CEDIM : ramener la chaleur au sol',
    client: 'CEDIM',
    location: 'Centre-Val de Loire',
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
    seoTitle: 'CEDIM : déstratification d’air en magasin | PEXEN',
    metaDescription: 'Projet CEDIM : déstratificateurs d’air en grande hauteur. 2,1 GWh cumac estimés*',
    focus: 'déstratification CEDIM',
  },
  {
    path: '/realisations/colorcon-efficacite-energetique-industrielle/',
    anchor: 'colorcon',
    title: 'Colorcon : chaufferie vapeur et froid process',
    client: 'Colorcon',
    location: 'Île-de-France',
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
    seoTitle: 'Colorcon : efficacité énergétique industrielle | PEXEN',
    metaDescription:
      'Projet Colorcon : chaufferie vapeur, froid process et utilités industrielles. Fiches CEE IND-UT étudiées.',
    focus: 'efficacité énergétique industrielle Colorcon',
  },
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

function listingCardHtml(c: Chantier): string {
  return `<a id="${c.anchor}" class="px-ultra-ref-card" href="${c.path}">
  <div class="px-ultra-ref-card__media"><img src="${c.image}" alt="${c.imageAlt}" loading="lazy" width="640" height="400" /></div>
  <div class="px-ultra-ref-card__body">
    <h3 class="px-ultra-ref-card__title">${c.client}</h3>
    <p class="px-ultra-ref-card__loc"><i class="fa fa-map-marker-alt" aria-hidden="true"></i>${c.location}</p>
    <span class="px-ultra-ref-card__cta">Voir la réalisation <span aria-hidden="true">→</span></span>
  </div>
</a>`;
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

function realisationsListing(): CmsBlock[] {
  const cards = CHANTIERS.map(listingCardHtml).join('');
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Réalisations',
        title: 'Nos références : projets financés par les CEE',
        highlight: '',
        intro:
          'Supermarchés, entrepôts, industrie pharmaceutique : quatre configurations, des travaux menés sans arrêter l’exploitation, des dossiers CEE engagés avant devis.',
        image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
        imageAlt: 'Projets d’efficacité énergétique réalisés par PEXEN',
        buttons: [contactBtn(), button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none')],
        metrics: [
          { id: uid('m'), value: '4 projets', label: '4 configurations' },
          { id: uid('m'), value: '47,5 GWh cumac*', label: 'estimés sur l’ensemble' },
          { id: uid('m'), value: '3 régions', label: '2 secteurs' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    rich(
      `<div class="px-ultra-center-intro"><h2>Des projets concrets, financés par les CEE</h2><p>Chaque référence présente le contexte, les travaux réalisés et le volume de kWh cumac estimé. Notre approche : intégrer l’expertise CEE dès la conception et sécuriser le dossier avant devis.</p><p><a href="/expertises/financement-cee-reglementation/">Découvrir le financement CEE</a> · <a href="/contact/">Parler de votre projet</a></p></div><div class="px-ultra-ref-grid">${cards}</div>`
    ),
    rich(
      `<h2>Comment lire nos chiffres</h2><p>Les volumes affichés sont exprimés en kWh cumac, l'unité officielle des certificats d'économies d'énergie. Ils sont calculés hors bonifications, à partir des fiches standardisées mobilisées sur chaque projet. Les économies mesurées sur les factures seront publiées au fil du suivi des consommations.</p>`,
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

/** CTA : un bandeau étude, pas de « Parlons… » redondant au milieu. */
function dedupeCtas(page: CmsPage) {
  page.blocks = normalizePageCtas(page.blocks || []);
}

const KEEP_REDIRECT_TO_LIST = new Set([
  '/realisations/agro-froid-bretagne/',
  '/realisations/campus-tertiaire-lyon/',
  '/realisations/carrefour-market/',
  '/realisations/cedim/',
  '/realisations/colorcon-bazainville/',
  '/realisations/intermarche-trevenans/',
]);

const snap = await updateSnapshot((s) => {
  upsert(s.pages, '/realisations/', 'Réalisations', realisationsListing(), {
    focusKeyphrase: "projets d'efficacité énergétique",
    seoTitle: "Projets d'efficacité énergétique : 4 références | PEXEN",
    metaDescription:
      "Projets d'efficacité énergétique PEXEN : Intermarché, Carrefour Market, CEDIM, Colorcon. Solutions installées, fiches CEE et économies d'énergie estimées.",
  });

  /* Retours 2 nov. #36 : pages chantier → 301 vers ancres (pas de fiches détail) */
  const anchors: [string, string][] = [
    ['/realisations/intermarche-sortie-du-fioul/', '/realisations/#intermarche'],
    ['/realisations/intermarche-trevenans/', '/realisations/#intermarche'],
    ['/realisations/carrefour-market-recuperation-de-chaleur/', '/realisations/#carrefour-market'],
    ['/realisations/carrefour-market/', '/realisations/#carrefour-market'],
    ['/realisations/cedim-destratification/', '/realisations/#cedim'],
    ['/realisations/cedim/', '/realisations/#cedim'],
    ['/realisations/colorcon-efficacite-energetique-industrielle/', '/realisations/#colorcon'],
    ['/realisations/colorcon-bazainville/', '/realisations/#colorcon'],
  ];
  for (const [from, to] of anchors) {
    const i = s.redirects.findIndex((r) => r.from === from);
    if (i >= 0) s.redirects[i] = { from, to, permanent: true };
    else s.redirects.push({ from, to, permanent: true });
    const page = s.pages.find((p) => p.path === from);
    if (page && CHANTIERS.some((c) => c.path === from)) {
      page.status = 'draft';
      page.seo = { ...page.seo, noindex: true };
      page.updatedAt = now();
    }
  }

  const keepLive = new Set([
    '/expertises/bureau-etudes-fluides/',
    '/expertises/assistance-maitrise-ouvrage/',
    '/expertises/financement-cee-reglementation/',
  ]);
  s.redirects = s.redirects.filter((r) => !keepLive.has(r.from));

  for (const page of s.pages) {
    if (['/solutions/froid-commercial-industriel/', '/solutions/recuperation-de-chaleur/', '/expertises/bureau-etudes-fluides/', '/expertises/assistance-maitrise-ouvrage/', '/expertises/financement-cee-reglementation/'].includes(page.path)) {
      dedupeCtas(page);
      page.updatedAt = now();
    }
  }

  /* Contact : hero + piliers avant le formulaire */
  const contact = s.pages.find((p) => p.path === '/contact/');
  if (contact) {
    const form = contact.blocks.find((x) => x.type === 'contactForm');
    contact.blocks = [
      b(
        'pageHeader',
        {
          breadcrumb: true,
          eyebrow: 'Contact',
          title: 'Parlons de votre projet',
          highlight: '',
          intro:
            'Décrivez votre site, vos installations et vos échéances. Un ingénieur PEXEN vous répond sous 48 h ouvrées.',
          image: IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
          imageAlt: 'Ingénieur PEXEN',
          buttons: [phoneBtn(), button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none')],
          heroVariant: 'solution',
        },
        { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
      ),
      rich(
        `<div class="px-ultra-pillars">
  <header class="px-ultra-pillars__head">
    <span class="px-ultra-pillars__eyebrow">Parcours</span>
    <h2 class="px-ultra-pillars__title">Trois étapes après votre message</h2>
    <p class="px-ultra-pillars__lead">Pas de formulaire sans suite : chaque demande est traitée par un ingénieur.</p>
  </header>
  <div class="px-ultra-pillars__grid">
    <article class="px-ultra-pillar"><span class="px-ultra-pillar__num">01</span><h3 class="px-ultra-pillar__title">Étude de la demande</h3><p class="px-ultra-pillar__text">Un ingénieur lit votre message et prépare les premières questions techniques.</p></article>
    <article class="px-ultra-pillar"><span class="px-ultra-pillar__num">02</span><h3 class="px-ultra-pillar__title">Échange de qualification</h3><p class="px-ultra-pillar__text">Appel sous 48 h ouvrées pour préciser le site, les installations et les échéances.</p></article>
    <article class="px-ultra-pillar"><span class="px-ultra-pillar__num">03</span><h3 class="px-ultra-pillar__title">Visite technique</h3><p class="px-ultra-pillar__text">Organisation du relevé sur site si le projet le justifie.</p></article>
  </div>
</div>`
      ),
      form ||
        b(
          'contactForm',
          {
            formId: 'contact-main',
            title: 'Envoyez votre demande',
            intro: 'Indiquez le type de site, la surface ou la puissance approximative, et vos coordonnées.',
            submitLabel: 'Envoyer ma demande',
            listItems: [
              'Un ingénieur étudie votre demande.',
              'Il prend contact avec vous pour qualifier le besoin.',
              'Nous organisons la visite technique de votre site.',
            ],
            phoneLabel: 'Téléphone',
            phoneHint: '01 41 93 52 80',
            privacyPath: '/politique-de-confidentialite/',
            variant: 'default',
          },
          { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
        ),
    ];
    contact.updatedAt = now();
  }

  /* Simulateur : hero solution cohérent */
  const sim = s.pages.find((p) => p.path === '/simulateur-prime-cee/');
  if (sim) {
    const header = sim.blocks.find((x) => x.type === 'pageHeader');
    if (header) {
      Object.assign(header.data, {
        eyebrow: 'Financement CEE',
        title: 'Estimez le financement de votre projet',
        intro:
          'Décrivez votre site et les travaux envisagés : un premier ordre de grandeur du financement mobilisable. Il ne remplace ni la visite technique ni la note de calcul.',
        image: IMG('cee-tertiaire.webp'),
        imageAlt: 'Financement CEE',
        buttons: [etudeBtn(), contactBtn()],
        heroVariant: 'solution',
        breadcrumb: true,
      });
      header.style = { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' };
    }
    sim.updatedAt = now();
  }

  void KEEP_REDIRECT_TO_LIST;
});

for (const c of CHANTIERS) {
  const p = snap.pages.find((x) => x.path === c.path);
  console.log(c.path, p?.status, p?.blocks.length);
}
console.log(
  'redirects détail',
  snap.redirects
    .filter((r) => r.from.startsWith('/realisations/') && r.from !== '/realisations/')
    .map((r) => `${r.from} → ${r.to}`)
    .join('\n')
);
await pool.end();
