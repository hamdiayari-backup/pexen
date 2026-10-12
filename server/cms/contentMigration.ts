/**
 * Migration v2 : toutes les pages du site passent en blocs éditables depuis le backoffice.
 * Reprend à l'identique le contenu des anciennes vues React (accueil, expertises, secteurs,
 * réalisations, approche, contact, merci, pages légales) et crée les sous-pages manquantes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData, ProjectMeta } from './blocks';
import { button, uid } from './blocks';
import { BLOCK_CATALOG, isBlockKind } from './blockCatalog';
import type { CmsBlock, CmsPage, CmsSnapshot, ContactFormField, PageTemplate } from './types';
import { cmsNow, defaultSeoForPath } from './defaults';
import { CEE_SHEETS, EXPERTISES, FAQ_HOME, METHODE_STEPS, REALISATIONS, SECTEURS } from '../../src/data/pexenData';

export const CONTENT_VERSION = 2;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../../public');

/* ------------------------------------------------------------------ Aides */

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return { id: uid('b'), type, data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>, style };
}

const phoneButton = (variant: ButtonData['variant'] = 'secondary'): ButtonData => button('{{telephone}}', 'tel:{{telephoneLien}}', variant, 'phone');
const contactButton = (label = 'Parler de votre projet'): ButtonData => button(label, '/contact/');

const finalCta = (title: string, highlight: string, text: string, withPhone = true) =>
  b('cta', {
    variant: 'dark',
    layout: 'centered',
    title,
    highlight,
    text,
    buttons: withPhone ? [contactButton(), phoneButton()] : [contactButton()],
  });

const EXPERTISE_ICONS: Record<string, string> = {
  froid: 'snowflake',
  'recuperation-de-chaleur': 'flame',
  'chauffage-traitement-air': 'wind',
  'gtb-gtc': 'cpu',
  'isolation-technique': 'shieldCheck',
  'reglementation-cee': 'fileCheck',
};
const EXPERTISE_IMAGES: Record<string, string> = {
  froid: '/images/terrain/meubles_froids.jpg',
  'recuperation-de-chaleur': '/images/terrain/couv_pac_maison.jpg',
  'chauffage-traitement-air': '/images/terrain/rooftop_cta.jpg',
  'gtb-gtc': '/images/terrain/gtb_supervision.jpg',
  'isolation-technique': '/images/terrain/maison_solaire.jpg',
  'reglementation-cee': '/images/terrain/transition_energetique.jpg',
};
const SECTOR_ICONS: Record<string, string> = { industrie: 'factory', tertiaire: 'building', 'residentiel-collectif': 'home' };

/* ------------------------------------------------------------------ Accueil */

