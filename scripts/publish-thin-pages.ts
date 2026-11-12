/**
 * Complète les 3 pages minces : éclairage LED, rénovation globale, bâtiments collectifs.
 * Contenu brief Amina + charte Ultra (paddings lg, CTA final navy).
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
const estimBtn = (): ButtonData => button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none');
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
}

/** Grille de piliers (sites, lots, interlocuteurs). */
function pillars(
  eyebrow: string,
  title: string,
  lead: string,
  items: { num: string; title: string; text: string; href?: string }[],
  bg: BlockStyle['background'] = 'soft'
) {
  const cards = items
    .map((it) => {
      const inner = `<span class="px-ultra-pillar__num">${it.num}</span>
      <h3 class="px-ultra-pillar__title">${it.title}</h3>
      <p class="px-ultra-pillar__text">${it.text}</p>${
        it.href ? `\n      <span class="px-ultra-pillar__cta">En savoir plus <span aria-hidden="true">→</span></span>` : ''
      }`;
      return it.href
        ? `<a class="px-ultra-pillar" href="${it.href}">${inner}</a>`
        : `<article class="px-ultra-pillar">${inner}</article>`;
    })
    .join('\n');
  return rich(
    `<div class="px-ultra-pillars">
  <header class="px-ultra-pillars__head">
    <span class="px-ultra-pillars__eyebrow">${eyebrow}</span>
    <h2 class="px-ultra-pillars__title">${title}</h2>
    <p class="px-ultra-pillars__lead">${lead}</p>
  </header>
  <div class="px-ultra-pillars__grid">${cards}</div>
</div>`,
    bg
  );
}

/** Bénéfices 2 colonnes avec icônes. */
function benefits(
  title: string,
  lead: string,
  items: { icon: string; name: string; text: string }[],
  bg: BlockStyle['background'] = 'white'
) {
  const grid = items
    .map(
      (it) => `<article class="px-ultra-benefits__item">
  <span class="px-ultra-benefits__icon" aria-hidden="true"><i class="fa-solid ${it.icon}"></i></span>
  <div>
    <h3 class="px-ultra-benefits__name">${it.name}</h3>
    <p class="px-ultra-benefits__text">${it.text}</p>
  </div>
</article>`
    )
    .join('\n');
  return rich(
    `<div class="px-ultra-benefits">
  <header class="px-ultra-benefits__head">
    <h2 class="px-ultra-benefits__title">${title}</h2>
    <p class="px-ultra-benefits__lead">${lead}</p>
  </header>
  <div class="px-ultra-benefits__grid">${grid}</div>
</div>`,
    bg
  );
}

/** Grille 2×2 qualifiée (+ cyan). */
function featgrid(
  title: string,
  lead: string,
  items: { num: string; title: string; text: string }[],
  bg: BlockStyle['background'] = 'soft'
) {
  const grid = items
    .map(
      (it) => `<article class="px-ultra-feat">
  <span class="px-ultra-feat__num">${it.num}</span>
  <h3 class="px-ultra-feat__title">${it.title}</h3>
  <p class="px-ultra-feat__text">${it.text}</p>
  <span class="px-ultra-feat__plus" aria-hidden="true">+</span>
</article>`
    )
    .join('\n');
  return rich(
    `<div class="px-ultra-featgrid">
  <header class="px-ultra-featgrid__head">
    <h2 class="px-ultra-featgrid__title">${title}</h2>
    <p class="px-ultra-featgrid__lead">${lead}</p>
  </header>
  <div class="px-ultra-featgrid__grid">${grid}</div>
</div>`,
    bg
  );
}

