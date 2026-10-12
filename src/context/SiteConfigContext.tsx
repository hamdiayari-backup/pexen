import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PEXEN_INFO } from '../data/pexenData';
import { IS_PREVIEW, usePreviewState } from '../preview';
import type { TokenValues } from '../../server/cms/blocks';

export interface BrandingPayload {
  siteName: string;
  tagline: string;
  logoUrl: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  colors: Record<string, string>;
  fonts?: { heading: string; body: string };
}

export interface SiteConfigPayload {
  general: {
    legalName: string;
    baseline: string;
    slogan: string;
    phone: string;
    phoneClean: string;
    contactEmail: string;
    slaHours: string;
    address: string;
  };
  branding: BrandingPayload;
  menus: { id: string; label: string; items: MenuItemDto[] }[];
  whatsapp: {
    enabled: boolean;
    number: string;
    defaultMessage: string;
    showOnMobile: boolean;
    showOnDesktop: boolean;
    position?: 'bottom-right' | 'bottom-left';
  };
  floatingButtons?: { id: string; label: string; path: string; style: 'primary' | 'outline' | 'ghost'; enabled: boolean }[];
  newsletterEnabled?: boolean;
  ai: { enabled: boolean; showOnPages: string[] | '*' };
  settings: {
    cookieBannerEnabled: boolean;
    analyticsEnabled: boolean;
    maintenance: { enabled: boolean; title: string; message: string };
  };
  redirects: { from: string; to: string; permanent: boolean }[];
}

export interface MenuItemDto {
  id: string;
  label: string;
  path: string;
  children?: MenuItemDto[];
  highlight?: boolean;
  openInNewTab?: boolean;
}

/** '*' = toutes les pages ; un motif terminé par * inclut les sous-pages. */
export function pathMatches(patterns: string[] | '*', path: string): boolean {
  if (patterns === '*') return true;
  const norm = (p: string) => (p.endsWith('/') ? p : `${p}/`);
  return patterns.some((pat) => (pat.endsWith('*') ? norm(path).startsWith(pat.slice(0, -1)) : norm(pat) === norm(path)));
}

/** Correspondance couleurs du backoffice → variables CSS du thème (src/index.css). */
const COLOR_VARS: Record<string, string> = {
  primary: '--px-primary',
  primaryHover: '--px-primary-dark',
  accent: '--px-accent',
  navy: '--px-navy',
  background: '--px-surface',
  text: '--px-text',
  muted: '--px-muted',
  border: '--px-border',
};

const PRELOADED_FONTS = new Set(['Poppins']);

function ensureFont(family: string) {
  if (!family || PRELOADED_FONTS.has(family)) return;
  const id = `px-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export function applyBranding(branding: BrandingPayload | undefined) {
  if (!branding) return;
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    const value = branding.colors?.[key];
    if (value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) root.style.setProperty(cssVar, value);
  }
  if (branding.fonts) {
    ensureFont(branding.fonts.body);
    ensureFont(branding.fonts.heading);
    root.style.setProperty('--px-font-body', `'${branding.fonts.body}'`);
    root.style.setProperty('--px-font-heading', `'${branding.fonts.heading}'`);
  }
  if (branding.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }
}

const SiteConfigContext = createContext<SiteConfigPayload | null>(null);

export function SiteConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfigPayload | null>(null);
  const preview = usePreviewState();

  useEffect(() => {
    fetch('/api/public/site-config')
      .then((r) => r.json())
      .then((cfg: SiteConfigPayload) => setConfig(cfg))
      .catch(() => setConfig(null));
  }, []);

  const effective = useMemo(() => {
    if (!config || !IS_PREVIEW || !preview?.site) return config;
    return { ...config, ...preview.site } as SiteConfigPayload;
  }, [config, preview?.site]);

  useEffect(() => {
    applyBranding(effective?.branding);
  }, [effective?.branding]);

  return <SiteConfigContext.Provider value={effective}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

/** Infos affichage — CMS prioritaire, fallback pexenData */
export function usePexenInfo() {
  const cfg = useSiteConfig();
  if (!cfg) return PEXEN_INFO;
  return {
    ...PEXEN_INFO,
    name: cfg.branding.siteName || PEXEN_INFO.name,
    legalName: cfg.general.legalName || PEXEN_INFO.legalName,
    baseline: cfg.general.baseline || PEXEN_INFO.baseline,
    slogan: cfg.general.slogan || PEXEN_INFO.slogan,
    phone: cfg.general.phone || PEXEN_INFO.phone,
    phoneClean: cfg.general.phoneClean || PEXEN_INFO.phoneClean,
    contactEmail: cfg.general.contactEmail || PEXEN_INFO.contactEmail,
    slaHours: cfg.general.slaHours || PEXEN_INFO.slaHours,
    address: cfg.general.address || PEXEN_INFO.address,
  };
}

/** Valeurs des variables {{…}} utilisables dans les textes des blocs. */
export function useTokens(): TokenValues {
  const info = usePexenInfo();
  return useMemo(
    () => ({ phone: info.phone, phoneClean: info.phoneClean, email: info.contactEmail, sla: info.slaHours, company: info.legalName }),
    [info.phone, info.phoneClean, info.contactEmail, info.slaHours, info.legalName]
  );
}