function homeBlocks(): CmsBlock[] {
  return [
    b(
      'hero',
      {
        layout: 'split',
        badgeTag: 'CEE',
        badgeText: 'Travaux finançables par les CEE · montage de A à Z',
        title: 'Réduisez durablement la facture énergétique de vos',
        rotatingWords: ['groupes froids.', 'chaufferies.', 'process industriels.', 'bâtiments.'],
        subtitle:
          "Industrie, tertiaire, résidentiel collectif : nous auditons, installons et mesurons les économies de vos installations. Preuves à l'appui, contrôle COFRAC à la clé.",
        buttons: [contactButton(), button('Voir nos réalisations', '/realisations/', 'secondary', 'none')],
        liveText: "Réponse d'un ingénieur sous {{delai}}",
        trustItems: ['RGE Ventilation+', 'RGE Qualisol', 'SOCOTEC Cat. I'],
        media: 'composition',
        mainImage: '/images/terrain/couv_pac_maison.jpg',
        mainImageAlt: 'Réseau électrique, éoliennes et panneaux solaires au coucher du soleil',
        secondaryImage: '/images/terrain/ingenieure_casque.jpg',
        secondaryImageAlt: 'Ingénieure PEXEN sur chantier',
        secondaryCaption: 'Nos équipes sur site',
        statValue: "jusqu'à -35 %",
        statLabel: 'sur la consommation des groupes froids',
        badgeCardTitle: 'Contrôle COFRAC',
        badgeCardText: 'systématique après travaux',
        chipText: '01 Conseil · 02 Ingénierie · 03 Suivi',
        parallax: true,
        marquee: ['Intermarché', 'Colorcon', 'Carrefour Market', 'CEDIM', 'Contrôle COFRAC', 'Fiches CEE', 'Décret BACS', 'Décret Tertiaire'],
      },
      {
        background: 'video',
        backgroundVideo: '/videos/hero_solaire.mp4',
        backgroundImage: '/videos/hero_solaire_poster.jpg',
        overlayTone: 'light',
        overlay: 55,
        decor: 'none',
        paddingTop: 'sm',
        paddingBottom: 'lg',
      }
    ),
    b(
      'projects',
      {
        eyebrow: 'Preuves de terrain',
        title: 'Nos réalisations,',
        highlight: 'résultats mesurés.',
        intro: 'Grande distribution, industrie pharmaceutique, plateformes logistiques : des chantiers réels, en site exploité.',
        headerLinkLabel: 'Toutes nos réalisations',
        headerLink: '/realisations/',
        layout: 'featured',
        showFilters: false,
        limit: 4,
      },
      { background: 'surface', decor: 'dots' }
    ),
    b(
      'cta',
      {
        variant: 'gradient',
        layout: 'split',
        eyebrow: 'Éligibilité CEE',
        title: 'Vos travaux sont peut-être déjà financés.',
        highlight: 'Vérifions-le ensemble.',
        buttons: [button("Étude d'éligibilité gratuite", '/contact/', 'dark'), phoneButton('glass')],
        image: '/images/terrain/ingenieur_tablette.jpg',
        imageAlt: 'Centrale solaire au coucher du soleil',
        imageCaption: "De l'étude au chantier",
      },
      { background: 'white', paddingTop: 'sm', paddingBottom: 'sm' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Vos enjeux, nos réponses',
        title: 'Vos consommations sont un coût.',
        highlight: 'Elles deviennent une obligation.',
        style: 'hoverDark',
        columns: 2,
        textPrefix: 'Réponse PEXEN —',
        items: [
          {
            id: uid('c'),
            icon: 'trendingDown',
            title: 'Des factures énergétiques trop élevées',
            text: 'Nous identifions vos postes les plus consommateurs (froid, chauffage, process) et engageons les actions au meilleur retour sur investissement.',
            tags: [],
            linkLabel: 'Voir les solutions',
            link: '/expertises/',
          },
          {
            id: uid('c'),
            icon: 'shieldAlert',
            title: 'Des obligations réglementaires (Décrets Tertiaire & BACS)',
            text: 'Nous vous aidons à atteindre vos objectifs et à sécuriser votre conformité sans perturber vos exploitations.',
            tags: [],
            linkLabel: 'Comprendre les décrets',
            link: '/expertises/reglementation-cee/',
          },
          {
            id: uid('c'),
            icon: 'wrench',
            title: 'Des installations techniques vieillissantes',
            text: 'Groupes froids, chaufferies fioul, réseaux mal isolés : nous modernisons vos équipements sans interrompre votre activité.',
            tags: [],
            linkLabel: 'Nos technologies',
            link: '/expertises/',
          },
          {
            id: uid('c'),
            icon: 'badgePercent',
            title: 'Un budget travaux à financer',
            text: 'Nous montons et valorisons vos dossiers CEE pour réduire le reste à charge de vos travaux au strict minimum.',
            tags: [],
            linkLabel: 'Voir le montage CEE',
            link: '/expertises/reglementation-cee/',
          },
        ],
      },
      { background: 'white', decor: 'rings', paddingTop: 'sm' }
    ),
    b(
      'showcase',
      {
        eyebrow: 'Nos expertises',
        title: 'Froid, chaleur, pilotage, isolation :',
        highlight: 'agir sur chaque kWh.',
        headerLinkLabel: 'Toutes les expertises',
        headerLink: '/expertises/',
        interval: 6,
        items: EXPERTISES.map((e) => ({
          id: uid('sh'),
          icon: EXPERTISE_ICONS[e.slug],
          title: e.title,
          text: e.shortDesc,
          image: EXPERTISE_IMAGES[e.slug],
          chips: e.solutions.slice(0, 4).map((s) => s.title),
          buttonLabel: "Découvrir l'expertise",
          link: `/expertises/${e.slug}/`,
        })),
      },
      { background: 'soft', decor: 'diagonal', borderTop: true }
    ),
    b(
      'simulator',
      { eyebrow: 'Simulateur', title: 'Estimez votre potentiel', highlight: 'en quelques clics.', align: 'center' },
      { background: 'white', decor: 'grid', paddingBottom: 'md' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Notre méthode',
        title: '4 étapes,',
        highlight: 'un livrable à chacune.',
        align: 'center',
        style: 'timeline',
        deliverableLabel: 'Document remis',
        items: METHODE_STEPS.map((s) => ({ id: uid('st'), num: s.num, title: s.title, text: s.description, deliverable: s.deliverable })),
        buttons: [contactButton(), button('Découvrir notre approche complète', '/notre-approche/', 'link')],
      },
      { background: 'soft', decor: 'dots', borderTop: true }
    ),
    b(
      'gallery',
      {
        eyebrow: 'Sur le terrain',
        title: 'Des installations réelles,',
        highlight: 'photographiées sur site.',
        intro: "Le monde de l'énergie tel qu'il est vraiment : installations, réseaux et équipements photographiés sur le terrain.",
        style: 'polaroid',
        handNote: 'faites défiler →',
        note: "Photos de chantiers PEXEN et illustrations techniques d'installations réelles (Wikimedia Commons, licences CC BY / CC BY-SA / CC0).",
        items: [
          ['ingenieur_tablette.jpg', 'Centrale solaire au couchant'],
          ['couv_pac_maison.jpg', 'Réseau, nucléaire & renouvelables'],
          ['pac_exterieur.jpg', 'Éolien, solaire & réseau électrique'],
          ['meubles_froids.jpg', 'Meubles froids — grande distribution'],
          ['transition_energetique.jpg', 'Réseaux & transition énergétique'],
          ['gaz_renouvelable.jpg', 'Parc éolien en montagne'],
          ['gtb_supervision.jpg', 'Supervision GTB en exploitation'],
          ['ferme_solaire_eolienne.jpg', 'Ferme solaire & éolienne'],
          ['maison_solaire.jpg', 'Éolienne au coucher du soleil'],
          ['ampoule_led.jpg', 'Sobriété — relamping LED'],
          ['mix_energetique.jpg', 'Le mix énergétique en mutation'],
          ['panneau_solaire.jpg', 'Autoproduction solaire'],
        ].map(([file, caption]) => ({ id: uid('g'), image: `/images/terrain/${file}`, caption })),
      },
      { background: 'white', paddingBottom: 'md' }
    ),
    b(
      'cta',
      {
        variant: 'dark',
        layout: 'split',
        badge: 'Échéance dans {{ans2030}}',
        title: 'Décret Tertiaire & BACS : votre site est-il prêt ?',
        text: '-40 % en 2030, -50 % en 2040, -60 % en 2050. GTB obligatoire au-delà de 290 kW, puis 70 kW en 2030.',
        bigNumber: '-40%',
        bigNumberLabel: 'de consommation',
        bigNumberStrong: 'exigés en 2030',
        backgroundImage: '/images/terrain/mix_energetique.jpg',
        buttons: [button('Vérifier ma conformité', '/expertises/reglementation-cee/')],
      },
      { background: 'white', paddingTop: 'sm', paddingBottom: 'sm' }
    ),
    b(
      'panels',
      {
        eyebrow: 'Secteurs',
        title: 'Industrie, tertiaire,',
        highlight: 'résidentiel collectif.',
        headerLinkLabel: 'Tous les secteurs',
        headerLink: '/secteurs/',
        items: SECTEURS.map((s) => ({
          id: uid('p'),
          icon: SECTOR_ICONS[s.slug],
          image: s.image,
          title: s.title,
          text: s.shortDesc,
          bullets: s.enjeux.slice(0, 2),
          linkLabel: 'Découvrir le secteur',
          link: `/secteurs/${s.slug}/`,
        })),
      },
      { background: 'white', decor: 'rings', paddingTop: 'sm' }
    ),
    b(
      'stats',
      {
        eyebrow: 'PEXEN en chiffres',
        title: 'Des engagements',
        highlight: 'vérifiés par des tiers.',
        style: 'cards',
        countUp: true,
        items: [
          { id: uid('k'), prefix: '-', value: '35', suffix: ' %', label: 'de consommation électrique', hint: "Jusqu'à, sur groupes froids et régulations HP" },
          { id: uid('k'), value: '100', suffix: ' %', label: 'dossiers CEE sécurisés', hint: 'Prise en charge administrative de A à Z' },
          { id: uid('k'), value: '48', suffix: ' h', label: 'délai de réponse', hint: "Contact direct avec un ingénieur d'études" },
          { id: uid('k'), value: 'France', label: 'déploiement national', hint: 'Interventions sur tout le territoire' },
        ],
      },
      { background: 'image', backgroundImage: '/images/terrain/ferme_solaire_eolienne.jpg', overlayTone: 'light', overlay: 85, borderTop: true, paddingBottom: 'sm' }
    ),
    b(
      'cta',
      {
        variant: 'light',
        layout: 'split',
        eyebrow: 'Partenaires CEE',
        title: 'Mandataires, délégataires, fournisseurs : travaillons ensemble.',
        text: 'Montage rigoureux des dossiers CEE, chantiers contrôlés par un organisme accrédité COFRAC, qualifications à jour : un partenaire fiable pour vos opérations.',
        buttons: [button('Devenir partenaire', '/contact/', 'secondary')],
      },
      { background: 'surface', paddingTop: 'none', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        eyebrow: 'Garanties',
        title: 'Qualifiés, assurés,',
        highlight: 'contrôlés.',
        cards: [
          {
            id: uid('ck'),
            icon: 'shieldCheck',
            tag: 'Qualifications PEXEN',
            entries: [
              ['RGE Ventilation+', "Traitement d'air haute performance"],
              ['RGE Qualisol CESI', 'Solaire thermique & ECS'],
              ['SOCOTEC Fluides Cat. I', 'Manipulation et mise en service froid'],
            ].map(([title, text]) => ({ id: uid('e'), title, text })),
          },
          {
            id: uid('ck'),
            icon: 'award',
            tag: "Bureau d'études partenaire",
            entries: [
              ['OPQIBI 1717', "Audit énergétique dans l'industrie"],
              ['OPQIBI 1905', 'Audit tertiaire et collectif'],
              ['Leo Energy', "Bureau d'études partenaire"],
            ].map(([title, text]) => ({ id: uid('e'), title, text })),
          },
          {
            id: uid('ck'),
            icon: 'check',
            tag: 'Assurances & contrôle',
            entries: [
              ['MIC Insurance', 'Responsabilité Civile Professionnelle'],
              ['Garantie décennale', 'Travaux et ouvrages techniques'],
              ['Contrôle COFRAC', 'Systématique post-travaux'],
            ].map(([title, text]) => ({ id: uid('e'), title, text })),
          },
        ],
      },
      { background: 'white', decor: 'diagonal' }
    ),
    b(
      'faq',
      {
        eyebrow: 'FAQ',
        title: 'Questions fréquentes',
        intro: "Interventions, délais, financements : l'essentiel avant de lancer votre projet.",
        layout: 'split',
        showContactCard: true,
        contactLabel: 'Une autre question ?',
        items: FAQ_HOME.map((f) => ({ id: uid('q'), question: f.question, answer: `<p>${f.answer}</p>` })),
      },
      { background: 'surface', decor: 'dots', borderTop: true }
    ),
    b(
      'cta',
      {
        variant: 'dark',
        layout: 'centered',
        badge: 'Réponse sous {{delai}}',
        title: 'Un projet ?',
        highlight: 'Parlons-en.',
        text: "Audit préliminaire, étude de dimensionnement ou montage CEE : un ingénieur PEXEN analyse votre site et vous propose un plan d'action chiffré.",
        buttons: [contactButton(), phoneButton()],
      },
      { background: 'white', paddingTop: 'md' }
    ),
  ];
}