function faq(title: string, items: [string, string][], bg: BlockStyle['background'] = 'soft') {
  return b(
    'faq',
    {
      eyebrow: 'FAQ',
      title,
      layout: 'stacked',
      showContactCard: false,
      items: items.map(([q, a]) => ({ id: uid('f'), question: q, answer: `<p>${a}</p>` })),
    },
    { background: bg, paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function steps(title: string, items: { title: string; text: string }[]) {
  return b(
    'steps',
    {
      eyebrow: 'Méthode',
      title,
      intro: '',
      items: items.map((it, i) => ({
        id: uid('s'),
        num: String(i + 1).padStart(2, '0'),
        title: it.title,
        text: it.text,
      })),
    },
    { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function checklist(title: string, items: string[], bg: BlockStyle['background'] = 'white') {
  return b(
    'checklist',
    {
      title,
      intro: '',
      cards: [{ id: uid('ck'), title: '', icon: 'fa-check', entries: items.map((t) => ({ id: uid('e'), title: t })) }],
    },
    { background: bg, paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function finalCta(text =
  'Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.') {
  return b(
    'cta',
    {
      variant: 'dark',
      layout: 'centered',
      title: 'Un projet ? Parlons-en.',
      text,
      buttons: [contactBtn(), estimBtn()],
    },
    { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function upsert(
  pages: CmsPage[],
  path: string,
  title: string,
  blocks: CmsBlock[],
  seo: { focus: string; seoTitle: string; meta: string }
) {
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
        focusKeyphrase: seo.focus,
        seoTitle: seo.seoTitle,
        metaDescription: seo.meta,
        slug: path.replace(/\//g, '').replace(/^solutions|^secteurs/, '') || 'page',
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
  page.seo = {
    ...page.seo,
    focusKeyphrase: seo.focus,
    seoTitle: seo.seoTitle,
    metaDescription: seo.meta,
    noindex: false,
  };
  page.updatedAt = now();
}

function eclairage(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Solutions',
        title: 'Éclairage LED des sites professionnels',
        highlight: 'Souvent −50 % sur le poste éclairage, sans fermer le site.',
        intro:
          "L'éclairage LED associé à la détection de présence et à la gradation selon la lumière du jour réduit fréquemment de plus de 50 % la consommation du poste éclairage (ADEME, Syndicat de l'éclairage). Dans un immeuble de bureaux, cela représente environ 10 % de l'électricité totale. Une action rapide, visible par tous les occupants.",
        image: IMG('eclairage-led-d-un-entrepot-pexen.webp'),
        imageAlt: "Éclairage LED d'un entrepôt, PEXEN",
        buttons: [contactBtn(), estimBtn()],
        parentLink: '/solutions/',
        parentLabel: 'Solutions',
        heroVariant: 'solution',
        metrics: [
          { id: uid('m'), value: '−50 %', label: 'souvent sur le poste éclairage' },
          { id: uid('m'), value: '≈ 10 %', label: "de l'électricité totale en bureaux" },
          { id: uid('m'), value: 'Par zone', label: 'installation sans coupure d’activité' },
        ],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Solutions',
        title: "Nos solutions d'éclairage LED",
        intro: 'Cinq leviers, à combiner selon les zones et les horaires d’occupation.',
        columns: 3,
        style: 'hoverDark',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Modules LED',
            text: 'Remplacement des luminaires existants par des modules LED adaptés à la hauteur sous plafond et à l’usage.',
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Détection de présence',
            text: 'Circulations, sanitaires, réserves : l’éclairage s’éteint dès que la zone est vide.',
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Gradation jour',
            text: 'Près des façades et lanterneaux, la puissance suit la lumière naturelle.',
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Extérieur & parkings',
            text: 'Projecteurs, candélabres et parkings : horaires, détection et niveaux adaptés à la nuit.',
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Pilotage GTB',
            text: 'Scénarios, horaires et suivi des consommations intégrés à la GTB / GTC du site.',
            tags: ['GTB'],
            link: '/solutions/gtb-tertiaire-gtc/',
            linkLabel: 'Découvrir →',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'split',
        title: 'Piloter les consommations',
        text: 'L’éclairage LED gagne encore quand la GTB orchestre horaires, détection et consignes par zone.',
        buttons: [button('Découvrir la GTB / GTC', '/solutions/gtb-tertiaire-gtc/', 'secondary', 'none')],
      },
      { background: 'white', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    pillars(
      'Priorisation',
      "Les sites où l'éclairage LED rapporte le plus",
      "L'étude compare la puissance installée, les heures de fonctionnement et le niveau d'éclairement requis par poste de travail. Plus les heures d’allumage sont longues, plus le retour est rapide.",
      [
        {
          num: '01',
          title: 'Entrepôts & ateliers',
          text: 'Éclairés de longues heures, souvent sur de grandes hauteurs : le poste lumière est massif.',
        },
        {
          num: '02',
          title: 'Surfaces de vente',
          text: 'Ouvertes tard, éclairage permanent en rayon : chaque watt compte sur l’année.',
        },
        {
          num: '03',
          title: 'Parkings & extérieurs',
          text: 'Nuit complète, détection et niveaux adaptés : gains élevés hors heures d’occupation.',
        },
        {
          num: '04',
          title: 'Bureaux occupés',
          text: 'Forte occupation, postes de travail exigeants : LED + gradation tiennent le confort.',
        },
      ],
      'soft'
    ),
    benefits(
      'Économies et confort visuel',
      "Un éclairage bien dimensionné ne se juge pas seulement au compteur : il protège aussi le confort des occupants et allège la climatisation.",
      [
        {
          icon: 'fa-ruler-combined',
          name: 'Niveaux réglementaires',
          text: "Respect des niveaux d'éclairement par poste de travail, mesurés avant et après intervention.",
        },
        {
          icon: 'fa-eye',
          name: 'Moins d’éblouissement',
          text: 'Choix des luminaires et des optiques pour limiter l’éblouissement et la fatigue visuelle.',
        },
        {
          icon: 'fa-temperature-low',
          name: 'Moins de chaleur dégagée',
          text: 'Les LED chauffent moins que les anciennes sources : la climatisation travaille moins en été.',
        },
        {
          icon: 'fa-bolt',
          name: 'Gain immédiat visible',
          text: 'Les occupants voient le changement dès le premier jour ; les équipes suivent la baisse sur les compteurs.',
        },
      ],
      'white'
    ),
    steps('Notre méthode éclairage', [
      { title: 'Relevé', text: 'Luminaires, puissances et heures de fonctionnement par zone.' },
      { title: 'Mesure', text: "Niveaux d'éclairement existants sur poste de travail." },
      { title: 'Étude', text: "Étude d'éclairage et choix des luminaires, détections et gradations." },
      { title: 'Installation', text: "Pose par zone, sans interrompre l'activité." },
      { title: 'Réglage et suivi', text: 'Détections, gradation, puis suivi des consommations.' },
    ]),
    b(
      'textMedia',
      {
        eyebrow: 'Terrain',
        title: 'Un poste visible, un gain immédiat',
        html: `<p>Les occupants voient le changement dès le premier jour. Les équipes techniques suivent la baisse sur les compteurs. Une action rapide, souvent combinée au pilotage GTB pour verrouiller les horaires et les scénarios.</p>`,
        image: IMG('eclairage-led-tertiaire-pexen.webp'),
        imageAlt: 'Éclairage LED tertiaire, PEXEN',
        mediaPosition: 'right',
        bullets: [
          'Souvent −50 % sur le poste éclairage',
          'Confort visuel tenu',
          'Installation par zone, site ouvert',
        ],
        buttons: [etudeBtn()],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'table',
      {
        eyebrow: 'Ce que l’étude compare',
        title: 'Trois données pour prioriser les zones',
        intro:
          'Avant de poser un luminaire, nous croisons ces indicateurs zone par zone pour cibler là où le LED rapporte vraiment.',
        columns: ['Indicateur', 'Pourquoi ça compte'],
        rows: [
          { id: uid('r'), cells: ['Puissance installée', 'Base du calcul d’économies kWh et de la facture.'] },
          { id: uid('r'), cells: ['Heures de fonctionnement', 'Plus la zone est allumée longtemps, plus le retour est court.'] },
          {
            id: uid('r'),
            cells: ["Niveau d'éclairement requis", 'Garantit le confort et la conformité sans sur-éclairer.'],
          },
        ],
        searchable: false,
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq("Questions fréquentes sur l'éclairage LED", [
      [
        'Faut-il changer tous les luminaires ?',
        "Pas toujours. L'étude distingue les zones à remplacer de celles où la détection ou la gradation suffisent.",
      ],
      [
        "L'éclairage LED est-il éligible à un financement ?",
        "Souvent, selon le type de luminaire et le bâtiment. Nous vérifions l'éligibilité à l'étape de faisabilité.",
      ],
      [
        "Combien de temps dure un projet d'éclairage LED ?",
        "Quelques jours à quelques semaines selon la surface, avec une installation par zone pour maintenir l'activité.",
      ],
    ]),
    finalCta(),
  ];
}

function renovationGlobale(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Solutions',
        title: 'Rénovation globale tertiaire et des bâtiments collectifs',
        highlight: 'Traiter le bâtiment comme un système, pas lot par lot.',
        intro:
          "La rénovation globale tertiaire traite ensemble l'enveloppe, la production de chaleur et de froid, la ventilation et le pilotage d'un bâtiment. Elle s'adresse aux sites qui visent les objectifs 2030 et au-delà du décret tertiaire, là où les actions isolées ne suffisent plus.",
        image: IMG('chantier-de-renovation-globale-tertiaire.webp'),
        imageAlt: 'Chantier de rénovation globale tertiaire',
        buttons: [contactBtn(), estimBtn()],
        parentLink: '/solutions/',
        parentLabel: 'Solutions',
        heroVariant: 'solution',
        metrics: [
          { id: uid('m'), value: '−40 %', label: 'cible 2030 (décret tertiaire)' },
          { id: uid('m'), value: '1 audit', label: 'scénarios chiffrés avant travaux' },
          { id: uid('m'), value: 'Multi-lots', label: 'froid · chaleur · pilotage · enveloppe' },
        ],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    featgrid(
      'Pourquoi une rénovation globale tertiaire',
      'Régulation, réglages et éclairage réduisent souvent les consommations de 20 à 30 %. Atteindre −40 % en 2030, puis −60 % en 2050, suppose de traiter le bâtiment comme un système.',
      [
        {
          num: '01',
          title: 'Actions isolées = plafond vite atteint',
          text: 'Pilotage et éclairage aident, mais ne suffisent plus pour les cibles 2030–2050.',
        },
        {
          num: '02',
          title: 'Chaque lot dimensionné avec les autres',
          text: 'Une pompe à chaleur se calcule sur les besoins après isolation, pas avant.',
        },
        {
          num: '03',
          title: 'Performance mesurée sur l’ensemble',
          text: 'Le bilan porte sur le bâtiment, pas sur une seule installation.',
        },
        {
          num: '04',
          title: 'Phasage sans se bloquer',
          text: 'Court terme (pilotage), moyen terme (production), long terme (enveloppe).',
        },
      ],
      'white'
    ),
    b(
      'cards',
      {
        eyebrow: 'Bouquet',
        title: 'Un bouquet de travaux adapté au bâtiment',
        intro: 'Cinq familles de lots, à assembler selon l’audit et l’exploitation du site.',
        columns: 3,
        style: 'hoverDark',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Enveloppe',
            text: 'Toitures-terrasses, menuiseries, apports solaires.',
            image: IMG('renovation-energetique.webp'),
            tags: [],
            link: '/solutions/isolation-technique/',
            linkLabel: 'Isolation →',
          },
          {
            id: uid('c'),
            title: 'Production de chaleur',
            text: 'Pompes à chaleur, récupération de chaleur, réseau de chaleur.',
            image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
            tags: [],
            link: '/solutions/pompe-a-chaleur-tertiaire/',
            linkLabel: 'Chaleur →',
          },
          {
            id: uid('c'),
            title: 'Froid & clim',
            text: 'Régulation, fermeture des meubles, condensation.',
            image: IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
            tags: [],
            link: '/solutions/froid-commercial-industriel/',
            linkLabel: 'Froid →',
          },
          {
            id: uid('c'),
            title: 'Ventilation & air',
            text: 'Traitement d’air et renouvellement adaptés à l’occupation.',
            tags: [],
            link: '/solutions/pompe-a-chaleur-tertiaire/',
            linkLabel: 'Découvrir →',
          },
          {
            id: uid('c'),
            title: 'Pilotage GTB / GTC',
            text: 'Classe A ou B pour tenir les gains dans le temps.',
            image: IMG('pilotage-gtb-decret-bacs-pexen.webp'),
            tags: ['BACS'],
            link: '/solutions/gtb-tertiaire-gtc/',
            linkLabel: 'GTB →',
          },
        ],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'split',
        title: 'Voir nos solutions',
        text: 'Chaque lot du bouquet renvoie à une expertise PEXEN déjà déployée sur le terrain.',
        buttons: [button('Toutes les solutions', '/solutions/', 'secondary', 'none')],
      },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    steps('Notre méthode', [
      { title: 'Audit énergétique', text: 'Avec notre partenaire Leo Energy (OPQIBI 1905).' },
      { title: 'Scénarios chiffrés', text: 'Économies, coûts, financement, temps de retour.' },
      { title: 'Plan de travaux', text: "Phasé selon l'exploitation du site." },
      { title: 'Réalisation', text: 'Lots froid, chaleur, pilotage et isolation.' },
      { title: 'Suivi', text: 'Consommations, éventuellement sous contrat de performance énergétique.' },
    ]),
    benefits(
      'Le financement de la rénovation globale',
      'Chaque lot conforme à une opération standardisée est valorisé. Une opération dédiée à la rénovation globale des bâtiments tertiaires est annoncée : nous la mobiliserons dès sa parution.',
      [
        {
          icon: 'fa-file-invoice-dollar',
          name: 'Lots CEE standardisés',
          text: 'Froid, chaleur, isolation, GTB : chaque opération éligible est montée dans le dossier.',
        },
        {
          icon: 'fa-layer-group',
          name: 'Bouquet cohérent',
          text: 'Le plan de travaux aligne les lots pour maximiser le financement sans surdimensionner.',
        },
        {
          icon: 'fa-building',
          name: 'Collectifs : BAR-TH-177',
          text: 'Pour l’habitat collectif, opération dédiée avec gain minimum de 35 %.',
        },
        {
          icon: 'fa-calculator',
          name: 'Estimation avant vote',
          text: 'Montants et temps de retour présentés avant validation du phasage.',
        },
      ],
      'white'
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'split',
        title: 'Estimer le financement',
        text: 'Une première estimation à partir de la surface, des usages et des lots envisagés.',
        buttons: [estimBtn()],
      },
      { background: 'white', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    b(
      'table',
      {
        eyebrow: 'Trajectoire',
        title: 'Une trajectoire 2030, 2040, 2050',
        intro:
          'La rénovation globale se planifie souvent en plusieurs phases. Chaque phase est dimensionnée pour ne pas pénaliser la suivante.',
        columns: ['Horizon', 'Priorité', 'Point de vigilance'],
        rows: [
          {
            id: uid('r'),
            cells: [
              'Court terme',
              'Pilotage, régulation, éclairage',
              'Gains rapides, sans bloquer les lots suivants',
            ],
          },
          {
            id: uid('r'),
            cells: [
              'Moyen terme',
              'Production de chaleur et de froid',
              'Dimensionner après isolation, pas avant',
            ],
          },
          {
            id: uid('r'),
            cells: [
              'Long terme',
              'Enveloppe (toiture, menuiseries…)',
              'Préparer les besoins thermiques futurs',
            ],
          },
        ],
        searchable: false,
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Collectifs',
        title: 'Rénovation globale des bâtiments collectifs',
        html: `<p>Pour les copropriétés et les gestionnaires, la rénovation globale d'un bâtiment collectif d'habitation fait l'objet d'une opération standardisée dédiée (BAR-TH-177). Elle demande un gain d'au moins 35 % sur la consommation d'énergie avant travaux, à partir d'un audit énergétique réalisé sur site avant les travaux.</p>`,
        image: IMG('renovation-globale-batiment-collectif-chaufferie-pexen.webp'),
        imageAlt: "Rénovation globale d'un bâtiment collectif, chaufferie",
        mediaPosition: 'left',
        bullets: [
          'Audit avec scénario en une étape et en plusieurs étapes',
          'Bouquet : isolation, chauffage, équilibrage',
          'Valorisation BAR-TH-177',
        ],
        buttons: [button('Bâtiments collectifs', '/secteurs/batiments-collectifs/')],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq('Questions fréquentes sur la rénovation globale', [
      [
        'Faut-il tout faire en une fois ?',
        'Non. Le plan de travaux peut être phasé sur plusieurs années, à condition que chaque phase prépare la suivante.',
      ],
      [
        'Le site reste-t-il ouvert pendant les travaux ?',
        'Oui dans la grande majorité des cas, avec un planning par zone.',
      ],
      [
        'Par quoi commencer une rénovation globale ?',
        "Par un audit énergétique du bâtiment, qui établit l'état initial, les scénarios et le phasage des travaux.",
      ],
    ]),
    finalCta(),
  ];
}

function collectifs(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Secteurs',
        title: 'Performance énergétique des bâtiments collectifs',
        highlight: 'Des charges maîtrisées, un confort tenu, un dossier prêt pour la décision.',
        intro:
          "Syndics et gestionnaires de patrimoine : dans les bâtiments collectifs, la chaufferie concentre l'essentiel des consommations et des charges. PEXEN la modernise, remplace le fioul par des pompes à chaleur, équilibre les réseaux et prépare un dossier lisible pour l'assemblée générale.",
        image: IMG('chaufferie-de-batiments-collectifs-modernisee-par-pexen.webp'),
        imageAlt: 'Chaufferie de bâtiments collectifs modernisée par PEXEN',
        buttons: [contactBtn(), estimBtn()],
        parentLink: '/secteurs/',
        parentLabel: 'Secteurs',
        heroVariant: 'sector',
        metrics: [
          { id: uid('m'), value: '15 ans', label: 'âge à partir duquel un plan pluriannuel de travaux est requis' },
          { id: uid('m'), value: 'RGE QualiPAC', label: 'installateur de pompes à chaleur collectives' },
          { id: uid('m'), value: '1 dossier', label: "prêt pour l'assemblée générale" },
        ],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cards',
      {
        eyebrow: '',
        title: 'Vos enjeux de gestionnaire',
        intro: '',
        columns: 3,
        style: 'hoverDark',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Les charges des occupants',
            text: "Le chauffage et l'eau chaude collectifs sont le premier poste de charges récupérables.",
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Des chaufferies vieillissantes',
            text: 'Chaudières fioul ou gaz hors condensation, réseaux non isolés, régulation figée : les rendements chutent.',
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Une décision collective',
            text: "Un projet de copropriété se vote en assemblée générale : il exige un dossier technique et financier lisible.",
            tags: [],
            link: '',
            linkLabel: '',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'table',
      {
        eyebrow: 'Réglementation',
        title: 'Les obligations des copropriétés',
        intro:
          'Ces documents chiffrent les travaux ; notre étude les traduit en scénarios finançables, prêts pour le conseil syndical et l’assemblée générale.',
        columns: ['Obligation', 'Qui est concerné', 'Ce que PEXEN apporte'],
        rows: [
          {
            id: uid('r'),
            cells: [
              'Plan pluriannuel de travaux',
              'Copropriétés de plus de 15 ans',
              'Scénarios chiffrés, phasage et financement',
            ],
          },
          {
            id: uid('r'),
            cells: [
              'DPE collectif',
              'Copropriétés > 15 ans (toutes depuis 2026)',
              'Lecture technique et priorisation des lots',
            ],
          },
          {
            id: uid('r'),
            cells: [
              'Décision en AG',
              'Tous les syndicats de copropriétaires',
              'Dossier lisible : coûts, aides, calendrier',
            ],
          },
        ],
        searchable: false,
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Solutions',
        title: 'Nos solutions pour les bâtiments collectifs',
        intro: 'De la chaufferie à la rénovation globale : un même interlocuteur pour le syndic et le gestionnaire.',
        columns: 2,
        style: 'hoverDark',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Sortie du fioul et du gaz',
            text: "Pompes à chaleur collectives et géothermie, bonifiées en cas de dépose d'une chaudière fossile. PEXEN est installateur RGE QualiPAC.",
            image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
            tags: ['QualiPAC'],
            link: '/solutions/pompe-a-chaleur-tertiaire/',
            linkLabel: 'Découvrir →',
          },
          {
            id: uid('c'),
            title: 'Équilibrage et régulation des réseaux',
            text: 'Les logements éloignés de la chaufferie atteignent la consigne sans surchauffer les autres.',
            image: IMG('batiments-collectifs-chaufferie-pexen.webp'),
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Isolation technique en chaufferie',
            text: 'Calorifugeage des réseaux, matelas isolants sur vannes et échangeurs.',
            image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp'),
            tags: [],
            link: '/solutions/isolation-technique/',
            linkLabel: 'Découvrir →',
          },
          {
            id: uid('c'),
            title: 'Rénovation globale',
            text: "Audit, bouquet de travaux et valorisation dédiée (BAR-TH-177), bonifiée jusqu'au 31 décembre 2030.",
            image: IMG('drive-secteur-renovation-globale-collectif.webp'),
            tags: ['BAR-TH-177'],
            link: '/solutions/renovation-globale-tertiaire/',
            linkLabel: 'Découvrir →',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'split',
        title: 'Demander une étude',
        text: 'Relevé chaufferie, scénarios PAC / hybride / géothermie, et montant des aides avant AG.',
        buttons: [etudeBtn()],
      },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    steps('Sortir du fioul en chaufferie collective', [
      { title: 'Relevé', text: 'Consommations, puissance installée et températures de départ.' },
      { title: 'Scénarios', text: 'Pompe à chaleur seule, hybride avec appoint, géothermie.' },
      { title: 'Dossier', text: "Assemblée générale, avec le montant du financement." },
      { title: 'Travaux', text: 'Hors saison de chauffe ou avec production provisoire.' },
      { title: 'Suivi', text: 'Réglage, équilibrage et suivi de la première saison.' },
    ]),
    pillars(
      'Interlocuteurs',
      'Un dossier adapté à chaque gestionnaire',
      'Le même projet technique, deux lectures : décision collective pour le syndic, suivi d’exploitation pour le gestionnaire de patrimoine.',
      [
        {
          num: '01',
          title: 'Syndic & conseil syndical',
          text: 'Éléments prêts pour l’assemblée générale : scénarios, coûts, aides, calendrier hors saison de chauffe.',
        },
        {
          num: '02',
          title: 'Gestionnaire de patrimoine',
          text: 'Suivi des consommations après travaux et ajustement des réglages de la chaufferie.',
        },
        {
          num: '03',
          title: 'Occupants',
          text: 'Confort tenu, charges mieux maîtrisées, travaux planifiés pour limiter les nuisances.',
        },
      ],
      'soft'
    ),
    faq('Questions fréquentes sur la chaufferie collective', [
      [
        'Les travaux se font-ils en site occupé ?',
        "Oui. Le remplacement d'une production de chaleur se planifie hors saison de chauffe ou avec une solution provisoire.",
      ],
      [
        'Qui perçoit le financement en copropriété ?',
        "Le syndicat des copropriétaires, maître d'ouvrage des travaux. Il vient en déduction du coût voté.",
      ],
      [
        "Comment savez-vous que l'installation n'est pas surdimensionnée ?",
        'Le dimensionnement est établi à partir des données du site, des régimes de fonctionnement et des relevés réalisés sur place.',
      ],
      [
        "Comment estimez-vous les économies avant que je valide les travaux ?",
        "À partir des données d'exploitation et des relevés réalisés sur site. PEXEN dimensionne la solution avant devis.",
      ],
    ]),
    finalCta(),
  ];
}

const snap = await updateSnapshot((s) => {
  upsert(s.pages, '/solutions/eclairage-led/', 'Éclairage LED', eclairage(), {
    focus: 'éclairage LED',
    seoTitle: 'Éclairage LED tertiaire et industriel | PEXEN',
    meta:
      "Éclairage LED des sites tertiaires et industriels : luminaires LED, détection de présence, gradation. Souvent plus de 50 % d'économies sur l'éclairage.",
  });

  upsert(s.pages, '/solutions/renovation-globale-tertiaire/', 'Rénovation globale', renovationGlobale(), {
    focus: 'rénovation globale tertiaire',
    seoTitle: 'Rénovation globale tertiaire : bouquet de travaux | PEXEN',
    meta:
      'Rénovation globale tertiaire et des bâtiments collectifs : audit, bouquet de travaux, chauffage, isolation, pilotage. PEXEN réalise et suit le projet.',
  });

  upsert(s.pages, '/secteurs/batiments-collectifs/', 'Bâtiments collectifs', collectifs(), {
    focus: 'bâtiments collectifs',
    seoTitle: 'Bâtiments collectifs : chaufferie et sortie du fioul | PEXEN',
    meta:
      'Bâtiments collectifs : chaufferie, pompes à chaleur en remplacement du fioul, équilibrage, rénovation globale. Pour syndics et gestionnaires.',
  });

  /* Plus de redirect qui masquait la page collectifs */
  s.redirects = s.redirects.filter((r) => r.from !== '/secteurs/batiments-collectifs/');
  /* Alias historique → page canonique batiments-collectifs */
  const alias = s.redirects.find((r) => r.from === '/secteurs/renovation-energetique-copropriete/');
  if (alias) {
    alias.to = '/secteurs/batiments-collectifs/';
  } else {
    s.redirects.push({
      from: '/secteurs/renovation-energetique-copropriete/',
      to: '/secteurs/batiments-collectifs/',
      permanent: true,
    });
  }

  /* Sync secteurs listing link if needed */
  const secteurs = s.pages.find((p) => p.path === '/secteurs/');
  if (secteurs) {
    const raw = JSON.stringify(secteurs.blocks);
    const next = raw
      .split('/secteurs/renovation-energetique-copropriete/')
      .join('/secteurs/batiments-collectifs/');
    if (next !== raw) {
      secteurs.blocks = JSON.parse(next);
      secteurs.updatedAt = now();
      console.log('secteurs listing → batiments-collectifs');
    }
  }

  console.log('published 3 thin pages + redirect fix');
});

for (const path of [
  '/solutions/eclairage-led/',
  '/solutions/renovation-globale-tertiaire/',
  '/secteurs/batiments-collectifs/',
]) {
  const p = snap.pages.find((x) => x.path === path);
  console.log(path, p?.status, p?.blocks.length, 'blocs ·', p?.seo.seoTitle);
}
console.log(
  'redirects',
  snap.redirects
    .filter((r) => r.from.includes('batiments') || r.from.includes('copropriete') || r.to.includes('batiments'))
    .map((r) => `${r.from} → ${r.to}`)
);
await pool.end();
