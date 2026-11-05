/**
 * Recette Phase 2 — Gabarits Solution + Secteur (corps de fiches).
 * Textes collés depuis la recette ; heroes déjà variantés.
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

const etudeCta = (title = 'Demander une étude') =>
  b(
    'cta',
    { variant: 'light', layout: 'centered', title, text: '', buttons: [etudeBtn()] },
    { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
  );

function hero(opts: {
  eyebrow: string;
  title: string;
  highlight: string;
  intro: string;
  image: string;
  imageAlt: string;
  metrics: { value: string; label: string }[];
  parent: { label: string; link: string };
  variant: 'solution' | 'sector';
}) {
  return b(
    'pageHeader',
    {
      breadcrumb: true,
      parentLabel: opts.parent.label,
      parentLink: opts.parent.link,
      eyebrow: opts.eyebrow,
      title: opts.title,
      highlight: opts.highlight,
      intro: opts.intro,
      image: opts.image,
      imageAlt: opts.imageAlt,
      buttons: [contactBtn(), estimBtn()],
      metrics: opts.metrics.map((m) => ({ id: uid('m'), ...m })),
      heroVariant: opts.variant,
    },
    { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
  );
}

function checklist(title: string, items: string[], bg: BlockStyle['background'] = 'white') {
  return b(
    'checklist',
    {
      title,
      intro: '',
      cards: [
        {
          id: uid('ck'),
          title: '',
          icon: 'fa-check',
          entries: items.map((t) => ({ id: uid('e'), title: t })),
        },
      ],
    },
    { background: bg, paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function solCards(
  title: string,
  items: { title: string; text: string; cee?: string[]; image?: string; imageAlt?: string }[],
  cols: 2 | 3 = 3
) {
  return b(
    'cards',
    {
      eyebrow: 'Solutions',
      title,
      intro: '',
      columns: cols,
      style: 'hoverDark',
      headerLinkLabel: '',
      items: items.map((it) => ({
        id: uid('c'),
        title: it.title,
        text: it.text,
        image: it.image,
        imageAlt: it.imageAlt || it.title,
        tags: it.cee || [],
        link: '',
        linkLabel: '',
      })),
    },
    { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
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

function table(title: string, columns: string[], rows: string[][]) {
  return b(
    'table',
    {
      eyebrow: '',
      title,
      intro: '',
      searchable: false,
      columns,
      rows: rows.map((cells) => ({ id: uid('r'), cells })),
    },
    { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function faq(title: string, items: [string, string][]) {
  return b(
    'faq',
    {
      eyebrow: 'FAQ',
      title,
      layout: 'stacked',
      showContactCard: false,
      items: items.map(([q, a]) => ({ id: uid('f'), question: q, answer: `<p>${a}</p>` })),
    },
    { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function note(text: string) {
  return rich(`<p class="text-xs text-slate-500">${text}</p>`, 'white');
}

function upsert(pages: CmsPage[], path: string, title: string, blocks: CmsBlock[], seo: Partial<CmsPage['seo']>) {
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
}

const SOL = { label: 'Solutions', link: '/solutions/' };
const SEC = { label: 'Secteurs', link: '/secteurs/' };
const CUMAC =
  '* Estimation calculée selon les fiches d’opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

/* ——— Solutions ——— */

function froid(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Solutions',
      title: 'Froid commercial et industriel',
      highlight: 'Réduire la consommation de vos groupes froids',
      intro:
        'Le froid commercial est le premier poste électrique d’un supermarché : 45 à 75 % des dépenses d’énergie selon Perifem. Dans l’industrie agroalimentaire ou pharmaceutique, le froid process pèse autant. PEXEN optimise les centrales existantes sans rompre la chaîne du froid : régulation, condensation, variation de vitesse et fermeture des meubles de vente. Chaque intervention préserve ce que vos clients ne voient jamais : la chaîne du froid.',
      image: IMG('centrale-de-froid-commercial-optimisee-par-pexen.webp'),
      imageAlt: 'Centrale de froid commercial optimisée par PEXEN',
      metrics: [
        { value: '45 à 75 %', label: 'des dépenses d’énergie d’un supermarché (Perifem)' },
        { value: 'Jusqu’à 30 %', label: 'd’électricité en moins par groupe froid' },
        { value: '979 kWh/m²/an', label: 'pour un rayon froid, contre 45 à 72 sans froid (OPERAT)' },
      ],
      parent: SOL,
      variant: 'solution',
    }),
    checklist('Pourquoi vos groupes froids consomment trop', [
      'Une pression de condensation fixe, réglée pour les journées les plus chaudes, alors que la température extérieure reste sous 20 °C la majeure partie de l’année.',
      'Des meubles de vente ouverts : un rayon froid consomme environ 979 kWh/m²/an, contre 45 à 72 kWh/m²/an pour un rayon sans froid (données OPERAT).',
      'Des compresseurs et ventilateurs à vitesse fixe, qui fonctionnent en tout ou rien.',
      'Des condenseurs sous-dimensionnés ou encrassés, qui obligent les compresseurs à travailler à haute pression.',
    ]),
    solCards('Nos solutions pour le froid commercial et industriel', [
      {
        title: 'Haute pression flottante',
        text: 'La pression de condensation suit la température extérieure au lieu de rester bloquée à sa valeur d’été. Sur une installation ancienne à régulation figée, le gain atteint jusqu’à 30 % de la consommation du groupe froid.',
        cee: ['BAT-TH-134', 'IND-UT-116'],
        image: IMG('regulation-haute-pression-flottante-sur-groupe-de-froid-commercial.webp'),
      },
      {
        title: 'Basse pression flottante',
        text: 'La pression d’évaporation s’ajuste à la demande réelle des meubles et des chambres froides. Les compresseurs travaillent avec un taux de compression plus faible.',
        cee: ['BAT-TH-145', 'IND-UT-115'],
        image: IMG('drive-froid-commercial-industriel.webp'),
      },
      {
        title: 'Condensation frigorifique haute efficacité',
        text: 'Des condenseurs dimensionnés pour un écart de température réduit et des ventilateurs à commutation électronique abaissent la pression de travail des compresseurs.',
        cee: ['BAT-EQ-130', 'IND-UT-113'],
        image: IMG('performance-energetique-centrale-froid-pexen.webp'),
      },
      {
        title: 'Variation électronique de vitesse',
        text: 'Compresseurs, ventilateurs et pompes adaptent leur vitesse à la charge au lieu de démarrer et s’arrêter en permanence. Moins d’appels de puissance, moins d’usure.',
        cee: ['BAT-TH-112', 'IND-UT-102'],
        image: IMG('centrale-de-froid-commercial-optimisee-par-pexen.webp'),
      },
      {
        title: 'Fermeture des meubles frigorifiques',
        text: 'Portes vitrées sur les meubles à température positive, couvercles sur les meubles à température négative : les apports de chaleur du magasin chutent, la température des produits se stabilise et les allées froides disparaissent.',
        cee: ['BAT-EQ-124', 'BAT-EQ-125'],
        image: IMG('fermeture-de-meubles-frigorifiques-en-froid-commercial.webp'),
      },
    ]),
    etudeCta(),
    rich(
      `<h2>Froid et chaleur : un même projet</h2><p>Un groupe froid rejette à l'extérieur la chaleur extraite des meubles, augmentée de l'énergie des compresseurs. Récupérée au condenseur, cette chaleur chauffe la surface de vente ou l'eau chaude sanitaire. Régulation du froid et récupération de chaleur s'étudient ensemble : les réglages de l'une conditionnent le rendement de l'autre.</p><p><a href="/solutions/recuperation-de-chaleur/">Récupération de chaleur</a></p>`,
      'soft'
    ),
    steps('Notre méthode sur une installation de froid', [
      { title: 'Relevé', text: 'Pressions, températures, temps de fonctionnement, état des condenseurs et des meubles.' },
      { title: 'Étude', text: 'Gisement par action, note de dimensionnement, calcul des kWh cumac.' },
      { title: 'Travaux', text: 'Interventions phasées pour maintenir la chaîne du froid et l’ouverture du magasin.' },
      { title: 'Suivi', text: 'Contrôle COFRAC et bilan d’économies d’énergie.' },
    ]),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre site', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    checklist('Les indicateurs que nous suivons sur un groupe froid', [
      'Températures de condensation et d’évaporation, heure par heure.',
      'Temps de fonctionnement et nombre de démarrages des compresseurs.',
      'Consommation électrique de la centrale, rapportée au mètre linéaire de meubles.',
      'Températures des produits dans les meubles positifs et négatifs.',
    ]),
    rich(`<p>Ces mesures, relevées avant et après travaux, alimentent le bilan d'économies d'énergie de l'étape 4.</p>`),
    note(CUMAC),
    faq('Questions fréquentes sur le froid commercial', [
      [
        'La haute pression flottante est-elle compatible avec mon installation ?',
        'Elle s’adapte à la plupart des centrales à condensation par air. Le relevé vérifie le détendeur, la plage de fonctionnement des compresseurs et la capacité du condenseur avant toute préconisation.',
      ],
      [
        'Faut-il fermer le magasin pendant les travaux ?',
        'Non. Les interventions sont phasées par meuble et par circuit, avec des solutions de stockage temporaire si nécessaire.',
      ],
      [
        'La fermeture des meubles réduit-elle les ventes ?',
        'Les portes vitrées maintiennent la visibilité des produits. Elles suppriment l’inconfort des allées froides et stabilisent la température des denrées.',
      ],
    ]),
    finalCta(),
  ];
}

