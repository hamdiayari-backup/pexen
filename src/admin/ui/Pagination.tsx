/**
 * Snapify
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cx } from './primitives';

export const PAGE_SIZES = [10, 25, 50, 100] as const;

function storedSize(id: string, fallback: number): number {
  try {
    const v = Number(localStorage.getItem(`pexen.pageSize.${id}`));
    return (PAGE_SIZES as readonly number[]).includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

/** Page courante + taille de page mémorisée par liste ; la page revient à 1 quand `resetKey` change (filtres, recherche). */
export function usePaging(id: string, { defaultSize = 25, resetKey }: { defaultSize?: number; resetKey?: unknown } = {}) {
  const [pageSize, setSize] = useState(() => storedSize(id, defaultSize));
  const [page, setPage] = useState(1);
  const key = JSON.stringify(resetKey ?? null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPage(1);
  }, [key]);
  const setPageSize = (n: number) => {
    try {
      localStorage.setItem(`pexen.pageSize.${id}`, String(n));
    } catch {
      /* stockage indisponible : la taille reste valable pour la session */
    }
    setSize(n);
    setPage(1);
  };
  return { page, setPage, pageSize, setPageSize };
}

/** Pagination côté navigateur d'une liste déjà chargée. */
export function usePagination<T>(items: readonly T[], id: string, opts: { defaultSize?: number; resetKey?: unknown } = {}) {
  const { page, setPage, pageSize, setPageSize } = usePaging(id, opts);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const pageItems = useMemo(() => items.slice((current - 1) * pageSize, current * pageSize), [items, current, pageSize]);
  return {
    pageItems,
    /** Position de la première ligne affichée dans la liste complète. */
    offset: (current - 1) * pageSize,
    setPage,
    props: { page: current, pageSize, total, onPage: setPage, onPageSize: setPageSize },
  };
}

function pageList(page: number, pages: number): (number | 'gap')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((p) => set.add(p));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | 'gap')[] = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize?: (size: number) => void;
  /** Libellé des éléments comptés, au pluriel en « s » (ex. « pages », « abonnés ») ; le singulier en est déduit. */
  noun?: string;
  /** Sans marge latérale, pour une liste déjà placée dans un bloc avec marges. */
  flush?: boolean;
  className?: string;
}

export function Pagination({ page, pageSize, total, onPage, onPageSize, noun = 'éléments', flush, className }: PaginationProps) {
  const ref = useRef<HTMLDivElement>(null);
  if (total <= 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const from = (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  const go = (p: number) => {
    onPage(Math.min(Math.max(1, p), pages));
    const list = ref.current?.parentElement;
    if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const btn = 'flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[13px] font-medium tabular-nums transition disabled:pointer-events-none disabled:opacity-40';

  return (
    <div ref={ref} className={cx('flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-100 text-[13px] text-slate-500', flush ? 'pt-3' : 'px-4 py-2.5', className)}>
      <div className="flex items-center gap-4">
        <span className="tabular-nums">
          {pages > 1 ? (
            <>
              <span className="font-medium text-slate-700">
                {from.toLocaleString('fr-FR')}–{to.toLocaleString('fr-FR')}
              </span>{' '}
              sur {total.toLocaleString('fr-FR')} {noun}
            </>
          ) : (
            <>
              <span className="font-medium text-slate-700">{total.toLocaleString('fr-FR')}</span> {total === 1 ? noun.replace(/s$/, '') : noun}
            </>
          )}
        </span>
        {onPageSize && total > PAGE_SIZES[0] ? (
          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Par page</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
              className="h-8 rounded-lg border border-slate-200 bg-white pl-2 pr-7 text-[13px] text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
              aria-label="Éléments par page"
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>
      {pages > 1 ? (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button type="button" className={cx(btn, 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')} disabled={current <= 1} onClick={() => go(current - 1)} aria-label="Page précédente">
            <ChevronLeft className="h-4 w-4" />
          </button>
          {pageList(current, pages).map((p, i) =>
            p === 'gap' ? (
              <span key={`gap-${i}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => go(p)}
                aria-current={p === current ? 'page' : undefined}
                className={cx(btn, p === current ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')}
              >
                {p}
              </button>
            )
          )}
          <button type="button" className={cx(btn, 'text-slate-500 hover:bg-slate-100 hover:text-slate-900')} disabled={current >= pages} onClick={() => go(current + 1)} aria-label="Page suivante">
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
