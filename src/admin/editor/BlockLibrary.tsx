import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BLOCK_CATALOG, BLOCK_CATEGORIES, BLOCK_KINDS } from '../../../server/cms/blockCatalog';
import type { BlockKind } from '../../../server/cms/blocks';
import { Modal } from '../ui/overlays';
import { cx, Input } from '../ui/primitives';
import { BLOCK_ICONS } from './blockSchemas';

const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function BlockLibrary({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (kind: BlockKind) => void }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const kinds = useMemo(
    () =>
      BLOCK_KINDS.filter((k) => {
        const m = BLOCK_CATALOG[k];
        if (cat !== 'all' && m.category !== cat) return false;
        return !q || norm(`${m.label} ${m.description}`).includes(norm(q));
      }),
    [q, cat]
  );

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Ajouter un bloc" description="Choisissez une section à insérer dans la page. Tout reste modifiable ensuite.">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un bloc…" className="pl-9" />
        </div>
        <div className="flex flex-wrap gap-1">
          {[{ id: 'all', label: 'Tous' }, ...BLOCK_CATEGORIES].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cx('rounded-full px-3 py-1 text-[13px] font-medium transition', cat === c.id ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1 scrollbar-thin">
        {BLOCK_CATEGORIES.map((c) => {
          const list = kinds.filter((k) => BLOCK_CATALOG[k].category === c.id);
          if (!list.length) return null;
          return (
            <div key={c.id}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{c.label}</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((k) => {
                  const m = BLOCK_CATALOG[k];
                  const Icon = BLOCK_ICONS[m.icon] || Search;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        onPick(k);
                        onClose();
                        setQ('');
                      }}
                      className="group flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 text-left transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-50 to-sky-50 text-brand-700 ring-1 ring-brand-100 transition group-hover:from-brand-500 group-hover:to-brand-600 group-hover:text-white">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-slate-900">{m.label}</span>
                        <span className="mt-0.5 block text-[12.5px] leading-snug text-slate-500">{m.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!kinds.length ? <p className="py-10 text-center text-sm text-slate-500">Aucun bloc ne correspond à « {q} ».</p> : null}
      </div>
    </Modal>
  );
}