function recup(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Solutions',
      title: 'Récupération de chaleur',
      highlight: 'Chauffer avec l’énergie que vous rejetez',
      intro:
        'Chaque groupe froid, chaque compresseur d’air, chaque process chaud rejette de la chaleur dans l’atmosphère. La récupération de chaleur capte cette énergie et la redirige vers le chauffage des locaux, l’eau chaude sanitaire ou le préchauffage d’un process. Elle réduit la consommation de la chaudière sans ajouter de combustible. Une énergie déjà payée, enfin utilisée.',
      image: IMG('recuperation-de-chaleur-sur-groupe-froid-installee-par-pexen.webp'),
      imageAlt: 'Récupération de chaleur sur groupe froid installée par PEXEN',
      metrics: [
        { value: '3 sources', label: 'groupe froid, air comprimé, process' },
        { value: '25 à 40 °C', label: 'chaleur fatale relevée par pompe à chaleur' },
        { value: '30,6 GWh cumac*', label: 'estimés sur le projet Carrefour Market' },
      ],
      parent: SOL,
      variant: 'solution',
    }),
    checklist('D’où vient la chaleur récupérable', [
      'Groupe de production de froid : la chaleur extraite des meubles et des chambres froides, augmentée de l’énergie des compresseurs, est rejetée au condenseur.',
      'Compresseur d’air : la quasi-totalité de l’électricité absorbée se transforme en chaleur.',
      'Process industriels : fumées, eaux de refroidissement, buées, eaux de lavage.',
      'Eaux grises : douches et lavages des bâtiments tertiaires.',
    ]),
    solCards(
      'Nos solutions de valorisation de la chaleur',
      [
        {
          title: 'Sur groupe de production de froid',
          text: 'Un échangeur placé en sortie de compresseur alimente un réseau d’eau chaude ou une batterie de traitement d’air. Le dimensionnement est validé par une étude datée et signée, exigée pour les CEE. Durée de vie conventionnelle : 14 ans.',
          cee: ['BAT-TH-139', 'IND-UT-117'],
          image: IMG('recuperation-de-chaleur-groupe-froid-pexen.webp'),
        },
        {
          title: 'Sur compresseur d’air',
          text: 'La chaleur du circuit d’huile ou de l’air de refroidissement préchauffe l’eau ou chauffe un atelier voisin.',
          cee: ['IND-UT-103'],
          image: IMG('drive-recuperateur-de-chaleur.webp'),
        },
        {
          title: 'Pompe à chaleur en rehausse de chaleur fatale',
          text: 'Quand la chaleur disponible est trop basse en température (25 à 40 °C), une pompe à chaleur la relève au niveau requis par le process ou le réseau de chauffage.',
          cee: ['IND-UT-137'],
          image: IMG('pompe-a-chaleur-tertiaire-pexen.webp'),
        },
        {
          title: 'Récupération instantanée sur eaux grises',
          text: 'Un échangeur sur l’évacuation des douches préchauffe l’eau froide entrante. Adapté aux établissements de santé, aux salles de sport et aux hôtels.',
          cee: ['BAT-TH-154'],
          image: IMG('installation-technique.webp'),
        },
      ],
      2
    ),
    etudeCta(),
    checklist('Où réutiliser la chaleur récupérée', [
      'Chauffage de la surface de vente ou des bureaux.',
      'Production d’eau chaude sanitaire.',
      'Préchauffage de l’air neuf.',
      'Eau de lavage et de nettoyage en industrie agroalimentaire.',
      'Préchauffage de l’eau d’appoint d’une chaudière vapeur.',
    ]),
    rich(
      `<h2>Les conditions d'un projet rentable</h2><p>Le projet tient si trois conditions sont réunies : des besoins de chaleur simultanés aux rejets, une distance courte entre source et usage, une régulation du froid qui reste prioritaire. Notre étude croise les courbes de rejet et de besoin heure par heure avant de dimensionner l'échangeur et le stockage.</p>`,
      'soft'
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre site', text: '', buttons: [contactBtn()] },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    rich(
      `<h2>Dimensionner l'échangeur et le stockage</h2><p>La puissance valorisable dépend de la température de condensation du groupe et du mode de captage. La désurchauffe capte une fraction de la chaleur à haute température, adaptée à l'eau chaude sanitaire. La condensation totale capte l'essentiel des rejets à plus basse température, adaptée au chauffage par plancher ou par batterie. Un ballon tampon lisse l'écart entre les heures de production et les heures de besoin. La régulation donne toujours la priorité à la production de froid.</p>`
    ),
    rich(
      `<h2>Comment se calcule la prime de la fiche BAT-TH-139</h2><p>Le volume de kWh cumac dépend du secteur d'activité du bâtiment, de la zone climatique, de l'usage de la chaleur et de la puissance thermique récupérée. L'étude de dimensionnement, datée et signée, fixe cette puissance : c'est la pièce que vérifie le contrôle.</p><p><a href="/expertises/financement-cee-reglementation/">Réglementation et financement CEE</a></p>`,
      'soft'
    ),
    etudeCta(),
    note(CUMAC),
    faq('Questions fréquentes sur la récupération de chaleur', [
      [
        'Quelle part du chauffage la chaleur récupérée peut-elle couvrir ?',
        'Cela dépend de la puissance du groupe froid et des besoins. Dans un supermarché, la chaleur rejetée dépasse souvent le besoin de chauffage hors grands froids.',
      ],
      [
        'Mon chauffage actuel doit-il être remplacé ?',
        'Non. L’échangeur s’installe en amont du générateur existant, qui assure l’appoint.',
      ],
      ['La récupération perturbe-t-elle la production de froid ?', 'Non : la régulation donne la priorité au froid.'],
    ]),
    finalCta(),
  ];
}