/* ------------------------------------------------------------------ Expertises */

const methodCompact = () =>
  b('steps', {
    title: "Notre méthode d'intervention en 4 étapes",
    intro: "De l'audit initial au contrôle d'étanchéité et mesure COFRAC.",
    style: 'compact',
    deliverableLabel: 'Document',
    items: METHODE_STEPS.map((s) => ({ id: uid('st'), num: s.num, title: s.title, text: s.description, deliverable: s.deliverable })),
  });

function expertisesBlocks(): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      title: 'Nos expertises en performance énergétique',
      intro:
        "Chaque intervention PEXEN commence par l'analyse de vos installations. Nous choisissons la solution adaptée, la dimensionnons, l'installons et mesurons les économies.",
    }),
    b(
      'cards',
      {
        style: 'card',
        columns: 3,
        tagsLabel: 'Solutions & Fiches :',
        items: EXPERTISES.map((e) => ({
          id: uid('c'),
          icon: EXPERTISE_ICONS[e.slug],
          title: e.title,
          text: e.shortDesc,
          tags: e.ceeList.slice(0, 3),
          linkLabel: "Découvrir l'expertise",
          link: `/expertises/${e.slug}/`,
        })),
      },
      { paddingTop: 'sm' }
    ),
    finalCta('Un projet ?', 'Parlons-en.', 'Nos experts vous répondent sous {{delai}}.'),
  ];
}

