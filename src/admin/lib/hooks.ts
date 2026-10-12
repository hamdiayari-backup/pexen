import { useCallback, useEffect, useRef, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { toast } from 'sonner';
import { ApiError } from './api';

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError || e instanceof Error) return e.message;
  return 'Une erreur inattendue est survenue';
}

/** Chargement asynchrone avec état, erreur et rechargement. */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = await loaderRef.current();
      setData(d);
      return d;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, error, loading, reload };
}

const stable = (v: unknown) => JSON.stringify(v);

/**
 * État de formulaire avec suivi des modifications, sauvegarde (Ctrl/Cmd+S),
 * et protection contre la perte de données (navigation interne et fermeture d'onglet).
 */
export function useEditable<T>(initial: T | null, save: (value: T) => Promise<T | void>, opts: { successMessage?: string } = {}) {
  const [value, setValue] = useState<T | null>(initial);
  const [baseline, setBaseline] = useState<string>(stable(initial));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial !== null) {
      setValue(initial);
      setBaseline(stable(initial));
    }
  }, [initial]);

  const dirty = value !== null && stable(value) !== baseline;

  const commit = useCallback(async () => {
    if (value === null || saving) return false;
    setSaving(true);
    try {
      const result = await save(value);
      const next = (result ?? value) as T;
      setValue(next);
      setBaseline(stable(next));
      toast.success(opts.successMessage || 'Modifications enregistrées');
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setSaving(false);
    }
  }, [value, saving, save, opts.successMessage]);

  const reset = useCallback(() => {
    setValue(JSON.parse(baseline) as T);
  }, [baseline]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty) void commit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dirty, commit]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname);

  /** Mise à jour partielle ergonomique : patch({ field: v }) */
  const patch = useCallback((p: Partial<T>) => setValue((v) => (v === null ? v : { ...v, ...p })), []);

  return { value, setValue, patch, dirty, saving, commit, reset, blocker };
}

export function useDebounced<T>(value: T, delay = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