function pac(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Solutions',
      title: 'Chauffage et traitement d’air',
      highlight: 'Sortir du fioul, chauffer les grands volumes',
      intro:
        'Une pompe à chaleur tertiaire remplace une chaudière fioul ou gaz et produit 3 à 4 kWh de chaleur pour 1 kWh d’électricité. Dans les bâtiments de grande hauteur, la déstratification ramène au sol l’air chaud accumulé sous la toiture. PEXEN, installateur RGE QualiPAC, dimensionne, installe et met en service ces équipements. Pour les occupants, un confort constant ; pour l’exploitant, une facture maîtrisée.',
      image: IMG('pompe-a-chaleur-tertiaire-air-eau-installee-par-pexen.webp'),
      imageAlt: 'Pompe à chaleur tertiaire air/eau installée par PEXEN',
      metrics: [
        { value: '3 à 4 kWh', label: 'de chaleur pour 1 kWh d’électricité' },
        { value: '×3 à ×5', label: 'bonification Coup de pouce Chauffage' },
        { value: 'Jusqu’à 30 %', label: 'de chauffage en moins par déstratification (EDF)' },
      ],
      parent: SOL,
      variant: 'solution',
    }),
    rich(
      `<h2>Pompe à chaleur tertiaire : remplacer une chaudière fossile</h2><p>Depuis le 1er janvier 2026, trois fiches CEE remplacent l'ancienne BAT-TH-113. Quand la pompe à chaleur remplace une chaudière au fioul, au charbon ou au gaz hors condensation, le Coup de pouce Chauffage multiplie la prime :</p>`
    ),
    table('Technologie · Fiche CEE · Bonification Coup de pouce', ['Technologie', 'Fiche CEE', 'Bonification'], [
      ['Pompe à chaleur air/eau', 'BAT-TH-163', '×3'],
      ['Pompe à chaleur eau/eau ou eau glycolée/eau', 'BAT-TH-164', '×4'],
      ['Système géothermique', 'BAT-TH-162', '×5'],
    ]),
    rich(
      `<h3>Les exigences de performance</h3><p>Pompe à chaleur jusqu'à 400 kW : efficacité saisonnière ≥ 111 % en moyenne et haute température, ≥ 126 % en basse température. Au-delà de 400 kW : COP ≥ 3,4 en air/eau, ≥ 4 en eau glycolée/eau, ≥ 4,5 en eau/eau. Nos notes de dimensionnement justifient chaque valeur.</p><h3>Un dimensionnement sur les besoins réels</h3><p>Nous partons des consommations de l'ancienne chaudière, des températures de départ du réseau et des émetteurs en place. Une pompe à chaleur surdimensionnée multiplie les cycles courts ; sous-dimensionnée, elle sollicite l'appoint.</p>`,
      'soft'
    ),
    rich(
      `<h2>Déstratification d'air des bâtiments de grande hauteur</h2><p>Dans un local de plus de 4 mètres sous plafond, la température gagne environ 1,5 °C par mètre de hauteur (EDF). Le chauffage réchauffe la toiture plutôt que la zone occupée. Des déstratificateurs renvoient l'air chaud vers le sol : jusqu'à 30 % d'économies sur le coût du chauffage selon EDF, pour un coût de 3 à 8 € par m².</p><p>Fiches CEE : BAT-TH-142 (tertiaire) · IND-BA-110 (industrie) · durée de vie conventionnelle : 15 ans.</p>`
    ),
    etudeCta(),
    rich(
      `<h2>Chaufferies industrielles : brûleur micro-modulant</h2><p>Sur une chaudière vapeur ou eau chaude industrielle, un brûleur micro-modulant ajuste en continu la puissance à la demande et limite les cycles marche-arrêt.</p><p>Fiche CEE : IND-UT-105</p>`,
      'soft'
    ),
    steps('Remplacer une chaudière fioul : les étapes', [
      { title: 'Relevé', text: 'Consommation des trois dernières années, puissance installée, températures de départ, émetteurs.' },
      { title: 'Choix de la technologie', text: 'Air/eau, eau/eau ou géothermie selon le site et le niveau de bonification visé.' },
      { title: 'Dossier CEE', text: 'Engagement du dossier CEE avant la signature du devis.' },
      { title: 'Dépose', text: 'Dépose de la chaudière et neutralisation ou dépose de la cuve.' },
      { title: 'Pose', text: 'Raccordement hydraulique, régulation et mise en service.' },
      { title: 'Suivi', text: 'Suivi de la première saison de chauffe.' },
    ]),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Traitement d'air des surfaces de vente et des ateliers</h2><p>Les centrales de traitement d'air consomment pour chauffer, refroidir et déplacer l'air. La variation électronique de vitesse des ventilateurs (BAT-TH-112) et un pilotage par la GTB ajustent les débits à l'occupation réelle.</p><p><a href="/solutions/gtb-tertiaire-gtc/">Pilotage GTB / GTC</a></p>`,
      'soft'
    ),
    rich(
      `<h2>Réalisations en chauffage et traitement d'air</h2><ul><li><a href="/realisations/">Intermarché · Bourgogne-Franche-Comté</a> : Pompe à chaleur air/eau en remplacement de deux chaudières fioul, déstratification. 14,8 GWh cumac estimés*</li><li><a href="/realisations/">CEDIM · Centre-Val de Loire</a> : Déstratification d'air d'un magasin chauffé par aérothermes gaz. 2,1 GWh cumac estimés*</li></ul>`
    ),
    note(CUMAC),
    faq('Questions fréquentes sur la pompe à chaleur tertiaire', [
      [
        'Une pompe à chaleur suffit-elle par grand froid ?',
        'Le dimensionnement intègre la température de base de votre zone climatique. Un appoint est prévu quand il est économiquement justifié.',
      ],
      [
        'Puis-je garder mes radiateurs ?',
        'Oui si la température de départ nécessaire reste compatible avec la pompe à chaleur. Le relevé de l’étape 1 le vérifie émetteur par émetteur.',
      ],
      [
        'La déstratification est-elle utile en été ?',
        'Les déstratificateurs brassent l’air et améliorent le confort ressenti. Ils sont déconseillés en atmosphère poussiéreuse ou polluée.',
      ],
      [
        'Quelle bonification CEE pour remplacer une chaudière fioul ?',
        'Le Coup de pouce Chauffage multiplie les kWh cumac par 3 pour une pompe à chaleur air/eau, par 4 pour une eau/eau et par 5 pour une géothermie, à condition de déposer l’équipement fossile.',
      ],
    ]),
    finalCta(),
  ];
}