function expertiseBlocks(slug: string): CmsBlock[] {
  const e = EXPERTISES.find((x) => x.slug === slug)!;
  const blocks: CmsBlock[] = [
    b('pageHeader', {
      breadcrumb: true,
      parentLabel: 'Expertises',
      parentLink: '/expertises/',
      title: e.heroTitle,
      intro: e.shortDesc,
      buttons: [contactButton()],
      image: EXPERTISE_IMAGES[slug],
      imageAlt: e.title,
    }),
    b(
      'cards',
      {
        title: 'Nos solutions techniques déployées',
        style: 'card',
        columns: 2,
        tagsLabel: 'Fiches CEE éligibles :',
        items: e.solutions.map((s) => ({ id: uid('c'), title: s.title, text: s.description, tags: [s.ceeFiches] })),
      },
      { paddingTop: 'sm' }
    ),
  ];
  if (slug === 'reglementation-cee') {
    blocks.push(
      b(
        'table',
        {
          title: 'Répertoire officiel des Fiches CEE PEXEN',
          intro: "Recherchez par nom d'équipement ou code officiel (ex: BAT-TH-134, IND-UT-116).",
          searchable: true,
          searchPlaceholder: 'Rechercher une fiche…',
          columns: ['Solution technique', 'Fiche Tertiaire', 'Fiche Industrie', 'Gains énergétiques typiques', 'Prise en charge CEE'],
          rows: CEE_SHEETS.map((c) => ({ id: uid('r'), cells: [c.name, c.codeTertiaire, c.codeIndustrie, c.typicalSavings, c.coverageEstimate] })),
        },
        { paddingTop: 'sm' }
      )
    );
  }
  blocks.push(
    methodCompact(),
    b(
      'projects',
      { title: 'Chantiers associés', headerLinkLabel: 'Voir toutes les réalisations', headerLink: '/realisations/', layout: 'compact', showFilters: false, limit: 3 },
      { paddingTop: 'sm' }
    ),
    finalCta(`Un projet concernant ${e.title.toLowerCase()} ?`, '', 'Nos ingénieurs analysent votre relevé technique sous {{delai}}.')
  );
  return blocks;
}

/* ------------------------------------------------------------------ Secteurs */

function secteursBlocks(): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      title: "Nos secteurs d'intervention",
      intro:
        'PEXEN intervient exclusivement auprès des professionnels : usines, grande distribution, parcs tertiaires et gestionnaires de copropriétés partout en France.',
    }),
    b(
      'cards',
      {
        style: 'image',
        columns: 3,
        tagsLabel: 'Équipements types :',
        items: SECTEURS.map((s) => ({
          id: uid('c'),
          image: s.image,
          title: s.title,
          text: s.shortDesc,
          tags: s.typicalEquipments,
          linkLabel: 'Découvrir le secteur',
          link: `/secteurs/${s.slug}/`,
        })),
      },
      { paddingTop: 'sm' }
    ),
    finalCta('Un projet sur votre site ?', 'Parlons-en.', 'Nos ingénieurs vous répondent sous {{delai}}.'),
  ];
}

function secteurBlocks(slug: string): CmsBlock[] {
  const s = SECTEURS.find((x) => x.slug === slug)!;
  const hasProjects = REALISATIONS.some((r) => r.sector === s.title);
  return [
    b('pageHeader', {
      breadcrumb: true,
      parentLabel: 'Secteurs',
      parentLink: '/secteurs/',
      title: s.heroTitle,
      intro: s.metaDesc,
      buttons: [contactButton()],
      image: s.image,
      imageAlt: s.title,
    }),
    b('cards', { title: 'Vos enjeux prioritaires', style: 'numbered', columns: 3, items: s.enjeux.map((text) => ({ id: uid('c'), title: '', text, tags: [] })) }, { paddingTop: 'sm' }),
    b(
      'cards',
      {
        title: 'Nos réponses techniques adaptées',
        style: 'minimal',
        columns: 3,
        items: s.solutions.map((sol) => ({
          id: uid('c'),
          icon: EXPERTISE_ICONS[sol.slug],
          title: sol.title,
          text: 'Expertise PEXEN',
          tags: [],
          linkLabel: 'Voir la solution',
          link: `/expertises/${sol.slug}/`,
        })),
      },
      { paddingTop: 'sm' }
    ),
    ...(hasProjects
      ? [
          b(
            'projects',
            {
              title: `Chantiers ${s.title}`,
              headerLinkLabel: 'Voir toutes les réalisations',
              headerLink: '/realisations/',
              layout: 'grid',
              filter: 'sector',
              sector: s.title,
              showFilters: false,
              limit: 0,
            },
            { paddingTop: 'sm' }
          ),
        ]
      : []),
    finalCta(`Un projet ${s.title.toLowerCase()} ?`, '', 'Nos ingénieurs vous répondent sous {{delai}}.'),
  ];
}

/* ------------------------------------------------------------------ Réalisations */

function realisationsBlocks(): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      title: 'Nos réalisations en performance énergétique',
      intro: 'Grande distribution, industrie pharmaceutique, entrepôts : découvrez les chantiers audités, réalisés et suivis par PEXEN partout en France.',
    }),
    b('projects', { layout: 'grid', filter: 'all', showFilters: true, limit: 0 }, { paddingTop: 'sm' }),
    finalCta('Vous souhaitez des résultats comparables sur votre site ?', '', 'Nos ingénieurs réalisent un audit préliminaire sans engagement.', false),
  ];
}

function projectMeta(r: (typeof REALISATIONS)[number], featured: boolean): ProjectMeta {
  return {
    client: r.client,
    location: r.location,
    department: r.department,
    sector: r.sector,
    solution: r.solution,
    summary: r.shortDescription,
    image: r.image,
    ceeSheet: r.ceeSheet,
    results: r.results,
    featured,
  };
}

function projectBlocks(r: (typeof REALISATIONS)[number]): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      parentLabel: 'Réalisations',
      parentLink: '/realisations/',
      backLabel: 'Retour à toutes les réalisations',
      backLink: '/realisations/',
      eyebrow: `${r.sector} · ${r.location} (${r.department})`,
      title: `${r.solution} — ${r.client}, ${r.location}`,
      intro: r.shortDescription,
    }),
    b('image', { url: r.image, alt: `${r.solution} sur le site ${r.client}`, width: 'wide', rounded: true }, { paddingTop: 'none', paddingBottom: 'sm' }),
    b('stats', { style: 'strip', countUp: false, items: r.metrics.map((m) => ({ id: uid('k'), label: m.label, value: m.value })) }, { paddingTop: 'none', paddingBottom: 'sm' }),
    b(
      'details',
      {
        sections: [
          { id: uid('s'), title: 'Le contexte & la problématique initiale', text: r.problem, bullets: [] },
          { id: uid('s'), title: "La solution d'ingénierie PEXEN", text: r.solutionDetail, bullets: [] },
          { id: uid('s'), title: 'Les résultats & performances mesurées', text: '', bullets: r.results },
        ],
        sideTitle: 'Fiche synthèse chantier',
        facts: [
          ['Client', r.client],
          ['Localisation', `${r.location} (${r.department})`],
          ['Secteur', r.sector],
          ['Fiche CEE', r.ceeSheet || 'Standard CEE'],
          ['Contrôle', 'Audit COFRAC'],
        ].map(([label, value]) => ({ id: uid('f'), label, value })),
        sideButton: button('Étudier un projet similaire', '/contact/'),
      },
      { paddingTop: 'sm' }
    ),
    finalCta('Un projet similaire ?', 'Parlons-en.', 'Nos ingénieurs vous répondent sous {{delai}}.'),
  ];
}

