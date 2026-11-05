import { loadSnapshot, updateSnapshot } from '../cms/store';
import type { AppearanceConfig, CmsPage, ThemeId } from '../cms/types';
import { HttpError } from '../http';
import { catalogEntry, ensureAppearance, THEME_CATALOG } from './registry';
import { ULTRA_CASE_STUDIES, ultraPrimaryMenu, ultraThemePages } from './ultraContent';

const ULTRA_PATHS = new Set([
  '/',
  '/notre-approche/',
  '/realisations/',
  '/estimation-financement/',
  '/contact/',
  ...ULTRA_CASE_STUDIES.map((cs) => cs.path),
]);

function mergePages(existing: CmsPage[], incoming: CmsPage[]): CmsPage[] {
  const byPath = new Map(existing.map((p) => [p.path, p]));
  for (const p of incoming) byPath.set(p.path, p);
  return [...byPath.values()];
}

export async function listThemesForAdmin() {
  const snap = await loadSnapshot();
  const appearance = ensureAppearance(snap.appearance);
  return THEME_CATALOG.map((t) => {
    const inst = appearance.installed.find((i) => i.id === t.id);
    return {
      ...t,
      installed: !!inst,
      installedAt: inst?.installedAt,
      contentVersion: inst?.contentVersion ?? 0,
      active: appearance.activeThemeId === t.id,
    };
  });
}

export async function activateTheme(id: ThemeId) {
  if (id !== 'default' && id !== 'pexen-ultra' && id !== 'pexen-maquette') {
    throw new HttpError(400, 'Thème inconnu');
  }
  const snap = await loadSnapshot();
  const current = ensureAppearance(snap.appearance);
  if (id === 'pexen-ultra' && !current.installed.some((i) => i.id === 'pexen-ultra')) {
    throw new HttpError(400, 'Installez d’abord le thème PEXEN Ultra.');
  }
  if (id === 'pexen-maquette' && !current.installed.some((i) => i.id === 'pexen-maquette')) {
    throw new HttpError(400, 'Installez d’abord le thème PEXEN Maquette.');
  }
  const next = await updateSnapshot((s) => {
    const appearance = ensureAppearance(s.appearance);
    appearance.activeThemeId = id;
    s.appearance = appearance;
  });
  return ensureAppearance(next.appearance);
}

export async function installTheme(id: ThemeId, withContent: boolean) {
  if (id !== 'pexen-ultra' && id !== 'pexen-maquette') {
    throw new HttpError(400, 'Ce thème ne peut pas être installé pour le moment.');
  }
  const meta = catalogEntry(id);
  const next = await updateSnapshot((snap) => {
    const appearance = ensureAppearance(snap.appearance);
    const now = new Date().toISOString();
    const idx = appearance.installed.findIndex((i) => i.id === id);
    const entry = { id, installedAt: now, contentVersion: meta.contentVersion };
    if (idx >= 0) appearance.installed[idx] = { ...appearance.installed[idx], ...entry };
    else appearance.installed.push(entry);

    /* Maquette réutilise le contenu multipage Ultra déjà en base — pas de re-seed. */
    if (withContent && id === 'pexen-ultra') {
      snap.pages = mergePages(
        snap.pages.filter((p) => !ULTRA_PATHS.has(p.path)),
        ultraThemePages()
      );
      // Libère les URLs /realisations/<slug>/ pour que chaque étude de cas s'ouvre sur sa propre page
      snap.redirects = (snap.redirects || []).filter((r) => !ULTRA_PATHS.has(r.from));
      const primary = snap.menus.find((m) => m.id === 'primary');
      const mobile = snap.menus.find((m) => m.id === 'mobile');
      const items = ultraPrimaryMenu();
      if (primary) primary.items = items;
      if (mobile) mobile.items = JSON.parse(JSON.stringify(items));
    }

    snap.appearance = appearance;
  });
  return {
    appearance: ensureAppearance(next.appearance),
    pagesUpdated: withContent && id === 'pexen-ultra' ? ULTRA_PATHS.size : 0,
  };
}

export function readAppearance(raw?: AppearanceConfig) {
  return ensureAppearance(raw);
}