function gtb(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Solutions',
      title: 'Pilotage GTB / GTC',
      highlight: 'Piloter vos consommations, respecter le décret BACS',
      intro:
        'Une GTB tertiaire (gestion technique du bâtiment) commande le chauffage, la climatisation, la ventilation, l’éclairage et la production de froid selon l’occupation et la météo. L’ADEME estime les gains entre 15 et 30 % sur les consommations pilotées. Depuis le décret BACS, elle devient une obligation pour une grande partie du parc tertiaire. Elle rend aux équipes techniques la visibilité sur ce que consomme chaque zone, heure par heure.',
      image: IMG('pilotage-gtb-decret-bacs-pexen.webp'),
      imageAlt: 'Supervision d’une GTB tertiaire par PEXEN',
      metrics: [
        { value: '15 à 30 %', label: 'd’économies sur les consommations pilotées (ADEME)' },
        { value: '290 kW', label: 'GTB obligatoire depuis le 1er janvier 2025' },
        { value: '70 kW', label: 'seuil au 1er janvier 2030' },
      ],
      parent: SOL,
      variant: 'solution',
    }),
    table('Le décret BACS : qui est concerné et quand', ['Bâtiment tertiaire', 'Échéance'], [
      ['Chauffage ou climatisation > 290 kW', 'Depuis le 1er janvier 2025'],
      ['Chauffage ou climatisation entre 70 et 290 kW (existant)', '1er janvier 2030'],
      ['Bâtiment neuf > 70 kW', 'Dès la construction'],
    ]),
    rich(
      `<p>Le système doit suivre, enregistrer et analyser les consommations par zone, conserver les données à l'échelle horaire et permettre l'arrêt manuel et la gestion autonome. Une dérogation est possible si le temps de retour sur investissement dépasse 10 ans, sur étude justificative.</p>`
    ),
    rich(
      `<h2>Classe A, B, C ou D : ce que change le niveau de GTB</h2><p>La norme NF EN ISO 52120-1 classe les systèmes de régulation de A (haute performance) à D (non performant). Dans un immeuble de bureaux, passer de la classe C à la classe A réduit d'environ 30 % la consommation thermique et de 13 % la consommation électrique. La fiche CEE BAT-TH-116 ne finance que les classes A et B.</p>`,
      'soft'
    ),
    etudeCta(),
    solCards(
      'Nos solutions de GTB tertiaire et de GTC',
      [
        {
          title: 'Audit de l’existant et cahier des charges',
          text: 'Inventaire des équipements, des automates et des protocoles (BACnet, Modbus, KNX), définition des scénarios de pilotage et de la classe visée.',
          cee: ['BAT-TH-116'],
          image: IMG('drive-pilotage-gtb-gtc.webp'),
        },
        {
          title: 'Installation et programmation',
          text: 'Comptage par usage, sondes, automates, supervision. Plages horaires, réduits de nuit, délestage, optimisation des relances.',
          image: IMG('pilotage-gtb-decret-bacs-pexen.webp'),
        },
        {
          title: 'Suivi des indicateurs de performance en industrie',
          text: 'Mesure des consommations par atelier ou par machine, indicateurs rapportés à la production.',
          cee: ['IND-UT-134'],
          image: IMG('efficacite-energetique-d-un-site-industriel.webp'),
        },
        {
          title: 'Exploitation des données',
          text: 'Tableaux de bord, alertes de dérive, données prêtes pour la déclaration annuelle OPERAT du décret tertiaire.',
          image: IMG('echeances-du-decret-tertiaire-et-du-decret-bacs.webp'),
        },
      ],
      2
    ),
    checklist('Ce que pilote une GTB tertiaire', [
      'Chauffage : consignes par zone, réduits de nuit et de week-end, optimisation des relances.',
      'Climatisation : consignes coordonnées avec le chauffage pour éviter les fonctionnements simultanés.',
      'Ventilation : débits selon l’occupation ou la concentration en CO2.',
      'Éclairage : horaires, détection de présence, gradation selon la lumière du jour.',
      'Froid commercial : supervision des températures et des alarmes.',
      'Eau chaude sanitaire : production et bouclage selon les besoins.',
    ]),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Après l'installation</h2><p>Une GTB perd son efficacité si personne ne l'exploite. Nous formons vos équipes techniques, ajustons les réglages à chaque changement de saison et remettons un bilan comparant les consommations avant et après mise en service.</p>`,
      'soft'
    ),
    rich(
      `<h2>Réalisation en pilotage</h2><ul><li><a href="/realisations/">Intermarché · Bourgogne-Franche-Comté</a> : GTB de classe B associée à la pompe à chaleur, à la récupération de chaleur et à la régulation du froid. 14,8 GWh cumac estimés*</li></ul>`
    ),
    note(CUMAC),
    faq('Questions fréquentes sur la GTB tertiaire', [
      [
        'Mon bâtiment est-il soumis au décret BACS ?',
        'Additionnez la puissance nominale de vos systèmes de chauffage ou de climatisation. Au-delà de 290 kW, l’obligation s’applique depuis 2025 ; entre 70 et 290 kW, au 1er janvier 2030.',
      ],
      [
        'Peut-on conserver les automates existants ?',
        'Souvent oui. L’audit vérifie leur compatibilité avec une supervision ouverte avant de proposer un remplacement.',
      ],
      [
        'Quelle différence entre GTB et GTC ?',
        'La GTC centralise la commande d’un lot technique. La GTB coordonne l’ensemble des lots du bâtiment selon l’occupation, les consignes et la météo.',
      ],
      [
        'Quelle classe viser : A ou B ?',
        'La classe B suffit souvent à respecter le décret BACS et à obtenir la prime BAT-TH-116. La classe A ajoute des fonctions d’optimisation, comme l’adaptation des consignes à l’occupation réelle, et augmente le gain.',
      ],
      [
        'Combien de temps dure l’installation d’une GTB ?',
        'De quelques semaines pour un magasin à plusieurs mois pour un ensemble de bâtiments. Les automates se mettent en place sans couper le chauffage ni le froid.',
      ],
    ]),
    finalCta(),
  ];
}

function isolation(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Solutions',
      title: 'Isolation technique',
      highlight: 'Limiter les pertes de vos réseaux et de vos toitures',
      intro:
        'Une canalisation d’eau chaude ou de vapeur non isolée, une vanne nue, une toiture-terrasse sans isolant : la chaleur produite se perd avant d’atteindre son usage. L’isolation technique traite ces pertes en priorité, avec des temps de retour parmi les plus courts des travaux d’économies d’énergie. Une action discrète, durable, qui travaille chaque heure de fonctionnement.',
      image: IMG('isolation-technique-calorifugeage-pexen.webp'),
      imageAlt: 'Isolation technique d’un réseau de chauffage par PEXEN',
      metrics: [
        { value: '30 ans', label: 'durée de vie retenue pour la toiture (BAT-EN-107)' },
        { value: 'Sans arrêt', label: 'pose sur réseaux en service' },
        { value: '3 fiches CEE', label: 'BAT-EN-107, IND-UT-131, IND-UT-121' },
      ],
      parent: SOL,
      variant: 'solution',
    }),
    checklist('Où se perd la chaleur d’un site', [
      'Réseaux de distribution en chaufferie, en galerie technique ou en faux plafond.',
      'Points singuliers : vannes, brides, filtres, pompes, rarement isolés après une intervention de maintenance.',
      'Toitures-terrasses des magasins, entrepôts et ateliers de plain-pied, première surface d’échange de ces bâtiments.',
      'Ballons, échangeurs et cuves de process.',
    ]),
    solCards('Nos solutions d’isolation technique', [
      {
        title: 'Calorifugeage des réseaux et des équipements',
        text: 'Isolation des tuyauteries, ballons et parois planes ou cylindriques, avec revêtement adapté à l’ambiance (intérieur, extérieur, zone humide).',
        cee: ['IND-UT-131'],
        image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp'),
      },
      {
        title: 'Matelas isolants sur points singuliers',
        text: 'Housses taillées pour chaque pièce, démontables sans outil, qui restent en place après chaque intervention de maintenance.',
        cee: ['IND-UT-121'],
        image: IMG('matelas-isolant-demontable-isolation-technique.webp'),
      },
      {
        title: 'Isolation des toitures-terrasses',
        text: 'Isolant posé sur l’étanchéité ou sous une nouvelle étanchéité, résistance thermique conforme aux exigences de la fiche. Durée de vie conventionnelle : 30 ans.',
        cee: ['BAT-EN-107'],
        image: IMG('isolation-technique-d-une-toiture-terrasse-par-pexen.webp'),
      },
    ]),
    etudeCta(),
    rich(
      `<h2>Repérer, chiffrer, isoler</h2><p>Nous relevons chaque tronçon et chaque point singulier : diamètre, longueur, température du fluide, ambiance. Une thermographie infrarouge localise les pertes invisibles. Le chiffrage classe les actions par temps de retour, CEE déduits.</p><p><a href="/notre-approche/">Notre approche</a></p>`,
      'soft'
    ),
    rich(
      `<h2>Les réseaux à isoler en priorité</h2><p>Plus le fluide est chaud et plus la ligne fonctionne longtemps, plus l'isolation technique rapporte. Viennent d'abord la vapeur et l'eau surchauffée, puis l'eau chaude de chauffage et de process. Sur les réseaux d'eau glacée, l'isolation limite aussi la condensation et la corrosion.</p>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    checklist('Choisir l’isolant et le revêtement', [
      'Laine minérale pour les réseaux chauds et la vapeur.',
      'Mousse élastomère avec pare-vapeur continu pour les réseaux froids.',
      'Revêtement en aluminium ou en tôle à l’extérieur et dans les zones exposées aux chocs.',
      'Matelas en tissu technique pour les pièces à démonter régulièrement.',
    ]),
    checklist('Toiture-terrasse : ce que vérifie notre relevé', [
      'L’état et l’âge de l’étanchéité.',
      'La capacité du support à recevoir l’isolant.',
      'Les relevés d’acrotère et les points de traversée.',
      'Les équipements posés en toiture : condenseurs, centrales de traitement d’air, extracteurs, à déplacer ou à protéger.',
    ]),
    etudeCta(),
    rich(
      `<h2>Isolation technique et décret tertiaire</h2><p>Dans un magasin ou un entrepôt de plain-pied, la toiture représente la plus grande surface d'échange avec l'extérieur. L'isolation d'une toiture-terrasse réduit à la fois les besoins de chauffage en hiver et les apports de chaleur en été, qui pèsent sur la climatisation et sur le froid commercial. C'est une action durable : la fiche BAT-EN-107 retient une durée de vie conventionnelle de 30 ans.</p>`,
      'soft'
    ),
    rich(
      `<h2>Réalisation en isolation technique</h2><ul><li><a href="/realisations/">Carrefour Market · Île-de-France</a> : Isolation de la toiture-terrasse du magasin, associée à la régulation du froid et à la récupération de chaleur. 30,6 GWh cumac estimés*</li></ul>`
    ),
    note(CUMAC),
    faq('Questions fréquentes sur l’isolation technique', [
      [
        'Faut-il arrêter l’installation pour la calorifuger ?',
        'Non dans la plupart des cas : les isolants et matelas se posent sur des réseaux en service.',
      ],
      [
        'Le calorifugeage est-il financé par les CEE ?',
        'Oui, en industrie (IND-UT-131 / 121) et en tertiaire pour la toiture-terrasse (BAT-EN-107).',
      ],
      ['Isolez-vous aussi les réseaux d’eau glacée ?', 'Oui, avec un isolant à pare-vapeur continu.'],
    ]),
    finalCta(),
  ];
}