/* ------------------------------------------------------------------ Approche, contact, merci */

function approcheBlocks(): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      eyebrow: "Optimiser aujourd'hui. Performer demain.",
      title: 'Conseil, ingénierie et suivi opérationnel',
      intro:
        "Plus qu'un simple accompagnement, PEXEN conjugue innovation, expertise et fiabilité grâce à son triptyque Conseil, Ingénierie et Suivi opérationnel, sur l'ensemble du territoire national.",
      buttons: [contactButton()],
    }),
    b(
      'steps',
      {
        title: 'Notre méthode en 4 étapes',
        intro: "Une démarche rigoureuse sans rupture d'activité avec un engagement contractuel à chaque jalon.",
        style: 'list',
        deliverableLabel: 'Document contractuel remis',
        items: METHODE_STEPS.map((s) => ({ id: uid('st'), num: s.num, title: s.title, text: s.description, deliverable: s.deliverable })),
      },
      { paddingTop: 'sm' }
    ),
    b(
      'checklist',
      {
        title: 'Qualifications et garanties',
        intro: "Les accréditations qui sécurisent vos dossiers et garantissent l'éligibilité CEE.",
        cards: [
          {
            id: uid('ck'),
            icon: 'shieldCheck',
            tag: 'Certifications PEXEN',
            title: 'Qualifications déposées',
            entries: ['RGE Ventilation+', 'RGE Qualisol CESI', 'SOCOTEC Fluides Frigorigènes Cat. I'].map((title) => ({ id: uid('e'), title })),
          },
          {
            id: uid('ck'),
            icon: 'award',
            tag: "Bureau d'études partenaire",
            title: 'Leo Energy',
            entries: ['OPQIBI 1717 — Audit énergétique industrie', 'OPQIBI 1905 — Audit tertiaire & collectif'].map((title) => ({ id: uid('e'), title })),
          },
          {
            id: uid('ck'),
            icon: 'check',
            tag: 'Assurances',
            title: 'MIC Insurance',
            entries: ["RC Professionnelle travaux d'ingénierie", 'Garantie Décennale installations'].map((title) => ({ id: uid('e'), title })),
          },
        ],
      },
      { paddingTop: 'sm' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Notre équipe',
        title: 'Une équipe pluridisciplinaire',
        highlight: 'mobilisée sur vos chantiers.',
        html: "<p>Ingénieurs thermiciens, experts frigoristes certifiés catégorie I, chargés d'affaires CEE et techniciens de mise en service : une équipe pluridisciplinaire d'ingénierie mobilisée sur vos chantiers.</p>",
        bullets: ['Ingénieurs thermiciens', 'Frigoristes certifiés catégorie I', "Chargés d'affaires CEE", 'Techniciens de mise en service'],
        mediaType: 'image',
        image: '/images/terrain/ingenieure_casque.jpg',
        imageAlt: 'Ingénieure PEXEN sur chantier',
        mediaPosition: 'right',
        mediaStyle: 'polaroid',
        caption: 'Nos équipes sur site',
        ratio: 'landscape',
      },
      { background: 'surface' }
    ),
    finalCta('Un projet ?', 'Parlons-en.', 'Nos experts vous répondent sous {{delai}}.'),
  ];
}

function contactBlocks(): CmsBlock[] {
  return [
    b(
      'contactForm',
      {
        formId: 'contact-main',
        title: 'Parlons de votre projet',
        intro: "Présentez-nous votre site et votre problématique. Un ingénieur ou chargé d'affaires vous répond sous {{delai}}.",
        phoneLabel: 'Ligne directe experts',
        phoneHint: 'Engagement de rappel sous {{delai}}',
        listTitle: 'Qualifications & Habilitations',
        listItems: ['RGE Ventilation+', 'RGE Qualisol CESI', 'SOCOTEC Fluides Frigorigènes Catégorie I'],
        submitLabel: 'Envoyer ma demande',
      },
      { background: 'none', paddingTop: 'md' }
    ),
  ];
}

function merciBlocks(): CmsBlock[] {
  return [
    b(
      'cta',
      {
        variant: 'light',
        layout: 'centered',
        badge: 'Demande envoyée',
        title: 'Merci, votre demande',
        highlight: 'a bien été envoyée.',
        text: "Un ingénieur ou chargé d'affaires PEXEN vous répond sous {{delai}}. Pour toute demande urgente, vous pouvez joindre directement notre permanence technique au {{telephone}}.",
        buttons: [button('Voir nos réalisations', '/realisations/'), button("Retour à l'accueil", '/', 'secondary', 'none'), phoneButton('link')],
      },
      { background: 'none', paddingTop: 'lg', paddingBottom: 'xl' }
    ),
  ];
}

/* ------------------------------------------------------------------ Pages légales */

