import React, { useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Copy, FolderOpen, GripVertical, Plus, Shapes, Trash2, X } from 'lucide-react';
import { CMS_ICONS } from '../../cms/icons';
import { uid } from '../../../server/cms/blocks';
import { useSite } from '../context/SiteContext';
import { Button, cx, Field, Input, Segmented, Select, Switch, Textarea } from '../ui/primitives';
import { ImageField, MediaPicker } from '../ui/media';
import { Modal } from '../ui/overlays';
import { TagInput } from '../ui/TagInput';
import { RichTextEditor } from './RichTextEditor';

type Data = Record<string, unknown>;
type Opt = { value: string; label: string };

interface Base {
  label?: string;
  hint?: string;
  /** Champ affiché sur une demi-largeur (deux par ligne). */
  half?: boolean;
  /** Condition d'affichage selon les autres valeurs du bloc. */
  show?: (d: Data) => boolean;
}

export type FieldDef = Base &
  (
    | { t: 'text'; key: string; placeholder?: string }
    | { t: 'textarea'; key: string; rows?: number; placeholder?: string }
    | { t: 'rich'; key: string; minimal?: boolean }
    | { t: 'image'; key: string; altKey?: string; aspect?: string }
    | { t: 'video'; key: string; embed?: (d: Data) => boolean }
    | { t: 'link'; key: string; placeholder?: string }
    | { t: 'select'; key: string; options: Opt[]; numeric?: boolean }
    | { t: 'segmented'; key: string; options: Opt[]; numeric?: boolean }
    | { t: 'switch'; key: string; description?: string }
    | { t: 'number'; key: string; min?: number; max?: number; step?: number; suffix?: string }
    | { t: 'range'; key: string; min: number; max: number; step?: number; suffix?: string }
    | { t: 'icon'; key: string }
    | { t: 'tags'; key: string; placeholder?: string }
    | { t: 'buttons'; key: string; max?: number }
    | { t: 'button'; key: string }
    | { t: 'form'; key: string }
    | { t: 'table' }
    | { t: 'list'; key: string; item: string; fields: FieldDef[]; create: () => Data; summary?: (it: Data) => string; max?: number }
  );

