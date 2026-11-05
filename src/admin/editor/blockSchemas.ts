import {
  BarChart3,
  Briefcase,
  Calculator,
  Camera,
  CheckSquare,
  Code2,
  Columns2,
  FileText,
  Grid3x3,
  HelpCircle,
  Image,
  Images,
  Layers,
  LayoutTemplate,
  List,
  Mail,
  Megaphone,
  Minus,
  PanelsTopLeft,
  Quote,
  Repeat,
  Route,
  Sparkles,
  Table,
  Video,
  type LucideIcon,
} from 'lucide-react';
import type { BlockKind } from '../../../server/cms/blocks';
import type { FieldDef } from './fields';

type Data = Record<string, unknown>;
export interface FieldGroup {
  title: string;
  fields: FieldDef[];
}

export const BLOCK_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  layout: LayoutTemplate,
  'file-text': FileText,
  columns: Columns2,
  list: List,
  image: Image,
  video: Video,
  images: Images,
  camera: Camera,
  repeat: Repeat,
  grid: Grid3x3,
  layers: Layers,
  route: Route,
  'bar-chart': BarChart3,
  panels: PanelsTopLeft,
  'check-square': CheckSquare,
  help: HelpCircle,
  quote: Quote,
  table: Table,
  megaphone: Megaphone,
  briefcase: Briefcase,
  calculator: Calculator,
  mail: Mail,
  minus: Minus,
  code: Code2,
};

const o = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

/** En-tête de section commun (sur-titre, titre, mot en couleur, introduction, alignement, lien). */
const heading = (withLink = true): FieldGroup => ({
  title: 'En-tête de section',
  fields: [
    { t: 'text', key: 'eyebrow', label: 'Sur-titre', placeholder: 'Ex. Notre méthode' },
    { t: 'text', key: 'title', label: 'Titre' },
    { t: 'text', key: 'highlight', label: 'Partie colorée du titre', hint: 'Ajoutée après le titre, dans la couleur principale.' },
    { t: 'textarea', key: 'intro', label: 'Introduction', rows: 2 },
    { t: 'segmented', key: 'align', label: 'Alignement du titre', options: o(['left', 'Gauche'], ['center', 'Centré'], ['right', 'Droite']), hint: 'Aussi réglable dans Style › Texte (placement).' },
    ...(withLink
      ? ([
          { t: 'text', key: 'headerLinkLabel', label: 'Lien d’en-tête', placeholder: 'Tout voir', half: true },
          { t: 'link', key: 'headerLink', label: 'Destination', half: true, placeholder: '/expertises/' },
        ] as FieldDef[])
      : []),
  ],
});

const SECTORS = o(['', 'Tous'], ['Industrie', 'Industrie'], ['Tertiaire', 'Tertiaire'], ['Résidentiel collectif', 'Résidentiel collectif']);

