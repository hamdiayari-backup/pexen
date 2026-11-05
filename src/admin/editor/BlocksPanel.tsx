import React, { useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowLeft, ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, LayoutTemplate, Paintbrush, Plus, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';
import type { CmsBlock } from '../../../server/cms/types';
import { BLOCK_CATALOG, createBlock, isBlockKind, withDefaults } from '../../../server/cms/blockCatalog';
import { resolveStyle, TOKEN_HELP, uid, type BlockKind, type BlockStyle } from '../../../server/cms/blocks';
import { useConfirm } from '../ui/overlays';
import { Button, cx } from '../ui/primitives';
import { BlockLibrary } from './BlockLibrary';
import { BLOCK_ICONS, BLOCK_SCHEMAS, blockSummary } from './blockSchemas';
import { FieldsForm } from './fields';
import { StyleEditor } from './StyleEditor';

type Data = Record<string, unknown>;

const metaOf = (b: CmsBlock) => (isBlockKind(b.type) ? BLOCK_CATALOG[b.type] : null);
const isHidden = (b: CmsBlock) => !!(b.style?.hideOnMobile && b.style?.hideOnDesktop);

/** Copie profonde avec de nouveaux identifiants (blocs et éléments de listes). */
function cloneBlock(b: CmsBlock): CmsBlock {
  const copy = structuredClone(b);
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') {
      const o = v as Data;
      if (typeof o.id === 'string') o.id = uid('i');
      Object.values(o).forEach(walk);
    }
  };
  walk(copy.data);
  return { ...copy, id: uid('b') };
}

/* ------------------------------------------------------------------ Structure */

function OutlineItem({
  block,
  index,
  count,
  selected,
  onSelect,
  onMove,
  onDuplicate,
  onToggleHidden,
  onDelete,
}: {
  block: CmsBlock;
  index: number;
  count: number;
  selected: boolean;
  onSelect: () => void;
  onMove: (dir: -1 | 1) => void;
  onDuplicate: () => void;
  onToggleHidden: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const meta = metaOf(block);
  const Icon = (meta && BLOCK_ICONS[meta.icon]) || Type;
  const hidden = isHidden(block);
  const summary = meta ? blockSummary(withDefaults(block.type as BlockKind, block.data) as unknown as Data) : '';
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cx(
        'group flex items-center gap-1 rounded-lg border bg-white py-1.5 pl-1 pr-1.5 transition',
        isDragging ? 'z-10 border-brand-500 shadow-lg' : selected ? 'border-brand-500 ring-2 ring-brand-500/15' : 'border-slate-200 hover:border-slate-300',
        hidden && 'opacity-60'
      )}
    >
      <button type="button" className="cursor-grab rounded p-1 text-slate-300 hover:text-slate-600 active:cursor-grabbing" title="Glisser pour déplacer" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', selected ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600')}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium text-slate-800">
            {meta?.label || block.type}
            {hidden ? <span className="ml-1.5 text-[11px] font-normal text-amber-600">masqué</span> : null}
          </span>
          {summary ? <span className="block truncate text-xs text-slate-400">{summary}</span> : null}
        </span>
      </button>
      <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} title="Monter" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} title="Descendre" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onToggleHidden} title={hidden ? 'Afficher' : 'Masquer'} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={onDuplicate} title="Dupliquer" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <Copy className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={onDelete} title="Supprimer" className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Inspecteur */

function Collapsible({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-100 last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <ChevronDown className={cx('h-4 w-4 text-slate-400 transition', !open && '-rotate-90')} />
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}

function TokensHelp() {
  return (
    <Collapsible title="Variables utilisables dans les textes" defaultOpen={false}>
      <p className="mb-2 text-xs text-slate-500">Elles sont remplacées automatiquement par les informations de « Informations générales ». Cliquez pour copier.</p>
      <div className="flex flex-wrap gap-1.5">
        {TOKEN_HELP.map((t) => (
          <button
            key={t.token}
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(t.token);
              toast.success(`${t.token} copié`);
            }}
            title={t.label}
            className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
          >
            {t.token}
          </button>
        ))}
      </div>
    </Collapsible>
  );
}

