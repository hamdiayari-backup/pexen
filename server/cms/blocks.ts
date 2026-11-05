/**
 * Modèle des blocs de contenu — partagé par le serveur, le site public et le backoffice.
 * Chaque bloc = { id, type, data, style } ; `data` dépend du type, `style` est commun.
 */

/* ------------------------------------------------------------------ Style commun */

export type BlockBackground = 'none' | 'white' | 'surface' | 'soft' | 'navy' | 'brand' | 'image' | 'video';
export type BlockSpacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type BlockAnimation = 'none' | 'fade-up' | 'fade' | 'zoom' | 'slide-left' | 'slide-right';
export type BlockDecor = 'none' | 'dots' | 'grid' | 'rings' | 'diagonal' | 'glow' | 'waves' | 'silk';
export type BlockTextAlign = 'left' | 'center' | 'right';
export type BlockTitleSize = 'sm' | 'md' | 'lg' | 'xl';
export type BlockBodySize = 'sm' | 'md' | 'lg';

export interface BlockStyle {
  background: BlockBackground;
  backgroundImage?: string;
  backgroundVideo?: string;
  /** Opacité du voile au-dessus d'une image/vidéo de fond (0–95). */
  overlay?: number;
  overlayTone?: 'light' | 'dark';
  decor: BlockDecor;
  paddingTop: BlockSpacing;
  paddingBottom: BlockSpacing;
  width: 'narrow' | 'default' | 'wide' | 'full';
  animation: BlockAnimation;
  borderTop?: boolean;
  anchor?: string;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
  /** Placement du texte (titres + intro du bloc). */
  textAlign?: BlockTextAlign;
  /** Taille des titres de section. */
  titleSize?: BlockTitleSize;
  /** Taille du corps de texte / intro. */
  bodySize?: BlockBodySize;
}

export const DEFAULT_STYLE: BlockStyle = {
  background: 'white',
  decor: 'none',
  paddingTop: 'lg',
  paddingBottom: 'lg',
  width: 'default',
  animation: 'fade-up',
  textAlign: 'center',
  titleSize: 'md',
  bodySize: 'md',
};

/* ------------------------------------------------------------------ Éléments réutilisables */

export type ButtonVariant = 'primary' | 'secondary' | 'dark' | 'light' | 'glass' | 'link';
export type ButtonIcon = 'arrow' | 'arrow-up-right' | 'phone' | 'mail' | 'download' | 'none';

export interface ButtonData {
  id: string;
  label: string;
  link: string;
  variant: ButtonVariant;
  icon: ButtonIcon;
  newTab?: boolean;
}

/** En-tête de section commun à la plupart des blocs. */
export interface SectionHeading {
  eyebrow?: string;
  title?: string;
  /** Partie du titre mise en couleur, affichée après le titre. */
  highlight?: string;
  intro?: string;
  align?: 'left' | 'center' | 'right';
  headerLinkLabel?: string;
  headerLink?: string;
}

/* ------------------------------------------------------------------ Données par type */

export interface HeroGalleryImage {
  id: string;
  image: string;
}

export interface HeroData {
  layout: 'split' | 'centered';
  badgeTag?: string;
  badgeText?: string;
  title: string;
  /** Mots qui défilent à la fin du titre (animation). */
  rotatingWords: string[];
  highlight?: string;
  subtitle?: string;
  buttons: ButtonData[];
  liveText?: string;
  trustItems: string[];
  media: 'composition' | 'image' | 'video' | 'none';
  mainImage?: string;
  mainImageAlt?: string;
  /** Images supplémentaires pour le carrousel polaroid / poker (hero) — médiathèque. */
  galleryImages?: HeroGalleryImage[];
  video?: string;
  videoPoster?: string;
  secondaryImage?: string;
  secondaryImageAlt?: string;
  secondaryCaption?: string;
  statValue?: string;
  statLabel?: string;
  badgeCardTitle?: string;
  badgeCardText?: string;
  chipText?: string;
  parallax: boolean;
  marquee: string[];
}

export interface PageHeaderMetric {
  id?: string;
  value: string;
  label: string;
}
export interface PageHeaderData {
  breadcrumb: boolean;
  parentLabel?: string;
  parentLink?: string;
  eyebrow?: string;
  title: string;
  /** Accroche bénéfice (Solutions / Secteurs) affichée sous le H1. */
  highlight?: string;
  intro?: string;
  buttons: ButtonData[];
  image?: string;
  imageAlt?: string;
  backLabel?: string;
  backLink?: string;
  /** 3 chiffres clés du hero (propre à chaque page — recette Phase 2). */
  metrics?: PageHeaderMetric[];
  /**
   * Gabarit hero Phase 2 :
   * expertise = fond bleu glace · solution = photo / bleu nuit · sector = accroche + photo bâtiment.
   */
  heroVariant?: 'auto' | 'expertise' | 'solution' | 'sector' | 'default';
}