export const BLOCK_SCHEMAS: Record<BlockKind, FieldGroup[]> = {
  hero: [
    {
      title: 'Textes',
      fields: [
        { t: 'segmented', key: 'layout', label: 'Mise en page', options: o(['split', 'Texte + visuel'], ['centered', 'Centrée']) },
        { t: 'text', key: 'badgeTag', label: 'Pastille', placeholder: 'Nouveau', half: true },
        { t: 'text', key: 'badgeText', label: 'Texte du badge', half: true },
        { t: 'textarea', key: 'title', label: 'Titre principal', rows: 2 },
        { t: 'tags', key: 'rotatingWords', label: 'Mots animés en fin de titre', placeholder: 'Ajouter un mot puis Entrée', hint: 'Les mots défilent l’un après l’autre. Laissez vide pour un titre fixe.' },
        { t: 'text', key: 'highlight', label: 'Partie colorée du titre', show: (d) => !(d.rotatingWords as string[])?.length },
        { t: 'textarea', key: 'subtitle', label: 'Sous-titre', rows: 3 },
      ],
    },
    { title: 'Boutons', fields: [{ t: 'buttons', key: 'buttons', max: 3 }] },
    {
      title: 'Bandeau de confiance',
      fields: [
        { t: 'text', key: 'liveText', label: 'Indicateur « en direct »', placeholder: 'Réponse sous {{delai}}' },
        { t: 'tags', key: 'trustItems', label: 'Arguments de confiance' },
        { t: 'tags', key: 'marquee', label: 'Mots du bandeau défilant (bas de bannière)' },
      ],
    },
    {
      title: 'Visuel',
      fields: [
        { t: 'select', key: 'media', label: 'Type de visuel', options: o(['composition', 'Composition animée (images + cartes)'], ['image', 'Image / carrousel polaroid'], ['video', 'Vidéo'], ['none', 'Aucun']) },
        { t: 'image', key: 'mainImage', label: 'Image principale', altKey: 'mainImageAlt', show: (d) => d.media === 'image' || d.media === 'composition' },
        {
          t: 'list',
          key: 'galleryImages',
          item: 'Photo',
          create: () => ({ image: '' }),
          summary: (it) => (it.image ? String(it.image).split('/').pop() || 'Photo' : 'Photo à choisir'),
          hint: 'Choisissez les photos dans la médiathèque. Elles défilent en éventail polaroid ; l’image principale reste la première.',
          show: (d) => d.media === 'image',
          fields: [{ t: 'image', key: 'image', label: 'Photo', aspect: 'aspect-[4/5]' }],
        },
        { t: 'video', key: 'video', label: 'Vidéo (fichier ou YouTube / Vimeo)', show: (d) => d.media === 'video' },
        { t: 'image', key: 'videoPoster', label: 'Image d’attente de la vidéo', show: (d) => d.media === 'video' },
        { t: 'image', key: 'secondaryImage', label: 'Photo secondaire (polaroïd)', altKey: 'secondaryImageAlt', aspect: 'aspect-[4/3]', show: (d) => d.media === 'composition' },
        { t: 'text', key: 'secondaryCaption', label: 'Légende manuscrite', show: (d) => d.media === 'composition' },
        { t: 'text', key: 'statValue', label: 'Carte chiffre : valeur', half: true, show: (d) => d.media === 'composition' },
        { t: 'text', key: 'statLabel', label: 'Carte chiffre : libellé', half: true, show: (d) => d.media === 'composition' },
        { t: 'text', key: 'badgeCardTitle', label: 'Carte sombre : titre', half: true, show: (d) => d.media === 'composition' },
        { t: 'text', key: 'badgeCardText', label: 'Carte sombre : texte', half: true, show: (d) => d.media === 'composition' },
        { t: 'text', key: 'chipText', label: 'Étiquette sur l’image', show: (d) => d.media === 'composition' },
        { t: 'switch', key: 'parallax', label: 'Effet de profondeur au survol de la souris', show: (d) => d.media === 'composition' || d.media === 'image' },
      ],
    },
  ],

  pageHeader: [
    {
      title: 'Textes',
      fields: [
        { t: 'text', key: 'eyebrow', label: 'Sur-titre' },
        { t: 'textarea', key: 'title', label: 'Titre', rows: 2 },
        { t: 'text', key: 'highlight', label: 'Partie colorée du titre' },
        { t: 'textarea', key: 'intro', label: 'Introduction', rows: 3 },
      ],
    },
    { title: 'Boutons', fields: [{ t: 'buttons', key: 'buttons', max: 3 }] },
    { title: 'Image', fields: [{ t: 'image', key: 'image', label: 'Image à droite (facultative)', altKey: 'imageAlt' }] },
    {
      title: 'Navigation',
      fields: [
        { t: 'switch', key: 'breadcrumb', label: 'Afficher le fil d’Ariane' },
        { t: 'text', key: 'parentLabel', label: 'Page parente', half: true, show: (d) => !!d.breadcrumb },
        { t: 'link', key: 'parentLink', label: 'Lien parent', half: true, show: (d) => !!d.breadcrumb },
        { t: 'text', key: 'backLabel', label: 'Lien retour', placeholder: 'Toutes les réalisations', half: true },
        { t: 'link', key: 'backLink', label: 'Destination', half: true },
      ],
    },
  ],

  richText: [
    {
      title: 'Contenu',
      fields: [
        { t: 'rich', key: 'html' },
        { t: 'segmented', key: 'size', label: 'Taille du texte', options: o(['normal', 'Normale'], ['large', 'Grande']) },
      ],
    },
  ],

  textMedia: [
    heading(false),
    {
      title: 'Texte',
      fields: [
        { t: 'rich', key: 'html', label: 'Paragraphes', minimal: true },
        { t: 'tags', key: 'bullets', label: 'Points clés (puces)' },
      ],
    },
    { title: 'Boutons', fields: [{ t: 'buttons', key: 'buttons', max: 3 }] },
    {
      title: 'Image ou vidéo',
      fields: [
        { t: 'segmented', key: 'mediaType', label: 'Média', options: o(['image', 'Image'], ['video', 'Vidéo']) },
        { t: 'image', key: 'image', label: 'Image', altKey: 'imageAlt', show: (d) => d.mediaType !== 'video' },
        { t: 'segmented', key: 'videoSource', label: 'Source', options: o(['file', 'Fichier'], ['embed', 'YouTube / Vimeo']), show: (d) => d.mediaType === 'video' },
        { t: 'video', key: 'video', label: 'Vidéo', embed: (d) => d.videoSource === 'embed', show: (d) => d.mediaType === 'video' },
        { t: 'image', key: 'poster', label: 'Image d’attente', show: (d) => d.mediaType === 'video' && d.videoSource !== 'embed' },
        { t: 'switch', key: 'autoplay', label: 'Lecture automatique en boucle (sans son)', show: (d) => d.mediaType === 'video' && d.videoSource !== 'embed' },
        { t: 'segmented', key: 'mediaPosition', label: 'Position', options: o(['left', 'À gauche'], ['right', 'À droite']) },
        { t: 'select', key: 'mediaStyle', label: 'Habillage', options: o(['rounded', 'Arrondi'], ['polaroid', 'Polaroïd'], ['framed', 'Cadre décalé']), half: true },
        { t: 'select', key: 'ratio', label: 'Format', options: o(['landscape', 'Paysage'], ['square', 'Carré'], ['portrait', 'Portrait']), half: true },
        { t: 'text', key: 'caption', label: 'Légende' },
      ],
    },
  ],

  details: [
    {
      title: 'Sections',
      fields: [
        {
          t: 'list',
          key: 'sections',
          item: 'Section',
          create: () => ({ title: 'Nouvelle section', text: '', bullets: [] }),
          fields: [
            { t: 'text', key: 'title', label: 'Titre' },
            { t: 'textarea', key: 'text', label: 'Texte', rows: 4 },
            { t: 'tags', key: 'bullets', label: 'Puces' },
          ],
        },
      ],
    },
    {
      title: 'Encadré',
      fields: [
        { t: 'text', key: 'sideTitle', label: 'Titre de l’encadré' },
        {
          t: 'list',
          key: 'facts',
          label: 'Informations',
          item: 'Information',
          create: () => ({ label: 'Libellé', value: '' }),
          summary: (it) => `${it.label || ''} : ${it.value || ''}`,
          fields: [
            { t: 'text', key: 'label', label: 'Libellé', half: true },
            { t: 'text', key: 'value', label: 'Valeur', half: true },
          ],
        },
        { t: 'button', key: 'sideButton', label: 'Bouton de l’encadré' },
      ],
    },
  ],

  image: [
    {
      title: 'Image',
      fields: [
        { t: 'image', key: 'url', label: 'Image', altKey: 'alt' },
        { t: 'text', key: 'caption', label: 'Légende' },
        { t: 'segmented', key: 'width', label: 'Largeur', options: o(['normal', 'Normale'], ['wide', 'Large'], ['full', 'Pleine']) },
        { t: 'switch', key: 'rounded', label: 'Coins arrondis' },
      ],
    },
  ],

  video: [
    {
      title: 'Vidéo',
      fields: [
        { t: 'segmented', key: 'source', label: 'Source', options: o(['file', 'Fichier'], ['embed', 'YouTube / Vimeo']) },
        { t: 'video', key: 'url', label: 'Vidéo', embed: (d) => d.source === 'embed' },
        { t: 'image', key: 'poster', label: 'Image d’attente', show: (d) => d.source !== 'embed' },
        { t: 'text', key: 'title', label: 'Titre (accessibilité)' },
        { t: 'switch', key: 'autoplay', label: 'Lecture automatique en boucle (sans son)' },
        { t: 'segmented', key: 'width', label: 'Largeur', options: o(['normal', 'Normale'], ['wide', 'Large'], ['full', 'Pleine']) },
      ],
    },
  ],

  slides: [
    {
      title: 'Diapositives',
      fields: [
        {
          t: 'list',
          key: 'slides',
          item: 'Diapositive',
          create: () => ({ image: '', title: 'Nouvelle diapositive', text: '' }),
          fields: [
            { t: 'image', key: 'image', label: 'Image', altKey: 'alt' },
            { t: 'text', key: 'title', label: 'Titre' },
            { t: 'textarea', key: 'text', label: 'Texte', rows: 2 },
            { t: 'link', key: 'link', label: 'Lien (facultatif)' },
          ],
        },
      ],
    },
    {
      title: 'Réglages',
      fields: [
        { t: 'switch', key: 'autoplay', label: 'Défilement automatique' },
        { t: 'number', key: 'interval', label: 'Durée par diapositive (s)', min: 2, max: 30, half: true, show: (d) => !!d.autoplay },
        { t: 'select', key: 'height', label: 'Hauteur', options: o(['md', 'Moyenne'], ['lg', 'Grande'], ['xl', 'Très grande']), half: true },
      ],
    },
  ],

  gallery: [
    heading(),
    {
      title: 'Photos',
      fields: [
        { t: 'select', key: 'style', label: 'Présentation', options: o(['polaroid', 'Polaroïds défilants'], ['grid', 'Grille'], ['masonry', 'Mosaïque']) },
        { t: 'text', key: 'handNote', label: 'Note manuscrite', show: (d) => d.style === 'polaroid' },
        { t: 'text', key: 'note', label: 'Note sous la galerie' },
        {
          t: 'list',
          key: 'items',
          item: 'Photo',
          create: () => ({ image: '', caption: '' }),
          fields: [
            { t: 'image', key: 'image', label: 'Photo', aspect: 'aspect-[4/3]' },
            { t: 'text', key: 'caption', label: 'Légende' },
          ],
        },
      ],
    },
  ],

  marquee: [
    {
      title: 'Bandeau',
      fields: [
        { t: 'segmented', key: 'speed', label: 'Vitesse', options: o(['slow', 'Lente'], ['normal', 'Normale'], ['fast', 'Rapide']) },
        {
          t: 'list',
          key: 'items',
          item: 'Élément',
          create: () => ({ text: 'Mot-clé' }),
          fields: [
            { t: 'text', key: 'text', label: 'Texte' },
            { t: 'image', key: 'logo', label: 'ou logo', aspect: 'aspect-[3/1]' },
          ],
        },
      ],
    },
  ],

  cards: [
    heading(),
    {
      title: 'Présentation',
      fields: [
        { t: 'select', key: 'style', label: 'Style des cartes', options: o(['card', 'Cartes blanches'], ['hoverDark', 'Cartes qui s’assombrissent au survol'], ['image', 'Cartes avec photo'], ['minimal', 'Minimal'], ['numbered', 'Numérotées']) },
        { t: 'segmented', key: 'columns', label: 'Colonnes', numeric: true, options: o(['2', '2'], ['3', '3'], ['4', '4']) },
        { t: 'text', key: 'textPrefix', label: 'Préfixe en gras du texte', placeholder: 'Ex. Réponse PEXEN —', half: true },
        { t: 'text', key: 'tagsLabel', label: 'Titre des étiquettes', half: true },
      ],
    },
    {
      title: 'Cartes',
      fields: [
        {
          t: 'list',
          key: 'items',
          item: 'Carte',
          create: () => ({ icon: 'zap', title: 'Nouvelle carte', text: '', tags: [] }),
          fields: [
            { t: 'icon', key: 'icon', label: 'Icône' },
            { t: 'image', key: 'image', label: 'Photo', aspect: 'aspect-[4/3]' },
            { t: 'text', key: 'imageAlt', label: 'Texte alternatif (ALT)', hint: 'Brief 00g — description accessible de la photo.' },
            { t: 'text', key: 'title', label: 'Titre' },
            { t: 'textarea', key: 'text', label: 'Texte', rows: 3 },
            { t: 'tags', key: 'tags', label: 'Étiquettes' },
            { t: 'text', key: 'linkLabel', label: 'Texte du lien', half: true },
            { t: 'link', key: 'link', label: 'Lien', half: true },
          ],
        },
      ],
    },
  ],

  showcase: [
    heading(),
    {
      title: 'Onglets',
      fields: [
        { t: 'number', key: 'interval', label: 'Changement automatique (s)', min: 0, max: 60, hint: '0 = pas de défilement automatique.' },
        {
          t: 'list',
          key: 'items',
          item: 'Onglet',
          create: () => ({ icon: 'zap', title: 'Nouvel onglet', text: '', image: '', chips: [] }),
          fields: [
            { t: 'icon', key: 'icon', label: 'Icône' },
            { t: 'text', key: 'title', label: 'Titre' },
            { t: 'textarea', key: 'text', label: 'Texte', rows: 3 },
            { t: 'image', key: 'image', label: 'Image' },
            { t: 'tags', key: 'chips', label: 'Points clés' },
            { t: 'text', key: 'buttonLabel', label: 'Texte du bouton', half: true },
            { t: 'link', key: 'link', label: 'Lien', half: true },
          ],
        },
      ],
    },
  ],

  steps: [
    heading(),
    {
      title: 'Étapes',
      fields: [
        { t: 'select', key: 'style', label: 'Présentation', options: o(['timeline', 'Frise animée'], ['list', 'Liste détaillée'], ['compact', 'Compacte']) },
        { t: 'text', key: 'deliverableLabel', label: 'Libellé « livrable »' },
        {
          t: 'list',
          key: 'items',
          item: 'Étape',
          create: () => ({ num: '', title: 'Nouvelle étape', text: '' }),
          fields: [
            { t: 'text', key: 'num', label: 'Numéro', half: true },
            { t: 'text', key: 'title', label: 'Titre', half: true },
            { t: 'textarea', key: 'text', label: 'Texte', rows: 3 },
            { t: 'text', key: 'deliverable', label: 'Livrable' },
          ],
        },
      ],
    },
    { title: 'Boutons', fields: [{ t: 'buttons', key: 'buttons', max: 2 }] },
  ],

  stats: [
    heading(),
    {
      title: 'Présentation',
      fields: [
        {
          t: 'segmented',
          key: 'style',
          label: 'Type de bloc',
          options: o(['cards', 'Cartes enjeux'], ['strip', 'Bandeau preuves'], ['inline', 'Chiffres en ligne']),
          hint: 'Cartes enjeux = titres + images + CTA. Bandeau = logos clients + chiffres + qualifications.',
        },
        {
          t: 'switch',
          key: 'countUp',
          label: 'Compteur animé à l’apparition',
          show: (d) => d.style !== 'cards',
        },
      ],
    },
    {
      title: 'Cartes / chiffres',
      fields: [
        {
          t: 'list',
          key: 'items',
          item: 'Carte',
          create: () => ({
            value: '',
            suffix: '',
            label: 'Nouveau titre',
            hint: '',
            image: '',
            ctaLabel: 'En savoir plus',
            link: '',
          }),
          summary: (it) => String(it.label || it.ctaLabel || `${it.prefix || ''}${it.value || ''}${it.suffix || ''}` || 'Carte'),
          fields: [
            { t: 'text', key: 'label', label: 'Titre' },
            { t: 'textarea', key: 'hint', label: 'Texte / description', rows: 3 },
            {
              t: 'image',
              key: 'image',
              label: 'Image de la carte',
              aspect: 'aspect-video',
              hint: 'Utilisée en mode « Cartes enjeux ».',
            },
            { t: 'text', key: 'imageAlt', label: 'ALT image' },
            { t: 'text', key: 'ctaLabel', label: 'Texte du bouton CTA', placeholder: 'Optimiser mon froid' },
            { t: 'link', key: 'link', label: 'Lien de la carte / du CTA' },
            {
              t: 'text',
              key: 'prefix',
              label: 'Chiffre — avant',
              half: true,
              placeholder: '+',
              hint: 'Bandeau preuves uniquement.',
            },
            { t: 'text', key: 'value', label: 'Chiffre — valeur', half: true },
            { t: 'text', key: 'suffix', label: 'Chiffre — après', half: true, placeholder: ' %' },
          ],
        },
      ],
    },
    {
      title: 'Bandeau preuves (clients & qualifications)',
      fields: [
        {
          t: 'textarea',
          key: 'footnote',
          label: 'Mentions astérisque (bas de page)',
          rows: 3,
          hint: 'Une mention par ligne. Affichées dans le footer, pas sous les chiffres.',
          show: (d) => d.style !== 'cards',
        },
        {
          t: 'list',
          key: 'partners',
          item: 'Client',
          create: () => ({ name: 'Client', logo: '' }),
          summary: (it) => String(it.name || 'Client'),
          show: (d) => d.style === 'strip' || d.style === 'inline',
          fields: [
            { t: 'text', key: 'name', label: 'Nom' },
            { t: 'image', key: 'logo', label: 'Logo' },
          ],
        },
        {
          t: 'list',
          key: 'qualifications',
          item: 'Qualification',
          create: () => ({ label: 'RGE', logo: '', caption: '', alt: '' }),
          summary: (it) => String(it.label || 'Qualif.'),
          show: (d) => d.style === 'strip' || d.style === 'inline',
          fields: [
            { t: 'text', key: 'label', label: 'Libellé', half: true },
            { t: 'text', key: 'caption', label: 'Légende (ex. Via notre partenaire)', half: true },
            { t: 'image', key: 'logo', label: 'Logo' },
            { t: 'text', key: 'alt', label: 'ALT' },
          ],
        },
      ],
    },
  ],

  panels: [
    heading(),
    {
      title: 'Panneaux',
      fields: [
        {
          t: 'list',
          key: 'items',
          item: 'Panneau',
          create: () => ({ image: '', title: 'Nouveau panneau', bullets: [] }),
          fields: [
            { t: 'image', key: 'image', label: 'Image de fond' },
            { t: 'text', key: 'imageAlt', label: 'Texte alternatif (ALT)' },
            { t: 'icon', key: 'icon', label: 'Icône' },
            { t: 'text', key: 'title', label: 'Titre' },
            { t: 'textarea', key: 'text', label: 'Texte', rows: 3 },
            { t: 'tags', key: 'bullets', label: 'Puces' },
            { t: 'text', key: 'linkLabel', label: 'Texte du lien', half: true },
            { t: 'link', key: 'link', label: 'Lien', half: true },
          ],
        },
      ],
    },
  ],

  checklist: [
    heading(),
    {
      title: 'Cartes',
      fields: [
        {
          t: 'list',
          key: 'cards',
          item: 'Carte',
          create: () => ({ icon: 'shieldCheck', title: 'Nouvelle carte', logos: [], entries: [] }),
          summary: (it) => String(it.title || 'Carte'),
          fields: [
            { t: 'text', key: 'title', label: 'Titre' },
            { t: 'text', key: 'tag', label: 'Étiquette (optionnel)', half: true },
            {
              t: 'icon',
              key: 'icon',
              label: 'Icône de secours',
              half: true,
              hint: 'Affichée seulement si aucun logo n’est renseigné.',
            },
            {
              t: 'list',
              key: 'logos',
              label: 'Logos',
              item: 'Logo',
              create: () => ({ src: '', alt: '', size: 'md' }),
              summary: (it) => String(it.alt || (it.src ? String(it.src).split('/').pop() : 'Logo')),
              fields: [
                { t: 'image', key: 'src', label: 'Fichier logo', aspect: 'aspect-[3/1]' },
                { t: 'text', key: 'alt', label: 'Texte alternatif (ALT)' },
                {
                  t: 'segmented',
                  key: 'size',
                  label: 'Taille',
                  options: o(['sm', 'Petit'], ['md', 'Moyen'], ['lg', 'Grand'], ['wide', 'Large (badge)']),
                },
              ],
            },
            {
              t: 'list',
              key: 'entries',
              label: 'Points',
              item: 'Point',
              create: () => ({ title: 'Nouveau point', text: '' }),
              fields: [
                { t: 'text', key: 'title', label: 'Titre' },
                { t: 'textarea', key: 'text', label: 'Texte', rows: 2 },
              ],
            },
          ],
        },
      ],
    },
  ],

  faq: [
    heading(false),
    {
      title: 'Questions',
      fields: [
        { t: 'segmented', key: 'layout', label: 'Mise en page', options: o(['split', 'Deux colonnes'], ['stacked', 'Une colonne']) },
        { t: 'switch', key: 'showContactCard', label: 'Carte « Une autre question ? »' },
        { t: 'text', key: 'contactLabel', label: 'Texte de la carte', show: (d) => !!d.showContactCard },
        {
          t: 'list',
          key: 'items',
          item: 'Question',
          create: () => ({ question: 'Nouvelle question ?', answer: '<p>Réponse.</p>' }),
          fields: [
            { t: 'text', key: 'question', label: 'Question' },
            { t: 'rich', key: 'answer', label: 'Réponse', minimal: true },
          ],
        },
      ],
    },
  ],

  testimonials: [
    heading(false),
    {
      title: 'Témoignages',
      fields: [
        {
          t: 'list',
          key: 'items',
          item: 'Témoignage',
          create: () => ({ quote: '', author: 'Nom', role: '' }),
          summary: (it) => String(it.author || ''),
          fields: [
            { t: 'textarea', key: 'quote', label: 'Citation', rows: 3 },
            { t: 'text', key: 'author', label: 'Auteur', half: true },
            { t: 'text', key: 'role', label: 'Fonction', half: true },
            { t: 'image', key: 'image', label: 'Photo', aspect: 'aspect-square' },
          ],
        },
      ],
    },
  ],

  table: [
    heading(false),
    {
      title: 'Tableau',
      fields: [
        { t: 'switch', key: 'searchable', label: 'Champ de recherche' },
        { t: 'text', key: 'searchPlaceholder', label: 'Texte du champ de recherche', show: (d) => !!d.searchable },
        { t: 'table' },
      ],
    },
  ],

  cta: [
    {
      title: 'Textes',
      fields: [
        { t: 'text', key: 'eyebrow', label: 'Sur-titre', half: true },
        { t: 'text', key: 'badge', label: 'Badge', half: true },
        { t: 'textarea', key: 'title', label: 'Titre', rows: 2 },
        { t: 'text', key: 'highlight', label: 'Partie colorée du titre' },
        { t: 'textarea', key: 'text', label: 'Texte', rows: 3 },
      ],
    },
    { title: 'Boutons', fields: [{ t: 'buttons', key: 'buttons', max: 3 }] },
    {
      title: 'Apparence',
      fields: [
        { t: 'select', key: 'variant', label: 'Fond du bandeau', options: o(['gradient', 'Dégradé de marque'], ['dark', 'Sombre'], ['light', 'Clair'], ['image', 'Photo']), half: true },
        { t: 'select', key: 'layout', label: 'Mise en page', options: o(['split', 'Texte + visuel'], ['centered', 'Centrée']), half: true },
        { t: 'image', key: 'backgroundImage', label: 'Photo de fond', show: (d) => d.variant === 'image' },
        { t: 'image', key: 'image', label: 'Image (polaroïd)', altKey: 'imageAlt', aspect: 'aspect-[4/3]', show: (d) => d.layout === 'split' },
        { t: 'text', key: 'imageCaption', label: 'Légende manuscrite', show: (d) => d.layout === 'split' && !!d.image },
        { t: 'text', key: 'bigNumber', label: 'Grand chiffre', half: true, show: (d) => d.layout === 'split' && !d.image },
        { t: 'text', key: 'bigNumberStrong', label: 'Texte en gras', half: true, show: (d) => d.layout === 'split' && !d.image },
        { t: 'text', key: 'bigNumberLabel', label: 'Texte du chiffre', show: (d) => d.layout === 'split' && !d.image },
      ],
    },
  ],

  projects: [
    heading(),
    {
      title: 'Réalisations',
      fields: [
        { t: 'select', key: 'layout', label: 'Présentation', options: o(['featured', 'Une grande + trois compactes'], ['grid', 'Grille avec filtres'], ['compact', 'Liste compacte']) },
        { t: 'switch', key: 'showFilters', label: 'Onglets de filtre par secteur', show: (d) => d.layout === 'grid' },
        { t: 'segmented', key: 'filter', label: 'Sélection', options: o(['all', 'Toutes'], ['sector', 'Un secteur']) },
        { t: 'select', key: 'sector', label: 'Secteur', options: SECTORS.slice(1), show: (d) => d.filter === 'sector' },
        { t: 'number', key: 'limit', label: 'Nombre maximum', min: 0, max: 50, hint: '0 = toutes les réalisations publiées.' },
      ],
    },
  ],

  simulator: [
    heading(false),
    {
      title: 'Affichage',
      fields: [
        {
          t: 'segmented',
          key: 'variant',
          label: 'Type de bloc',
          options: o(['teaser', 'Bandeau (lien vers l’outil)'], ['tool', 'Outil 3 étapes']),
        },
        { t: 'form', key: 'formId', label: 'Formulaire qui reçoit la demande', hint: 'Les champs se gèrent dans Engagement › Formulaires.' },
        { t: 'text', key: 'ctaLabel', label: 'Texte du bouton d’envoi', show: (d) => d.variant !== 'teaser' },
        { t: 'text', key: 'teaserCtaLabel', label: 'Texte du bouton', show: (d) => d.variant === 'teaser', half: true },
        { t: 'link', key: 'teaserCtaLink', label: 'Destination', show: (d) => d.variant === 'teaser', half: true, placeholder: '/estimation-financement/' },
        { t: 'text', key: 'teaserNote', label: 'Note sous le bandeau', show: (d) => d.variant === 'teaser' },
      ],
    },
    {
      title: 'Résultat affiché',
      fields: [
        { t: 'text', key: 'resultPrefix', label: 'Libellé du résultat', placeholder: 'Financement estimé' },
        { t: 'textarea', key: 'resultNote', label: 'Phrase sous la fourchette', rows: 2 },
        { t: 'textarea', key: 'disclaimer', label: 'Mention * (sans valeur contractuelle)', rows: 2 },
      ],
    },
    {
      title: 'Après l’estimation',
      fields: [
        { t: 'text', key: 'howTitle', label: 'Titre « comment c’est estimé »' },
        { t: 'textarea', key: 'howText', label: 'Texte explicatif', rows: 4 },
        { t: 'text', key: 'contactTitle', label: 'Titre du bandeau contact' },
        { t: 'textarea', key: 'contactText', label: 'Texte du bandeau contact (48 h)', rows: 2 },
        { t: 'link', key: 'privacyPath', label: 'Politique de confidentialité', placeholder: '/politique-de-confidentialite/' },
      ],
    },
    {
      title: 'Barème — types de site',
      fields: [
        {
          t: 'list',
          key: 'siteTypes',
          item: 'Type de site',
          create: () => ({ id: `st-${Math.random().toString(36).slice(2, 8)}`, label: 'Nouveau type', factor: 1 }),
          summary: (it) => `${it.label || 'Type'} × ${it.factor ?? 1}`,
          fields: [
            { t: 'text', key: 'label', label: 'Libellé', half: true },
            { t: 'number', key: 'factor', label: 'Coefficient', min: 0, max: 3, step: 0.01, half: true },
          ],
        },
      ],
    },
    {
      title: 'Barème — régions',
      fields: [
        {
          t: 'list',
          key: 'regions',
          item: 'Région',
          create: () => ({ id: `rg-${Math.random().toString(36).slice(2, 8)}`, label: 'Région', factor: 1 }),
          summary: (it) => `${it.label || 'Région'} × ${it.factor ?? 1}`,
          fields: [
            { t: 'text', key: 'label', label: 'Libellé', half: true },
            { t: 'number', key: 'factor', label: 'Coefficient', min: 0, max: 3, step: 0.01, half: true },
          ],
        },
      ],
    },
    {
      title: 'Barème — travaux',
      fields: [
        {
          t: 'list',
          key: 'operations',
          item: 'Travaux',
          create: () => ({ id: `op-${Math.random().toString(36).slice(2, 8)}`, label: 'Nouvelle action', minPerM2: 5, maxPerM2: 15 }),
          summary: (it) => `${it.label || 'Action'} · ${it.minPerM2 ?? 0}–${it.maxPerM2 ?? 0} €/m²`,
          fields: [
            { t: 'text', key: 'label', label: 'Libellé' },
            { t: 'number', key: 'minPerM2', label: 'Min € / m²', min: 0, max: 200, step: 0.5, half: true },
            { t: 'number', key: 'maxPerM2', label: 'Max € / m²', min: 0, max: 400, step: 0.5, half: true },
            { t: 'number', key: 'minPerKw', label: 'Min € / kW (facultatif)', min: 0, max: 500, step: 1, half: true },
            { t: 'number', key: 'maxPerKw', label: 'Max € / kW (facultatif)', min: 0, max: 800, step: 1, half: true },
          ],
        },
      ],
    },
    {
      title: 'Barème — énergies',
      fields: [
        {
          t: 'list',
          key: 'energies',
          item: 'Énergie',
          create: () => ({ id: `en-${Math.random().toString(36).slice(2, 8)}`, label: 'Énergie', factor: 1 }),
          summary: (it) => `${it.label || 'Énergie'} × ${it.factor ?? 1}`,
          fields: [
            { t: 'text', key: 'label', label: 'Libellé', half: true },
            { t: 'number', key: 'factor', label: 'Coefficient', min: 0, max: 3, step: 0.01, half: true },
          ],
        },
      ],
    },
  ],

  contactForm: [
    {
      title: 'Formulaire',
      fields: [
        { t: 'form', key: 'formId', label: 'Formulaire', hint: 'Les champs se gèrent dans Engagement › Formulaires.' },
        { t: 'text', key: 'title', label: 'Titre' },
        { t: 'textarea', key: 'intro', label: 'Introduction', rows: 2 },
        { t: 'text', key: 'submitLabel', label: 'Texte du bouton d’envoi' },
      ],
    },
    {
      title: 'Colonne de coordonnées',
      fields: [
        { t: 'text', key: 'phoneLabel', label: 'Titre du téléphone', half: true },
        { t: 'text', key: 'phoneHint', label: 'Précision', half: true },
        { t: 'text', key: 'listTitle', label: 'Titre de la liste' },
        { t: 'tags', key: 'listItems', label: 'Éléments de la liste' },
      ],
    },
  ],

  spacer: [
    {
      title: 'Espace',
      fields: [
        { t: 'range', key: 'height', label: 'Hauteur', min: 0, max: 240, step: 4, suffix: ' px' },
        { t: 'switch', key: 'divider', label: 'Ligne de séparation' },
      ],
    },
  ],

  html: [
    {
      title: 'Code',
      fields: [{ t: 'textarea', key: 'html', label: 'HTML', rows: 12, hint: 'Les balises <script> ne sont pas exécutées : utilisez une iframe pour intégrer un widget ou une carte.' }],
    },
  ],
};