export const str = (v: unknown) => (typeof v === 'string' ? v : v == null ? '' : String(v));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function LinkInput({ value, onChange, placeholder = '/contact/' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Input list="admin-site-links" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />;
}

/* ------------------------------------------------------------------ Boutons */

export const BUTTON_VARIANTS: Opt[] = [
  { value: 'primary', label: 'Principal (dégradé)' },
  { value: 'secondary', label: 'Contour' },
  { value: 'dark', label: 'Sombre' },
  { value: 'light', label: 'Blanc' },
  { value: 'glass', label: 'Transparent (sur fond sombre)' },
  { value: 'link', label: 'Lien texte' },
];
export const BUTTON_ICONS: Opt[] = [
  { value: 'arrow', label: 'Flèche →' },
  { value: 'arrow-up-right', label: 'Flèche ↗' },
  { value: 'phone', label: 'Téléphone' },
  { value: 'mail', label: 'E-mail' },
  { value: 'download', label: 'Téléchargement' },
  { value: 'none', label: 'Aucune' },
];
const BUTTON_FIELDS: FieldDef[] = [
  { t: 'text', key: 'label', label: 'Texte du bouton' },
  { t: 'link', key: 'link', label: 'Lien', hint: 'Page du site, https://…, tel:…, mailto:… ou #preferences-cookies' },
  { t: 'select', key: 'variant', label: 'Style', options: BUTTON_VARIANTS, half: true },
  { t: 'select', key: 'icon', label: 'Icône', options: BUTTON_ICONS, half: true },
  { t: 'switch', key: 'newTab', label: 'Ouvrir dans un nouvel onglet' },
];
const newButton = (): Data => ({ id: uid('btn'), label: 'En savoir plus', link: '/contact/', variant: 'primary', icon: 'arrow' });

/* ------------------------------------------------------------------ Icônes */

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = value ? CMS_ICONS[value] : undefined;
  const Icon = current?.icon || Shapes;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-left text-sm shadow-xs transition hover:border-slate-300"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-50 text-brand-700">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className={cx('flex-1 truncate', current ? 'text-slate-800' : 'text-slate-400')}>{current?.label || 'Choisir une icône'}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Choisir une icône" size="md">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          <button
            type="button"
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            className={cx('flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-[11px] text-slate-500 transition hover:border-brand-500', !value ? 'border-brand-500 bg-brand-50' : 'border-slate-200')}
          >
            <X className="h-5 w-5" />
            Aucune
          </button>
          {Object.entries(CMS_ICONS).map(([key, { icon: I, label }]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setOpen(false);
              }}
              className={cx(
                'flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-[11px] text-slate-600 transition hover:border-brand-500 hover:bg-brand-50/50',
                value === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'
              )}
            >
              <I className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------------------------------------------ Vidéo */

export function VideoInput({ value, onChange, embed }: { value: string; onChange: (v: string) => void; embed?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-2">
      {value && !embed ? (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <video src={value} className="aspect-video w-full object-cover" muted controls preload="metadata" />
        </div>
      ) : null}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={embed ? 'https://www.youtube.com/watch?v=…' : '/videos/ma-video.mp4'}
          className="min-w-0 flex-1"
        />
        {!embed ? (
          <Button icon={FolderOpen} onClick={() => setOpen(true)} title="Choisir dans la médiathèque">
            Médiathèque
          </Button>
        ) : null}
      </div>
      {embed ? <p className="text-xs text-slate-500">Lien YouTube ou Vimeo : la vidéo est intégrée automatiquement.</p> : null}
      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(a) => onChange(a.url)} kind="video" />
    </div>
  );
}

/* ------------------------------------------------------------------ Tableau */

function TableField({ value, onChange }: { value: Data; onChange: (p: Data) => void }) {
  const columns = arr<string>(value.columns);
  const rows = arr<{ id: string; cells: string[] }>(value.rows);
  const setCols = (c: string[]) => onChange({ columns: c, rows: rows.map((r) => ({ ...r, cells: c.map((_, i) => r.cells[i] ?? '') })) });
  const setCell = (ri: number, ci: number, v: string) => onChange({ rows: rows.map((r, i) => (i === ri ? { ...r, cells: columns.map((_, j) => (j === ci ? v : r.cells[j] ?? '')) } : r)) });
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-slate-200 scrollbar-thin">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((c, ci) => (
                <th key={ci} className="min-w-[130px] border-b border-slate-200 p-1">
                  <div className="flex items-center gap-1">
                    <input
                      value={c}
                      onChange={(e) => setCols(columns.map((x, j) => (j === ci ? e.target.value : x)))}
                      className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 font-semibold text-slate-700 outline-none focus:border-brand-500 focus:bg-white"
                    />
                    <button type="button" title="Supprimer la colonne" onClick={() => setCols(columns.filter((_, j) => j !== ci))} className="rounded p-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-8 border-b border-slate-200" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0">
                {columns.map((_, ci) => (
                  <td key={ci} className="p-1">
                    <input
                      value={r.cells[ci] ?? ''}
                      onChange={(e) => setCell(ri, ci, e.target.value)}
                      className="w-full rounded border border-transparent px-1.5 py-1 text-slate-700 outline-none hover:border-slate-200 focus:border-brand-500"
                    />
                  </td>
                ))}
                <td className="p-1 text-center">
                  <button type="button" title="Supprimer la ligne" onClick={() => onChange({ rows: rows.filter((_, i) => i !== ri) })} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <Button size="sm" icon={Plus} onClick={() => onChange({ rows: [...rows, { id: uid('r'), cells: columns.map(() => '') }] })}>
          Ligne
        </Button>
        <Button size="sm" icon={Plus} onClick={() => setCols([...columns, `Colonne ${columns.length + 1}`])}>
          Colonne
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Listes répétables */

function SortableItem({
  id,
  index,
  title,
  open,
  onToggle,
  onDuplicate,
  onDelete,
  children,
}: {
  id: string;
  index: number;
  title: string;
  open: boolean;
  onToggle: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx('rounded-lg border bg-white', isDragging ? 'z-10 border-brand-500 shadow-lg' : 'border-slate-200')}
    >
      <div className="flex items-center gap-1 py-1.5 pl-1 pr-1.5">
        <button type="button" className="cursor-grab rounded p-1 text-slate-300 hover:text-slate-600 active:cursor-grabbing" title="Glisser pour réordonner" {...attributes} {...listeners}>
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
          {open ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
          <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">{index + 1}.</span>
          <span className="truncate text-[13px] font-medium text-slate-700">{title}</span>
        </button>
        {onDuplicate ? (
          <button type="button" onClick={onDuplicate} title="Dupliquer" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button type="button" onClick={onDelete} title="Supprimer" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {open ? <div className="space-y-3 border-t border-slate-100 p-3">{children}</div> : null}
    </div>
  );
}

const itemTitle = (it: Data, fallback: string, summary?: (it: Data) => string) => {
  const s = summary?.(it) || str(it.title) || str(it.label) || str(it.question) || str(it.text) || str(it.caption) || str(it.quote) || str(it.value);
  return s.replace(/<[^>]+>/g, '').trim().slice(0, 70) || fallback;
};

function ListField({ value, onChange, def }: { value: Data[]; onChange: (v: Data[]) => void; def: Extract<FieldDef, { t: 'list' }> }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  /* Anciens hero.galleryImages stockés en string[] → objets { image } pour le sélecteur médiathèque. */
  const coerced: Data[] = value.every((it) => typeof it === 'string')
    ? (value as unknown as string[]).map((image, i) => ({ id: `tmp-${i}`, image }))
    : value;
  const items = coerced.map((it, i) => (typeof it.id === 'string' && it.id ? it : { ...it, id: `tmp-${i}` }));
  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onChange(arrayMove(items, items.findIndex((x) => x.id === e.active.id), items.findIndex((x) => x.id === e.over!.id)));
  };
  const canAdd = !def.max || items.length < def.max;
  return (
    <div className="space-y-1.5">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((x) => x.id as string)} strategy={verticalListSortingStrategy}>
          {items.map((it, i) => (
            <SortableItem
              key={it.id as string}
              id={it.id as string}
              index={i}
              title={itemTitle(it, `${def.item} ${i + 1}`, def.summary)}
              open={openId === it.id}
              onToggle={() => setOpenId(openId === it.id ? null : (it.id as string))}
              onDuplicate={canAdd ? () => onChange([...items.slice(0, i + 1), { ...structuredClone(it), id: uid('i') }, ...items.slice(i + 1)]) : undefined}
              onDelete={() => onChange(items.filter((x) => x.id !== it.id))}
            >
              <FieldsForm fields={def.fields} value={it} onChange={(p) => onChange(items.map((x) => (x.id === it.id ? { ...x, ...p } : x)))} />
            </SortableItem>
          ))}
        </SortableContext>
      </DndContext>
      {canAdd ? (
        <button
          type="button"
          onClick={() => {
            const created = { ...def.create(), id: uid('i') };
            onChange([...items, created]);
            setOpenId(created.id);
          }}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 py-2 text-[13px] font-medium text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter : {def.item.toLowerCase()}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Rendu d'un champ */

function FormSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { site } = useSite();
  const forms = site?.forms ?? [];
  return <Select value={value} onChange={onChange} options={forms.map((f) => ({ value: f.id, label: f.name }))} />;
}

function FieldControl({ def, value, onChange }: { def: FieldDef; value: Data; onChange: (p: Data) => void }) {
  if (def.t === 'table') return <TableField value={value} onChange={onChange} />;
  const v = value[def.key];
  const set = (x: unknown) => onChange({ [def.key]: x });
  switch (def.t) {
    case 'text':
      return <Input value={str(v)} onChange={(e) => set(e.target.value)} placeholder={def.placeholder} />;
    case 'textarea':
      return <Textarea value={str(v)} rows={def.rows ?? 3} onChange={(e) => set(e.target.value)} placeholder={def.placeholder} />;
    case 'rich':
      return <RichTextEditor value={str(v)} onChange={set} minimal={def.minimal} />;
    case 'image':
      return (
        <div className="space-y-2">
          <ImageField value={str(v)} onChange={(url, asset) => onChange(def.altKey && asset?.alt && !value[def.altKey] ? { [def.key]: url, [def.altKey]: asset.alt } : { [def.key]: url })} aspect={def.aspect ?? 'aspect-video'} />
          {def.altKey ? <Input value={str(value[def.altKey])} onChange={(e) => onChange({ [def.altKey!]: e.target.value })} placeholder="Texte alternatif (accessibilité et SEO)" /> : null}
        </div>
      );
    case 'video':
      return <VideoInput value={str(v)} onChange={set} embed={def.embed?.(value)} />;
    case 'link':
      return <LinkInput value={str(v)} onChange={set} placeholder={def.placeholder} />;
    case 'select':
      return <Select value={str(v)} onChange={(x) => set(def.numeric ? Number(x) : x)} options={def.options} />;
    case 'segmented':
      return (
        <div className="overflow-x-auto scrollbar-thin">
          <Segmented size="sm" value={str(v)} onChange={(x) => set(def.numeric ? Number(x) : x)} options={def.options} />
        </div>
      );
    case 'switch':
      return <Switch checked={!!v} onChange={set} label={def.label} description={def.description} />;
    case 'number':
      return (
        <Input
          type="number"
          value={v == null ? '' : String(v)}
          min={def.min}
          max={def.max}
          step={def.step}
          onChange={(e) => set(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      );
    case 'range':
      return (
        <div className="flex items-center gap-3">
          <input type="range" min={def.min} max={def.max} step={def.step ?? 1} value={Number(v ?? def.min)} onChange={(e) => set(Number(e.target.value))} className="flex-1 accent-brand-600" />
          <span className="w-14 text-right text-xs tabular-nums text-slate-600">
            {Number(v ?? def.min)}
            {def.suffix}
          </span>
        </div>
      );
    case 'icon':
      return <IconPicker value={str(v)} onChange={set} />;
    case 'tags':
      return <TagInput value={arr<string>(v)} onChange={set} placeholder={def.placeholder} />;
    case 'buttons':
      return <ListField value={arr<Data>(v)} onChange={set} def={{ t: 'list', key: def.key, item: 'Bouton', fields: BUTTON_FIELDS, create: newButton, max: def.max }} />;
    case 'button': {
      const b = v && typeof v === 'object' ? (v as Data) : null;
      return b ? (
        <div className="space-y-3 rounded-lg border border-slate-200 p-3">
          <FieldsForm fields={BUTTON_FIELDS} value={b} onChange={(p) => set({ ...b, ...p })} />
          <Button size="sm" variant="ghost" icon={Trash2} className="text-rose-600" onClick={() => set(undefined)}>
            Retirer le bouton
          </Button>
        </div>
      ) : (
        <Button size="sm" icon={Plus} onClick={() => set(newButton())}>
          Ajouter un bouton
        </Button>
      );
    }
    case 'form':
      return <FormSelect value={str(v)} onChange={set} />;
    case 'list':
      return <ListField value={arr<Data>(v)} onChange={set} def={def} />;
  }
}

export function FieldsForm({ fields, value, onChange }: { fields: FieldDef[]; value: Data; onChange: (p: Data) => void }) {
  const visible = fields.filter((f) => !f.show || f.show(value));
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
      {visible.map((def, i) => (
        <div key={'key' in def ? def.key : `f${i}`} className={def.half ? 'col-span-1 min-w-0' : 'col-span-2 min-w-0'}>
          {def.t === 'switch' ? (
            <FieldControl def={def} value={value} onChange={onChange} />
          ) : (
            <Field label={def.label} hint={def.hint}>
              <FieldControl def={def} value={value} onChange={onChange} />
            </Field>
          )}
        </div>
      ))}
    </div>
  );
}