/* ——— Secteurs ——— */

function industrie(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Secteurs',
      title: 'Efficacité énergétique des sites industriels',
      highlight: 'Vos lignes ne s’arrêtent pas. Vos économies non plus.',
      intro:
        'Dans l’industrie, l’énergie est un coût de production et la continuité, une exigence. L’efficacité énergétique industrielle agit sur les utilités qui tournent en continu : production de froid, chaufferies, air comprimé, réseaux. PEXEN conduit les études et les travaux en coordination avec vos arrêts programmés, sans perturber les lignes.',
      image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp'),
      imageAlt: 'Chaufferie vapeur d’un site industriel, efficacité énergétique industrielle',
      metrics: [
        { value: '2,75 GWh/an', label: 'seuil de l’audit énergétique obligatoire' },
        { value: '4 ans', label: 'périodicité de l’audit réglementaire' },
        { value: 'OPQIBI 1717', label: 'audit industrie via notre bureau d’études partenaire' },
      ],
      parent: SEC,
      variant: 'sector',
    }),
    solCards(
      'Vos enjeux industriels',
      [
        {
          title: 'Le coût de l’énergie par unité produite',
          text: 'Froid process, vapeur et air comprimé tournent souvent 24 h sur 24 : chaque point de rendement gagné se répète jusqu’à 8 760 heures par an.',
        },
        {
          title: 'La continuité de production',
          text: 'Les travaux se calent sur vos arrêts techniques et se réalisent en grande partie sur des installations en service.',
        },
        {
          title: 'L’audit énergétique obligatoire',
          text: 'À partir de 2,75 GWh consommés par an, sans système de management de l’énergie certifié, un audit est exigé tous les quatre ans.',
        },
      ],
      3
    ),
    table('Nos solutions d’efficacité énergétique industrielle', ['Poste', 'Solution PEXEN', 'Fiche CEE industrie'], [
      ['Froid process', 'Haute pression flottante', 'IND-UT-116'],
      ['Froid process', 'Basse pression flottante', 'IND-UT-115'],
      ['Froid process', 'Condensation haute efficacité', 'IND-UT-113'],
      ['Moteurs, pompes, ventilateurs', 'Variation électronique de vitesse', 'IND-UT-102'],
      ['Chaleur perdue', 'Récupération sur groupe froid', 'IND-UT-117'],
      ['Chaleur perdue', 'Récupération sur compresseur d’air', 'IND-UT-103'],
      ['Chaleur perdue', 'PAC en rehausse de chaleur fatale', 'IND-UT-137'],
      ['Chaufferie', 'Brûleur micro-modulant', 'IND-UT-105'],
      ['Grande hauteur', 'Déstratification d’air', 'IND-BA-110'],
      ['Réseaux', 'Calorifugeage', 'IND-UT-131'],
      ['Réseaux', 'Matelas isolants', 'IND-UT-121'],
      ['Pilotage', 'Indicateurs de performance', 'IND-UT-134'],
    ]),
    etudeCta(),
    rich(
      `<h2>Une démarche adaptée aux contraintes industrielles</h2><p>Le relevé s'appuie sur vos données de comptage et sur des mesures ponctuelles : puissances, températures, temps de fonctionnement. L'étude classe les actions par temps de retour, CEE déduits. Les audits réglementaires sont conduits avec notre partenaire Leo Energy, qualifié OPQIBI 1717 pour l'industrie.</p><p><a href="/notre-approche/">Notre approche</a></p>`,
      'soft'
    ),
    checklist('Utilités industrielles : où se trouve le gisement', [
      'Froid process : régulation flottante, condensation haute efficacité, récupération de la chaleur rejetée.',
      'Air comprimé : fuites, pression de service, variation de vitesse, récupération de chaleur.',
      'Vapeur et eau chaude : brûleur micro-modulant, condensats, purgeurs, calorifugeage.',
      'Moteurs, pompes et ventilateurs : variation électronique de vitesse à charge variable.',
    ]),
    rich(
      `<h2>L'audit énergétique réglementaire</h2><p>Au-delà de 2,75 GWh consommés par an, l'audit énergétique devient obligatoire tous les quatre ans pour les entreprises sans système de management de l'énergie certifié. Mené avec notre partenaire Leo Energy, qualifié OPQIBI 1717 pour l'industrie, il ne s'arrête pas au rapport : chaque action recommandée est chiffrée avec sa fiche CEE et peut être réalisée par PEXEN.</p>`
    ),
    faq('Questions fréquentes sur l’efficacité énergétique industrielle', [
      [
        'Pouvez-vous intervenir pendant un arrêt technique court ?',
        'Oui. Les fournitures sont préparées en amont pour concentrer les raccordements sur la fenêtre d’arrêt.',
      ],
      [
        'Quelles actions sont les plus rapides à rentabiliser ?',
        'En général : calorifugeage des points singuliers, régulation du froid et variation de vitesse. Le relevé le confirme pour votre site.',
      ],
      [
        'Mon site est-il soumis à l’audit énergétique obligatoire ?',
        'Oui si sa consommation annuelle moyenne atteint 2,75 GWh et qu’il ne dispose pas d’un système de management de l’énergie certifié ISO 50001.',
      ],
    ]),
    finalCta(),
  ];
}

