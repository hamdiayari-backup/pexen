/**
 * Pages du site public, textes du brief webmaster Phase 2 (ne pas reformuler).
 * Photos : visuels fournis dans dossiers-pexen.
 */
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from './blocks';
import { button, uid } from './blocks';
import { BLOCK_CATALOG } from './blockCatalog';
import type { CmsBlock, PageTemplate } from './types';

export interface BriefPage {
  path: string;
  title: string;
  template: PageTemplate;
  seoTitle: string;
  metaDescription?: string;
  noindex?: boolean;
  status?: 'published' | 'draft';
  focus?: string;
  blocks: () => CmsBlock[];
}

const IMG = {
  hero: '/images/renovation-energetique.webp',
  inter: '/images/pompes-a-chaleur-toiture.webp',
  carrefour: '/images/installation-technique.webp',
  cedim: '/images/climatisation-toiture.webp',
  colorcon: '/images/centrale-froid.webp',
  coucher: '/images/audit-batiment.webp',
  eolien: '/images/performance-energetique.webp',
  solaires: '/images/cee-tertiaire.webp',
  transition: '/images/sobriete-energetique.webp',
  renouvelable: '/images/professionnel-pac.webp',
  audit: '/images/audit-energetique-entreprise.webp',
};

const MENTION =
  '* Estimation calculée selon les fiches d\'opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (label = 'Parler de votre projet'): ButtonData => button(label, '/contact/');
const phoneBtn = (): ButtonData => button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone');

const finalCta = () =>
  b(
    'cta',
    {
      variant: 'image',
      layout: 'centered',
      title: 'Un projet ? Parlons-en.',
      text: 'Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.',
      buttons: [contactBtn(), phoneBtn()],
      backgroundImage: IMG.coucher,
    },
    { background: 'navy' }
  );

const faq = (title: string, items: [string, string][]) =>
  b('faq', {
    title,
    layout: 'stacked',
    showContactCard: false,
    items: items.map(([question, answer]) => ({ id: uid('q'), question, answer })),
  });

const cards = (
  title: string,
  intro: string | undefined,
  items: { title: string; text: string; link?: string; linkLabel?: string; image?: string; icon?: string }[],
  columns: 2 | 3 | 4 = 3,
  style: 'card' | 'image' | 'minimal' | 'hoverDark' | 'numbered' = 'card',
  sectionStyle: Partial<BlockStyle> = {}
) =>
  b(
    'cards',
    {
      title,
      intro,
      style,
      columns,
      items: items.map((it) => ({
        id: uid('c'),
        title: it.title,
        text: it.text,
        tags: [],
        link: it.link,
        linkLabel: it.linkLabel,
        image: it.image,
        icon: it.icon,
      })),
    },
    sectionStyle
  );

