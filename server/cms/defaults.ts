import type { CmsSnapshot, MenuConfig } from './types';

const now = () => new Date().toISOString();

export function createDefaultMenus(): MenuConfig[] {
  const expertisesChildren = [
    { id: 'm-exp-froid', label: 'Froid commercial & industriel', path: '/expertises/froid/' },
    { id: 'm-exp-recup', label: 'Récupération de chaleur', path: '/expertises/recuperation-de-chaleur/' },
    { id: 'm-exp-cvc', label: 'Chauffage & traitement d\'air', path: '/expertises/chauffage-traitement-air/' },
    { id: 'm-exp-gtb', label: 'GTB / GTC & BACS', path: '/expertises/gtb-gtc/' },
    { id: 'm-exp-iso', label: 'Isolation technique', path: '/expertises/isolation-technique/' },
    { id: 'm-exp-cee', label: 'Réglementation & CEE', path: '/expertises/reglementation-cee/' },
  ];
  const secteursChildren = [
    { id: 'm-sec-ind', label: 'Industrie', path: '/secteurs/industrie/' },
    { id: 'm-sec-ter', label: 'Tertiaire', path: '/secteurs/tertiaire/' },
    { id: 'm-sec-res', label: 'Résidentiel collectif', path: '/secteurs/residentiel-collectif/' },
  ];

  const primary: MenuConfig = {
    id: 'primary',
    label: 'Menu principal (desktop)',
    items: [
      { id: 'm-exp', label: 'Expertises', path: '/expertises/', children: expertisesChildren },
      { id: 'm-sec', label: 'Secteurs', path: '/secteurs/', children: secteursChildren },
      { id: 'm-real', label: 'Réalisations', path: '/realisations/' },
      { id: 'm-approche', label: 'Notre approche', path: '/notre-approche/' },
      { id: 'm-contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
    ],
  };

  const mobile: MenuConfig = {
    id: 'mobile',
    label: 'Menu mobile',
    items: JSON.parse(JSON.stringify(primary.items)) as MenuConfig['items'],
  };

  const footer: MenuConfig = {
    id: 'footer',
    label: 'Pied de page',
    items: [
      { id: 'f-real', label: 'Réalisations & Chantiers', path: '/realisations/' },
      { id: 'f-approche', label: 'Notre approche (4 étapes)', path: '/notre-approche/' },
      { id: 'f-contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
      { id: 'f-legal', label: 'Mentions légales', path: '/mentions-legales/' },
      { id: 'f-privacy', label: 'Politique de confidentialité', path: '/politique-de-confidentialite/' },
      { id: 'f-cookies', label: 'Cookies', path: '/cookies/' },
    ],
  };

  return [primary, mobile, footer];
}

export function createEmptySnapshot(): CmsSnapshot {
  const t = now();
  return {
    version: 1,
    general: {
      legalName: 'PEXEN SAS',
      baseline: 'Ingénierie & Performance Énergétique',
      slogan: 'Optimiser aujourd\'hui. Performer demain.',
      phone: '01 41 93 52 80',
      phoneClean: '+33141935280',
      contactEmail: 'contact@pexen.fr',
      slaHours: '48 h ouvrées',
      address: 'Paris & Déploiement partout en France',
      timezone: 'Europe/Paris',
      locale: 'fr-FR',
    },
    branding: {
      siteName: 'PEXEN®',
      tagline: 'Ingénierie & Performance Énergétique',
      logoUrl: '/logo-pexen.svg',
      colors: {
        primary: '#00C6BA',
        primaryHover: '#00A89D',
        accent: '#0066EE',
        navy: '#0B1528',
        background: '#F5F7FA',
        text: '#0B1528',
        muted: '#64748B',
        border: '#E3E8EE',
      },
      fonts: { heading: 'Poppins', body: 'Poppins' },
    },
    pages: [],
    posts: [],
    menus: createDefaultMenus(),
    forms: [
      {
        id: 'contact-main',
        name: 'Formulaire contact principal',
        recipientEmails: ['contact@pexen.fr'],
        successPath: '/contact/merci/',
        enabled: true,
        honeypotField: 'website_url',
        fields: [
          { id: 'f1', name: 'vousEtes', label: 'Vous êtes', type: 'select', required: true, options: ['Entreprise', 'Collectivité', 'Partenaire CEE', 'Autre'] },
          { id: 'f2', name: 'entreprise', label: 'Entreprise / Organisation', type: 'text', required: true },
          { id: 'f3', name: 'nomPrenom', label: 'Nom & prénom', type: 'text', required: true },
          { id: 'f4', name: 'email', label: 'E-mail', type: 'email', required: true },
          { id: 'f5', name: 'telephone', label: 'Téléphone', type: 'tel', required: true },
          { id: 'f6', name: 'message', label: 'Votre projet', type: 'textarea', required: true },
          { id: 'f7', name: 'rgpdAccepted', label: 'J\'accepte la politique de confidentialité', type: 'checkbox', required: true },
        ],
      },
    ],
    formSubmissions: [],
    whatsapp: {
      enabled: true,
      number: '+33141935280',
      defaultMessage: 'Bonjour PEXEN, je souhaite échanger sur un projet de performance énergétique.',
      showOnMobile: true,
      showOnDesktop: true,
      position: 'bottom-right',
    },
    floatingButtons: [],
    ai: {
      enabled: true,
      model: 'gemini-3.8-flash',
      temperature: 0.3,
      maxMessagesPerSession: 30,
      maxSessionsPerDayPerIp: 20,
      maxTokensPerDayGlobal: 500_000,
      showOnPages: '*',
    },
    newsletter: {
      enabled: false,
      provider: 'internal',
      doubleOptIn: true,
    },
    subscribers: [],
    settings: {
      publicUrl: 'https://pexen.fr',
      maintenance: {
        enabled: false,
        title: 'Maintenance en cours',
        message: 'Le site est momentanément indisponible. Merci de votre patience.',
        allowedIps: [],
      },
      cookieBannerEnabled: true,
      analyticsEnabled: true,
      sitemapAuto: true,
      seo: createDefaultSeoGlobal(),
    },
    google: { connected: false },
    media: [],
    redirects: [],
    users: [],
  };
}

export function createDefaultSeoGlobal(): import('./types').SeoGlobalSettings {
  return {
    titleSeparator: '|',
    titleSuffix: 'PEXEN',
    organizationName: 'PEXEN SAS',
    socialProfiles: [],
  };
}

export function defaultSeoForPath(path: string, title: string): import('./types').SeoMeta {
  return {
    focusKeyphrase: '',
    seoTitle: `${title} | PEXEN`,
    metaDescription:
      'Réduisez la facture énergétique de vos sites industriels, tertiaires et résidentiels collectifs : audit, travaux, financement CEE et suivi des économies.',
    slug: path.replace(/^\/|\/$/g, '') || 'accueil',
    noindex: false,
    nofollow: false,
    twitterCard: 'summary_large_image',
    schemaType: path === '/' ? 'Organization' : 'WebPage',
  };
}

export { now as cmsNow };