function tertiaire(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Secteurs',
      title: 'Efficacité énergétique des bâtiments tertiaires',
      highlight: 'Le décret tertiaire a une date. Votre plan d’actions aussi.',
      intro:
        'Grande distribution, bureaux, entrepôts logistiques, établissements de santé : l’efficacité énergétique tertiaire répond désormais à une trajectoire chiffrée. Le décret tertiaire impose −40 % de consommation en 2030 à tout bâtiment de 1 000 m² et plus. PEXEN traite d’abord les postes qui pèsent le plus, froid commercial, chauffage des grands volumes et pilotage, pour bâtir un plan d’actions que vous pouvez défendre devant votre direction.',
      image: IMG('efficacite-energetique-des-batiments-tertiaires.webp'),
      imageAlt: 'Supermarché accompagné par PEXEN en efficacité énergétique tertiaire',
      metrics: [
        { value: '−40 %', label: 'en 2030, puis −50 % en 2040 et −60 % en 2050' },
        { value: '1 000 m²', label: 'seuil d’assujettissement' },
        { value: '30 septembre', label: 'déclaration annuelle sur OPERAT' },
      ],
      parent: SEC,
      variant: 'sector',
    }),
    solCards(
      'Vos enjeux dans le tertiaire',
      [
        {
          title: 'Le décret tertiaire',
          text: '−40 % en 2030, −50 % en 2040, −60 % en 2050, déclaration annuelle sur OPERAT avant le 30 septembre.',
        },
        {
          title: 'Le décret BACS',
          text: 'GTB obligatoire au-delà de 290 kW depuis 2025, au-delà de 70 kW au 1er janvier 2030.',
        },
        {
          title: 'Le poids du froid et des grands volumes',
          text: 'Dans un supermarché, le froid représente 45 à 75 % des dépenses d’énergie ; dans un entrepôt ou un magasin de grande hauteur, la chaleur s’accumule sous la toiture.',
        },
      ],
      3
    ),
    solCards(
      'Nos interventions par type de bâtiment tertiaire',
      [
        {
          title: 'Grande distribution',
          text: 'Régulation haute et basse pression flottante, fermeture des meubles, récupération de chaleur sur la centrale froid, pompe à chaleur, GTB.',
          image: IMG('drive-froid-commercial-industriel.webp'),
        },
        {
          title: 'Bureaux',
          text: 'GTB de classe A ou B, pompes à chaleur, équilibrage et régulation des réseaux, isolation des toitures-terrasses.',
          image: IMG('drive-pilotage-gtb-gtc.webp'),
        },
        {
          title: 'Entrepôts et magasins de grande hauteur',
          text: 'Déstratification d’air, remplacement des aérothermes gaz, isolation de toiture.',
          image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'),
        },
        {
          title: 'Santé et hébergement',
          text: 'Production d’eau chaude sanitaire, récupération de chaleur sur eaux grises, pilotage des centrales de traitement d’air.',
          image: IMG('drive-recuperateur-de-chaleur.webp'),
        },
      ],
      2
    ),
    etudeCta(),
    rich(
      `<h2>Construire votre trajectoire décret tertiaire</h2><p>Nous partons de votre année de référence déclarée sur OPERAT, nous chiffrons l'écart avec l'objectif 2030 et nous classons les actions par gain et par temps de retour, CEE déduits. Le plan d'actions sert ensuite de base aux déclarations annuelles.</p><p><a href="/expertises/financement-cee-reglementation/">Réglementation et financement CEE</a></p>`,
      'soft'
    ),
    rich(
      `<h2>Le cas de la grande distribution</h2><p>Selon les déclarations OPERAT 2023, un supermarché de 400 à 2 500 m² consomme en moyenne 264 à 281 kWh par m² et par an. L'écart vient des rayons froids : environ 979 kWh/m²/an pour un rayon réfrigéré, contre 45 à 72 kWh/m²/an pour un rayon sec. Notre ordre d'intervention suit ce constat : régulation du froid, fermeture des meubles, récupération de chaleur, puis chauffage et pilotage.</p>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Propriétaires et exploitants : qui décide quoi</h2><p>Le décret tertiaire engage le propriétaire et l'occupant. Les équipements de l'exploitant, comme le froid commercial, relèvent souvent du locataire ; l'enveloppe et la chaufferie, du propriétaire. Nous construisons un plan d'actions qui sépare clairement les deux périmètres, pour que chacun déclare ses consommations et finance ses travaux.</p>`,
      'soft'
    ),
    rich(
      `<h2>Réalisations dans le tertiaire</h2><ul><li><a href="/realisations/">Intermarché · Bourgogne-Franche-Comté</a> : 14,8 GWh cumac estimés*</li><li><a href="/realisations/">Carrefour Market · Île-de-France</a> : 30,6 GWh cumac estimés* · objectif contractuel −40 %</li><li><a href="/realisations/">CEDIM · Centre-Val de Loire</a> : 2,1 GWh cumac estimés*</li></ul>`
    ),
    note(CUMAC),
    faq('Questions fréquentes sur l’efficacité énergétique tertiaire', [
      [
        'Qui est responsable du décret tertiaire : le propriétaire ou le locataire ?',
        'Les deux. Ils se répartissent les actions selon le bail et déclarent sur OPERAT pour la part qui les concerne.',
      ],
      [
        'Que faire si mon année de référence est mal renseignée ?',
        'Elle peut être corrigée sur OPERAT. Nous vérifions sa cohérence avec vos factures avant de bâtir la trajectoire.',
      ],
      [
        'Les travaux de froid commercial comptent-ils pour le décret tertiaire ?',
        'Oui. Le décret porte sur toutes les consommations d’énergie finale du bâtiment, froid alimentaire compris.',
      ],
      [
        'Mon magasin est-il soumis au décret BACS ?',
        'Oui si la puissance nominale cumulée de ses systèmes de chauffage ou de climatisation dépasse 290 kW, et à partir de 2030 au-delà de 70 kW.',
      ],
      [
        'Par quelles actions commencer dans un immeuble de bureaux ?',
        'Le pilotage d’abord : horaires, consignes et réduits de nuit. Viennent ensuite la production de chaleur et de froid, puis l’enveloppe.',
      ],
    ]),
    finalCta(),
  ];
}