export interface RichTextData {
  html: string;
  size: 'normal' | 'large';
}

export interface TextMediaData extends SectionHeading {
  html: string;
  bullets: string[];
  buttons: ButtonData[];
  mediaType: 'image' | 'video';
  image?: string;
  imageAlt?: string;
  videoSource: 'file' | 'embed';
  video?: string;
  poster?: string;
  mediaPosition: 'left' | 'right';
  mediaStyle: 'rounded' | 'polaroid' | 'framed' | 'logoMask' | 'diagonal';
  caption?: string;
  ratio: 'landscape' | 'square' | 'portrait';
  autoplay: boolean;
}

export interface ImageData {
  url: string;
  alt: string;
  caption?: string;
  width: 'normal' | 'wide' | 'full';
  rounded: boolean;
}

export interface VideoData {
  source: 'embed' | 'file';
  url: string;
  poster?: string;
  autoplay: boolean;
  title?: string;
  width: 'normal' | 'wide' | 'full';
}

export interface SlideItem {
  id: string;
  image: string;
  alt?: string;
  title?: string;
  text?: string;
  link?: string;
}
export interface SlidesData {
  autoplay: boolean;
  interval: number;
  height: 'md' | 'lg' | 'xl';
  slides: SlideItem[];
}

export interface CardItem {
  id: string;
  icon?: string;
  image?: string;
  imageAlt?: string;
  title: string;
  text?: string;
  tags: string[];
  linkLabel?: string;
  link?: string;
}
export interface CardsData extends SectionHeading {
  style: 'card' | 'hoverDark' | 'image' | 'minimal' | 'numbered';
  columns: 2 | 3 | 4 | 5;
  items: CardItem[];
  /** Préfixe en gras ajouté au début du texte (ex. « Réponse PEXEN — »). */
  textPrefix?: string;
  tagsLabel?: string;
}

export interface ShowcaseItem {
  id: string;
  icon?: string;
  title: string;
  text?: string;
  image?: string;
  chips: string[];
  buttonLabel?: string;
  link?: string;
}
export interface ShowcaseData extends SectionHeading {
  interval: number;
  items: ShowcaseItem[];
}

export interface StepItem {
  id: string;
  num: string;
  title: string;
  text?: string;
  deliverable?: string;
}
export interface StepsData extends SectionHeading {
  style: 'timeline' | 'list' | 'compact';
  deliverableLabel: string;
  items: StepItem[];
  buttons: ButtonData[];
}

export interface StatItem {
  id: string;
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  hint?: string;
  link?: string;
  /** Image de carte (style « Cartes » / section Enjeux). */
  image?: string;
  imageAlt?: string;
  /** Libellé du CTA sous la carte (ex. « Optimiser mon froid »). */
  ctaLabel?: string;
}
export interface StatsPartner {
  name: string;
  logo?: string;
}
export interface StatsQualification {
  label: string;
  logo?: string;
  alt?: string;
  caption?: string;
}
export interface StatsData extends SectionHeading {
  style: 'cards' | 'inline' | 'strip';
  countUp: boolean;
  items: StatItem[];
  /** Note légale / précision (astérisques) — affichée en bas de page / footer. */
  footnote?: string;
  /** Clients du bandeau Preuves — nom seul ou { name, logo }. */
  partners?: Array<string | StatsPartner>;
  /** Logos qualifications sous les chiffres (bandeau Preuves). */
  qualifications?: StatsQualification[];
}

export interface CtaData {
  variant: 'gradient' | 'dark' | 'light' | 'image';
  layout: 'split' | 'centered';
  eyebrow?: string;
  badge?: string;
  title: string;
  highlight?: string;
  text?: string;
  buttons: ButtonData[];
  image?: string;
  imageAlt?: string;
  imageCaption?: string;
  backgroundImage?: string;
  bigNumber?: string;
  bigNumberLabel?: string;
  bigNumberStrong?: string;
}

export interface PanelItem {
  id: string;
  icon?: string;
  image: string;
  imageAlt?: string;
  title: string;
  text?: string;
  bullets: string[];
  linkLabel?: string;
  link?: string;
}
export interface PanelsData extends SectionHeading {
  items: PanelItem[];
}