function BlockInspector({
  block,
  onChange,
  onBack,
  onDuplicate,
  onDelete,
}: {
  block: CmsBlock;
  onChange: (b: CmsBlock) => void;
  onBack: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [tab, setTab] = useState<'content' | 'style'>('content');
  if (!isBlockKind(block.type)) {
    return (
      <div className="p-4 text-sm text-slate-500">
        Type de bloc inconnu : {String(block.type)}.
        <Button className="mt-3" onClick={onBack} icon={ArrowLeft}>
          Retour
        </Button>
      </div>
    );
  }
  const kind = block.type;
  const meta = BLOCK_CATALOG[kind];
  const Icon = BLOCK_ICONS[meta.icon] || Type;
  const data = withDefaults(kind, block.data) as unknown as Data;
  const style = resolveStyle(block.style, meta.style);
  const groups = BLOCK_SCHEMAS[kind];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2.5">
        <Button size="icon" variant="ghost" onClick={onBack} title="Retour à la structure">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-500 text-white">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">{meta.label}</span>
        <Button size="icon" variant="ghost" onClick={onDuplicate} title="Dupliquer">
          <Copy className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={onDelete} title="Supprimer">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 border-b border-slate-200 text-[13px] font-medium">
        {(
          [
            ['content', 'Contenu', Type],
            ['style', 'Style & animation', Paintbrush],
          ] as const
        ).map(([id, label, I]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cx('flex items-center justify-center gap-1.5 border-b-2 py-2.5 transition', tab === id ? 'border-brand-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}
          >
            <I className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {tab === 'content' ? (
          <>
            {groups.map((g) => {
              const visibleFields = g.fields.filter((f) => !f.show || f.show(data));
              if (!visibleFields.length) return null;
              return (
                <Collapsible key={`${block.id}-${g.title}`} title={g.title}>
                  <FieldsForm fields={g.fields} value={data} onChange={(p) => onChange({ ...block, data: { ...data, ...p } })} />
                </Collapsible>
              );
            })}
            {kind === 'projects' ? (
              <p className="px-4 pb-4 text-xs text-slate-500">Les réalisations affichées sont les pages publiées utilisant le modèle « Réalisation » (onglet Page › Modèle).</p>
            ) : null}
            <TokensHelp />
          </>
        ) : (
          <StyleEditor style={style} onChange={(p: Partial<BlockStyle>) => onChange({ ...block, style: { ...block.style, ...p } })} />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ Panneau complet */

export function BlocksPanel({
  blocks,
  onChange,
  selectedId,
  onSelect,
  readOnly,
}: {
  blocks: CmsBlock[];
  onChange: (b: CmsBlock[]) => void;
  selectedId: string | null;
  onSelect: (id: string | null, scroll?: boolean) => void;
  readOnly?: boolean;
}) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const confirm = useConfirm();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const selected = blocks.find((b) => b.id === selectedId) || null;

  const onDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onChange(arrayMove(blocks, blocks.findIndex((b) => b.id === e.active.id), blocks.findIndex((b) => b.id === e.over!.id)));
  };
  const add = (kind: BlockKind) => {
    const block = createBlock(kind) as unknown as CmsBlock;
    const at = insertAt ?? blocks.length;
    onChange([...blocks.slice(0, at), block, ...blocks.slice(at)]);
    setInsertAt(null);
    onSelect(block.id, true);
  };
  const duplicate = (b: CmsBlock) => {
    const i = blocks.findIndex((x) => x.id === b.id);
    const copy = cloneBlock(b);
    onChange([...blocks.slice(0, i + 1), copy, ...blocks.slice(i + 1)]);
    onSelect(copy.id, true);
  };
  const remove = async (b: CmsBlock) => {
    if (!(await confirm({ title: 'Supprimer ce bloc ?', message: `Le bloc « ${metaOf(b)?.label || b.type} » sera retiré de la page. Vous pourrez annuler tant que la page n’est pas enregistrée.`, confirmLabel: 'Supprimer', danger: true }))) return;
    onChange(blocks.filter((x) => x.id !== b.id));
    if (selectedId === b.id) onSelect(null);
  };
  const toggleHidden = (b: CmsBlock) => {
    const h = !isHidden(b);
    onChange(blocks.map((x) => (x.id === b.id ? { ...x, style: { ...x.style, hideOnMobile: h, hideOnDesktop: h } } : x)));
  };

  const body = selected ? (
    <BlockInspector
      key={selected.id}
      block={selected}
      onChange={(nb) => onChange(blocks.map((x) => (x.id === nb.id ? nb : x)))}
      onBack={() => onSelect(null)}
      onDuplicate={() => duplicate(selected)}
      onDelete={() => void remove(selected)}
    />
  ) : (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">Structure de la page</p>
          <p className="text-xs text-slate-500">
            {blocks.length} bloc{blocks.length > 1 ? 's' : ''} · cliquez pour modifier, glissez pour réordonner
          </p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 scrollbar-thin">
        {blocks.length === 0 ? (
          <button
            type="button"
            onClick={() => setLibraryOpen(true)}
            className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-14 text-slate-500 transition hover:border-brand-500 hover:bg-brand-50/40 hover:text-brand-700"
          >
            <LayoutTemplate className="mb-2 h-6 w-6" />
            <span className="text-sm font-medium">Ajouter le premier bloc</span>
            <span className="mt-1 text-xs">Bannière, texte + image, vidéo, cartes…</span>
          </button>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((b, i) => (
                <React.Fragment key={b.id}>
                  <OutlineItem
                    block={b}
                    index={i}
                    count={blocks.length}
                    selected={b.id === selectedId}
                    onSelect={() => onSelect(b.id, true)}
                    onMove={(dir) => onChange(arrayMove(blocks, i, i + dir))}
                    onDuplicate={() => duplicate(b)}
                    onToggleHidden={() => toggleHidden(b)}
                    onDelete={() => void remove(b)}
                  />
                  <div className="group/ins relative flex h-3 items-center justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        setInsertAt(i + 1);
                        setLibraryOpen(true);
                      }}
                      className="absolute z-10 flex h-5 items-center gap-1 rounded-full bg-white px-2 text-[11px] font-medium text-slate-400 opacity-0 ring-1 ring-slate-200 transition hover:text-brand-700 hover:ring-brand-500 group-hover/ins:opacity-100"
                    >
                      <Plus className="h-3 w-3" /> Insérer ici
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
      <div className="border-t border-slate-200 p-3">
        <Button variant="secondary" className="w-full justify-center" icon={Plus} onClick={() => setLibraryOpen(true)}>
          Ajouter un bloc
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className={cx('h-full', readOnly && 'pointer-events-none opacity-70')}>{body}</div>
      <BlockLibrary
        open={libraryOpen}
        onClose={() => {
          setLibraryOpen(false);
          setInsertAt(null);
        }}
        onPick={add}
      />
    </>
  );
}