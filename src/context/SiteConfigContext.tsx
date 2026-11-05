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
  ai: {
    enabled: boolean;
    showOnPages: string[] | '*';
    buttonLabel?: string;
    statusLabel?: string;
    panelTitle?: string;
  };
  settings: {
    cookieBannerEnabled: boolean;
    analyticsEnabled: boolean;
    maintenance: { enabled: boolean; title: string; message: string };
    footerLegalNotes?: string[];
    seo?: { gaMeasurementId?: string; googleVerification?: string };
  };
  redirects: { from: string; to: string; permanent: boolean }[];
  appearance?: { activeThemeId: 'default' | 'pexen-ultra' | 'pexen-maquette' };
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

/** Correspondance couleurs du backoffice → variables CSS du thème Classique (src/index.css). */
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

const PRELOADED_FONTS = new Set(['Poppins', 'Figtree', 'Sora']);

function ensureFont(family: string) {
  if (!family || PRELOADED_FONTS.has(family)) return;
  const id = `px-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function hexToRgb(hex: string): string | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

function setVar(root: CSSStyleDeclaration, name: string, value: string) {
  /* important : bat les !important de pexen-brand.css / Bootstrap du thème Ultra */
  root.setProperty(name, value, 'important');
}

export function applyBranding(branding: BrandingPayload | undefined) {
  if (!branding) return;
  const root = document.documentElement.style;
  const c = branding.colors || {};

  for (const [key, cssVar] of Object.entries(COLOR_VARS)) {
    const value = c[key];
    if (value && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) setVar(root, cssVar, value);
  }

  /* Thème Ultra (Bizen) + Bootstrap — mêmes jetons que /administrator/branding */
  const primary = c.primary;
  const primaryHover = c.primaryHover;
  const accent = c.accent;
  const navy = c.navy;
  const surface = c.background;
  const text = c.text;
  const muted = c.muted;

  if (primary && hexToRgb(primary)) {
    setVar(root, '--primary', primary);
    setVar(root, '--primary-rgb', hexToRgb(primary)!);
    setVar(root, '--px-primary-rgb', hexToRgb(primary)!);
    setVar(root, '--bs-primary', primary);
    setVar(root, '--bs-primary-rgb', hexToRgb(primary)!);
  }
  if (primaryHover && hexToRgb(primaryHover)) {
    setVar(root, '--hover', primaryHover);
  }
  if (accent && hexToRgb(accent)) {
    setVar(root, '--bs-info', accent);
    setVar(root, '--bs-info-rgb', hexToRgb(accent)!);
    setVar(root, '--px-accent-rgb', hexToRgb(accent)!);
  }
  if (navy && hexToRgb(navy)) {
    setVar(root, '--secondary', navy);
    setVar(root, '--secondary-rgb', hexToRgb(navy)!);
    setVar(root, '--dark', navy);
    setVar(root, '--headings-color', navy);
    setVar(root, '--px-navy-rgb', hexToRgb(navy)!);
    setVar(root, '--bs-secondary', navy);
    setVar(root, '--bs-secondary-rgb', hexToRgb(navy)!);
    setVar(root, '--bs-dark', navy);
    setVar(root, '--bs-dark-rgb', hexToRgb(navy)!);
  }
  if (surface && hexToRgb(surface)) {
    setVar(root, '--light', surface);
    setVar(root, '--primary-mute', surface);
  }
  if (text && hexToRgb(text)) {
    setVar(root, '--body-color', text);
  }
  if (muted && hexToRgb(muted)) {
    setVar(root, '--text-muted', muted);
  }

  if (branding.fonts) {
    ensureFont(branding.fonts.body);
    ensureFont(branding.fonts.heading);
    setVar(root, '--px-font-body', `'${branding.fonts.body}', system-ui, sans-serif`);
    setVar(root, '--px-font-heading', `'${branding.fonts.heading}', system-ui, sans-serif`);
    setVar(root, '--font-family-base', `'${branding.fonts.body}', system-ui, sans-serif`);
    setVar(root, '--font-family-headings', `'${branding.fonts.heading}', system-ui, sans-serif`);
    setVar(root, '--font-family-btn', `'${branding.fonts.body}', system-ui, sans-serif`);
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
