/**
 * Retours Amina 2 nov. — corrections bloquantes
 * #9 CPE off · #10 CEE fiche · #11-12 Simulateur · #13 /solutions/ · #25 /secteurs/ · #36 Réalisations 1 page
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

const CUMAC =
  '* Estimation calculée selon les fiches d’opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
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

function ensureRedirect(list: { from: string; to: string; permanent: boolean }[], from: string, to: string) {
  const i = list.findIndex((r) => r.from === from);
  if (i >= 0) list[i] = { from, to, permanent: true };
  else list.push({ from, to, permanent: true });
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
  return page;
}

/* ——— #10 CEE ——— */
function ceeBlocks(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Expertises',
        title: 'Réglementation et financement CEE',
        highlight: '',
        intro:
          "Trois textes encadrent la performance énergétique des sites professionnels : le décret tertiaire, le décret BACS et l'obligation d'audit énergétique. Un dispositif les finance en partie : les certificats d'économies d'énergie. Le financement CEE n'est pas une fin en soi ; il réduit le reste à charge de travaux utiles. Notre rôle : transformer une obligation en plan d'actions financé, chiffré et défendable devant votre direction.",
        image: IMG('echeances-du-decret-tertiaire-et-du-decret-bacs.webp'),
        imageAlt: 'Échéances du décret tertiaire et du décret BACS',
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: '−40 %', label: 'en 2030, tertiaire dès 1 000 m²' },
          { id: uid('m'), value: '290 kW', label: 'GTB obligatoire depuis 2025' },
          { id: uid('m'), value: '2,75 GWh/an', label: "seuil de l'audit obligatoire" },
        ],
        parentLabel: 'Expertises',
        parentLink: '/expertises/',
        heroVariant: 'expertise',
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Décret tertiaire : −40 % en 2030</h2><p>Tout bâtiment, partie de bâtiment ou ensemble de bâtiments accueillant des activités tertiaires sur 1 000 m² ou plus doit réduire sa consommation d'énergie finale de 40 % en 2030, 50 % en 2040 et 60 % en 2050, par rapport à une année de référence comprise entre 2010 et 2019, ou atteindre un seuil en valeur absolue. Les consommations se déclarent chaque année sur la plateforme <a href="https://operat.ademe.fr/" target="_blank" rel="noopener noreferrer">OPERAT</a> de l'ADEME, avant le 30 septembre. Le défaut de déclaration expose à une amende administrative jusqu'à 7 500 € pour une personne morale et à une publication.</p>`
    ),
    rich(
      `<h2>Décret BACS : la GTB obligatoire</h2><p>Les bâtiments tertiaires dont le système de chauffage ou de climatisation dépasse 290 kW doivent être équipés d'un système d'automatisation et de contrôle (GTB) depuis le 1er janvier 2025. Pour les bâtiments existants entre 70 et 290 kW, l'échéance est fixée au 1er janvier 2030.</p><p><a href="/solutions/gtb-tertiaire-gtc/">Pilotage GTB / GTC</a></p>`,
      'soft'
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    rich(
      `<h2>Audit énergétique obligatoire</h2><p>Les entreprises dont la consommation annuelle moyenne d'énergie atteint 2,75 GWh, et qui ne disposent pas d'un système de management de l'énergie certifié, réalisent un audit énergétique tous les quatre ans. Nos audits sont conduits avec notre bureau d'études partenaire Leo Energy, qualifié OPQIBI 1905 (tertiaire et habitat collectif) et 1717 (industrie).</p>`
    ),
    rich(
      `<h2>Le financement CEE : principe et calendrier</h2><p>Les fournisseurs d'énergie, dits obligés, financent des économies d'énergie chez leurs clients. Chaque opération standardisée génère un volume de kWh cumac, c'est-à-dire des kWh économisés cumulés et actualisés sur la durée de vie conventionnelle de l'équipement. La 6e période (2026-2030) fixe une obligation de 1 050 TWh cumac par an, en hausse de 27 %, avec des contrôles renforcés.</p>`
    ),
    b(
      'cards',
      {
        eyebrow: '',
        title: '',
        intro: '',
        columns: 3,
        style: 'minimal',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Trois règles pour sécuriser votre prime',
            text: "Engager le dossier CEE avant la signature du devis : un devis signé avant l'engagement fait perdre la prime. Respecter les critères techniques de la fiche, justifiés par une note de dimensionnement datée et signée. Conserver les pièces exigées au contrôle par un organisme accrédité COFRAC.",
            tags: [],
          },
          {
            id: uid('c'),
            title: 'Les bonifications',
            text: "Coup de pouce Chauffage : ×3 pour une pompe à chaleur air/eau, ×4 eau/eau, ×5 géothermie en remplacement d'une chaudière fossile. Contrat de performance énergétique : bonification des fiches lorsque l'économie est garantie contractuellement.",
            tags: [],
          },
          {
            id: uid('c'),
            title: 'Notre rôle',
            text: 'PEXEN calcule les kWh cumac dès l’étude, monte et valorise les dossiers en direct ou avec ses délégataires et mandataires partenaires, et prépare les pièces du contrôle.',
            tags: [],
          },
        ],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    b(
      'table',
      {
        eyebrow: 'Catalogue',
        title: 'Les fiches CEE que nous mobilisons',
        intro: 'Opérations standardisées tertiaire et industrie que PEXEN engage sur ses chantiers.',
        searchable: true,
        columns: ['Domaine', 'Solution', 'Fiche tertiaire / résidentiel', 'Fiche industrie', 'Statut'],
        rows: [
          ['Froid commercial et industriel', 'Haute pression flottante', 'BAT-TH-134', 'IND-UT-116', 'En vigueur'],
          ['Froid commercial et industriel', 'Basse pression flottante', 'BAT-TH-145', 'IND-UT-115', 'En vigueur'],
          ['Froid commercial et industriel', 'Condensation frigorifique haute efficacité', 'BAT-EQ-130', 'IND-UT-113', 'En vigueur'],
          ['Froid commercial et industriel', 'Variation électronique de vitesse', 'BAT-TH-112', 'IND-UT-102', 'En vigueur'],
          ['Froid commercial et industriel', 'Fermeture des meubles frigorifiques (positif)', 'BAT-EQ-124', 'aucune', 'En vigueur'],
          ['Froid commercial et industriel', 'Fermeture des meubles frigorifiques (négatif)', 'BAT-EQ-125', 'aucune', 'En vigueur'],
          ['Récupération de chaleur', 'Récupération de chaleur sur groupe de production de froid', 'BAT-TH-139', 'IND-UT-117', 'En vigueur'],
          ['Récupération de chaleur', "Récupération de chaleur sur compresseur d'air", 'aucune', 'IND-UT-103', 'En vigueur'],
          ['Récupération de chaleur', 'Pompe à chaleur en rehausse de chaleur fatale', 'aucune', 'IND-UT-137', 'En vigueur'],
          ['Récupération de chaleur', 'Récupération instantanée de chaleur sur eaux grises', 'BAT-TH-154', 'aucune', 'En vigueur'],
          ['Chauffage et traitement d’air', 'Pompe à chaleur air/eau (Coup de pouce ×3)', 'BAT-TH-163', 'aucune', 'En vigueur depuis le 1er janvier 2026'],
          ['Chauffage et traitement d’air', 'Pompe à chaleur eau/eau ou eau glycolée/eau (Coup de pouce ×4)', 'BAT-TH-164', 'aucune', 'En vigueur depuis le 1er janvier 2026'],
          ['Chauffage et traitement d’air', 'Système géothermique (Coup de pouce ×5)', 'BAT-TH-162', 'aucune', 'En vigueur depuis le 1er janvier 2026'],
          ['Chauffage et traitement d’air', "Déstratification d'air", 'BAT-TH-142', 'IND-BA-110', 'En vigueur'],
          ['Chauffage et traitement d’air', 'Brûleur micro-modulant sur chaudière industrielle', 'aucune', 'IND-UT-105', 'En vigueur'],
          ['Pilotage GTB / GTC', 'Système de gestion technique du bâtiment (classe A ou B)', 'BAT-TH-116', 'aucune', 'En vigueur'],
          ['Pilotage GTB / GTC', 'Mesure des indicateurs de performance énergétique', 'aucune', 'IND-UT-134', 'En vigueur'],
          ['Isolation technique', 'Isolation des toitures-terrasses', 'BAT-EN-107', 'aucune', 'En vigueur'],
          ['Isolation technique', 'Isolation des parois planes ou cylindriques (calorifugeage)', 'aucune', 'IND-UT-131', 'En vigueur'],
          ['Isolation technique', "Isolation des points singuliers d'un réseau (matelas isolants)", 'aucune', 'IND-UT-121', 'En vigueur'],
          ['Résidentiel collectif', "Rénovation globale d'un bâtiment résidentiel collectif", 'BAR-TH-177', 'aucune', 'En vigueur · Coup de pouce jusqu’au 31 décembre 2030'],
          ['Résidentiel collectif', "Réglage des organes d'équilibrage d'une installation de chauffage", 'BAR-SE-104', 'aucune', 'En vigueur'],
        ].map((cells) => ({ id: uid('r'), cells })),
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    rich(
      `<p><a href="https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie" target="_blank" rel="noopener noreferrer">Catalogue officiel des opérations standardisées</a></p>`
    ),
    rich(
      `<h2>Obligés, délégataires, mandataires : qui fait quoi</h2><p>L'obligé (fournisseur d'énergie) ou son délégataire achète les certificats et verse la prime. Le mandataire monte et dépose le dossier pour le compte du bénéficiaire. PEXEN, en tant qu'entreprise de travaux et d'ingénierie, prépare les pièces techniques et coordonne l'ensemble pour que vous n'ayez qu'un interlocuteur.</p>`,
      'soft'
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    checklist('Les pièces d’un dossier CEE', [
      'Le devis et la facture, avec les mentions exigées par la fiche.',
      "L'attestation sur l'honneur signée par le bénéficiaire.",
      'La note de dimensionnement datée et signée, quand la fiche l’exige.',
      "Les justificatifs de qualification de l'entreprise, pour les fiches qui en demandent une.",
      "Le rapport de contrôle de l'organisme accrédité COFRAC.",
    ]),
    faq('Questions fréquentes sur le financement CEE', [
      [
        'Quel montant de prime CEE puis-je obtenir ?',
        "Il dépend du volume de kWh cumac de l'opération et du prix du marché au moment de l'engagement. Nous le chiffrons à l'étape 2, avant toute signature.",
      ],
      [
        "Les CEE sont-ils cumulables avec d'autres aides ?",
        'Souvent, selon les règles propres à chaque aide. Nous vérifions les cumuls possibles projet par projet.',
      ],
      [
        'Que se passe-t-il lors du contrôle ?',
        "Un organisme accrédité COFRAC vérifie sur site la conformité de l'opération à la fiche. Nos dossiers sont constitués pour ce contrôle dès l'engagement.",
      ],
    ]),
    finalCta(),
  ];
}

/* ——— #13 /solutions/ ——— */
function solutionsLanding(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Solutions',
        title: "Nos solutions d'ingénierie énergétique",
        highlight: '',
        intro:
          "L'ingénierie énergétique de PEXEN couvre les cinq postes qui concentrent les consommations d'un site professionnel : la production de froid, la chaleur perdue, le chauffage des grands volumes, le pilotage et les pertes thermiques. Chaque expertise associe une étude chiffrée, des travaux réalisés par nos équipes et un suivi des résultats.",
        image: IMG('performance-energetique.webp'),
        imageAlt: 'Ingénierie énergétique PEXEN',
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: 'Jusqu’à 30 %', label: 'par groupe froid (haute pression flottante)' },
          { id: uid('m'), value: '15 à 30 %', label: 'sur les consommations pilotées par GTB (ADEME)' },
          { id: uid('m'), value: '3 à 4 kWh', label: 'de chaleur par kWh électrique (PAC)' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Solutions',
        title: 'Cinq solutions, un seul interlocuteur',
        intro: '',
        columns: 3,
        style: 'hoverDark',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Froid commercial et industriel',
            text: "Haute et basse pression flottante, condensation haute efficacité, variation électronique de vitesse, fermeture des meubles frigorifiques. Dans un supermarché, le froid représente 45 à 75 % des dépenses d'énergie : c'est le premier gisement.",
            image: IMG('centrale-froid.webp'),
            imageAlt: 'Ingénierie énergétique du froid commercial',
            tags: [],
            link: '/solutions/froid-commercial-industriel/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            title: 'Récupération de chaleur',
            text: "Un groupe froid rejette en continu la chaleur extraite des meubles et des chambres froides. Récupérée, elle chauffe la surface de vente, l'eau chaude sanitaire ou un process.",
            image: IMG('drive-recuperateur-de-chaleur.webp'),
            imageAlt: 'Récupération de chaleur sur groupe froid',
            tags: [],
            link: '/solutions/recuperation-de-chaleur/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            title: 'Chauffage et traitement d’air',
            text: "Pompes à chaleur air/eau, eau/eau et géothermie en remplacement du fioul ou du gaz, déstratification des volumes de plus de 4 mètres sous plafond.",
            image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
            imageAlt: 'Pompe à chaleur tertiaire',
            tags: [],
            link: '/solutions/pompe-a-chaleur-tertiaire/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            title: 'Pilotage GTB / GTC',
            text: 'Gestion technique du bâtiment de classe A ou B selon la norme NF EN ISO 52120-1, conformité au décret BACS, suivi des indicateurs de performance.',
            image: IMG('pilotage-gtb-decret-bacs-pexen.webp'),
            imageAlt: 'GTB tertiaire',
            tags: [],
            link: '/solutions/gtb-tertiaire-gtc/',
            linkLabel: 'Découvrir la solution',
          },
          {
            id: uid('c'),
            title: 'Isolation technique',
            text: 'Isolation des toitures-terrasses, calorifugeage des réseaux, matelas isolants sur vannes et points singuliers.',
            image: IMG('isolation-technique-calorifugeage-pexen.webp'),
            imageAlt: 'Isolation technique des réseaux',
            tags: [],
            link: '/solutions/isolation-technique/',
            linkLabel: 'Découvrir la solution',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    rich(
      `<h2>Une ingénierie énergétique financée par les CEE</h2><p>Chaque solution correspond à une ou plusieurs fiches d'opérations standardisées des certificats d'économies d'énergie (CEE). Nous calculons le volume de kWh cumac dès l'étude, nous engageons le dossier avant la signature du devis et nous préparons les pièces exigées au contrôle. Les fiches mobilisées sont publiées sur le site du ministère de la Transition écologique.</p><p><a href="/expertises/financement-cee-reglementation/">Réglementation et financement CEE</a></p>`,
      'soft'
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    rich(
      `<h2>De l'audit à la mesure des économies</h2><p>Prévisite et audit, dimensionnement et ingénierie technico-financière, installation et mise en service, puis contrôle COFRAC et suivi des performances : quatre étapes, un livrable à chacune. Les travaux se déroulent en site ouvert, en coordination avec votre exploitation.</p><p><a href="/notre-approche/">Notre approche</a></p>`
    ),
    checklist('Par où commencer selon votre site', [
      'Supermarché : régulation du froid, fermeture des meubles, récupération de chaleur sur la centrale froid.',
      'Bureaux : GTB de classe A ou B, pompe à chaleur, équilibrage des réseaux.',
      'Entrepôt ou magasin de grande hauteur : déstratification d’air, isolation de la toiture-terrasse.',
      'Site industriel : froid process, air comprimé, chaufferie vapeur, calorifugeage des réseaux.',
      'Résidence collective : chaufferie, sortie du fioul, équilibrage, rénovation globale.',
    ]),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    checklist(
      'Ce que contient chaque étude PEXEN',
      [
        "L'état initial : équipements, consommations, temps de fonctionnement.",
        'Le gisement par action, en kWh et en euros par an.',
        'Le coût des travaux et le montant estimé des CEE.',
        'Le temps de retour, CEE déduits.',
        "Le planning d'intervention et les contraintes d'exploitation.",
      ],
      'soft'
    ),
    checklist('Les repères qui guident nos priorités', [
      "45 à 75 % : part du froid alimentaire dans les dépenses d'énergie d'un supermarché (Perifem).",
      "Jusqu'à 30 % : économie sur la consommation d'un groupe froid ancien avec une haute pression flottante.",
      '15 à 30 % : économie sur les consommations pilotées par une GTB (ADEME).',
      "Jusqu'à 30 % : économie sur le coût du chauffage d'un local de grande hauteur déstratifié (EDF).",
      "3 à 4 kWh de chaleur produits par une pompe à chaleur pour 1 kWh d'électricité consommé.",
    ]),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    faq('Questions fréquentes', [
      [
        'Pouvez-vous combiner plusieurs solutions sur un même site ?',
        'Oui. Sur un supermarché, nous associons souvent régulation du froid, récupération de chaleur, fermeture des meubles et GTB. Les gains se cumulent et le dossier CEE regroupe les fiches.',
      ],
      [
        'Intervenez-vous sur des installations récentes ?',
        "Oui. Une installation récente peut fonctionner avec une régulation figée ou des réglages d'usine. Le relevé de l'étape 1 indique le potentiel avant tout engagement.",
      ],
      [
        'Où intervenez-vous ?',
        "Partout en France métropolitaine, depuis notre siège d'Aubervilliers (Seine-Saint-Denis).",
      ],
      [
        'Quelle solution rapporte le plus vite ?',
        "Sur un supermarché, la régulation du froid et la fermeture des meubles. Sur un entrepôt chauffé au gaz, la déstratification. Sur un réseau de vapeur, le calorifugeage des points singuliers. Le relevé de l'étape 1 classe les actions de votre site par temps de retour.",
      ],
      [
        'Réalisez-vous les travaux vous-mêmes ?',
        'Oui. PEXEN dimensionne, installe et met en service, avec ses équipes et des partenaires qualifiés, puis suit les consommations après travaux.',
      ],
    ]),
    finalCta(),
  ];
}

/* ——— #36 Réalisations 1 page ——— */
function refCard(opts: {
  id: string;
  title: string;
  meta: string;
  enjeu: string;
  result: string;
  image: string;
  imageAlt: string;
}): string {
  return `<a id="${opts.id}" class="px-ultra-case-card" href="/realisations/#${opts.id}">
    <div class="px-ultra-case-card__media"><img src="${opts.image}" alt="${opts.imageAlt}" loading="lazy" width="640" height="400" /></div>
    <div class="px-ultra-case-card__body">
      <p class="px-ultra-case-card__meta">${opts.meta}</p>
      <h3 class="px-ultra-case-card__title">${opts.title}</h3>
      <p class="px-ultra-case-card__enjeu">${opts.enjeu}</p>
      <p class="px-ultra-case-card__result">${opts.result}</p>
      <span class="px-ultra-case-card__cta">Voir le projet <span aria-hidden="true">→</span></span>
    </div>
  </a>`;
}

function refArticle(opts: {
  id: string;
  title: string;
  meta: string;
  image: string;
  imageAlt: string;
  body: string;
  result?: string;
  flip?: boolean;
}): string {
  const result = opts.result ? `<p class="px-ultra-ref__result"><strong>${opts.result}</strong></p>` : '';
  return `<article id="${opts.id}" class="px-ultra-ref${opts.flip ? ' px-ultra-ref--flip' : ''}">
  <div class="px-ultra-ref__grid">
    <div class="px-ultra-ref__copy">
      <h2>${opts.title}</h2>
      <p class="px-ultra-ref__meta">${opts.meta}</p>
      ${opts.body}
      ${result}
      <p class="px-ultra-ref__open"><a href="/realisations/#${opts.id}">Découvrir l’intégralité de cette fiche projet →</a></p>
    </div>
    <div class="px-ultra-ref__media">
      <img src="${opts.image}" alt="${opts.imageAlt}" loading="lazy" width="960" height="540" />
    </div>
  </div>
</article>`;
}

function realisationsSingle(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Réalisations',
        title: 'Nos réalisations',
        highlight: '',
        intro:
          "Quatre projets d'efficacité énergétique, quatre configurations : un supermarché qui sort du fioul, une moyenne surface sous contrat de performance énergétique, un magasin de grande hauteur, un site pharmaceutique. Pour chacun : l'enjeu de départ, les solutions retenues, les fiches CEE mobilisées et l'économie d'énergie estimée.",
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
        intro: 'Filtrez par secteur.',
        layout: 'grid',
        filter: 'all',
        showFilters: true,
        limit: 0,
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    rich(
      `<div class="px-ultra-center-intro"><h2>Fiches projets</h2><p>Enjeu, solutions retenues, fiches CEE et économies d’énergie estimées — en un coup d’œil.</p></div><div class="px-ultra-case-list">${[
        refCard({
          id: 'intermarche',
          title: 'Intermarché : sortir du fioul et optimiser le froid',
          meta: 'Bourgogne-Franche-Comté · Grande distribution',
          enjeu:
            'Chaudières fioul vétustes, froid commercial énergivore. PAC air/eau, récupération de chaleur, déstratification, GTB B · BAT-TH-163, 139, 134, 116, 142 · BAT-EQ-124.',
          result: "14,8 GWh cumac d'économies d'énergie estimées* · sortie complète du fioul",
          image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
          imageAlt: 'Pompe à chaleur air/eau installée par PEXEN chez Intermarché',
        }),
        refCard({
          id: 'carrefour-market',
          title: 'Carrefour Market : froid, chaleur et toiture sous contrat de performance',
          meta: 'Île-de-France · Grande distribution',
          enjeu:
            'Centrale froid 7 compresseurs, objectif −40 % contractuel. Récupération de chaleur, HP flottante, isolation toiture · BAT-TH-139, 134 · BAT-EN-107 · BAT-EQ-124, 125.',
          result: "30,6 GWh cumac d'économies d'énergie estimées* · objectif contractuel −40 %",
          image: IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
          imageAlt: "Centrale de froid commercial chez Carrefour Market, projet d'efficacité énergétique PEXEN",
        }),
        refCard({
          id: 'cedim',
          title: 'CEDIM : ramener la chaleur au sol',
          meta: 'Centre-Val de Loire · Négoce et entrepôt',
          enjeu: 'Plus de 5 m sous plafond, aérothermes gaz. Trois déstratificateurs d’air · BAT-TH-142.',
          result: "2,1 GWh cumac d'économies d'énergie estimées*",
          image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'),
          imageAlt: "Déstratificateurs d'air installés par PEXEN chez CEDIM",
        }),
        refCard({
          id: 'colorcon',
          title: 'Colorcon : chaufferie vapeur et froid process',
          meta: 'Île-de-France · Industrie pharmaceutique',
          enjeu:
            'Utilités en continu. Récupération de chaleur, PAC, régulation froid, calorifugeage · IND-UT-137, 103, 116, 105, 131.',
          result: 'Étude d’efficacité énergétique industrielle · fiches IND-UT',
          image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp'),
          imageAlt: "Chaufferie vapeur du site Colorcon, projet d'efficacité énergétique industrielle",
        }),
      ].join('')}</div>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Comment lire nos chiffres</h2><p>Les volumes affichés sont exprimés en kWh cumac, l'unité officielle des certificats d'économies d'énergie. Ils sont calculés hors bonifications, à partir des fiches standardisées mobilisées sur chaque projet. Les économies mesurées sur les factures seront publiées au fil du suivi des consommations.</p>`,
      'soft'
    ),
    checklist('Ce que ces projets ont en commun', [
      'Un relevé sur site avant toute préconisation.',
      'Plusieurs actions combinées sur un même site, rarement une seule.',
      'Des travaux menés sans fermer le magasin ni arrêter la production.',
      'Un dossier CEE engagé avant la signature des devis.',
    ]),
    rich(`<p class="text-xs text-slate-500 px-ultra-legal-note">${CUMAC}</p>`),
    finalCta(),
  ];
}

/* ——— Expertises landing sans CPE ——— */
function expertisesLandingNoCpe(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Expertises',
        title: 'Un accompagnement adapté à votre projet',
        highlight: '',
        intro:
          "Chaque site et chaque projet répondent à des enjeux différents. PEXEN intervient selon vos besoins, mission ciblée ou accompagnement global, de l'étude au financement CEE, jusqu'au suivi des performances.",
        image: IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
        imageAlt: 'Ingénieur PEXEN sur site',
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: '3 expertises', label: "de l'étude au financement" },
          { id: uid('m'), value: '1 équipe', label: "du premier relevé au bilan d'économies" },
          { id: uid('m'), value: 'COFRAC', label: 'contrôle par un organisme accrédité' },
        ],
        heroVariant: 'expertise',
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Accompagnement',
        title: 'Trois expertises, une seule équipe',
        intro: 'Études, financement CEE et travaux : nous intervenons là où vous avez besoin de nous.',
        style: 'hoverDark',
        columns: 3,
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Études et ingénierie',
            text: 'Audit, relevés, scénarios et feuille de route pour prioriser les investissements.',
            tags: ['Audit', 'Dimensionnement'],
            link: '/expertises/bureau-etudes-fluides/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('audit-batiment.webp'),
          },
          {
            id: uid('c'),
            title: 'Accompagnement travaux',
            text: 'Planification, suivi de chantier, mise en service et documents de fin de travaux.',
            tags: ['AMO', 'Chantier'],
            link: '/expertises/assistance-maitrise-ouvrage/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('pexen-partenaire-installateur-livraison-d-equipements-sur-chantier.webp'),
          },
          {
            id: uid('c'),
            title: 'Réglementation et financement',
            text: 'Éligibilité, note de calcul, montage du dossier jusqu’au contrôle COFRAC.',
            tags: ['CEE', 'BACS', 'Tertiaire'],
            link: '/expertises/financement-cee-reglementation/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('cee-tertiaire.webp'),
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: '',
        title: 'Voir nos réalisations',
        intro: 'Intermarché, Carrefour Market, CEDIM, Colorcon : enjeux, solutions et kWh cumac estimés.',
        style: 'hoverDark',
        columns: 1,
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Nos références',
            text: 'Quatre configurations, des travaux menés sans arrêter l’exploitation.',
            tags: [],
            link: '/realisations/',
            linkLabel: 'Voir les références',
            image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
          },
        ],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq('Questions fréquentes', [
      ["Où intervenez-vous ?", "Partout en France métropolitaine, depuis notre siège d'Aubervilliers (Seine-Saint-Denis)."],
      ['Réalisez-vous les travaux vous-mêmes ?', 'Oui. PEXEN dimensionne, installe et met en service, avec ses équipes et des partenaires qualifiés, puis suit les consommations.'],
    ]),
    finalCta(),
  ];
}

