/** Modèle de données CMS PEXEN — source unique pour le site et le backoffice */

import type { BlockKind, BlockStyle, ProjectMeta } from './blocks';

export type BlockType = BlockKind;

export interface CmsBlock {
  id: string;
  type: BlockType;
  data: Record<string, unknown>;
  style?: Partial<BlockStyle>;
}

export interface SeoMeta {
  focusKeyphrase: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  canonicalUrl?: string;
  noindex: boolean;
  nofollow: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard: 'summary' | 'summary_large_image';
  schemaType: 'WebPage' | 'Article' | 'Organization' | 'LocalBusiness';
  breadcrumbsTitle?: string;
}

export type PageContentSource = 'react' | 'cms';
export type PageTemplate = 'default' | 'landing' | 'legal' | 'project';

export interface CmsPage {
  id: string;
  path: string;
  title: string;
  status: 'draft' | 'published' | 'scheduled';
  publishedAt?: string;
  scheduledAt?: string;
  contentSource: PageContentSource;
  template: PageTemplate;
  blocks: CmsBlock[];
  seo: SeoMeta;
  /** Fiche réalisation (template `project`) : alimente les blocs « Réalisations ». */
  project?: ProjectMeta;
  updatedAt: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  children?: MenuItem[];
  openInNewTab?: boolean;
  highlight?: boolean;
}

export interface MenuConfig {
  id: 'primary' | 'mobile' | 'footer';
  label: string;
  items: MenuItem[];
}

export interface ThemeBranding {
  siteName: string;
  tagline: string;
  logoUrl: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  colors: {
    primary: string;
    primaryHover: string;
    accent: string;
    navy: string;
    background: string;
    text: string;
    muted: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export interface SiteGeneralInfo {
  legalName: string;
  baseline: string;
  slogan: string;
  phone: string;
  phoneClean: string;
  contactEmail: string;
  slaHours: string;
  address: string;
  timezone: string;
  locale: string;
}

export interface WhatsAppConfig {
  enabled: boolean;
  number: string;
  defaultMessage: string;
  showOnMobile: boolean;
  showOnDesktop: boolean;
  position: 'bottom-right' | 'bottom-left';
}

export interface FloatingButtonConfig {
  id: string;
  label: string;
  path: string;
  style: 'primary' | 'outline' | 'ghost';
  enabled: boolean;
}

export interface AiAssistantConfig {
  enabled: boolean;
  model: string;
  temperature: number;
  maxMessagesPerSession: number;
  maxSessionsPerDayPerIp: number;
  maxTokensPerDayGlobal: number;
  systemInstructionOverride?: string;
  showOnPages: '*' | string[];
}

export interface ContactFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox';
  required: boolean;
  options?: string[];
  placeholder?: string;
  width?: 'full' | 'half';
}

export interface ContactFormConfig {
  id: string;
  name: string;
  recipientEmails: string[];
  successPath: string;
  fields: ContactFormField[];
  honeypotField?: string;
  enabled: boolean;
}

export interface ContactSubmission {
  id: string;
  formId: string;
  payload: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  createdAt: string;
  read: boolean;
}

export interface NewsletterConfig {
  enabled: boolean;
  provider: 'internal' | 'mailchimp' | 'brevo' | 'custom';
  doubleOptIn: boolean;
  welcomeEmailSubject?: string;
  apiKeyEnvVar?: string;
  listId?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'unsubscribed';
  source?: string;
  confirmToken?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface ContentRevision {
  id: string;
  entityType: 'page' | 'post';
  entityId: string;
  label: string;
  snapshot: CmsPage | BlogPost;
  createdAt: string;
  authorEmail?: string;
}

export interface MaintenanceConfig {
  enabled: boolean;
  title: string;
  message: string;
  allowedIps: string[];
  bypassSecret?: string;
}

export interface SeoGlobalSettings {
  titleSeparator: string;
  titleSuffix: string;
  defaultOgImage?: string;
  organizationName: string;
  organizationLogo?: string;
  socialProfiles: string[];
  googleVerification?: string;
  bingVerification?: string;
}

export interface SiteSettings {
  publicUrl: string;
  maintenance: MaintenanceConfig;
  cookieBannerEnabled: boolean;
  analyticsEnabled: boolean;
  robotsTxtExtra?: string;
  sitemapAuto: boolean;
  seo: SeoGlobalSettings;
}

export interface GoogleIntegration {
  connected: boolean;
  searchConsoleProperty?: string;
  analyticsPropertyId?: string;
  oauthRefreshToken?: string;
  lastSyncAt?: string;
}

export interface MediaAsset {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  alt?: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  blocks: CmsBlock[];
  seo: SeoMeta;
  status: 'draft' | 'published';
  publishedAt?: string;
  author?: string;
  tags: string[];
  updatedAt: string;
  createdAt: string;
}

export interface RedirectRule {
  from: string;
  to: string;
  permanent: boolean;
}

export interface AnalyticsEvent {
  id: string;
  kind: 'view' | 'leave';
  sessionId: string;
  path: string;
  referrer?: string;
  country?: string;
  city?: string;
  device: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  durationSec?: number;
  ts: string;
}

export interface AdminUser {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: 'superadmin' | 'editor' | 'seo' | 'viewer';
  name: string;
  lastLoginAt?: string;
}

export interface CmsSnapshot {
  version: number;
  general: SiteGeneralInfo;
  branding: ThemeBranding;
  pages: CmsPage[];
  posts: BlogPost[];
  menus: MenuConfig[];
  forms: ContactFormConfig[];
  formSubmissions: ContactSubmission[];
  whatsapp: WhatsAppConfig;
  floatingButtons: FloatingButtonConfig[];
  ai: AiAssistantConfig;
  newsletter: NewsletterConfig;
  subscribers: NewsletterSubscriber[];
  settings: SiteSettings;
  google: GoogleIntegration;
  media: MediaAsset[];
  redirects: RedirectRule[];
  /** Hérité : les événements sont désormais dans data/cms/analytics.jsonl */
  analyticsEvents?: AnalyticsEvent[];
  users: AdminUser[];
}

export interface AnalyticsSummary {
  days: number;
  pageViews: number;
  uniqueSessions: number;
  avgTimeOnPageSec: number;
  bounceRate: number;
  activeNow: number;
  timeseries: { date: string; views: number; sessions: number }[];
  topPages: { path: string; views: number; avgTimeSec: number }[];
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
  referrers: { source: string; views: number }[];
  recent: AnalyticsEvent[];
}
