/**
 * Catalogue des blocs : libellé, catégorie, données et style par défaut.
 * Utilisé par le rendu public (valeurs de repli), la migration et la bibliothèque de blocs du backoffice.
 */
import type { BlockDataMap, BlockKind, BlockStyle, TypedBlock } from './blocks';
import { button, uid } from './blocks';

export type BlockCategory = 'entete' | 'contenu' | 'media' | 'listes' | 'conversion' | 'avance';

export const BLOCK_CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: 'entete', label: 'En-têtes' },
  { id: 'contenu', label: 'Texte & mise en page' },
  { id: 'media', label: 'Images & vidéos' },
  { id: 'listes', label: 'Listes & chiffres' },
  { id: 'conversion', label: 'Conversion' },
  { id: 'avance', label: 'Avancé' },
];

export interface BlockMeta<K extends BlockKind = BlockKind> {
  label: string;
  description: string;
  category: BlockCategory;
  /** Icône affichée dans la bibliothèque de blocs du backoffice. */
  icon: string;
  defaults: () => BlockDataMap[K];
  style: Partial<BlockStyle>;
}

type Catalog = { [K in BlockKind]: BlockMeta<K> };

export const BLOCK_CATALOG: Catalog = {
  hero: {
    label: "Bannière d'accueil",
    description: 'Grand titre animé, boutons, composition d’images ou vidéo, bandeau défilant.',
    category: 'entete',
    icon: 'sparkles',
    style: { background: 'soft', decor: 'dots', paddingTop: 'md', paddingBottom: 'xl', animation: 'fade-up' },
    defaults: () => ({
      layout: 'split',
      badgeTag: 'Nouveau',
      badgeText: 'Votre accroche',
      title: 'Titre principal de la page',
      rotatingWords: [],
      highlight: '',
      subtitle: 'Une phrase claire qui explique la proposition de valeur.',
      buttons: [button('Demander un diagnostic', '/contact/'), button('Découvrir', '/expertises/', 'secondary', 'none')],
      liveText: '',
      trustItems: [],
      media: 'image',
      mainImage: '',
      mainImageAlt: '',
      parallax: true,
      marquee: [],
    }),
  },
  pageHeader: {
    label: 'En-tête de page',
    description: "Fil d'Ariane, titre, introduction, boutons et image latérale.",
    category: 'entete',
    icon: 'layout',
    style: { background: 'white', paddingTop: 'md', paddingBottom: 'md', borderTop: false },
    defaults: () => ({ breadcrumb: true, title: 'Titre de la page', intro: '', buttons: [] }),
  },
  richText: {
    label: 'Texte',
    description: 'Paragraphes, titres, listes et liens avec l’éditeur riche.',
    category: 'contenu',
    icon: 'file-text',
    style: { width: 'narrow', paddingTop: 'md', paddingBottom: 'md' },
    defaults: () => ({ html: '<h2>Titre de section</h2><p>Votre texte ici.</p>', size: 'normal' }),
  },
  textMedia: {
    label: 'Texte + image / vidéo',
    description: 'Texte, puces et boutons à côté d’une image ou d’une vidéo (gauche ou droite).',
    category: 'contenu',
    icon: 'columns',
    style: {},
    defaults: () => ({
      eyebrow: '',
      title: 'Un titre percutant',
      highlight: '',
      html: '<p>Expliquez votre sujet en quelques phrases.</p>',
      bullets: [],
      buttons: [],
      mediaType: 'image',
      image: '',
      imageAlt: '',
      videoSource: 'file',
      mediaPosition: 'right',
      mediaStyle: 'rounded',
      ratio: 'landscape',
      autoplay: false,
    }),
  },
  details: {
    label: 'Sections + encadré',
    description: 'Plusieurs sections de texte avec une fiche récapitulative collante à droite.',
    category: 'contenu',
    icon: 'list',
    style: {},
    defaults: () => ({
      sections: [{ id: uid('s'), title: 'Le contexte', text: '', bullets: [] }],
      sideTitle: 'En bref',
      facts: [{ id: uid('f'), label: 'Client', value: '' }],
    }),
  },
  image: {
    label: 'Image',
    description: 'Une image seule avec légende.',
    category: 'media',
    icon: 'image',
    style: { paddingTop: 'md', paddingBottom: 'md' },
    defaults: () => ({ url: '', alt: '', caption: '', width: 'normal', rounded: true }),
  },
  video: {
    label: 'Vidéo',
    description: 'Fichier vidéo de la médiathèque ou lien YouTube / Vimeo.',
    category: 'media',
    icon: 'video',
    style: { paddingTop: 'md', paddingBottom: 'md' },
    defaults: () => ({ source: 'file', url: '', autoplay: false, title: '', width: 'normal' }),
  },
  slides: {
    label: 'Diaporama',
    description: 'Carrousel d’images avec titre et lien, défilement automatique.',
    category: 'media',
    icon: 'images',
    style: { paddingTop: 'md', paddingBottom: 'md' },
    defaults: () => ({ autoplay: true, interval: 6, height: 'lg', slides: [{ id: uid('sl'), image: '', title: 'Diapositive 1', text: '' }] }),
  },
  gallery: {
    label: 'Galerie',
    description: 'Photos de chantier en polaroïds défilants, grille ou mosaïque.',
    category: 'media',
    icon: 'camera',
    style: { background: 'surface' },
    defaults: () => ({ title: 'Nos chantiers', style: 'grid', items: [] }),
  },
  marquee: {
    label: 'Bandeau défilant',
    description: 'Mots-clés ou logos qui défilent en continu.',
    category: 'media',
    icon: 'repeat',
    style: { background: 'white', paddingTop: 'none', paddingBottom: 'none', width: 'full', animation: 'none' },
    defaults: () => ({ speed: 'normal', items: [{ id: uid('m'), text: 'Mot-clé' }] }),
  },
  cards: {
    label: 'Cartes',
    description: 'Grille de cartes avec icône, image, texte, tags et lien (5 styles).',
    category: 'listes',
    icon: 'grid',
    style: {},
    defaults: () => ({
      title: 'Nos services',
      style: 'card',
      columns: 3,
      items: [1, 2, 3].map((n) => ({ id: uid('c'), icon: 'zap', title: `Carte ${n}`, text: 'Description courte.', tags: [] })),
    }),
  },
  showcase: {
    label: 'Vitrine à onglets',
    description: 'Onglets qui défilent automatiquement avec image, texte et puces.',
    category: 'listes',
    icon: 'layers',
    style: { background: 'surface' },
    defaults: () => ({
      title: 'Nos expertises',
      interval: 6,
      items: [1, 2, 3].map((n) => ({ id: uid('sh'), icon: 'zap', title: `Onglet ${n}`, text: '', image: '', chips: [] })),
    }),
  },
  steps: {
    label: 'Étapes',
    description: 'Méthode en étapes : frise animée, liste ou version compacte.',
    category: 'listes',
    icon: 'route',
    style: {},
    defaults: () => ({
      title: 'Notre méthode',
      style: 'timeline',
      deliverableLabel: 'Livrable',
      buttons: [],
      items: [1, 2, 3].map((n) => ({ id: uid('st'), num: String(n).padStart(2, '0'), title: `Étape ${n}`, text: '' })),
    }),
  },
  stats: {
    label: 'Chiffres clés',
    description: 'Chiffres avec compteur animé.',
    category: 'listes',
    icon: 'bar-chart',
    style: {},
    defaults: () => ({
      style: 'cards',
      countUp: true,
      items: [
        { id: uid('k'), value: '30', suffix: ' %', label: "d'économies" },
        { id: uid('k'), value: '48', suffix: ' h', label: 'pour répondre' },
        { id: uid('k'), value: '100', suffix: ' %', label: 'clients suivis' },
      ],
    }),
  },
  panels: {
    label: 'Panneaux extensibles',
    description: 'Grandes images qui s’ouvrent au survol (secteurs, offres).',
    category: 'listes',
    icon: 'panels',
    style: {},
    defaults: () => ({ title: 'Nos secteurs', items: [{ id: uid('p'), image: '', title: 'Panneau 1', bullets: [] }] }),
  },
  checklist: {
    label: 'Cartes de garanties',
    description: 'Cartes titrées contenant des points clés.',
    category: 'listes',
    icon: 'check-square',
    style: {},
    defaults: () => ({ title: 'Nos engagements', cards: [{ id: uid('ck'), icon: 'shieldCheck', title: 'Garantie', entries: [{ id: uid('e'), title: 'Point clé', text: '' }] }] }),
  },
  faq: {
    label: 'Questions fréquentes',
    description: 'Accordéon de questions / réponses avec carte de contact.',
    category: 'listes',
    icon: 'help',
    style: {},
    defaults: () => ({ title: 'Questions fréquentes', layout: 'split', showContactCard: true, items: [{ id: uid('q'), question: 'Votre question ?', answer: '<p>La réponse.</p>' }] }),
  },
  testimonials: {
    label: 'Témoignages',
    description: 'Citations clients avec photo et fonction.',
    category: 'listes',
    icon: 'quote',
    style: { background: 'surface' },
    defaults: () => ({ title: 'Ils nous font confiance', items: [{ id: uid('t'), quote: 'Un accompagnement remarquable.', author: 'Nom du client', role: 'Fonction' }] }),
  },
  table: {
    label: 'Tableau',
    description: 'Tableau de données avec recherche.',
    category: 'listes',
    icon: 'table',
    style: {},
    defaults: () => ({ searchable: false, columns: ['Colonne 1', 'Colonne 2'], rows: [{ id: uid('r'), cells: ['', ''] }] }),
  },
  cta: {
    label: "Appel à l'action",
    description: 'Bandeau de conversion : dégradé, sombre, clair ou avec image.',
    category: 'conversion',
    icon: 'megaphone',
    style: { paddingTop: 'md', paddingBottom: 'md' },
    defaults: () => ({ variant: 'gradient', layout: 'split', title: 'Parlons de votre projet', text: '', buttons: [button('Nous contacter', '/contact/', 'dark')] }),
  },
  projects: {
    label: 'Réalisations',
    description: 'Liste automatique des pages « réalisation » publiées.',
    category: 'conversion',
    icon: 'briefcase',
    style: {},
    defaults: () => ({ title: 'Nos réalisations', layout: 'grid', filter: 'all', showFilters: true, limit: 0 }),
  },
  simulator: {
    label: 'Simulateur CEE',
    description: 'Simulateur interactif de primes CEE.',
    category: 'conversion',
    icon: 'calculator',
    style: { background: 'surface' },
    defaults: () => ({ title: 'Estimez votre prime CEE', align: 'center' }),
  },
  contactForm: {
    label: 'Formulaire de contact',
    description: 'Formulaire configuré dans « Formulaires », avec coordonnées.',
    category: 'conversion',
    icon: 'mail',
    style: { background: 'surface', paddingTop: 'md' },
    defaults: () => ({ formId: 'contact-main', title: 'Parlons de votre projet', intro: '', listItems: [], submitLabel: 'Envoyer ma demande' }),
  },
  spacer: {
    label: 'Espace / séparateur',
    description: 'Espace vertical, avec ou sans ligne.',
    category: 'avance',
    icon: 'minus',
    style: { paddingTop: 'none', paddingBottom: 'none', animation: 'none' },
    defaults: () => ({ height: 48, divider: false }),
  },
  html: {
    label: 'Code HTML',
    description: 'Intégration libre (carte, widget…).',
    category: 'avance',
    icon: 'code',
    style: { paddingTop: 'md', paddingBottom: 'md', animation: 'none' },
    defaults: () => ({ html: '' }),
  },
};

export const BLOCK_KINDS = Object.keys(BLOCK_CATALOG) as BlockKind[];

export function isBlockKind(v: unknown): v is BlockKind {
  return typeof v === 'string' && v in BLOCK_CATALOG;
}

/** Données complétées avec les valeurs par défaut (les champs absents ne cassent jamais le rendu). */
export function withDefaults<K extends BlockKind>(type: K, data: unknown): BlockDataMap[K] {
  const base = BLOCK_CATALOG[type].defaults() as unknown as Record<string, unknown>;
  const src = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(src)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(base[k]) && !Array.isArray(v)) continue;
    out[k] = v;
  }
  return out as unknown as BlockDataMap[K];
}

export function createBlock<K extends BlockKind>(type: K): TypedBlock<K> {
  return { id: uid('b'), type, data: BLOCK_CATALOG[type].defaults(), style: {} };
}
