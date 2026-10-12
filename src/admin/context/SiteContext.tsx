import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { api, type ClientSnapshot } from '../lib/api';
import { useAsync } from '../lib/hooks';

interface SiteState {
  site: ClientSnapshot | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<unknown>;
  /** Met à jour la copie locale après une sauvegarde réussie. */
  patchSite: <K extends keyof ClientSnapshot>(key: K, value: ClientSnapshot[K]) => void;
}

const SiteContext = createContext<SiteState | null>(null);

export function SiteProvider({ children }: { children: React.ReactNode }) {
  const { data, setData, loading, error, reload } = useAsync(() => api.snapshot(), []);
  const patchSite = useCallback<SiteState['patchSite']>((key, value) => setData((s) => (s ? { ...s, [key]: value } : s)), [setData]);
  const value = useMemo(() => ({ site: data, loading, error, reload, patchSite }), [data, loading, error, reload, patchSite]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error('useSite hors SiteProvider');
  return ctx;
}

/** Le snapshot chargé (à utiliser sous un composant qui garantit sa présence). */
export function useSiteData(): ClientSnapshot {
  const { site } = useSite();
  if (!site) throw new Error('Site non chargé');
  return site;
}

export function publicUrl(site: ClientSnapshot | null, path = '/'): string {
  const base = (site?.settings.publicUrl || window.location.origin).replace(/\/+$/, '');
  return `${base}${path}`;
}