function home(): CmsBlock[] {
  return [
    b(
      'hero',
      {
        layout: 'split',
        title: 'Réduisez durablement la facture énergétique de vos',
        rotatingWords: ['sites.', 'groupes froids.', 'chaufferies.', 'process industriels.'],
        subtitle:
          'Des groupes froids qui protègent la chaîne alimentaire, des chaufferies qui garantissent le confort de milliers de personnes, des lignes de production qui ne s\'arrêtent jamais. PEXEN conçoit, installe et suit la performance énergétique de ces installations, dans l\'industrie, le tertiaire et le résidentiel collectif. Des économies calculées, réalisées, démontrées.',
        buttons: [contactBtn(), button('Voir nos réalisations', '/realisations/', 'secondary', 'none')],
        liveText: 'Nos experts vous répondent sous 48 h ouvrées.',
        trustItems: ['Installateur RGE QualiPAC', 'RGE Qualisol CESI'],
        media: 'image',
        mainImage: IMG.hero,
        mainImageAlt: 'Chantier de performance énergétique PEXEN en grande distribution',
        galleryImages: [IMG.coucher, IMG.audit, IMG.carrefour, IMG.colorcon, IMG.eolien, IMG.solaires, IMG.transition, IMG.renouvelable, IMG.inter].map((image) => ({
          id: uid('g'),
          image,
        })),
        chipText: '01 Conseil · 02 Ingénierie · 03 Suivi opérationnel',
        parallax: false,
        marquee: ['Intermarché', 'Carrefour Market', 'CEDIM', 'Colorcon'],
      },
      { background: 'white', paddingTop: 'md', paddingBottom: 'lg' }
    ),
    cards(
      'Nos projets de performance énergétique',
      'Quatre sites, quatre configurations, une même exigence : que chaque économie annoncée soit d\'abord calculée, puis démontrée.',
      [
        {
          title: 'Intermarché · Bourgogne-Franche-Comté',
          text: 'Grande distribution. Sortie du fioul : pompe à chaleur air/eau, récupération de chaleur sur groupe froid, déstratification, GTB classe B, fermeture des meubles frigorifiques. 14,8 GWh cumac d\'économies d\'énergie estimées*',
          image: IMG.inter,
          link: '/realisations/#intermarche',
          linkLabel: 'Voir la réalisation',
        },
        {
          title: 'Carrefour Market · Île-de-France',
          text: 'Grande distribution. Récupération de chaleur sur la centrale froid, haute pression flottante, isolation de la toiture-terrasse, fermeture des meubles, contrat de performance énergétique. 30,6 GWh cumac d\'économies d\'énergie estimées* · objectif contractuel −40 %',
          image: IMG.carrefour,
          link: '/realisations/#carrefour-market',
          linkLabel: 'Voir la réalisation',
        },
        {
          title: 'CEDIM · Centre-Val de Loire',
          text: 'Négoce et entrepôt. Déstratification d\'air d\'un magasin de grande hauteur chauffé au gaz. 2,1 GWh cumac d\'économies d\'énergie estimées*',
          image: IMG.cedim,
          link: '/realisations/#cedim',
          linkLabel: 'Voir la réalisation',
        },
        {
          title: 'Colorcon · Île-de-France',
          text: 'Industrie pharmaceutique. Récupération de chaleur fatale et isolation technique des réseaux. Des économies mesurées, un process maintenu.',
          image: IMG.colorcon,
          link: '/realisations/#colorcon',
          linkLabel: 'Voir la réalisation',
        },
      ],
      2,
      'image'
    ),
    b('richText', { html: `<p class="text-xs text-slate-500">${MENTION}</p>`, size: 'normal' }, { paddingTop: 'none', paddingBottom: 'md' }),
    /* Seul bloc en fond sombre animé (demande utilisateur) */
    cards(
      'Vos consommations sont un coût. Elles deviennent une obligation.',
      undefined,
      [
        { title: 'Le froid pèse sur votre facture', text: 'Dans la grande distribution, le froid alimentaire représente 45 à 75 % des dépenses d\'énergie (Perifem). C\'est le premier poste que nous optimisons.', link: '/expertises/froid-commercial-industriel/', linkLabel: 'Découvrir', icon: 'snowflake', image: IMG.inter },
        { title: 'Le décret tertiaire fixe le cap', text: '−40 % de consommation en 2030, −50 % en 2040, −60 % en 2050 pour tout bâtiment tertiaire de 1 000 m² et plus, avec une déclaration annuelle sur OPERAT.', link: '/expertises/financement-cee-reglementation/', linkLabel: 'Découvrir', icon: 'fileCheck', image: IMG.transition },
        { title: 'Le décret BACS impose le pilotage', text: 'Une GTB est obligatoire au-delà de 290 kW de chauffage ou de climatisation depuis 2025, au-delà de 70 kW au 1er janvier 2030.', link: '/expertises/gtb-tertiaire-gtc/', linkLabel: 'Découvrir', icon: 'cpu', image: IMG.carrefour },
        { title: 'Vos travaux peuvent être financés', text: 'Les certificats d\'économies d\'énergie réduisent le reste à charge. Bonification jusqu\'à ×5 lorsqu\'une pompe à chaleur ou une géothermie remplace une chaudière fossile.', link: '/expertises/financement-cee-reglementation/', linkLabel: 'Découvrir', icon: 'badgePercent', image: IMG.solaires },
      ],
      4,
      'card',
      { background: 'navy', decor: 'glow', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'showcase',
      {
        title: 'Nos expertises : froid, chaleur, pilotage, isolation.',
        intro: 'Cinq leviers techniques, un seul interlocuteur — de l\'étude au suivi des consommations.',
        interval: 5,
        items: [
          { id: uid('sh'), icon: 'snowflake', title: 'Froid commercial & industriel', text: 'Haute et basse pression flottante, condensation haute efficacité, variation de vitesse, fermeture des meubles frigorifiques.', image: IMG.inter, chips: ['BAT-TH-134', 'IND-UT-116', 'Meubles froids'], buttonLabel: 'Découvrir', link: '/expertises/froid-commercial-industriel/' },
          { id: uid('sh'), icon: 'flame', title: 'Récupération de chaleur', text: 'La chaleur rejetée par vos groupes froids et compresseurs chauffe vos locaux et votre eau.', image: IMG.colorcon, chips: ['Chaleur fatale', 'ECS', 'Locaux'], buttonLabel: 'Découvrir', link: '/expertises/recuperation-de-chaleur/' },
          { id: uid('sh'), icon: 'wind', title: 'Chauffage & traitement d\'air', text: 'Pompes à chaleur en remplacement du fioul ou du gaz, déstratification des grands volumes.', image: IMG.coucher, chips: ['PAC', 'Déstratification', 'Sortie fioul'], buttonLabel: 'Découvrir', link: '/expertises/pompe-a-chaleur-tertiaire/' },
          { id: uid('sh'), icon: 'cpu', title: 'Pilotage GTB / GTC', text: 'Gestion technique du bâtiment de classe A ou B, conformité au décret BACS.', image: IMG.carrefour, chips: ['Décret BACS', 'Classe A/B', 'Suivi'], buttonLabel: 'Découvrir', link: '/expertises/gtb-tertiaire-gtc/' },
          { id: uid('sh'), icon: 'shieldCheck', title: 'Isolation technique', text: 'Toitures-terrasses, calorifugeage des réseaux, isolation des points singuliers.', image: IMG.cedim, chips: ['Toiture', 'Calorifugeage', 'Points singuliers'], buttonLabel: 'Découvrir', link: '/expertises/isolation-technique/' },
        ],
      },
      { background: 'surface', decor: 'silk', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b('steps', {
      title: 'Une méthode en 4 étapes, de l\'audit à la mesure.',
      intro: 'La performance énergétique ne se décrète pas, elle s\'ingénie : mesurée sur le terrain, calculée, construite, puis prouvée.',
      style: 'timeline',
      deliverableLabel: 'Remis',
      buttons: [contactBtn(), button('Notre approche', '/notre-approche/', 'secondary', 'none')],
      items: [
        { id: uid('s'), num: '01', title: 'Prévisite & audit', text: 'Relevé sur site, analyse des factures et des équipements.', deliverable: 'Pré-étude d\'ingénierie.' },
        { id: uid('s'), num: '02', title: 'Dimensionnement & ingénierie technico-financière', text: 'Notes de calcul, chiffrage des travaux et des CEE.', deliverable: 'Dossier technique, devis, plan de financement.' },
        { id: uid('s'), num: '03', title: 'Installation & mise en service', text: 'Travaux coordonnés avec votre exploitation.', deliverable: 'Procès-verbal de réception.' },
        { id: uid('s'), num: '04', title: 'Contrôle COFRAC, suivi & performance', text: 'Contrôle par un organisme accrédité COFRAC, suivi des consommations.', deliverable: 'Bilan d\'économies d\'énergie.' },
      ],
    }),
    cards(
      'Industrie, tertiaire, résidentiel collectif.',
      undefined,
      [
        { title: 'Industrie', text: 'Vos lignes ne s\'arrêtent pas. Vos économies non plus.', image: IMG.colorcon, link: '/secteurs/efficacite-energetique-industrielle/', linkLabel: 'Découvrir' },
        { title: 'Tertiaire', text: 'Le décret tertiaire a une date. Votre plan d\'actions aussi.', image: IMG.carrefour, link: '/secteurs/efficacite-energetique-tertiaire/', linkLabel: 'Découvrir' },
        { title: 'Résidentiel collectif', text: 'Des charges maîtrisées, un confort tenu, un dossier prêt pour la décision.', image: IMG.hero, link: '/secteurs/renovation-energetique-copropriete/', linkLabel: 'Découvrir' },
      ],
      3,
      'image'
    ),
    b(
      'gallery',
      {
        title: 'Sur le terrain',
        intro: 'Installations, réseaux, sites : le quotidien de nos chantiers de performance énergétique.',
        style: 'polaroid',
        handNote: 'Vu sur site →',
        items: [
          { id: uid('g'), image: IMG.hero, caption: 'Chantier grande distribution' },
          { id: uid('g'), image: IMG.coucher, caption: 'Transition énergétique' },
          { id: uid('g'), image: IMG.inter, caption: 'Groupes & production' },
          { id: uid('g'), image: IMG.carrefour, caption: 'Pilotage & data' },
          { id: uid('g'), image: IMG.solaires, caption: 'Énergies renouvelables' },
          { id: uid('g'), image: IMG.eolien, caption: 'Parc & performance' },
          { id: uid('g'), image: IMG.cedim, caption: 'Infrastructure' },
          { id: uid('g'), image: IMG.renouvelable, caption: 'Sites & réseaux' },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'stats',
      {
        title: 'PEXEN en chiffres',
        style: 'cards',
        countUp: true,
        footnote: MENTION,
        items: [
          {
            id: uid('k'),
            value: '47,5',
            suffix: 'GWh cumac',
            label: 'd\'économies d\'énergie estimées sur nos projets*',
            hint: 'Volume cumulé des opérations engagées',
          },
          { id: uid('k'), value: '5', label: 'expertises techniques' },
          { id: uid('k'), value: '28', label: 'fiches CEE couvertes par nos solutions' },
          { id: uid('k'), value: '48', suffix: 'h', label: 'délai de réponse ouvré' },
        ],
      },
      { background: 'soft', decor: 'silk', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    cards(
      'Mandataires, délégataires, fournisseurs : travaillons ensemble.',
      'Des partenariats conçus pour que chaque opération passe le contrôle — et que chaque équipement tienne sa promesse de performance.',
      [
        {
          title: 'Délégataires & mandataires CEE',
          text: 'Des opérations construites pour passer le contrôle COFRAC, du dimensionnement au dossier prêt à valoriser.',
          icon: 'fileCheck',
          image: IMG.transition,
          link: '/contact/',
          linkLabel: 'Échanger avec nos équipes',
        },
        {
          title: 'Fabricants & fournisseurs',
          text: 'Des équipements dimensionnés et posés pour tenir leurs promesses de performance sur le terrain, chantier après chantier.',
          icon: 'zap',
          image: IMG.renouvelable,
          link: '/contact/',
          linkLabel: 'Devenir partenaire',
        },
      ],
      2,
      'hoverDark',
      { background: 'surface', decor: 'silk', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    cards(
      'Qualifiés, assurés, contrôlés.',
      undefined,
      [
        { title: 'Qualifications PEXEN', text: 'RGE QualiPAC (chauffage et eau chaude sanitaire) · RGE Qualisol CESI.', image: IMG.solaires, icon: 'award' },
        { title: 'Audit énergétique, via Leo Energy', text: 'OPQIBI 1905 (bâtiments tertiaires et habitat collectif) · OPQIBI 1717 (industrie).', image: IMG.eolien, icon: 'search' },
        { title: 'Assurances et contrôle', text: 'RC Pro et décennale MIC Insurance · chantiers contrôlés par un organisme accrédité COFRAC.', image: IMG.cedim, icon: 'shieldCheck' },
      ],
      3,
      'image'
    ),
    faq('Questions fréquentes sur la performance énergétique', [
      ['Mes travaux peuvent-ils être financés par les CEE ?', 'La plupart de nos solutions relèvent d\'une fiche d\'opération standardisée. Le dossier doit être engagé avant la signature du devis : nous l\'intégrons dès l\'étape 2.'],
      ['Mon bâtiment est-il concerné par le décret tertiaire ?', 'Oui s\'il accueille des activités tertiaires sur 1 000 m² ou plus. Les consommations se déclarent chaque année sur la plateforme OPERAT de l\'ADEME, avant le 30 septembre.'],
      ['Le décret BACS m\'oblige-t-il à installer une GTB ?', 'Les bâtiments tertiaires dont le chauffage ou la climatisation dépasse 290 kW doivent être équipés d\'un système de pilotage (GTB) depuis le 1er janvier 2025. Le seuil passe à 70 kW au 1er janvier 2030.'],
      ['Sous quel délai répondez-vous ?', 'Un ingénieur ou un chargé d\'affaires vous répond sous 48 h ouvrées.'],
    ]),
    finalCta(),
  ];
}

function header(title: string, intro: string, parent?: { label: string; link: string }, image?: string, alt?: string, extraButtons: ButtonData[] = [contactBtn()]): CmsBlock {
  return b(
    'pageHeader',
    {
      breadcrumb: true,
      parentLabel: parent?.label,
      parentLink: parent?.link,
      title,
      intro,
      buttons: extraButtons,
      image,
      imageAlt: alt,
    },
    { background: 'surface', paddingBottom: 'md' }
  );
}

function expertises(): CmsBlock[] {
  return [
    header(
      'Nos expertises en ingénierie énergétique',
      'L\'ingénierie énergétique de PEXEN couvre les cinq postes qui concentrent les consommations d\'un site professionnel : la production de froid, la chaleur perdue, le chauffage des grands volumes, le pilotage et les pertes thermiques. Chaque expertise associe une étude chiffrée, des travaux réalisés par nos équipes et un suivi des résultats.'
    ),
    cards(
      'Cinq expertises, un seul interlocuteur',
      undefined,
      [
        { title: 'Froid commercial & industriel', text: 'Haute et basse pression flottante, condensation haute efficacité, variation électronique de vitesse, fermeture des meubles frigorifiques. Dans un supermarché, le froid représente 45 à 75 % des dépenses d\'énergie : c\'est le premier gisement.', link: '/expertises/froid-commercial-industriel/', linkLabel: 'Découvrir', icon: 'snowflake' },
        { title: 'Récupération de chaleur', text: 'Un groupe froid rejette en continu la chaleur extraite des meubles et des chambres froides. Récupérée, elle chauffe la surface de vente, l\'eau chaude sanitaire ou un process.', link: '/expertises/recuperation-de-chaleur/', linkLabel: 'Découvrir', icon: 'flame' },
        { title: 'Chauffage & traitement d\'air', text: 'Pompes à chaleur air/eau, eau/eau et géothermie en remplacement du fioul ou du gaz, déstratification des volumes de plus de 4 mètres sous plafond.', link: '/expertises/pompe-a-chaleur-tertiaire/', linkLabel: 'Découvrir', icon: 'wind' },
        { title: 'Pilotage GTB / GTC', text: 'Gestion technique du bâtiment de classe A ou B selon la norme NF EN ISO 52120-1, conformité au décret BACS, suivi des indicateurs de performance.', link: '/expertises/gtb-tertiaire-gtc/', linkLabel: 'Découvrir', icon: 'cpu' },
        { title: 'Isolation technique', text: 'Isolation des toitures-terrasses, calorifugeage des réseaux, matelas isolants sur vannes et points singuliers.', link: '/expertises/isolation-technique/', linkLabel: 'Découvrir', icon: 'shieldCheck' },
      ],
      3
    ),
    b('richText', {
      html: `<h2>Une ingénierie énergétique financée par les CEE</h2><p>Chaque solution correspond à une ou plusieurs fiches d'opérations standardisées des certificats d'économies d'énergie (CEE). Nous calculons le volume de kWh cumac dès l'étude, nous engageons le dossier avant la signature du devis et nous préparons les pièces exigées au contrôle. Les fiches mobilisées sont publiées sur le <a href="https://www.ecologie.gouv.fr/politiques-publiques/operations-standardisees-deconomies-denergie" target="_blank" rel="noopener">site du ministère de la Transition écologique</a>.</p><h2>Par où commencer selon votre site</h2><ul><li>Supermarché : régulation du froid, fermeture des meubles, récupération de chaleur sur la centrale froid.</li><li>Bureaux : GTB de classe A ou B, pompe à chaleur, équilibrage des réseaux.</li><li>Entrepôt ou magasin de grande hauteur : déstratification d'air, isolation de la toiture-terrasse.</li><li>Site industriel : froid process, air comprimé, chaufferie vapeur, calorifugeage des réseaux.</li><li>Résidence collective : chaufferie, sortie du fioul, équilibrage, rénovation globale.</li></ul><h2>Les repères qui guident nos priorités</h2><ul><li>45 à 75 % : part du froid alimentaire dans les dépenses d'énergie d'un supermarché (Perifem).</li><li>Jusqu'à 30 % : économie sur la consommation d'un groupe froid ancien avec une haute pression flottante.</li><li>15 à 30 % : économie sur les consommations pilotées par une GTB (ADEME).</li><li>Jusqu'à 30 % : économie sur le coût du chauffage d'un local de grande hauteur déstratifié (EDF).</li><li>3 à 4 kWh de chaleur produits par une pompe à chaleur pour 1 kWh d'électricité consommé.</li></ul>`,
      size: 'normal',
    }),
    faq('Questions fréquentes', [
      ['Pouvez-vous combiner plusieurs expertises sur un même site ?', 'Oui. Sur un supermarché, nous associons souvent régulation du froid, récupération de chaleur, fermeture des meubles et GTB. Les gains se cumulent et le dossier CEE regroupe les fiches.'],
      ['Intervenez-vous sur des installations récentes ?', 'Oui. Une installation récente peut fonctionner avec une régulation figée ou des réglages d\'usine. Le relevé de l\'étape 1 indique le potentiel avant tout engagement.'],
      ['Où intervenez-vous ?', 'Partout en France métropolitaine, depuis notre siège d\'Aubervilliers (Seine-Saint-Denis).'],
      ['Réalisez-vous les travaux vous-mêmes ?', 'Oui. PEXEN dimensionne, installe et met en service, avec ses équipes et des partenaires qualifiés, puis suit les consommations après travaux.'],
    ]),
    finalCta(),
  ];
}

function froid(): CmsBlock[] {
  return [
    header(
      'Froid commercial et industriel : réduire la consommation de vos groupes froids',
      'Le froid commercial est le premier poste électrique d\'un supermarché : 45 à 75 % des dépenses d\'énergie selon Perifem. Dans l\'industrie agroalimentaire ou pharmaceutique, le froid process pèse autant. PEXEN optimise les centrales existantes sans rompre la chaîne du froid : régulation, condensation, variation de vitesse et fermeture des meubles de vente. Chaque intervention préserve ce que vos clients ne voient jamais : la chaîne du froid.',
      { label: 'Expertises', link: '/expertises/' },
      IMG.carrefour,
      'Centrale de froid commercial optimisée par PEXEN'
    ),
    b('richText', {
      html: `<h2>Pourquoi vos groupes froids consomment trop</h2><ul><li>Une pression de condensation fixe, réglée pour les journées les plus chaudes, alors que la température extérieure reste sous 20 °C la majeure partie de l'année.</li><li>Des meubles de vente ouverts : un rayon froid consomme environ 979 kWh/m²/an, contre 45 à 72 kWh/m²/an pour un rayon sans froid (données OPERAT).</li><li>Des compresseurs et ventilateurs à vitesse fixe, qui fonctionnent en tout ou rien.</li><li>Des condenseurs sous-dimensionnés ou encrassés, qui obligent les compresseurs à travailler à haute pression.</li></ul>`,
      size: 'normal',
    }),
    cards('Nos solutions pour le froid commercial et industriel', undefined, [
      { title: 'Haute pression flottante', text: 'La pression de condensation suit la température extérieure au lieu de rester bloquée à sa valeur d\'été. Sur une installation ancienne à régulation figée, le gain atteint jusqu\'à 30 % de la consommation du groupe froid. Fiches CEE : BAT-TH-134 (tertiaire) · IND-UT-116 (industrie).' },
      { title: 'Basse pression flottante', text: 'La pression d\'évaporation s\'ajuste à la demande réelle des meubles et des chambres froides. Fiches CEE : BAT-TH-145 · IND-UT-115.' },
      { title: 'Condensation frigorifique haute efficacité', text: 'Des condenseurs dimensionnés pour un écart de température réduit et des ventilateurs à commutation électronique abaissent la pression de travail des compresseurs. Fiches CEE : BAT-EQ-130 · IND-UT-113.' },
      { title: 'Variation électronique de vitesse', text: 'Compresseurs, ventilateurs et pompes adaptent leur vitesse à la charge. Fiches CEE : BAT-TH-112 · IND-UT-102.' },
      { title: 'Fermeture des meubles frigorifiques', text: 'Portes vitrées sur les meubles à température positive, couvercles sur les meubles à température négative. Fiches CEE : BAT-EQ-124 (positif) · BAT-EQ-125 (négatif).' },
    ], 2),
    b('richText', {
      html: `<h2>Froid et chaleur : un même projet</h2><p>Un groupe froid rejette à l'extérieur la chaleur extraite des meubles, augmentée de l'énergie des compresseurs. Récupérée au condenseur, cette chaleur chauffe la surface de vente ou l'eau chaude sanitaire. Régulation du froid et récupération de chaleur s'étudient ensemble.</p><p><a href="/expertises/recuperation-de-chaleur/">Récupération de chaleur</a></p><p class="text-xs text-slate-500">${MENTION}</p>`,
      size: 'normal',
    }),
    faq('Questions fréquentes sur le froid commercial', [
      ['La haute pression flottante est-elle compatible avec mon installation ?', 'Elle s\'adapte à la plupart des centrales à condensation par air. Le relevé vérifie le détendeur, la plage de fonctionnement des compresseurs et la capacité du condenseur avant toute préconisation.'],
      ['Faut-il fermer le magasin pendant les travaux ?', 'Non. Les interventions sont phasées par meuble et par circuit, avec des solutions de stockage temporaire si nécessaire.'],
      ['La fermeture des meubles réduit-elle les ventes ?', 'Les portes vitrées maintiennent la visibilité des produits. Elles suppriment l\'inconfort des allées froides et stabilisent la température des denrées.'],
    ]),
    finalCta(),
  ];
}

function chaleur(): CmsBlock[] {
  return [
    header(
      'Récupération de chaleur : chauffer avec l\'énergie que vous rejetez',
      'Chaque groupe froid, chaque compresseur d\'air, chaque process chaud rejette de la chaleur dans l\'atmosphère. La récupération de chaleur capte cette énergie et la redirige vers le chauffage des locaux, l\'eau chaude sanitaire ou le préchauffage d\'un process. Elle réduit la consommation de la chaudière sans ajouter de combustible. Une énergie déjà payée, enfin utilisée.',
      { label: 'Expertises', link: '/expertises/' },
      IMG.colorcon,
      'Récupération de chaleur sur groupe froid installée par PEXEN'
    ),
    cards('Nos solutions de valorisation de la chaleur', undefined, [
      { title: 'Sur groupe de production de froid', text: 'Un échangeur placé en sortie de compresseur alimente un réseau d\'eau chaude ou une batterie de traitement d\'air. Durée de vie conventionnelle : 14 ans. Fiches CEE : BAT-TH-139 (tertiaire) · IND-UT-117 (industrie, sous réserve de maintien de la fiche).' },
      { title: 'Sur compresseur d\'air', text: 'La chaleur du circuit d\'huile ou de l\'air de refroidissement préchauffe l\'eau ou chauffe un atelier voisin. Fiche CEE : IND-UT-103.' },
      { title: 'Pompe à chaleur en rehausse de chaleur fatale', text: 'Quand la chaleur disponible est trop basse en température (25 à 40 °C), une pompe à chaleur la relève au niveau requis. Fiche CEE : IND-UT-137.' },
      { title: 'Récupération instantanée sur eaux grises', text: 'Un échangeur sur l\'évacuation des douches préchauffe l\'eau froide entrante. Adapté aux établissements de santé, aux salles de sport et aux hôtels. Fiche CEE : BAT-TH-154.' },
    ], 2),
    b('richText', {
      html: `<h2>Les conditions d'un projet rentable</h2><p>Le projet tient si trois conditions sont réunies : des besoins de chaleur simultanés aux rejets, une distance courte entre source et usage, une régulation du froid qui reste prioritaire. Notre étude croise les courbes de rejet et de besoin heure par heure avant de dimensionner l'échangeur et le stockage.</p><p class="text-xs text-slate-500">${MENTION}</p>`,
      size: 'normal',
    }),
    faq('Questions fréquentes sur la récupération de chaleur', [
      ['Quelle part de mon chauffage la chaleur récupérée peut-elle couvrir ?', 'Cela dépend de la puissance du groupe froid, de son temps de fonctionnement et de vos besoins. Dans un supermarché, la chaleur rejetée par la centrale froid dépasse souvent le besoin de chauffage du magasin hors grands froids.'],
      ['Mon chauffage actuel doit-il être remplacé ?', 'Non. L\'échangeur s\'installe en amont du générateur existant, qui assure l\'appoint.'],
      ['La fiche IND-UT-117 est-elle toujours valable ?', 'Sa suppression est envisagée par le ministère. Nous vérifions la fiche en vigueur à la date d\'engagement de chaque opération.'],
    ]),
    finalCta(),
  ];
}

function pac(): CmsBlock[] {
  return [
    header(
      'Chauffage et traitement d\'air : sortir du fioul, chauffer les grands volumes',
      'Une pompe à chaleur tertiaire remplace une chaudière fioul ou gaz et produit 3 à 4 kWh de chaleur pour 1 kWh d\'électricité. Dans les bâtiments de grande hauteur, la déstratification ramène au sol l\'air chaud accumulé sous la toiture. PEXEN, installateur RGE QualiPAC, dimensionne, installe et met en service ces équipements. Pour les occupants, un confort constant ; pour l\'exploitant, une facture maîtrisée.',
      { label: 'Expertises', link: '/expertises/' },
      IMG.cedim,
      'Déstratificateur d\'air installé dans un magasin de grande hauteur'
    ),
    b('table', {
      title: 'Pompe à chaleur tertiaire : remplacer une chaudière fossile',
      intro: 'Depuis le 1er janvier 2026, trois fiches CEE remplacent l\'ancienne BAT-TH-113. Quand la pompe à chaleur remplace une chaudière au fioul, au charbon ou au gaz hors condensation, le Coup de pouce Chauffage multiplie la prime.',
      searchable: false,
      columns: ['Technologie', 'Fiche CEE', 'Bonification Coup de pouce'],
      rows: [
        { id: uid('r'), cells: ['Pompe à chaleur air/eau', 'BAT-TH-163', '×3'] },
        { id: uid('r'), cells: ['Pompe à chaleur eau/eau ou eau glycolée/eau', 'BAT-TH-164', '×4'] },
        { id: uid('r'), cells: ['Système géothermique', 'BAT-TH-162', '×5'] },
      ],
    }),
    b('richText', {
      html: `<h2>Déstratification d'air des bâtiments de grande hauteur</h2><p>Dans un local de plus de 4 mètres sous plafond, la température gagne environ 1,5 °C par mètre de hauteur (EDF). Des déstratificateurs renvoient l'air chaud vers le sol : jusqu'à 30 % d'économies sur le coût du chauffage selon EDF. Fiches CEE : BAT-TH-142 (tertiaire) · IND-BA-110 (industrie).</p><h2>Chaufferies industrielles : brûleur micro-modulant</h2><p>Sur une chaudière vapeur ou eau chaude industrielle, un brûleur micro-modulant ajuste en continu la puissance à la demande. Fiche CEE : IND-UT-105.</p><p class="text-xs text-slate-500">${MENTION}</p>`,
      size: 'normal',
    }),
    faq('Questions fréquentes sur la pompe à chaleur tertiaire', [
      ['Une pompe à chaleur suffit-elle par grand froid ?', 'Le dimensionnement intègre la température de base de votre zone climatique. Un appoint est prévu quand il est économiquement justifié.'],
      ['Puis-je garder mes radiateurs ?', 'Oui si la température de départ nécessaire reste compatible avec la pompe à chaleur. Le relevé de l\'étape 1 le vérifie émetteur par émetteur.'],
      ['Quelle bonification CEE pour remplacer une chaudière fioul ?', 'Le Coup de pouce Chauffage multiplie les kWh cumac par 3 pour une pompe à chaleur air/eau, par 4 pour une eau/eau et par 5 pour une géothermie, à condition de déposer l\'équipement fossile.'],
    ]),
    finalCta(),
  ];
}

function gtb(): CmsBlock[] {
  return [
    header(
      'Pilotage GTB / GTC : piloter vos consommations et respecter le décret BACS',
      'Une GTB tertiaire (gestion technique du bâtiment) commande le chauffage, la climatisation, la ventilation, l\'éclairage et la production de froid selon l\'occupation et la météo. L\'ADEME estime les gains entre 15 et 30 % sur les consommations pilotées. Depuis le décret BACS, elle devient une obligation pour une grande partie du parc tertiaire.',
      { label: 'Expertises', link: '/expertises/' }
    ),
    b('table', {
      title: 'Le décret BACS : qui est concerné et quand',
      searchable: false,
      columns: ['Bâtiment tertiaire', 'Échéance'],
      rows: [
        { id: uid('r'), cells: ['Chauffage ou climatisation > 290 kW', 'Depuis le 1er janvier 2025'] },
        { id: uid('r'), cells: ['Chauffage ou climatisation entre 70 et 290 kW (existant)', '1er janvier 2030 (décret n° 2025-1343)'] },
        { id: uid('r'), cells: ['Bâtiment neuf > 70 kW', 'Dès la construction'] },
      ],
    }),
    cards('Nos solutions de GTB tertiaire et de GTC', undefined, [
      { title: 'Audit de l\'existant et cahier des charges', text: 'Inventaire des équipements, des automates et des protocoles (BACnet, Modbus, KNX). Fiche CEE : BAT-TH-116.' },
      { title: 'Installation et programmation', text: 'Comptage par usage, sondes, automates, supervision. Plages horaires, réduits de nuit, délestage.' },
      { title: 'Suivi des indicateurs en industrie', text: 'Mesure des consommations par atelier ou par machine. Fiche CEE : IND-UT-134.' },
      { title: 'Exploitation des données', text: 'Tableaux de bord, alertes de dérive, données prêtes pour la déclaration annuelle OPERAT.' },
    ], 2),
    faq('Questions fréquentes sur la GTB tertiaire', [
      ['Mon bâtiment est-il soumis au décret BACS ?', 'Additionnez la puissance nominale de vos systèmes de chauffage ou de climatisation. Au-delà de 290 kW, l\'obligation s\'applique depuis 2025 ; entre 70 et 290 kW, au 1er janvier 2030.'],
      ['Quelle différence entre GTB et GTC ?', 'La GTC centralise la commande d\'un lot technique. La GTB coordonne l\'ensemble des lots du bâtiment selon l\'occupation, les consignes et la météo.'],
      ['Quelle classe viser : A ou B ?', 'La classe B suffit souvent à respecter le décret BACS et à obtenir la prime BAT-TH-116. La classe A ajoute des fonctions d\'optimisation et augmente le gain.'],
    ]),
    finalCta(),
  ];
}

function isolation(): CmsBlock[] {
  return [
    header(
      'Isolation technique : limiter les pertes de vos réseaux et de vos toitures',
      'Une canalisation d\'eau chaude ou de vapeur non isolée, une vanne nue, une toiture-terrasse sans isolant : la chaleur produite se perd avant d\'atteindre son usage. L\'isolation technique traite ces pertes en priorité, avec des temps de retour parmi les plus courts des travaux d\'économies d\'énergie.',
      { label: 'Expertises', link: '/expertises/' },
      IMG.colorcon,
      'Isolation technique d\'un réseau de chauffage par PEXEN'
    ),
    cards('Nos solutions d\'isolation technique', undefined, [
      { title: 'Calorifugeage des réseaux et des équipements', text: 'Isolation des tuyauteries, ballons et parois planes ou cylindriques. Fiche CEE : IND-UT-131.' },
      { title: 'Matelas isolants sur points singuliers', text: 'Housses taillées pour chaque pièce, démontables sans outil. Fiche CEE : IND-UT-121.' },
      { title: 'Isolation des toitures-terrasses', text: 'Isolant posé sur l\'étanchéité ou sous une nouvelle étanchéité. Durée de vie conventionnelle : 30 ans. Fiche CEE : BAT-EN-107.' },
    ], 3),
    b('richText', {
      html: `<p>Nous relevons chaque tronçon et chaque point singulier : diamètre, longueur, température du fluide, ambiance. Une thermographie infrarouge localise les pertes invisibles. Le chiffrage classe les actions par temps de retour, CEE déduits.</p><p class="text-xs text-slate-500">${MENTION}</p>`,
      size: 'normal',
    }),
    faq('Questions fréquentes sur l\'isolation technique', [
      ['Faut-il arrêter l\'installation pour la calorifuger ?', 'Non dans la plupart des cas : les isolants et matelas se posent sur des réseaux en service.'],
      ['Le calorifugeage est-il financé par les CEE ?', 'Oui, en industrie avec les fiches IND-UT-131 et IND-UT-121, en tertiaire pour la toiture-terrasse avec BAT-EN-107.'],
      ['Isolez-vous aussi les réseaux d\'eau glacée ?', 'Oui, avec un isolant à pare-vapeur continu : une discontinuité suffit à créer de la condensation, puis de la corrosion sous l\'isolant.'],
    ]),
    finalCta(),
  ];
}

function cee(): CmsBlock[] {
  return [
    header(
      'Réglementation et financement CEE',
      'Trois textes encadrent la performance énergétique des sites professionnels : le décret tertiaire, le décret BACS et l\'obligation d\'audit énergétique. Un dispositif les finance en partie : les certificats d\'économies d\'énergie. Le financement CEE n\'est pas une fin en soi ; il réduit le reste à charge de travaux utiles.'
    ),
    b('richText', {
      html: `<h2>Décret tertiaire : −40 % en 2030</h2><p>Tout bâtiment accueillant des activités tertiaires sur 1 000 m² ou plus doit réduire sa consommation d'énergie finale de 40 % en 2030, 50 % en 2040 et 60 % en 2050. Les consommations se déclarent chaque année sur <a href="https://operat.ademe.fr/" target="_blank" rel="noopener">OPERAT</a>, avant le 30 septembre.</p><h2>Le financement CEE : principe et calendrier</h2><p>Les fournisseurs d'énergie, dits obligés, financent des économies d'énergie chez leurs clients. Chaque opération standardisée génère un volume de kWh cumac. La 6e période (2026-2030) fixe une obligation de 1 050 TWh cumac par an.</p><h3>Trois règles pour sécuriser votre prime</h3><ul><li>Engager le dossier CEE avant la signature du devis.</li><li>Respecter les critères techniques de la fiche, justifiés par une note de dimensionnement datée et signée.</li><li>Conserver les pièces exigées au contrôle par un organisme accrédité COFRAC.</li></ul>`,
      size: 'normal',
    }),
    b('table', {
      title: 'Les fiches CEE que nous mobilisons',
      searchable: true,
      searchPlaceholder: 'Rechercher une fiche…',
      columns: ['Solution', 'Fiche tertiaire', 'Fiche industrie', 'Statut'],
      rows: [
        ['Haute pression flottante', 'BAT-TH-134', 'IND-UT-116', 'En vigueur'],
        ['Basse pression flottante', 'BAT-TH-145', 'IND-UT-115', 'En vigueur'],
        ['Condensation haute efficacité', 'BAT-EQ-130', 'IND-UT-113', 'En vigueur'],
        ['Variation électronique de vitesse', 'BAT-TH-112', 'IND-UT-102', 'En vigueur'],
        ['Fermeture meubles positifs', 'BAT-EQ-124', '—', 'En vigueur'],
        ['Fermeture meubles négatifs', 'BAT-EQ-125', '—', 'En vigueur'],
        ['Récupération sur groupe froid', 'BAT-TH-139', 'IND-UT-117', 'IND-UT-117 : vérifier à l\'engagement'],
        ['Récupération sur compresseur d\'air', '—', 'IND-UT-103', 'En vigueur'],
        ['PAC en rehausse de chaleur fatale', '—', 'IND-UT-137', 'En vigueur'],
        ['Eaux grises', 'BAT-TH-154', '—', 'En vigueur'],
        ['PAC air/eau', 'BAT-TH-163', '—', 'En vigueur depuis le 01/01/2026'],
        ['PAC eau/eau', 'BAT-TH-164', '—', 'En vigueur depuis le 01/01/2026'],
        ['Géothermie', 'BAT-TH-162', '—', 'En vigueur depuis le 01/01/2026'],
        ['Déstratification', 'BAT-TH-142', 'IND-BA-110', 'En vigueur'],
        ['Brûleur micro-modulant', '—', 'IND-UT-105', 'En vigueur'],
        ['GTB classe A ou B', 'BAT-TH-116', '—', 'En vigueur'],
        ['Indicateurs de performance', '—', 'IND-UT-134', 'En vigueur'],
        ['Toiture-terrasse', 'BAT-EN-107', '—', 'En vigueur'],
        ['Calorifugeage', '—', 'IND-UT-131', 'En vigueur'],
        ['Points singuliers', '—', 'IND-UT-121', 'En vigueur'],
        ['Rénovation globale résidentiel', 'BAR-TH-177', '—', 'Coup de pouce jusqu\'au 31/12/2030'],
        ['Équilibrage chauffage', 'BAR-SE-104', '—', 'En vigueur'],
      ].map((cells) => ({ id: uid('r'), cells })),
    }),
    faq('Questions fréquentes sur le financement CEE', [
      ['Quel montant de prime CEE puis-je obtenir ?', 'Il dépend du volume de kWh cumac de l\'opération et du prix du marché au moment de l\'engagement. Nous le chiffrons à l\'étape 2, avant toute signature.'],
      ['Les CEE sont-ils cumulables avec d\'autres aides ?', 'Souvent, selon les règles propres à chaque aide. Nous vérifions les cumuls possibles projet par projet.'],
      ['Que se passe-t-il lors du contrôle ?', 'Un organisme accrédité COFRAC vérifie sur site la conformité de l\'opération à la fiche. Nos dossiers sont constitués pour ce contrôle dès l\'engagement.'],
    ]),
    finalCta(),
  ];
}

function renovation(): CmsBlock[] {
  return [
    header(
      'Rénovation globale tertiaire : un bouquet de travaux, un seul dossier',
      'La rénovation globale tertiaire traite ensemble l\'enveloppe, la production de chaleur et de froid, la ventilation et le pilotage d\'un bâtiment. Une fiche CEE dédiée financera ces bouquets de travaux dès sa parution. Elle complète les fiches par équipement pour les projets qui visent les objectifs du décret tertiaire.'
    ),
    b('richText', {
      html: `<p>Page en préparation : elle sera publiée quand l'arrêté créant la fiche CEE sera paru au Journal officiel. La fiche BAR-TH-177 finance déjà la rénovation globale des bâtiments résidentiels collectifs.</p>`,
      size: 'normal',
    }),
    finalCta(),
  ];
}

function secteurs(): CmsBlock[] {
  return [
    header(
      'Nos secteurs d\'intervention',
      'L\'efficacité énergétique ne se traite pas de la même manière dans une usine, un supermarché ou une résidence de 200 logements. Les usages, les obligations et les interlocuteurs changent. PEXEN intervient sur trois secteurs, avec des solutions et des fiches CEE propres à chacun.'
    ),
    cards('Efficacité énergétique par secteur', undefined, [
      { title: 'Industrie', text: 'Froid process, chaleur fatale, chaufferies vapeur, air comprimé, réseaux de distribution. Vos lignes ne s\'arrêtent pas. Vos économies non plus.', image: IMG.colorcon, link: '/secteurs/efficacite-energetique-industrielle/', linkLabel: 'Découvrir' },
      { title: 'Tertiaire', text: 'Grande distribution, bureaux, entrepôts, santé. Le décret tertiaire a une date. Votre plan d\'actions aussi.', image: IMG.carrefour, link: '/secteurs/efficacite-energetique-tertiaire/', linkLabel: 'Découvrir' },
      { title: 'Résidentiel collectif', text: 'Bailleurs sociaux, syndics, gestionnaires de copropriété. Des charges maîtrisées, un confort tenu, un dossier prêt pour la décision.', image: IMG.hero, link: '/secteurs/renovation-energetique-copropriete/', linkLabel: 'Découvrir' },
    ], 3, 'image'),
    finalCta(),
  ];
}

function industrie(): CmsBlock[] {
  return [
    header(
      'Efficacité énergétique des sites industriels',
      'Vos lignes ne s\'arrêtent pas. Vos économies non plus. Dans l\'industrie, l\'énergie est un coût de production et la continuité, une exigence. L\'efficacité énergétique industrielle agit sur les utilités qui tournent en continu : production de froid, chaufferies, air comprimé, réseaux. PEXEN conduit les études et les travaux en coordination avec vos arrêts programmés, sans perturber les lignes.',
      { label: 'Secteurs', link: '/secteurs/' },
      IMG.colorcon,
      'Chaufferie et réseaux d\'un site industriel'
    ),
    b('richText', {
      html: `<h2>Réalisation industrielle</h2><p><strong>Colorcon · Île-de-France · Industrie pharmaceutique.</strong> Optimisation d'une chaufferie vapeur, de la production de froid et des réseaux de distribution. Fiches étudiées : IND-UT-137 · IND-UT-103 · IND-UT-116 · IND-UT-105 · IND-UT-131.</p>`,
      size: 'normal',
    }, { anchor: 'colorcon' }),
    faq('Questions fréquentes sur l\'efficacité énergétique industrielle', [
      ['Pouvez-vous intervenir pendant un arrêt technique court ?', 'Oui. Les fournitures sont préparées en amont pour concentrer les raccordements sur la fenêtre d\'arrêt.'],
      ['Mon site est-il soumis à l\'audit énergétique obligatoire ?', 'Oui si sa consommation annuelle moyenne atteint 2,75 GWh et qu\'il ne dispose pas d\'un système de management de l\'énergie certifié ISO 50001.'],
      ['Pouvez-vous valoriser la chaleur d\'un process à basse température ?', 'Oui, avec une pompe à chaleur en rehausse de température (fiche IND-UT-137).'],
    ]),
    finalCta(),
  ];
}

function tertiaire(): CmsBlock[] {
  return [
    header(
      'Efficacité énergétique des bâtiments tertiaires',
      'Le décret tertiaire a une date. Votre plan d\'actions aussi. Grande distribution, bureaux, entrepôts logistiques, établissements de santé : le décret tertiaire impose −40 % de consommation en 2030 à tout bâtiment de 1 000 m² et plus. PEXEN traite d\'abord les postes qui pèsent le plus, froid commercial, chauffage des grands volumes et pilotage.',
      { label: 'Secteurs', link: '/secteurs/' },
      IMG.inter,
      'Supermarché accompagné par PEXEN en efficacité énergétique tertiaire'
    ),
    cards('Nos interventions par type de bâtiment tertiaire', undefined, [
      { title: 'Grande distribution', text: 'Régulation haute et basse pression flottante, fermeture des meubles, récupération de chaleur, pompe à chaleur, GTB.', link: '/expertises/froid-commercial-industriel/', linkLabel: 'Froid commercial' },
      { title: 'Bureaux', text: 'GTB de classe A ou B, pompes à chaleur, équilibrage et régulation des réseaux, isolation des toitures-terrasses.', link: '/expertises/gtb-tertiaire-gtc/', linkLabel: 'GTB' },
      { title: 'Entrepôts et magasins de grande hauteur', text: 'Déstratification d\'air, remplacement des aérothermes gaz, isolation de toiture.', link: '/expertises/pompe-a-chaleur-tertiaire/', linkLabel: 'Chauffage' },
      { title: 'Santé et hébergement', text: 'Production d\'eau chaude sanitaire, récupération de chaleur sur eaux grises, pilotage des centrales de traitement d\'air.', link: '/expertises/recuperation-de-chaleur/', linkLabel: 'Chaleur' },
    ], 2),
    faq('Questions fréquentes sur l\'efficacité énergétique tertiaire', [
      ['Qui est responsable du décret tertiaire : le propriétaire ou le locataire ?', 'Les deux. Ils se répartissent les actions selon le bail et déclarent sur OPERAT pour la part qui les concerne.'],
      ['Les travaux de froid commercial comptent-ils pour le décret tertiaire ?', 'Oui. Le décret porte sur toutes les consommations d\'énergie finale du bâtiment, froid alimentaire compris.'],
    ]),
    finalCta(),
  ];
}

function residentiel(): CmsBlock[] {
  return [
    header(
      'Performance énergétique du résidentiel collectif',
      'Des charges maîtrisées, un confort tenu, un dossier prêt pour la décision. Bailleurs sociaux, syndics et gestionnaires de copropriété : la rénovation énergétique agit sur deux choses que les occupants ressentent chaque hiver, leurs charges et leur confort. PEXEN modernise les chaufferies collectives, remplace le fioul par des pompes à chaleur, équilibre les réseaux et monte les dossiers CEE, dont la rénovation globale BAR-TH-177.',
      { label: 'Secteurs', link: '/secteurs/' }
    ),
    cards('Nos solutions pour la rénovation énergétique copropriété', undefined, [
      { title: 'Sortie du fioul et du gaz', text: 'Pompes à chaleur collectives et géothermie, bonifiées par le Coup de pouce Chauffage. PEXEN est installateur RGE QualiPAC.', link: '/expertises/pompe-a-chaleur-tertiaire/', linkLabel: 'Découvrir' },
      { title: 'Équilibrage et régulation', text: 'Réglage des organes d\'équilibrage d\'une installation de chauffage à eau chaude. Fiche CEE : BAR-SE-104.' },
      { title: 'Isolation technique en chaufferie', text: 'Calorifugeage des réseaux et matelas isolants sur vannes et échangeurs.', link: '/expertises/isolation-technique/', linkLabel: 'Découvrir' },
      { title: 'Rénovation globale', text: 'Audit, bouquet de travaux et financement par la fiche BAR-TH-177, bonification Coup de pouce prolongée jusqu\'au 31 décembre 2030.' },
    ], 2),
    faq('Questions fréquentes sur la rénovation énergétique en copropriété', [
      ['Les travaux se font-ils en site occupé ?', 'Oui. Le remplacement d\'une production de chaleur se planifie hors saison de chauffe ou avec une solution provisoire.'],
      ['Qui perçoit la prime CEE en copropriété ?', 'Le syndicat des copropriétaires, maître d\'ouvrage des travaux. La prime vient en déduction du coût voté.'],
      ['Travaillez-vous avec les bailleurs sociaux ?', 'Oui, de l\'étude du patrimoine à la réalisation, avec un dossier CEE par opération.'],
    ]),
    finalCta(),
  ];
}

function fiche(anchor: string, title: string, image: string, alt: string, html: string): CmsBlock {
  return b(
    'textMedia',
    {
      title,
      html,
      bullets: [],
      buttons: [],
      mediaType: 'image',
      image,
      imageAlt: alt,
      videoSource: 'file',
      mediaPosition: 'right',
      mediaStyle: 'rounded',
      ratio: 'landscape',
      autoplay: false,
    },
    { anchor, background: 'white' }
  );
}

function realisations(): CmsBlock[] {
  return [
    header(
      'Nos réalisations',
      'Quatre projets d\'efficacité énergétique, quatre configurations : un supermarché qui sort du fioul, une moyenne surface sous contrat de performance énergétique, un magasin de grande hauteur, un site pharmaceutique. Pour chacun : l\'enjeu de départ, les solutions retenues, les fiches CEE mobilisées et l\'économie d\'énergie estimée.'
    ),
    fiche(
      'intermarche',
      'Intermarché : sortir du fioul et optimiser le froid',
      IMG.inter,
      'Pompe à chaleur et production de froid chez Intermarché',
      `<p>Bourgogne-Franche-Comté · Grande distribution</p><h3>L'enjeu</h3><p>Un supermarché chauffé par deux chaudières fioul vétustes, une production de froid commercial énergivore et un objectif de décarbonation.</p><h3>Les solutions</h3><p>Pompe à chaleur air/eau en remplacement du fioul. Récupération de chaleur sur le groupe froid. Déstratification d'air de la surface de vente. GTB de classe B. Fermeture des meubles frigorifiques et haute pression flottante.</p><p>Fiches CEE : BAT-TH-163 (Coup de pouce) · BAT-TH-139 · BAT-TH-134 · BAT-TH-116 · BAT-TH-142 · BAT-EQ-124</p><p><strong>14,8 GWh cumac</strong> d'économies d'énergie estimées* · sortie complète du fioul</p>`
    ),
    fiche(
      'carrefour-market',
      'Carrefour Market : froid, chaleur et toiture sous contrat de performance',
      IMG.carrefour,
      'Centrale de froid commercial chez Carrefour Market',
      `<p>Île-de-France · Grande distribution</p><h3>L'enjeu</h3><p>Une centrale de froid commercial de sept compresseurs, le premier poste électrique du magasin, et un objectif de réduction garanti par contrat.</p><h3>Les solutions</h3><p>Récupération de chaleur sur la centrale froid. Régulation haute pression flottante. Isolation de la toiture-terrasse. Fermeture des meubles à température positive et négative.</p><p>Fiches CEE : BAT-TH-139 · BAT-TH-134 · BAT-EN-107 · BAT-EQ-124 · BAT-EQ-125, avec bonification contrat de performance énergétique</p><p><strong>30,6 GWh cumac</strong> d'économies d'énergie estimées* · objectif contractuel −40 % sur le périmètre traité</p>`
    ),
    fiche(
      'cedim',
      'CEDIM : ramener la chaleur au sol',
      IMG.cedim,
      'Déstratificateurs d\'air installés par PEXEN chez CEDIM',
      `<p>Centre-Val de Loire · Négoce et entrepôt</p><h3>L'enjeu</h3><p>Un magasin de plus de 5 mètres sous plafond, chauffé par aérothermes gaz : l'air chaud stagne sous la toiture, le sol reste froid.</p><h3>La solution</h3><p>Trois déstratificateurs d'air qui renvoient la chaleur vers la zone occupée. Fiche CEE : BAT-TH-142.</p><p><strong>2,1 GWh cumac</strong> d'économies d'énergie estimées*</p>`
    ),
    fiche(
      'colorcon',
      'Colorcon : chaufferie vapeur et froid process',
      IMG.colorcon,
      'Réseaux et isolation thermique du site Colorcon',
      `<p>Île-de-France · Industrie pharmaceutique</p><h3>L'enjeu</h3><p>Un site de production pharmaceutique dont les utilités tournent en continu : chaufferie vapeur, production de froid, réseaux de distribution.</p><p>Pistes étudiées : récupération de chaleur, pompe à chaleur en rehausse de chaleur fatale, régulation du groupe froid, brûleur micro-modulant, calorifugeage des réseaux. Fiches CEE étudiées : IND-UT-137 · IND-UT-103 · IND-UT-116 · IND-UT-105 · IND-UT-131.</p>`
    ),
    b('richText', {
      html: `<h2>Comment lire nos chiffres</h2><p>Les volumes affichés sont exprimés en kWh cumac, l'unité officielle des certificats d'économies d'énergie. Ils sont calculés hors bonifications, à partir des fiches standardisées mobilisées sur chaque projet. Les économies mesurées sur les factures seront publiées au fil du suivi des consommations.</p><h2>Nos projets d'efficacité énergétique en chiffres</h2><p>47,5 GWh cumac d'économies d'énergie estimées sur l'ensemble de ces projets*, trois régions, deux secteurs, huit fiches CEE mobilisées sur les projets engagés.</p><p class="text-xs text-slate-500">${MENTION}</p>`,
      size: 'normal',
    }),
    finalCta(),
  ];
}

function approche(): CmsBlock[] {
  return [
    header(
      'Notre approche',
      'Optimiser aujourd\'hui. Performer demain. Derrière chaque site, des installations qui ne s\'arrêtent jamais, et des équipes qui en portent la responsabilité face à des coûts qui augmentent et à des obligations qui se durcissent. PEXEN est né d\'une conviction : la performance énergétique ne se décrète pas, elle s\'ingénie.'
    ),
    b('richText', {
      html: `<h2>Notre mission</h2><p>Faire de la performance énergétique un levier maîtrisé, mesurable et durable pour les sites industriels, tertiaires et résidentiels collectifs. Notre vision : un parc bâti et industriel où chaque kWh économisé est calculé, réalisé et démontré. La performance ne se promet plus, elle se prouve.</p>`,
      size: 'large',
    }),
    b('steps', {
      title: 'Une méthode en 4 étapes, de l\'audit énergétique à la mesure',
      style: 'timeline',
      deliverableLabel: 'Remis',
      buttons: [],
      items: [
        { id: uid('s'), num: '01', title: 'Prévisite & audit', text: 'Relevé des équipements, lecture des factures et des courbes de charge, mesures ponctuelles. Les audits réglementaires sont conduits avec notre partenaire Leo Energy, qualifié OPQIBI 1905 et 1717.', deliverable: 'Pré-étude d\'ingénierie avec le gisement par poste.' },
        { id: uid('s'), num: '02', title: 'Dimensionnement & ingénierie technico-financière', text: 'Notes de calcul, choix des équipements, chiffrage des travaux, calcul des kWh cumac et engagement du dossier CEE avant toute signature.', deliverable: 'Dossier technique, devis, plan de financement.' },
        { id: uid('s'), num: '03', title: 'Installation & mise en service', text: 'Travaux réalisés par nos équipes et nos partenaires qualifiés, phasés pour maintenir l\'exploitation, réglages et essais.', deliverable: 'Procès-verbal de réception.' },
        { id: uid('s'), num: '04', title: 'Contrôle COFRAC, suivi & performance', text: 'Contrôle de l\'opération par un organisme accrédité COFRAC, suivi des consommations, ajustement des réglages.', deliverable: 'Bilan d\'économies d\'énergie.' },
      ],
    }),
    cards('Nos valeurs', undefined, [
      { title: 'Exigence', text: 'La précision de l\'ingénieur, à chaque étape : aucune préconisation sans relevé, une note de calcul signée pour chaque solution.' },
      { title: 'Engagement', text: 'Jusqu\'au résultat, pas jusqu\'à la facture : un livrable à chaque étape, le suivi des consommations après travaux, une réponse sous 48 h ouvrées.' },
      { title: 'Intégrité', text: 'Des chiffres justes, des engagements tenus : une estimation n\'est jamais présentée comme une mesure, les règles CEE et les limites d\'une solution sont dites d\'emblée.' },
    ], 3),
    b('richText', {
      html: `<h2>Ingénierie, travaux et financement réunis</h2><p>Un bureau d'études s'arrête au rapport. Un installateur dimensionne au catalogue. Un intermédiaire CEE ne voit que la prime. PEXEN porte la note de calcul, le chantier et le dossier : le froid, la chaleur, le pilotage et l'isolation traités dans un même projet, par la même équipe.</p><h2>Qualifiés, assurés, contrôlés</h2><ul><li>RGE QualiPAC (chauffage et eau chaude sanitaire) et RGE Qualisol CESI.</li><li>Audits énergétiques via notre partenaire Leo Energy : OPQIBI 1905 et 1717.</li><li>Responsabilité civile professionnelle et garantie décennale : MIC Insurance.</li><li>Opérations contrôlées par des organismes accrédités COFRAC.</li></ul>`,
      size: 'normal',
    }),
    faq('Questions fréquentes sur notre approche', [
      ['L\'audit énergétique est-il payant ?', 'La prévisite et la pré-étude sont définies avec vous lors du premier échange, selon la taille du site et le niveau de détail attendu.'],
      ['Combien de temps dure un projet ?', 'De quelques semaines pour une déstratification à plusieurs mois pour une rénovation de chaufferie ou de centrale froid. Le planning figure dans le dossier de l\'étape 2.'],
      ['Comment mesurez-vous les économies ?', 'Par comparaison des consommations avant et après travaux, corrigées du climat et de l\'activité, à partir de vos compteurs ou de comptages posés pour le projet.'],
    ]),
    finalCta(),
  ];
}

function contact(): CmsBlock[] {
  return [
    b('contactForm', {
      formId: 'contact-main',
      title: 'Parlons de votre projet',
      intro: 'Décrivez votre site, vos installations et vos échéances : un ingénieur ou un chargé d\'affaires PEXEN vous répond sous 48 h ouvrées, avec les premières pistes à étudier. Plus votre description est précise, plus notre première réponse l\'est aussi.',
      phoneLabel: '01 41 93 52 80',
      phoneHint: 'Siège : 111 avenue Victor Hugo, 93300 Aubervilliers. Intervention partout en France métropolitaine.',
      listTitle: 'Ce qui se passe après votre demande',
      listItems: ['Un ingénieur étudie votre demande.', 'Il vous rappelle sous 48 h ouvrées pour préciser le besoin.', 'Nous organisons la prévisite de votre site.'],
      submitLabel: 'Envoyer ma demande',
    }),
    b('richText', {
      html: `<p class="text-xs text-slate-500">Vos données sont traitées par PEXEN pour répondre à votre demande. Vous pouvez exercer vos droits à tout moment : rgpd@pexen.fr.</p>`,
      size: 'normal',
    }, { paddingTop: 'none' }),
  ];
}

function merci(): CmsBlock[] {
  return [
    b('cta', {
      variant: 'light',
      layout: 'centered',
      title: 'Merci, votre demande a bien été envoyée.',
      text: 'Un ingénieur ou un chargé d\'affaires PEXEN vous répond sous 48 h ouvrées. Pour une demande urgente : 01 41 93 52 80.',
      buttons: [button('Voir nos réalisations', '/realisations/', 'primary', 'none'), button('Retour à l\'accueil', '/', 'secondary', 'none')],
    }),
  ];
}

function notFoundNote(): CmsBlock[] {
  return [
    b('cta', {
      variant: 'light',
      layout: 'centered',
      title: 'Cette page n\'existe pas ou a été déplacée.',
      text: 'Le site PEXEN a été refondu : certaines adresses ont changé. Voici les pages les plus consultées.',
      buttons: [
        button('Nos expertises', '/expertises/', 'primary', 'none'),
        button('Nos réalisations', '/realisations/', 'secondary', 'none'),
        button('Parler de votre projet', '/contact/', 'secondary', 'none'),
      ],
    }),
  ];
}

function mentions(): CmsBlock[] {
  return [
    b('richText', {
      html: `<h1>Mentions légales</h1>
<h2>Éditeur du site</h2>
<p>Le site pexen.fr est édité par PEXEN SAS, société par actions simplifiée au capital de 30 000 €.<br>Siège social : 111 avenue Victor Hugo, 93300 Aubervilliers<br>RCS Bobigny 922 217 336 · SIRET 922 217 336 00028<br>TVA intracommunautaire : FR75922217336<br>Téléphone : 01 41 93 52 80 · E-mail : contact@pexen.fr</p>
<h2>Directeur de la publication</h2><p>Jamel Yacouben, Président.</p>
<h2>Hébergement</h2><p>IONOS SARL, 7 place de la Gare, BP 70109, 57201 Sarreguemines Cedex. Téléphone : 09 70 80 89 11.</p>
<h2>Propriété intellectuelle</h2><p>La marque PEXEN®, le logo, les textes, les photographies et la structure du site sont la propriété de PEXEN SAS. Toute reproduction sans autorisation écrite est interdite. Les logos des clients sont reproduits avec leur accord. Les logos de qualification appartiennent à leurs organismes respectifs.</p>
<h2>Chiffres et estimations</h2><p>Les économies d'énergie exprimées en kWh cumac sont des estimations calculées selon les fiches d'opérations standardisées des certificats d'économies d'énergie. Elles ne constituent ni une mesure des consommations réelles ni un engagement de résultat.</p>
<h2>Liens externes</h2><p>Les liens vers des sites tiers sont fournis à titre d'information. PEXEN SAS n'exerce aucun contrôle sur leur contenu.</p>
<h2>Données personnelles et cookies</h2><p>Voir la <a href="/politique-de-confidentialite/">politique de confidentialité</a> et la page <a href="/cookies/">cookies</a>.</p>
<h2>Droit applicable</h2><p>Le présent site est soumis au droit français.</p>`,
      size: 'normal',
    }, { width: 'narrow' }),
  ];
}

function confidentialite(): CmsBlock[] {
  return [
    b('richText', {
      html: `<h1>Politique de confidentialité</h1>
<h2>Responsable du traitement</h2><p>PEXEN SAS, société par actions simplifiée au capital de 30 000 €, 111 avenue Victor Hugo, 93300 Aubervilliers, représentée par Jamel Yacouben, Président. Contact : rgpd@pexen.fr.</p>
<h2>Données collectées</h2><p>Via le formulaire de contact : profil, entreprise, nom et prénom, fonction, e-mail professionnel, téléphone, typologie de site, nature du besoin, localisation, message, origine du contact. Via la mesure d'audience, uniquement avec votre accord : pages consultées, durée de visite, type d'appareil, données de localisation approximative.</p>
<h2>Finalités et bases légales</h2><ul><li>Répondre à votre demande et établir une proposition — mesures précontractuelles (art. 6.1.b du RGPD).</li><li>Suivre la relation commerciale avec les professionnels — intérêt légitime (art. 6.1.f).</li><li>Mesurer l'audience du site — consentement (art. 6.1.a).</li></ul>
<h2>Destinataires</h2><p>Les personnes habilitées de PEXEN. Sous-traitants : IONOS (hébergement, France / Union européenne) et Google Ireland Limited (Google Analytics, uniquement avec votre accord). Vos données ne sont ni vendues ni louées.</p>
<h2>Durées de conservation</h2><p>Demandes de contact et prospects : 3 ans à compter du dernier contact. Clients : durée de la relation contractuelle, puis durée de prescription légale. Données de mesure d'audience : 14 mois.</p>
<h2>Vos droits</h2><p>Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Pour les exercer : rgpd@pexen.fr. Nous répondons sous un mois. Vous pouvez introduire une réclamation auprès de la <a href="https://www.cnil.fr/" target="_blank" rel="noopener">CNIL</a>.</p>
<p>Dernière mise à jour : 18 octobre 2026.</p>`,
      size: 'normal',
    }, { width: 'narrow' }),
  ];
}

function cookies(): CmsBlock[] {
  return [
    b('richText', {
      html: `<h1>Cookies</h1>
<p>Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site. Sur pexen.fr, aucun cookie de mesure n'est déposé sans votre accord.</p>
<h2>Cookies utilisés</h2>
<ul><li>Mémorisation de vos choix de consentement — 6 mois — PEXEN.</li><li>_ga — distinguer les visiteurs (mesure d'audience) — 13 mois — Google, uniquement si vous acceptez.</li><li>_ga_[ID] — conserver l'état de la session — 13 mois — Google, uniquement si vous acceptez.</li></ul>
<h2>Gérer vos choix</h2><p>Vous pouvez modifier votre choix à tout moment avec le lien « Gérer mes cookies » en bas de chaque page. Votre choix est conservé 6 mois.</p>`,
      size: 'normal',
    }, { width: 'narrow' }),
  ];
}

const page = (partial: Omit<BriefPage, 'blocks'> & { blocks: () => CmsBlock[] }): BriefPage => partial;

export function briefPageDefinitions(): BriefPage[] {
  return [
    page({ path: '/', title: 'Accueil', template: 'landing', seoTitle: 'Performance énergétique industrie et tertiaire | PEXEN', metaDescription: 'PEXEN, ingénierie et performance énergétique des sites industriels, tertiaires et résidentiels collectifs : audit, travaux, financement CEE et suivi.', focus: 'performance énergétique', blocks: home }),
    page({ path: '/expertises/', title: 'Expertises', template: 'default', seoTitle: 'Ingénierie énergétique : nos 5 expertises | PEXEN', metaDescription: 'Ingénierie énergétique PEXEN : froid commercial et industriel, récupération de chaleur, pompes à chaleur, GTB/GTC, isolation technique. Étude, travaux, suivi.', focus: 'ingénierie énergétique', blocks: expertises }),
    page({ path: '/expertises/froid-commercial-industriel/', title: 'Froid commercial & industriel', template: 'default', seoTitle: 'Froid commercial et industriel : groupes froids | PEXEN', metaDescription: 'Froid commercial et industriel : haute pression flottante, condensation, variateurs, fermeture des meubles. Jusqu\'à 30 % d\'électricité en moins par groupe froid.', focus: 'froid commercial', blocks: froid }),
    page({ path: '/expertises/recuperation-de-chaleur/', title: 'Récupération de chaleur', template: 'default', seoTitle: 'Récupération de chaleur sur groupe froid et process | PEXEN', metaDescription: 'Récupération de chaleur sur groupe froid, compresseur d\'air et chaleur fatale industrielle : chauffez vos locaux et votre eau avec l\'énergie que vous rejetez.', focus: 'récupération de chaleur', blocks: chaleur }),
    page({ path: '/expertises/pompe-a-chaleur-tertiaire/', title: 'Chauffage & traitement d\'air', template: 'default', seoTitle: 'Pompe à chaleur tertiaire et déstratification | PEXEN', metaDescription: 'Pompe à chaleur tertiaire en remplacement du fioul ou du gaz, bonifiée jusqu\'à ×5 par le Coup de pouce CEE, et déstratification d\'air des grands volumes.', focus: 'pompe à chaleur tertiaire', blocks: pac }),
    page({ path: '/expertises/gtb-tertiaire-gtc/', title: 'Pilotage GTB / GTC', template: 'default', seoTitle: 'GTB tertiaire et décret BACS : classes A et B | PEXEN', metaDescription: 'GTB tertiaire de classe A ou B, conformité au décret BACS (290 kW en 2025, 70 kW en 2030) et prime CEE BAT-TH-116.', focus: 'GTB tertiaire', blocks: gtb }),
    page({ path: '/expertises/isolation-technique/', title: 'Isolation technique', template: 'default', seoTitle: 'Isolation technique : réseaux et toitures | PEXEN', metaDescription: 'Isolation technique des réseaux et des bâtiments : calorifugeage industriel, matelas isolants, toitures-terrasses.', focus: 'isolation technique', blocks: isolation }),
    page({ path: '/expertises/financement-cee-reglementation/', title: 'Réglementation & financement CEE', template: 'default', seoTitle: 'Financement CEE, décret tertiaire et décret BACS | PEXEN', metaDescription: 'Financement CEE de vos travaux, décret tertiaire (−40 % en 2030), décret BACS : obligations, échéances et liste des fiches CEE que nous mobilisons.', focus: 'financement CEE', blocks: cee }),
    page({ path: '/expertises/renovation-globale-tertiaire/', title: 'Rénovation globale tertiaire', template: 'default', seoTitle: 'Rénovation globale tertiaire et CEE | PEXEN', metaDescription: 'Rénovation globale tertiaire : bouquet de travaux, audit et financement CEE par la future fiche dédiée.', noindex: true, status: 'draft', focus: 'rénovation globale tertiaire', blocks: renovation }),
    page({ path: '/secteurs/', title: 'Secteurs', template: 'default', seoTitle: 'Efficacité énergétique par secteur d\'activité | PEXEN', metaDescription: 'Efficacité énergétique des sites industriels, des bâtiments tertiaires et du résidentiel collectif : obligations, gisements et solutions PEXEN par secteur.', focus: 'efficacité énergétique', blocks: secteurs }),
    page({ path: '/secteurs/efficacite-energetique-industrielle/', title: 'Industrie', template: 'default', seoTitle: 'Efficacité énergétique industrielle : froid, chaleur | PEXEN', metaDescription: 'Efficacité énergétique industrielle : froid process, chaleur fatale, vapeur, calorifugeage. Études et travaux sans arrêt de production.', focus: 'efficacité énergétique industrielle', blocks: industrie }),
    page({ path: '/secteurs/efficacite-energetique-tertiaire/', title: 'Tertiaire', template: 'default', seoTitle: 'Efficacité énergétique tertiaire et décret tertiaire | PEXEN', metaDescription: 'Efficacité énergétique tertiaire : grande distribution, bureaux, entrepôts, santé. Atteignez −40 % en 2030 avec le froid, la GTB et le chauffage.', focus: 'efficacité énergétique tertiaire', blocks: tertiaire }),
    page({ path: '/secteurs/renovation-energetique-copropriete/', title: 'Résidentiel collectif', template: 'default', seoTitle: 'Rénovation énergétique copropriété et logement | PEXEN', metaDescription: 'Rénovation énergétique copropriété et logement social : chaufferies collectives, sortie du fioul, équilibrage, rénovation globale BAR-TH-177.', focus: 'rénovation énergétique copropriété', blocks: residentiel }),
    page({ path: '/realisations/', title: 'Réalisations', template: 'default', seoTitle: 'Projets d\'efficacité énergétique : 4 références | PEXEN', metaDescription: 'Projets d\'efficacité énergétique PEXEN : Intermarché, Carrefour Market, CEDIM, Colorcon. Solutions installées, fiches CEE et économies d\'énergie estimées.', focus: 'projets d\'efficacité énergétique', blocks: realisations }),
    page({ path: '/notre-approche/', title: 'Notre approche', template: 'default', seoTitle: 'Audit énergétique, travaux et suivi : notre méthode | PEXEN', metaDescription: 'De l\'audit énergétique au bilan d\'économies : prévisite, ingénierie technico-financière, installation, contrôle COFRAC et suivi.', focus: 'audit énergétique', blocks: approche }),
    page({ path: '/contact/', title: 'Contact', template: 'default', seoTitle: 'Contact : parler de votre projet | PEXEN', metaDescription: 'Contact PEXEN : décrivez votre site et votre besoin, un ingénieur vous répond sous 48 h ouvrées. 01 41 93 52 80.', focus: 'contact PEXEN', blocks: contact }),
    page({ path: '/contact/merci/', title: 'Merci', template: 'default', seoTitle: 'Merci | PEXEN', noindex: true, blocks: merci }),
    page({ path: '/mentions-legales/', title: 'Mentions légales', template: 'legal', seoTitle: 'Mentions légales | PEXEN', metaDescription: 'Mentions légales du site pexen.fr : éditeur, directeur de la publication, hébergeur, propriété intellectuelle.', noindex: true, blocks: mentions }),
    page({ path: '/politique-de-confidentialite/', title: 'Politique de confidentialité', template: 'legal', seoTitle: 'Politique de confidentialité | PEXEN', metaDescription: 'Comment PEXEN collecte, utilise et protège vos données personnelles.', noindex: true, blocks: confidentialite }),
    page({ path: '/cookies/', title: 'Cookies', template: 'legal', seoTitle: 'Cookies | PEXEN', metaDescription: 'Les cookies utilisés sur pexen.fr et comment gérer vos choix.', noindex: true, blocks: cookies }),
  ];
}

export const BRIEF_REDIRECTS: [string, string][] = [
  ['/expertises/froid/', '/expertises/froid-commercial-industriel/'],
  ['/expertises/gtb-gtc/', '/expertises/gtb-tertiaire-gtc/'],
  ['/expertises/reglementation-cee/', '/expertises/financement-cee-reglementation/'],
  ['/expertises/chauffage-traitement-air/', '/expertises/pompe-a-chaleur-tertiaire/'],
  ['/secteurs/industrie/', '/secteurs/efficacite-energetique-industrielle/'],
  ['/secteurs/tertiaire/', '/secteurs/efficacite-energetique-tertiaire/'],
  ['/secteurs/residentiel-collectif/', '/secteurs/renovation-energetique-copropriete/'],
  ['/realisations/intermarche-trevenans/', '/realisations/#intermarche'],
  ['/realisations/colorcon-bazainville/', '/realisations/#colorcon'],
  ['/realisations/carrefour-market/', '/realisations/#carrefour-market'],
  ['/realisations/cedim/', '/realisations/#cedim'],
];

export { notFoundNote };