const LEGAL: Record<string, { title: string; intro: string; html: string; cookiesButton?: boolean }> = {
  '/mentions-legales/': {
    title: 'Mentions légales',
    intro:
      "Dernière mise à jour : 2 octobre 2026 — Conformément aux dispositions des articles 6-III et 19 de la Loi n° 2004-575 du 21 juin 2004 pour la Confiance dans l'économie numérique (L.C.E.N.).",
    html: `<h2>1. Éditeur de la plateforme</h2>
<p>Le site <strong>pexen.fr</strong> est édité par la société <strong>PEXEN SAS</strong>, société par actions simplifiée au capital social de 50 000 €, immatriculée au Registre du Commerce et des Sociétés sous le numéro RCS Paris B 912 345 678.</p>
<ul><li>Siège social : Paris, France</li><li>Numéro de TVA intracommunautaire : FR 12 912345678</li><li>Téléphone : {{telephone}}</li><li>Directeur de la publication : Direction Générale PEXEN</li></ul>
<h2>2. Hébergement</h2>
<p>Le site est hébergé par la société <strong>Ionos SE</strong> :</p>
<ul><li>Adresse : Elgendorfer Str. 57, 56410 Montabaur, Allemagne</li><li>Téléphone : 09 70 80 89 11</li><li>Site web : ionos.fr</li></ul>
<h2>3. Propriété intellectuelle &amp; Marque PEXEN®</h2>
<p>L'ensemble des éléments constituant ce site (textes, méthodologies, logotypes, charte graphique, photographies de chantiers, fiches synthèses CEE) sont la propriété exclusive de PEXEN SAS ou font l'objet d'une autorisation préalable expresse. La marque <strong>PEXEN®</strong> est une marque déposée protégée. Toute reproduction, représentation ou exploitation non autorisée constitue une contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la propriété intellectuelle.</p>
<p>Les dénominations commerciales et logos de tiers (clients, partenaires) mentionnés sur le site sont utilisés avec leur accord ou à titre de référence contractuelle vérifiée.</p>
<h2>4. Partenariat d'ingénierie &amp; qualifications</h2>
<p>Les qualifications d'ingénierie et d'audit énergétique <strong>OPQIBI 1717</strong> et <strong>OPQIBI 1905</strong> sont détenues et opérées par notre bureau d'études partenaire <strong>Leo Energy</strong>, dans le cadre de nos accords de cotraitance et d'assistance technique.</p>
<h2>5. Limitation de responsabilité</h2>
<p>Les simulations énergétiques et estimations CEE fournies sur le site ont un caractère informatif et ne constituent pas un engagement contractuel préalable. Tout dimensionnement définitif fait l'objet d'un audit terrain formalisé et d'un contrat d'ingénierie visé par nos experts.</p>`,
  },
  '/politique-de-confidentialite/': {
    title: 'Politique de confidentialité',
    intro: 'Conforme au Règlement Général sur la Protection des Données (RGPD 2016/679) et à la loi Informatique et Libertés.',
    html: `<h2>1. Responsable de traitement</h2>
<p>Le responsable du traitement des données personnelles collectées via le site pexen.fr est la société <strong>PEXEN SAS</strong>, joignable par téléphone au {{telephone}}.</p>
<h2>2. Données collectées &amp; finalités</h2>
<p>Dans le cadre de l'utilisation de notre formulaire de contact et de dimensionnement, nous collectons les données professionnelles strictement nécessaires : nom, prénom, adresse e-mail professionnelle, numéro de téléphone, entreprise, fonction, typologie du site et descriptif du besoin.</p>
<p>Ces données sont traitées pour :</p>
<ul><li>Répondre sous {{delai}} à vos demandes d'études techniques et de devis.</li><li>Instruire les pré-études d'éligibilité aux Certificats d'Économies d'Énergie (CEE).</li><li>Le suivi de la relation commerciale B2B.</li></ul>
<h2>3. Durée de conservation</h2>
<p>Les données relatives à une demande de contact ou de projet sont conservées pendant une durée maximale de <strong>3 ans</strong> à compter du dernier contact émanant du prospect ou client.</p>
<h2>4. Vos droits &amp; contact CNIL</h2>
<p>Conformément à la réglementation en vigueur, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation et d'opposition au traitement de vos données. Vous pouvez exercer ces droits en nous adressant une demande par téléphone ou courrier. Vous conservez également le droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL, cnil.fr).</p>`,
  },
  '/cookies/': {
    title: 'Gestion des cookies',
    intro: "Transparence totale : maîtrisez vos choix de navigation et de mesure d'audience.",
    html: `<h2>Mesurer, c'est notre métier.</h2>
<p>Ce site utilise des traceurs afin d'assurer son bon fonctionnement et, sous réserve de votre consentement explicite, de mesurer l'audience globale via Google Analytics 4 (Google Consent Mode v2 respecté).</p>
<h3>1. Cookies techniques indispensables (toujours actifs)</h3>
<p>Nécessaires à l'enregistrement de vos préférences de consentement, à la sécurité et à la fluidité de navigation. Ils ne requièrent pas de consentement préalable.</p>
<h3>2. Cookies de mesure d'audience (désactivés par défaut)</h3>
<p>Google Analytics 4 nous permet d'analyser anonymement le volume de fréquentation et les pages consultées afin d'optimiser l'ergonomie. Aucun cookie de mesure n'est déposé sans votre clic sur « Tout accepter ».</p>`,
    cookiesButton: true,
  },
};

function legalBlocks(p: string): CmsBlock[] {
  const l = LEGAL[p];
  return [
    b('pageHeader', { breadcrumb: true, backLabel: "Retour à l'accueil", backLink: '/', title: l.title, intro: l.intro }, { width: 'narrow', paddingBottom: 'sm' }),
    b('richText', { html: l.html, size: 'normal' }, { width: 'narrow', paddingTop: 'none', paddingBottom: l.cookiesButton ? 'sm' : 'xl' }),
    ...(l.cookiesButton
      ? [
          b(
            'cta',
            {
              variant: 'light',
              layout: 'split',
              title: 'Vos préférences',
              text: 'Vous pouvez modifier votre choix à tout moment.',
              buttons: [button('Modifier mes préférences cookies', '#preferences-cookies', 'primary', 'none')],
            },
            { width: 'narrow', paddingTop: 'none', paddingBottom: 'xl' }
          ),
        ]
      : []),
  ];
}

/* ------------------------------------------------------------------ Définition des pages */

interface PageDef {
  path: string;
  title: string;
  template: PageTemplate;
  seoTitle: string;
  metaDescription?: string;
  noindex?: boolean;
  blocks: () => CmsBlock[];
  project?: ProjectMeta;
}