function collectifs(): CmsBlock[] {
  return [
    hero({
      eyebrow: 'Secteurs',
      title: 'Performance énergétique des bâtiments collectifs',
      highlight: 'Des charges maîtrisées, un confort tenu, un dossier prêt pour la décision.',
      intro:
        'Bailleurs sociaux, syndics et gestionnaires de copropriété : la rénovation énergétique copropriété et logement social agit sur deux choses que les occupants ressentent chaque hiver, leurs charges et leur confort. PEXEN modernise les chaufferies collectives, remplace le fioul par des pompes à chaleur, équilibre les réseaux et monte les dossiers CEE, dont la rénovation globale BAR-TH-177.',
      image: IMG('chaufferie-de-batiments-collectifs-modernisee-par-pexen.webp'),
      imageAlt: 'Chaufferie collective, rénovation énergétique copropriété',
      metrics: [
        { value: '15 ans', label: 'âge à partir duquel un plan pluriannuel de travaux est requis' },
        { value: 'RGE QualiPAC', label: 'installateur de pompes à chaleur collectives' },
        { value: '1 dossier', label: 'prêt pour l’assemblée générale' },
      ],
      parent: SEC,
      variant: 'sector',
    }),
    solCards(
      'Vos enjeux de bailleur ou de syndic',
      [
        {
          title: 'Les charges des occupants',
          text: 'Le chauffage et l’eau chaude collectifs constituent le premier poste de charges récupérables.',
        },
        {
          title: 'Des chaufferies vieillissantes',
          text: 'Chaudières fioul ou gaz hors condensation, réseaux non isolés, régulation figée : les rendements chutent.',
        },
        {
          title: 'Une décision collective',
          text: 'Un projet de copropriété se vote en assemblée générale : il exige un dossier technique et financier lisible.',
        },
      ],
      3
    ),
    solCards(
      'Nos solutions pour la rénovation énergétique copropriété',
      [
        {
          title: 'Sortie du fioul et du gaz',
          text: 'Pompes à chaleur collectives et géothermie, bonifiées par le Coup de pouce Chauffage en cas de dépose d’une chaudière fossile. PEXEN est installateur RGE QualiPAC.',
          cee: ['BAT-TH-163', 'BAT-TH-164', 'BAT-TH-162'],
          image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
        },
        {
          title: 'Équilibrage et régulation des réseaux',
          text: 'Réglage des organes d’équilibrage d’une installation de chauffage à eau chaude : les logements éloignés de la chaufferie atteignent la consigne sans surchauffer les autres.',
          cee: ['BAR-SE-104'],
          image: IMG('batiments-collectifs-chaufferie-pexen.webp'),
        },
        {
          title: 'Isolation technique en chaufferie',
          text: 'Calorifugeage des réseaux et matelas isolants sur vannes et échangeurs.',
          cee: ['IND-UT-131', 'IND-UT-121'],
          image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp'),
        },
        {
          title: 'Rénovation globale',
          text: 'Audit, bouquet de travaux et financement par la fiche BAR-TH-177, avec une bonification Coup de pouce « Rénovation performante d’un bâtiment résidentiel collectif » prolongée jusqu’au 31 décembre 2030.',
          cee: ['BAR-TH-177'],
          image: IMG('drive-secteur-renovation-globale-collectif.webp'),
        },
      ],
      2
    ),
    etudeCta(),
    rich(
      `<h2>Un dossier prêt pour l'assemblée générale</h2><p>Nous remettons un dossier lisible par le conseil syndical ou la direction du patrimoine : état des lieux, scénarios chiffrés, montant des CEE, reste à charge par lot ou par logement, calendrier des travaux en site occupé.</p>`,
      'soft'
    ),
    rich(
      `<h2>Les obligations des copropriétés</h2><p>Depuis la loi Climat et résilience, les copropriétés de plus de 15 ans doivent disposer d'un projet de plan pluriannuel de travaux, et les immeubles en monopropriété ou en copropriété d'un diagnostic de performance énergétique collectif. Le calendrier s'est appliqué par taille de copropriété : de 2023 à 2025 pour le plan pluriannuel, de 2024 à 2026 pour le DPE collectif. Depuis le 1er janvier 2026, toutes les copropriétés sont concernées. Ces documents chiffrent les travaux ; notre étude les traduit en scénarios finançables.</p>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    steps('Sortir du fioul en chaufferie collective', [
      { title: 'Relevé', text: 'Consommations, puissance installée et températures de départ.' },
      { title: 'Scénarios', text: 'Pompe à chaleur seule, hybride avec appoint, géothermie.' },
      { title: 'Dossier', text: 'Assemblée générale ou comité d’engagement, avec le montant des CEE.' },
      { title: 'Travaux', text: 'Hors saison de chauffe ou avec production provisoire.' },
      { title: 'Suivi', text: 'Réglage, équilibrage et suivi de la première saison.' },
    ]),
    rich(
      `<h2>Bailleurs, syndics, gestionnaires : un dossier adapté à chacun</h2><p>Pour un bailleur social, nous raisonnons à l'échelle du patrimoine et du programme pluriannuel. Pour un syndic, nous préparons les éléments que le conseil syndical présentera aux copropriétaires. Pour un gestionnaire, nous suivons les consommations après travaux et ajustons les réglages de la chaufferie.</p>`,
      'soft'
    ),
    etudeCta(),
    faq('Questions fréquentes sur la rénovation énergétique en copropriété', [
      [
        'Les travaux se font-ils en site occupé ?',
        'Oui. Le remplacement d’une production de chaleur se planifie hors saison de chauffe ou avec une solution provisoire.',
      ],
      [
        'Qui perçoit la prime CEE en copropriété ?',
        'Le syndicat des copropriétaires, maître d’ouvrage des travaux. La prime vient en déduction du coût voté.',
      ],
      [
        'Travaillez-vous avec les bailleurs sociaux ?',
        'Oui, de l’étude du patrimoine à la réalisation, avec un dossier CEE par opération.',
      ],
      [
        'Pouvez-vous intervenir sur une chaufferie au gaz ?',
        'Oui. La modernisation (régulation, équilibrage, isolation) ou le remplacement par pompe à chaleur se dimensionnent selon le site.',
      ],
    ]),
    finalCta(),
  ];
}