/** Champs de la fiche réalisation (template « project »). */
export const PROJECT_FIELDS: FieldDef[] = [
  { t: 'text', key: 'client', label: 'Client (ex. CARREFOUR MARKET)' },
  { t: 'text', key: 'location', label: 'Ville / Région', half: true },
  { t: 'text', key: 'department', label: 'Département', half: true },
  { t: 'select', key: 'sector', label: 'Secteur', options: SECTORS.slice(1), half: true },
  { t: 'text', key: 'badge', label: 'Badge carte (ex. Opération financée CEE)', half: true },
  { t: 'text', key: 'primeCee', label: 'Prime CEE valorisée (ex. 290 000 €)', half: true },
  { t: 'text', key: 'cumac', label: 'Volume CEE (ex. 30,6 GWh cumac)', half: true },
  { t: 'text', key: 'ceeSheet', label: 'Fiches CEE (ex. BAT-TH-134 · BAT-TH-139)' },
  { t: 'text', key: 'solution', label: 'Titre de l’opération / Solution' },
  { t: 'textarea', key: 'summary', label: 'Résumé court', rows: 3 },
  { t: 'image', key: 'image', label: 'Image de couverture' },
  { t: 'tags', key: 'results', label: 'Puces techniques / Résultats clés (affichés sur la carte)' },
  { t: 'switch', key: 'featured', label: 'Mettre en avant sur l’accueil' },
];

export const blockSummary = (d: Data): string => {
  const pick = ['title', 'badgeText', 'eyebrow', 'html', 'url', 'caption'].map((k) => d[k]).find((v) => typeof v === 'string' && v.trim()) as string | undefined;
  return (pick || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
};