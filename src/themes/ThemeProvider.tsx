import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { ThemeId } from '../../server/cms/types';
import { useSiteConfig } from '../context/SiteConfigContext';
import { defaultTheme } from './default';
import { pexenMaquetteTheme } from './pexen-maquette';
import { pexenUltraTheme } from './pexen-ultra';
import type { ThemeDefinition } from './types';

const THEMES: Record<ThemeId, ThemeDefinition> = {
  default: defaultTheme,
  'pexen-ultra': pexenUltraTheme,
  'pexen-maquette': pexenMaquetteTheme,
};

const VALID: ThemeId[] = ['default', 'pexen-ultra', 'pexen-maquette'];

function asThemeId(v: string | null | undefined): ThemeId | null {
  return v && (VALID as string[]).includes(v) ? (v as ThemeId) : null;
}

const ThemeCtx = createContext<ThemeDefinition>(defaultTheme);

export function useTheme() {
  return useContext(ThemeCtx);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const cfg = useSiteConfig();
  const previewParam =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('preview_theme') : null;
  const cached = typeof window !== 'undefined' ? localStorage.getItem('pexen_active_theme') : null;
  const id: ThemeId =
    asThemeId(previewParam) ||
    asThemeId(cfg?.appearance?.activeThemeId) ||
    asThemeId(cached) ||
    'pexen-maquette';
  const theme = THEMES[id] ?? pexenMaquetteTheme;

  useEffect(() => {
    if (cfg?.appearance?.activeThemeId) {
      try {
        localStorage.setItem('pexen_active_theme', cfg.appearance.activeThemeId);
      } catch {
        /* ignore */
      }
    }
  }, [cfg?.appearance?.activeThemeId]);

  useEffect(() => {
    document.documentElement.dataset.pexenTheme = id;
    return () => {
      delete document.documentElement.dataset.pexenTheme;
    };
  }, [id]);

  const value = useMemo(() => theme, [theme]);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}