function pageDefinitions(): PageDef[] {
  const defs: PageDef[] = [
    { path: '/', title: 'Accueil', template: 'landing', seoTitle: 'PEXEN | Ingénierie & performance énergétique', blocks: homeBlocks },
    { path: '/expertises/', title: 'Expertises', template: 'default', seoTitle: 'Nos expertises en performance énergétique | PEXEN', blocks: expertisesBlocks },
    ...EXPERTISES.map<PageDef>((e) => ({
      path: `/expertises/${e.slug}/`,
      title: e.title,
      template: 'default',
      seoTitle: `${e.heroTitle} | PEXEN`,
      metaDescription: e.metaDesc,
      blocks: () => expertiseBlocks(e.slug),
    })),
    { path: '/secteurs/', title: 'Secteurs', template: 'default', seoTitle: 'Industrie, tertiaire, résidentiel collectif | PEXEN', blocks: secteursBlocks },
    ...SECTEURS.map<PageDef>((s) => ({
      path: `/secteurs/${s.slug}/`,
      title: s.title,
      template: 'default',
      seoTitle: `${s.heroTitle} | PEXEN`,
      metaDescription: s.metaDesc,
      blocks: () => secteurBlocks(s.slug),
    })),
    { path: '/realisations/', title: 'Réalisations', template: 'default', seoTitle: 'Nos réalisations en performance énergétique | PEXEN', blocks: realisationsBlocks },
    ...REALISATIONS.map<PageDef>((r, i) => ({
      path: `/realisations/${r.slug}/`,
      title: `${r.client} — ${r.location}`,
      template: 'project',
      seoTitle: `${r.solution} — ${r.client} | PEXEN`,
      metaDescription: r.shortDescription,
      blocks: () => projectBlocks(r),
      project: projectMeta(r, i === 0),
    })),
    { path: '/notre-approche/', title: 'Notre approche', template: 'default', seoTitle: 'Notre approche : conseil, ingénierie, suivi | PEXEN', blocks: approcheBlocks },
    { path: '/contact/', title: 'Contact', template: 'default', seoTitle: 'Contact : parlez de votre projet | PEXEN', blocks: contactBlocks },
    { path: '/contact/merci/', title: 'Merci', template: 'default', seoTitle: 'Merci pour votre demande | PEXEN', noindex: true, blocks: merciBlocks },
    ...Object.entries(LEGAL).map<PageDef>(([p, l]) => ({ path: p, title: l.title, template: 'legal', seoTitle: `${l.title} | PEXEN`, blocks: () => legalBlocks(p) })),
  ];
  return defs;
}

/* ------------------------------------------------------------------ Blocs hérités (v1) */

type Legacy = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Convertit les blocs du premier éditeur (hero/cta/stats simplifiés) vers le modèle actuel. */
export function upgradeLegacyBlock(block: CmsBlock): CmsBlock | null {
  if (!isBlockKind(block.type)) return null;
  const d = (block.data || {}) as Legacy;
  switch (block.type) {
    case 'hero':
      if (!('ctaLabel' in d) && !('variant' in d) && !('backgroundStyle' in d)) return block;
      return {
        id: block.id,
        type: 'hero',
        data: {
          ...BLOCK_CATALOG.hero.defaults(),
          layout: 'centered',
          badgeText: str(d.eyebrow),
          badgeTag: '',
          title: str(d.title),
          subtitle: str(d.subtitle),
          media: 'none',
          buttons: [
            ...(d.ctaLabel && d.ctaPath ? [button(str(d.ctaLabel), str(d.ctaPath))] : []),
            ...(d.secondaryLabel && d.secondaryPath ? [button(str(d.secondaryLabel), str(d.secondaryPath), 'secondary', 'none')] : []),
          ],
        },
        style: d.backgroundImage
          ? { background: 'image', backgroundImage: str(d.backgroundImage), overlayTone: d.variant === 'light' ? 'light' : 'dark' }
          : { background: d.variant === 'light' ? 'soft' : 'navy' },
      };
    case 'cta':
      if (!('buttonLabel' in d) && Array.isArray(d.buttons)) return block;
      return {
        id: block.id,
        type: 'cta',
        data: {
          ...BLOCK_CATALOG.cta.defaults(),
          variant: d.variant === 'dark' ? 'dark' : d.variant === 'light' ? 'light' : 'gradient',
          title: str(d.title),
          text: str(d.text),
          buttons: d.buttonLabel && d.buttonPath ? [button(str(d.buttonLabel), str(d.buttonPath), d.variant === 'light' ? 'primary' : 'light')] : [],
        },
        style: block.style,
      };
    case 'stats': {
      const items = Array.isArray(d.items) ? (d.items as Legacy[]) : [];
      if (items.every((it) => typeof it.id === 'string')) return block;
      return {
        ...block,
        data: { ...BLOCK_CATALOG.stats.defaults(), ...d, items: items.map((it) => ({ id: uid('k'), value: str(it.value), label: str(it.label) })) },
      };
    }
    default:
      return block;
  }
}

/* ------------------------------------------------------------------ Formulaire et médias */

const SELECT = (options: string[]) => ({ type: 'select' as const, options });