const CHANTIER_301: [string, string][] = [
  ['/realisations/intermarche-trevenans/', '/realisations/intermarche-sortie-du-fioul/'],
  ['/realisations/carrefour-market/', '/realisations/carrefour-market-recuperation-de-chaleur/'],
  ['/realisations/cedim/', '/realisations/cedim-destratification/'],
  ['/realisations/colorcon-bazainville/', '/realisations/colorcon-efficacite-energetique-industrielle/'],
];

const snap = await updateSnapshot((s) => {
  /* ——— #9 CPE off ——— */
  const cpe = s.pages.find((p) => p.path === '/expertises/contrat-performance-energetique/');
  if (cpe) {
    cpe.status = 'draft';
    cpe.seo = { ...cpe.seo, noindex: true };
    cpe.updatedAt = now();
  }
  ensureRedirect(s.redirects, '/expertises/contrat-performance-energetique/', '/expertises/');
  ensureRedirect(s.redirects, '/contrat-de-performance-energetique/', '/expertises/');

  /* Strip CPE from menus */
  for (const menu of s.menus || []) {
    for (const item of menu.items || []) {
      if (item.children) {
        item.children = item.children.filter((c) => !c.path?.includes('contrat-performance'));
      }
      if (item.path?.includes('contrat-performance')) item.path = '/expertises/';
    }
  }
  /* Footer links if present on branding/settings */
  const ft = (s as { footer?: { columns?: { links?: { path?: string; label?: string }[] }[] } }).footer;
  if (ft?.columns) {
    for (const col of ft.columns) {
      if (col.links) col.links = col.links.filter((l) => !l.path?.includes('contrat-performance'));
    }
  }

  upsert(s.pages, '/expertises/', 'Expertises', expertisesLandingNoCpe(), {
    focusKeyphrase: 'expertise énergétique',
    seoTitle: 'Expertise énergétique : étude, travaux, financement | PEXEN',
    metaDescription:
      "Les expertises PEXEN : bureau d'études fluides, accompagnement travaux, réglementation et financement CEE. Une seule équipe.",
  });

  /* ——— #10 CEE ——— */
  upsert(s.pages, '/expertises/financement-cee-reglementation/', 'Réglementation et financement CEE', ceeBlocks(), {
    focusKeyphrase: 'financement CEE',
    seoTitle: 'Financement CEE, décret tertiaire et décret BACS | PEXEN',
    metaDescription:
      'Financement CEE de vos travaux, décret tertiaire (−40 % en 2030), décret BACS : obligations, échéances et liste des fiches CEE que nous mobilisons.',
  });

  /* ——— #11-12 Simulateur ——— */
  const sim = s.pages.find((p) => p.path === '/simulateur-prime-cee/');
  if (sim) {
    const header = sim.blocks.find((x) => x.type === 'pageHeader');
    if (header) {
      Object.assign(header.data, {
        eyebrow: 'Simulateur',
        title: 'Estimez le financement de votre projet',
        intro:
          'Décrivez votre site et les travaux envisagés : un premier ordre de grandeur du financement mobilisable. Il ne remplace ni la visite technique ni la note de calcul.',
        buttons: [etudeBtn(), contactBtn()],
        heroVariant: 'solution',
        breadcrumb: true,
      });
      header.style = { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' };
    }
    sim.seo.seoTitle = 'Simulateur prime CEE : estimez le financement de vos travaux | PEXEN';
    sim.seo.focusKeyphrase = 'simulateur prime CEE';
    sim.seo.metaDescription =
      'Estimez le financement CEE de vos travaux énergétiques. Ordre de grandeur indicatif, confirmé après relevé sur site par un ingénieur PEXEN.';
    sim.updatedAt = now();
  }

  /* ——— #13 /solutions/ ——— */
  upsert(s.pages, '/solutions/', 'Solutions', solutionsLanding(), {
    focusKeyphrase: 'ingénierie énergétique',
    seoTitle: 'Ingénierie énergétique : nos 5 solutions | PEXEN',
    metaDescription:
      'Ingénierie énergétique PEXEN : froid commercial et industriel, récupération de chaleur, pompes à chaleur, GTB/GTC, isolation technique. Étude, travaux, suivi.',
  });

  /* ——— #25 /secteurs/ H1 ——— */
  const sec = s.pages.find((p) => p.path === '/secteurs/');
  if (sec) {
    const header = sec.blocks.find((x) => x.type === 'pageHeader');
    if (header) {
      Object.assign(header.data, {
        title: "Nos secteurs d'intervention",
        eyebrow: 'Secteurs',
        intro:
          "L'efficacité énergétique ne se traite pas de la même manière dans une usine, un supermarché ou une résidence. PEXEN intervient sur trois secteurs, avec des solutions et des priorités propres à chacun.",
        buttons: [contactBtn(), estimBtn()],
        heroVariant: 'sector',
      });
    }
    /* Strip invented mid CTAs titled oddly if any */
    sec.blocks = sec.blocks.filter((bl) => !(bl.type === 'cta' && /Parlons de votre site|Financer votre projet/i.test(String((bl.data as { title?: string }).title || ''))));
    sec.updatedAt = now();
  }

  /* ——— #36 Réalisations ——— */
  upsert(s.pages, '/realisations/', 'Réalisations', realisationsSingle(), {
    focusKeyphrase: "projets d'efficacité énergétique",
    seoTitle: "Projets d'efficacité énergétique : 4 références | PEXEN",
    metaDescription:
      "Projets d'efficacité énergétique PEXEN : Intermarché, Carrefour Market, CEDIM, Colorcon. Solutions installées, fiches CEE et économies d'énergie estimées.",
  });

  for (const [from, to] of CHANTIER_301) {
    ensureRedirect(s.redirects, from, to);
  }
  /* Les 4 fiches canoniques restent publiées (pages dédiées). */
  for (const path of [
    '/realisations/intermarche-sortie-du-fioul/',
    '/realisations/carrefour-market-recuperation-de-chaleur/',
    '/realisations/cedim-destratification/',
    '/realisations/colorcon-efficacite-energetique-industrielle/',
  ]) {
    const page = s.pages.find((p) => p.path === path);
    if (page) {
      page.status = 'published';
      page.seo = { ...page.seo, noindex: false };
      page.updatedAt = now();
    }
    s.redirects = s.redirects.filter((r) => r.from !== path);
  }

  for (const page of s.pages) {
    const raw = JSON.stringify(page.blocks);
    let next = raw.replaceAll('/expertises/contrat-performance-energetique/', '/expertises/');
    if (next !== raw) {
      page.blocks = JSON.parse(next);
      page.updatedAt = now();
    }
  }
});

const checks = [
  '/expertises/',
  '/expertises/contrat-performance-energetique/',
  '/expertises/financement-cee-reglementation/',
  '/simulateur-prime-cee/',
  '/solutions/',
  '/secteurs/',
  '/realisations/',
];
for (const path of checks) {
  const p = snap.pages.find((x) => x.path === path);
  console.log(path, p?.status, p?.blocks?.length, p?.seo?.seoTitle?.slice(0, 50));
}
console.log(
  'redirects',
  snap.redirects
    .filter(
      (r) =>
        r.from.includes('contrat') ||
        r.from.includes('realisations/') ||
        r.to.includes('#')
    )
    .map((r) => `${r.from} → ${r.to}`)
    .join('\n')
);
const menu = snap.menus?.find((m) => m.id === 'primary');
const exp = menu?.items?.find((i) => i.path === '/expertises/');
console.log(
  'menu expertises children',
  exp?.children?.map((c) => c.label).join(' | ')
);

await pool.end();