export interface GalleryItem {
  id: string;
  image: string;
  caption?: string;
}
export interface GalleryData extends SectionHeading {
  style: 'polaroid' | 'grid' | 'masonry';
  handNote?: string;
  note?: string;
  items: GalleryItem[];
}

export interface ChecklistEntry {
  id: string;
  title: string;
  text?: string;
}
export interface ChecklistLogo {
  id: string;
  src: string;
  alt?: string;
  /** sm | md | lg | wide — taille d’affichage dans la carte */
  size?: 'sm' | 'md' | 'lg' | 'wide';
}
export interface ChecklistCard {
  id: string;
  icon?: string;
  tag?: string;
  title?: string;
  /** Logos affichés en tête de carte (éditeur visuel). */
  logos?: ChecklistLogo[];
  entries: ChecklistEntry[];
}
export interface ChecklistData extends SectionHeading {
  cards: ChecklistCard[];
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
export interface FaqData extends SectionHeading {
  layout: 'split' | 'stacked';
  showContactCard: boolean;
  contactLabel?: string;
  items: FaqItem[];
}

export interface MarqueeItem {
  id: string;
  text?: string;
  logo?: string;
}
export interface MarqueeData {
  speed: 'slow' | 'normal' | 'fast';
  items: MarqueeItem[];
}

export interface ProjectsData extends SectionHeading {
  layout: 'featured' | 'grid' | 'compact' | 'cards';
  filter: 'all' | 'sector';
  sector?: string;
  showFilters: boolean;
  limit: number;
}

export interface TableData extends SectionHeading {
  searchable: boolean;
  searchPlaceholder?: string;
  columns: string[];
  rows: { id: string; cells: string[] }[];
}

export interface SimulatorOption {
  id: string;
  label: string;
  factor: number;
}
export interface SimulatorOperation {
  id: string;
  label: string;
  minPerM2: number;
  maxPerM2: number;
  minPerKw?: number;
  maxPerKw?: number;
}
export interface SimulatorEnergy {
  id: string;
  label: string;
  factor: number;
}
export interface SimulatorData extends SectionHeading {
  /** Bandeau d’accueil (teaser) ou outil 3 étapes (tool). */
  variant?: 'teaser' | 'tool';
  teaserCtaLabel?: string;
  teaserCtaLink?: string;
  teaserNote?: string;
  /** Formulaire CMS qui reçoit la demande (Engagement › Formulaires). */
  formId?: string;
  siteTypes?: SimulatorOption[];
  regions?: SimulatorOption[];
  operations?: SimulatorOperation[];
  energies?: SimulatorEnergy[];
  disclaimer?: string;
  resultPrefix?: string;
  resultNote?: string;
  ctaLabel?: string;
  howTitle?: string;
  howText?: string;
  privacyPath?: string;
  contactTitle?: string;
  contactText?: string;
}

export interface ContactFormData {
  formId: string;
  title: string;
  intro?: string;
  phoneLabel?: string;
  phoneHint?: string;
  listTitle?: string;
  listItems: string[];
  submitLabel: string;
  /** ultra : champs progressifs (dropdown puis détails). */
  variant?: 'default' | 'progressive';
  privacyPath?: string;
}

export interface DetailsData {
  sections: { id: string; title: string; text?: string; bullets: string[] }[];
  sideTitle?: string;
  facts: { id: string; label: string; value: string }[];
  sideButton?: ButtonData;
}

export interface TestimonialsData extends SectionHeading {
  items: { id: string; quote: string; author: string; role?: string; image?: string }[];
}

export interface SpacerData {
  height: number;
  divider: boolean;
}

export interface HtmlData {
  html: string;
}

export interface BlockDataMap {
  hero: HeroData;
  pageHeader: PageHeaderData;
  richText: RichTextData;
  textMedia: TextMediaData;
  image: ImageData;
  video: VideoData;
  slides: SlidesData;
  cards: CardsData;
  showcase: ShowcaseData;
  steps: StepsData;
  stats: StatsData;
  cta: CtaData;
  panels: PanelsData;
  gallery: GalleryData;
  checklist: ChecklistData;
  faq: FaqData;
  marquee: MarqueeData;
  projects: ProjectsData;
  table: TableData;
  simulator: SimulatorData;
  contactForm: ContactFormData;
  details: DetailsData;
  testimonials: TestimonialsData;
  spacer: SpacerData;
  html: HtmlData;
}

export type BlockKind = keyof BlockDataMap;

export interface TypedBlock<K extends BlockKind = BlockKind> {
  id: string;
  type: K;
  data: BlockDataMap[K];
  style?: Partial<BlockStyle>;
}

/* ------------------------------------------------------------------ Réalisations */

/** Métadonnées d'une page « réalisation » (template `project`), utilisées par le bloc Réalisations. */
export interface ProjectMeta {
  client: string;
  location: string;
  department?: string;
  sector: string;
  badge?: string;
  primeCee?: string;
  cumac?: string;
  solution: string;
  summary: string;
  image: string;
  ceeSheet?: string;
  results: string[];
  featured?: boolean;
  /** Ordre d’affichage (0 = premier) dans le bloc Réalisations / API publique. */
  sortOrder?: number;
}

/* ------------------------------------------------------------------ Utilitaires */

export const uid = (prefix = 'b') => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export const button = (label: string, link: string, variant: ButtonVariant = 'primary', icon: ButtonIcon = 'arrow'): ButtonData => ({
  id: uid('btn'),
  label,
  link,
  variant,
  icon,
});

export function resolveStyle(style?: Partial<BlockStyle>, defaults?: Partial<BlockStyle>): BlockStyle {
  return { ...DEFAULT_STYLE, ...defaults, ...style };
}

export interface TokenValues {
  phone: string;
  phoneClean: string;
  email: string;
  sla: string;
  company: string;
}

/** Remplace les variables {{telephone}}, {{email}}, {{delai}}, {{societe}}, {{annee}}, {{ans2030}}. */
export function applyTokens(text: string | undefined, t: TokenValues): string {
  if (!text) return '';
  if (!text.includes('{{')) return text;
  const year = new Date().getFullYear();
  const yearsTo2030 = Math.max(2030 - year, 0);
  return text
    .replace(/\{\{\s*telephone\s*\}\}/g, t.phone)
    .replace(/\{\{\s*telephoneLien\s*\}\}/g, t.phoneClean)
    .replace(/\{\{\s*email\s*\}\}/g, t.email)
    .replace(/\{\{\s*delai\s*\}\}/g, t.sla)
    .replace(/\{\{\s*societe\s*\}\}/g, t.company)
    .replace(/\{\{\s*annee\s*\}\}/g, String(year))
    .replace(/\{\{\s*ans2030\s*\}\}/g, `${yearsTo2030} an${yearsTo2030 > 1 ? 's' : ''}`);
}

export const TOKEN_HELP: { token: string; label: string }[] = [
  { token: '{{telephone}}', label: 'Téléphone' },
  { token: '{{email}}', label: 'E-mail de contact' },
  { token: '{{delai}}', label: 'Délai de réponse' },
  { token: '{{societe}}', label: 'Nom de la société' },
  { token: '{{annee}}', label: 'Année en cours' },
  { token: '{{ans2030}}', label: 'Années restantes avant 2030' },
];

/** Extraction du texte d'un bloc (analyse SEO, recherche). */
export function blockToHtml(block: { type: string; data: unknown }): { html: string; alts: string[] } {
  const parts: string[] = [];
  const alts: string[] = [];
  const titleKeys = new Set(['title', 'question', 'heroTitle']);
  const htmlKeys = new Set(['html', 'answer']);
  const skip = new Set(['id', 'link', 'parentLink', 'backLink', 'headerLink', 'variant', 'icon', 'style', 'layout', 'mediaType', 'videoSource', 'video', 'poster', 'source', 'url']);

  const walk = (v: unknown, key = '') => {
    if (v == null) return;
    if (typeof v === 'string') {
      if (!v.trim() || skip.has(key)) return;
      if (/^(image|mainImage|secondaryImage|logo|backgroundImage)$/.test(key)) return;
      if (/alt$/i.test(key)) {
        alts.push(v);
        return;
      }
      if (htmlKeys.has(key)) parts.push(v);
      else if (titleKeys.has(key)) parts.push(block.type === 'hero' || block.type === 'pageHeader' ? `<h1>${v}</h1>` : `<h2>${v}</h2>`);
      else parts.push(`<p>${v}</p>`);
      return;
    }
    if (Array.isArray(v)) {
      v.forEach((x) => walk(x, key));
      return;
    }
    if (typeof v === 'object') {
      const o = v as Record<string, unknown>;
      for (const [k, val] of Object.entries(o)) walk(val, k);
      const img = o.image ?? o.url ?? o.mainImage;
      if (typeof img === 'string' && img && !('alt' in o) && !('imageAlt' in o) && !('mainImageAlt' in o) && /\.(jpe?g|png|webp|avif|gif|svg)$/i.test(img)) {
        alts.push(String(o.caption || o.title || ''));
      }
    }
  };
  walk(block.data);
  return { html: parts.join('\n'), alts };
}