export function contactFormFields(): ContactFormField[] {
  const f = (name: string, label: string, extra: Partial<ContactFormField>): ContactFormField => ({
    id: `f-${name}`,
    name,
    label,
    type: 'text',
    required: true,
    width: 'half',
    ...extra,
  });
  return [
    f('vousEtes', 'Vous êtes', {
      ...SELECT([
        'Client (entreprise, gestionnaire de site)',
        'Bailleur, syndic ou gestionnaire de copropriété',
        'Mandataire ou délégataire CEE',
        'Fournisseur ou fabricant',
        "Bureau d'études",
        'Autre',
      ]),
      placeholder: 'Sélectionnez votre profil…',
      width: 'full',
    }),
    f('entreprise', 'Entreprise / Raison sociale', { placeholder: 'Ex : Intermarché, Safran…' }),
    f('nomPrenom', 'Nom & prénom', { placeholder: 'Ex : Jean Dupont' }),
    f('fonction', 'Fonction', { placeholder: 'Ex : Directeur technique, Responsable maintenance…' }),
    f('email', 'E-mail professionnel', { type: 'email', placeholder: 'nom@entreprise.fr' }),
    f('telephone', 'Téléphone', { type: 'tel', placeholder: '06 00 00 00 00' }),
    f('typologieSite', 'Typologie de site', {
      ...SELECT(['Site industriel', 'Grande distribution / commerce', 'Bureaux', 'Entrepôt / logistique', 'Santé', 'Résidentiel collectif', 'Autre']),
      placeholder: 'Sélectionnez…',
    }),
    f('natureBesoin', 'Nature du besoin', {
      ...SELECT([
        'Froid commercial ou industriel',
        'Récupération de chaleur',
        'Pompe à chaleur / remplacement chaudière',
        'Déstratification',
        'GTB-GTC / décret BACS',
        'Isolation technique',
        'Audit et conseil',
        'Décret tertiaire',
        'Financement CEE',
        'Partenariat',
        'Autre',
      ]),
      placeholder: 'Sélectionnez…',
    }),
    f('localisationSite', 'Localisation du site (ville ou dpt)', { placeholder: 'Ex : Lyon (69), Trévenans (90)…' }),
    f('message', 'Message / problématique technique', { type: 'textarea', placeholder: 'Décrivez votre site, vos équipements et votre objectif.', width: 'full' }),
    f('commentConnu', 'Comment avez-vous connu PEXEN ?', {
      ...SELECT([
        'Bouche-à-oreille / recommandation',
        'Moteur de recherche (Google…)',
        'Assistant IA (ChatGPT, Perplexity…)',
        'Réseaux sociaux',
        'Salon ou événement',
        'Partenaire (mandataire, délégataire, fournisseur)',
        'Autre',
      ]),
      placeholder: 'Sélectionnez…',
      width: 'full',
    }),
    f('rgpdAccepted', "J'accepte que PEXEN utilise mes données pour traiter ma demande, conformément à la politique de confidentialité", {
      type: 'checkbox',
      width: 'full',
    }),
  ];
}

const MIME: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.webm': 'video/webm' };

function registerBundledMedia(snapshot: CmsSnapshot) {
  const known = new Set(snapshot.media.map((m) => m.url));
  for (const dir of ['images/terrain', 'videos']) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(path.join(PUBLIC_DIR, dir));
    } catch {
      continue;
    }
    for (const file of files.sort()) {
      const mime = MIME[path.extname(file).toLowerCase()];
      const url = `/${dir}/${file}`;
      if (!mime || known.has(url)) continue;
      snapshot.media.push({
        id: uid('media'),
        filename: file,
        url,
        mimeType: mime,
        sizeBytes: fs.statSync(path.join(PUBLIC_DIR, dir, file)).size,
        alt: '',
        createdAt: cmsNow(),
      });
    }
  }
}

/* ------------------------------------------------------------------ Migration */

const PLACEHOLDER = 'Contenu géré depuis le backoffice';

/** URL de l'ancien site WordPress (redirections 301 permanentes). */
const LEGACY_REDIRECTS: [string, string][] = [
  ['/contactez-nous/', '/contact/'],
  ['/nos-solutions/', '/expertises/'],
  ['/nos-solutions-2/', '/expertises/'],
  ['/nos-solutions-3/', '/expertises/'],
  ['/nos-solutions-4/', '/expertises/'],
  ['/nos-solutions-industrielles/', '/secteurs/industrie/'],
  ['/isolation-des-murs-par-lexterieur/', '/expertises/'],
  ['/combles-perdus/', '/expertises/'],
  ['/fenetres-et-baies-vitrees/', '/expertises/'],
  ['/category/residentiel/', '/secteurs/'],
  ['/cas-2-maison-dhote-a-lyon/', '/realisations/'],
  ['/cas-3-usine-andros-carquefou/', '/realisations/'],
  ['/cas-4-appartement-t3-a-lille/', '/realisations/'],
  ['/category/etude-de-cas/', '/realisations/'],
  ['/sample-page/', '/'],
  ['/hello-world/', '/'],
  ['/elementor-209/', '/'],
];

function isUntouched(page: CmsPage) {
  if (page.contentSource === 'react') return true;
  return page.blocks.length <= 1 && page.blocks.every((bl) => JSON.stringify(bl.data).includes(PLACEHOLDER));
}

export function migrateContentToBlocks(snapshot: CmsSnapshot): void {
  if ((snapshot.version ?? 1) >= CONTENT_VERSION) return;
  const now = cmsNow();

  for (const def of pageDefinitions()) {
    const existing = snapshot.pages.find((p) => p.path === def.path);
    if (existing) {
      if (isUntouched(existing)) {
        existing.blocks = def.blocks();
        existing.template = def.template;
        if (def.project) existing.project = def.project;
        existing.seo = { ...existing.seo, seoTitle: def.seoTitle, ...(def.metaDescription ? { metaDescription: def.metaDescription } : {}) };
        existing.updatedAt = now;
      }
      existing.contentSource = 'cms';
      continue;
    }
    snapshot.pages.push({
      id: uid('page'),
      path: def.path,
      title: def.title,
      status: 'published',
      publishedAt: now,
      contentSource: 'cms',
      template: def.template,
      blocks: def.blocks(),
      seo: {
        ...defaultSeoForPath(def.path, def.title),
        seoTitle: def.seoTitle,
        ...(def.metaDescription ? { metaDescription: def.metaDescription } : {}),
        ...(def.noindex ? { noindex: true } : {}),
      },
      ...(def.project ? { project: def.project } : {}),
      createdAt: now,
      updatedAt: now,
    });
  }

  for (const page of snapshot.pages) {
    page.contentSource = 'cms';
    page.blocks = page.blocks.map(upgradeLegacyBlock).filter((x): x is CmsBlock => !!x);
  }
  for (const post of snapshot.posts) {
    post.blocks = post.blocks.map(upgradeLegacyBlock).filter((x): x is CmsBlock => !!x);
  }

  const form = snapshot.forms.find((f) => f.id === 'contact-main');
  if (form && !form.fields.some((f) => f.name === 'fonction')) form.fields = contactFormFields();

  for (const [from, to] of LEGACY_REDIRECTS) {
    if (!snapshot.redirects.some((r) => r.from === from)) snapshot.redirects.push({ from, to, permanent: true });
  }

  registerBundledMedia(snapshot);
  snapshot.version = CONTENT_VERSION;
}
