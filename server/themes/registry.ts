import type { AppearanceConfig, ThemeId } from '../cms/types';

export interface ThemeCatalogEntry {
  id: ThemeId;
  name: string;
  description: string;
  version: string;
  screenshot?: string;
  /** Contenu multipage livré avec le thème. */
  contentVersion: number;
  multipage: boolean;
}

export const THEME_CATALOG: ThemeCatalogEntry[] = [
  {
    id: 'default',
    name: 'PEXEN Classique',
    description: 'Thème actuel du site React : blocs éditoriaux, hero polaroid et navigation standard.',
    version: '1.0.0',
    screenshot: '/images/themes/theme-default.png',
    contentVersion: 0,
    multipage: true,
  },
  {
    id: 'pexen-ultra',
    name: 'PEXEN Ultra',
    description:
      'Inspiré Bizen / ultra-s : hero vidéo, forme logo PEXEN, lecture diagonale, timeline process, réalisations type Tera, formulaire progressif.',
    version: '1.0.0',
    screenshot: '/images/themes/theme-pexen-ultra.png',
    contentVersion: 6,
    multipage: true,
  },
  {
    id: 'pexen-maquette',
    name: 'PEXEN Maquette',
    description:
      'Homepage fidèle à la maquette Amina : hero ∞ mosaïque photos, KPIs, enjeux, grille expertises, timeline, réalisations, footer watermark.',
    version: '1.0.0',
    screenshot: '/images/themes/theme-pexen-maquette.png',
    contentVersion: 1,
    multipage: true,
  },
];

export function defaultAppearance(): AppearanceConfig {
  return {
    activeThemeId: 'default',
    installed: [{ id: 'default', installedAt: new Date().toISOString(), contentVersion: 0 }],
  };
}

export function ensureAppearance(raw?: AppearanceConfig): AppearanceConfig {
  const base = defaultAppearance();
  if (!raw) return base;
  const installed = Array.isArray(raw.installed) && raw.installed.length ? raw.installed : base.installed;
  const known: ThemeId[] = ['default', 'pexen-ultra', 'pexen-maquette'];
  const active = known.includes(raw.activeThemeId) ? raw.activeThemeId : 'default';
  const ids = new Set(installed.map((i) => i.id));
  if (!ids.has('default')) installed.unshift({ id: 'default', installedAt: new Date().toISOString(), contentVersion: 0 });
  return { activeThemeId: active, installed };
}

export function catalogEntry(id: ThemeId): ThemeCatalogEntry {
  return THEME_CATALOG.find((t) => t.id === id) ?? THEME_CATALOG[0];
}
