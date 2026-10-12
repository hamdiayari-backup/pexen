import React, { useState } from 'react';
import { X } from 'lucide-react';

export function TagInput({
  value,
  onChange,
  placeholder = 'Ajouter puis Entrée',
  validate,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  validate?: (v: string) => boolean;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim().replace(/,$/, '');
    if (t && !value.includes(t) && (!validate || validate(t))) onChange([...value, t]);
    else if (t && validate && !validate(t)) return;
    setDraft('');
  };
  const invalid = !!draft.trim() && !!validate && !validate(draft.trim());
  return (
    <div className={`flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border ${invalid ? 'border-rose-400' : 'border-slate-200'} bg-white px-2 py-1.5 shadow-xs focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/15`}>
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-slate-100 py-0.5 pl-2 pr-1 text-xs font-medium text-slate-700">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700" aria-label={`Retirer ${t}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          } else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
        placeholder={value.length ? '' : placeholder}
        className="min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400"
      />
    </div>
  );
}
