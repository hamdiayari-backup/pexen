import type { CmsSnapshot, MenuConfig, SystemSettings } from './types';
import { createDefaultRoles } from './permissions';
import { defaultAppearance } from '../themes/registry';

const now = () => new Date().toISOString();

export function createDefaultMenus(): MenuConfig[] {
  const expertisesChildren = [
    { id: 'm-exp-froid', label: 'Froid commercial & industriel', path: '/expertises/froid-commercial-industriel/' },
    { id: 'm-exp-recup', label: 'Récupération de chaleur', path: '/expertises/recuperation-de-chaleur/' },
    { id: 'm-exp-cvc', label: 'Chauffage & traitement d\'air', path: '/expertises/pompe-a-chaleur-tertiaire/' },
    { id: 'm-exp-gtb', label: 'Pilotage GTB / GTC', path: '/expertises/gtb-tertiaire-gtc/' },
    { id: 'm-exp-iso', label: 'Isolation technique', path: '/expertises/isolation-technique/' },
    { id: 'm-exp-cee', label: 'Réglementation & financement CEE', path: '/expertises/financement-cee-reglementation/' },
  ];
  const secteursChildren = [
    { id: 'm-sec-ind', label: 'Industrie', path: '/secteurs/efficacite-energetique-industrielle/' },
    { id: 'm-sec-ter', label: 'Tertiaire', path: '/secteurs/efficacite-energetique-tertiaire/' },
    { id: 'm-sec-res', label: 'Résidentiel collectif', path: '/secteurs/renovation-energetique-copropriete/' },
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
    appearance: defaultAppearance(),
    general: {
      legalName: 'PEXEN SAS',
      baseline: 'Ingénierie & Performance Énergétique',
      slogan: 'Optimiser aujourd\'hui. Performer demain.',
      phone: '01 41 93 52 80',
      phoneClean: '+33141935280',
      contactEmail: 'contact@pexen.fr',
      slaHours: '48 h ouvrées',
      address: '111 avenue Victor Hugo, 93300 Aubervilliers',
      timezone: 'Europe/Paris',
      locale: 'fr-FR',
    },
    branding: {
      siteName: 'PEXEN®',
      tagline: 'Ingénierie & Performance Énergétique',
      logoUrl: '/brand/logo-sans-baseline-couleur.svg',
      logoDarkUrl: '/brand/logo-principal-blanc.svg',
      faviconUrl: '/favicon.svg',
      colors: {
        primary: '#009FCC',
        primaryHover: '#00769A',
        accent: '#01CDF3',
        navy: '#082D4A',
        background: '#F4F8F9',
        text: '#0B1B2B',
        muted: '#5A6B7B',
        border: '#D5E1E6',
      },
      fonts: { heading: 'Sora', body: 'Figtree' },
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
      buttonLabel: 'Conseiller PEXEN',
      statusLabel: 'En ligne',
      panelTitle: 'Conseiller PEXEN',
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
      footerLegalNotes: [
        '* Volume d’économies d’énergie estimé selon les fiches d’opérations standardisées mobilisées : le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements. Il ne constitue pas une mesure des consommations réelles.',
        '* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique (10 ans), à conditions d’exploitation comparables.',
      ],
    },
    google: { connected: false },
    media: [],
    redirects: [],
    users: [],
    roles: createDefaultRoles(),
    system: createDefaultSystemSettings(),
  };
}

export function createDefaultSystemSettings(): SystemSettings {
  return {
    smtp: {
      enabled: false,
      host: '',
      port: 587,
      security: 'starttls',
      username: '',
      fromName: 'PEXEN',
      fromEmail: '',
      replyTo: '',
      timeoutSec: 20,
      allowSelfSigned: false,
    },
    notifications: { securityAlerts: true, accountChanges: true, adminEmails: [] },
    security: {
      passwordMinLength: 10,
      requireUppercase: false,
      requireNumber: true,
      requireSymbol: false,
      passwordExpiryDays: 0,
      sessionHours: 12,
      rememberDays: 30,
      idleMinutes: 0,
      maxLoginAttempts: 8,
      lockoutMinutes: 15,
      twoFactor: 'optional',
      adminIpAllowlist: [],
      hsts: false,
    },
    limits: {
      publicApiPerMinute: 300,
      adminApiPerMinute: 600,
      formSubmissions: { max: 5, windowMinutes: 10 },
      newsletter: { max: 5, windowMinutes: 10 },
      passwordReset: { max: 5, windowMinutes: 60 },
    },
    uploads: { maxSizeMb: 15, allowImages: true, allowSvg: true, allowVideo: true, allowPdf: true },
    privacy: { analyticsRetentionDays: 400, submissionsRetentionDays: 0, auditRetentionDays: 365, mailLogRetentionDays: 90, storeSubmitterIp: true },
    performance: { publicCacheSeconds: 30 },
  };
}

/** Complète récursivement `value` avec les clés manquantes de `defaults` (les tableaux sont pris tels quels). */
export function withDefaults<T>(defaults: T, value: unknown): T {
  if (Array.isArray(defaults)) return (Array.isArray(value) ? value : defaults) as T;
  if (defaults && typeof defaults === 'object') {
    const src = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
    const out: Record<string, unknown> = { ...src };
    for (const [k, d] of Object.entries(defaults as Record<string, unknown>)) out[k] = withDefaults(d, src[k]);
    return out as T;
  }
  return (value === undefined || value === null || typeof value !== typeof defaults ? defaults : value) as T;
}

export function createDefaultSeoGlobal(): import('./types').SeoGlobalSettings {
  return {
    titleSeparator: '|',
    titleSuffix: 'PEXEN',
    organizationName: 'PEXEN SAS',
    socialProfiles: [],
    gaMeasurementId: '',
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