const snap = await updateSnapshot((s) => {
  upsert(s.pages, '/solutions/froid-commercial-industriel/', 'Froid commercial et industriel', froid(), {
    focusKeyphrase: 'froid commercial',
    seoTitle: 'Froid commercial et industriel : groupes froids | PEXEN',
    metaDescription:
      'Froid commercial et industriel : haute pression flottante, condensation, variateurs, fermeture des meubles. Jusqu’à 30 % d’électricité en moins par groupe froid.',
  });
  upsert(s.pages, '/solutions/recuperation-de-chaleur/', 'Récupération de chaleur', recup(), {
    focusKeyphrase: 'récupération de chaleur',
    seoTitle: 'Récupération de chaleur sur groupe froid et process | PEXEN',
    metaDescription:
      'Récupération de chaleur sur groupe froid, compresseur d’air et chaleur fatale industrielle : chauffez vos locaux et votre eau avec l’énergie que vous rejetez.',
  });
  upsert(s.pages, '/solutions/pompe-a-chaleur-tertiaire/', 'Chauffage et traitement d’air', pac(), {
    focusKeyphrase: 'pompe à chaleur tertiaire',
    seoTitle: 'Pompe à chaleur tertiaire et déstratification | PEXEN',
    metaDescription:
      'Pompe à chaleur tertiaire en remplacement du fioul ou du gaz, bonifiée jusqu’à ×5 par le Coup de pouce CEE, et déstratification d’air des grands volumes.',
  });
  upsert(s.pages, '/solutions/gtb-tertiaire-gtc/', 'Pilotage GTB / GTC', gtb(), {
    focusKeyphrase: 'GTB tertiaire',
    seoTitle: 'GTB tertiaire et décret BACS : classes A et B | PEXEN',
    metaDescription:
      'GTB tertiaire de classe A ou B, conformité au décret BACS (290 kW en 2025, 70 kW en 2030) et prime CEE BAT-TH-116. 15 à 30 % d’économies sur les postes pilotés.',
  });
  upsert(s.pages, '/solutions/isolation-technique/', 'Isolation technique', isolation(), {
    focusKeyphrase: 'isolation technique',
    seoTitle: 'Isolation technique : réseaux et toitures-terrasses | PEXEN',
    metaDescription:
      'Isolation technique : calorifugeage des réseaux, matelas isolants, toitures-terrasses. Étude et pose PEXEN, fiches CEE mobilisées.',
  });

  upsert(s.pages, '/secteurs/efficacite-energetique-industrielle/', 'Industrie', industrie(), {
    focusKeyphrase: 'efficacité énergétique industrielle',
    seoTitle: 'Efficacité énergétique industrielle : froid, chaleur | PEXEN',
    metaDescription:
      'Efficacité énergétique industrielle : froid process, chaleur fatale, vapeur, calorifugeage. Études et travaux sans arrêt de production, fiches CEE IND-UT.',
  });
  upsert(s.pages, '/secteurs/efficacite-energetique-tertiaire/', 'Tertiaire', tertiaire(), {
    focusKeyphrase: 'efficacité énergétique tertiaire',
    seoTitle: 'Efficacité énergétique tertiaire et décret tertiaire | PEXEN',
    metaDescription:
      'Efficacité énergétique tertiaire : grande distribution, bureaux, entrepôts, santé. Atteignez −40 % en 2030 avec le froid, la GTB et le chauffage.',
  });
  upsert(s.pages, '/secteurs/renovation-energetique-copropriete/', 'Bâtiments collectifs', collectifs(), {
    focusKeyphrase: 'rénovation énergétique',
    seoTitle: 'Rénovation énergétique des bâtiments collectifs | PEXEN',
    metaDescription:
      'Rénovation énergétique copropriété et logement social : sortie du fioul, chaufferie collective, équilibrage, dossiers CEE et AG.',
  });
});

for (const path of [
  '/solutions/froid-commercial-industriel/',
  '/solutions/recuperation-de-chaleur/',
  '/solutions/pompe-a-chaleur-tertiaire/',
  '/solutions/gtb-tertiaire-gtc/',
  '/solutions/isolation-technique/',
  '/secteurs/efficacite-energetique-industrielle/',
  '/secteurs/efficacite-energetique-tertiaire/',
  '/secteurs/renovation-energetique-copropriete/',
]) {
  const p = snap.pages.find((x) => x.path === path);
  console.log(path, p ? `${p.status} · ${p.blocks.length} blocs · ${p.seo.seoTitle}` : 'MISSING');
}
await pool.end();
