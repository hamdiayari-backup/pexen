import React, { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, FileText, Film, ImageIcon, ImagePlus, Search, UploadCloud, X } from 'lucide-react';
import type { MediaAsset } from '../../../server/cms/types';
import { api } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { fmtBytes } from '../lib/format';
import { Button, cx, EmptyState, Input, Spinner } from './primitives';
import { Modal } from './overlays';

const MAX_BYTES = 15 * 1024 * 1024;
export const ACCEPT_IMAGES = 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml,image/avif';
export const ACCEPT_ALL = `${ACCEPT_IMAGES},video/mp4,video/webm,application/pdf`;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error(`Lecture impossible : ${file.name}`));
    r.readAsDataURL(file);
  });
}

export async function uploadFiles(files: File[]): Promise<MediaAsset[]> {
  const out: MediaAsset[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) {
      toast.error(`${file.name} dépasse 15 Mo`);
      continue;
    }
    try {
      const dataBase64 = await readAsBase64(file);
      const asset = await api.upload({ filename: file.name, dataBase64, mimeType: file.type, alt: '' });
      out.push(asset);
    } catch (e) {
      toast.error(`${file.name} : ${errorMessage(e)}`);
    }
  }
  if (out.length) toast.success(out.length > 1 ? `${out.length} fichiers importés` : 'Fichier importé');
  return out;
}

export function MediaThumb({ asset, className }: { asset: Pick<MediaAsset, 'url' | 'mimeType' | 'alt'>; className?: string }) {
  if (asset.mimeType.startsWith('image/')) {
    return <img src={asset.url} alt={asset.alt || ''} loading="lazy" className={cx('h-full w-full object-cover', className)} />;
  }
  const Icon = asset.mimeType.startsWith('video/') ? Film : FileText;
  return (
    <div className={cx('flex h-full w-full items-center justify-center bg-slate-100 text-slate-400', className)}>
      <Icon className="h-8 w-8" />
    </div>
  );
}

export function DropZone({ onFiles, accept = ACCEPT_ALL, compact }: { onFiles: (f: File[]) => void; accept?: string; compact?: boolean }) {
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
      onClick={() => input.current?.click()}
      className={cx(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition',
        compact ? 'px-4 py-5' : 'px-6 py-10',
        over ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      <UploadCloud className={cx('text-slate-400', compact ? 'mb-1 h-5 w-5' : 'mb-3 h-8 w-8')} />
      <p className="text-sm font-medium text-slate-700">Glissez vos fichiers ici ou cliquez pour parcourir</p>
      {!compact ? <p className="mt-1 text-xs text-slate-500">Images, vidéos MP4/WebM, PDF — 15 Mo maximum</p> : null}
      <input
        ref={input}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          onFiles([...(e.target.files || [])]);
          e.target.value = '';
        }}
      />
    </div>
  );
}

/** Sélecteur de médias : bibliothèque + import. */
export function MediaPicker({
  open,
  onClose,
  onSelect,
  kind = 'image',
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaAsset) => void;
  kind?: 'image' | 'video' | 'any';
}) {
  const { data, setData, loading } = useAsync(() => (open ? api.media() : Promise.resolve(null)), [open]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () =>
      (data || []).filter(
        (m) =>
          (kind === 'any' || m.mimeType.startsWith(`${kind}/`)) &&
          (!q || m.filename.toLowerCase().includes(q.toLowerCase()) || m.alt?.toLowerCase().includes(q.toLowerCase()))
      ),
    [data, q, kind]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      setUploading(true);
      const added = await uploadFiles(files);
      setUploading(false);
      if (added.length) {
        setData((d) => [...added, ...(d || [])]);
        setSelected(added[0]);
      }
    },
    [setData]
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="Médiathèque"
      description="Choisissez un fichier existant ou importez-en un nouveau."
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            disabled={!selected}
            onClick={() => {
              if (selected) onSelect(selected);
              onClose();
            }}
          >
            Utiliser ce fichier
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <DropZone onFiles={handleFiles} compact accept={kind === 'image' ? ACCEPT_IMAGES : kind === 'video' ? 'video/mp4,video/webm' : ACCEPT_ALL} />
        {uploading ? (
          <p className="flex items-center gap-2 text-sm text-slate-500">
            <Spinner className="h-4 w-4" /> Import en cours…
          </p>
        ) : null}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un fichier…" className="pl-9" />
        </div>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={ImageIcon} title="Aucun fichier" description="Importez votre premier fichier ci-dessus." />
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                onDoubleClick={() => {
                  onSelect(m);
                  onClose();
                }}
                className={cx(
                  'group relative aspect-square overflow-hidden rounded-lg border-2 bg-slate-50 transition',
                  selected?.id === m.id ? 'border-brand-500 ring-3 ring-brand-500/20' : 'border-transparent hover:border-slate-300'
                )}
                title={m.filename}
              >
                <MediaThumb asset={m} />
                {selected?.id === m.id ? (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                ) : null}
                <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/60 px-2 pb-1 pt-4 text-left text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {m.filename} · {fmtBytes(m.sizeBytes)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/** Champ image : aperçu + choix depuis la médiathèque. */
export function ImageField({
  value,
  onChange,
  aspect = 'aspect-video',
  kind = 'image',
  emptyLabel = 'Choisir une image',
}: {
  value?: string;
  onChange: (url: string, asset?: MediaAsset) => void;
  aspect?: string;
  kind?: 'image' | 'video';
  emptyLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {value ? (
        <div className={cx('group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50', aspect)}>
          {kind === 'video' ? (
            <video src={value} className="h-full w-full object-cover" muted />
          ) : (
            <img src={value} alt="" className="h-full w-full object-contain" />
          )}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-900/50 opacity-0 transition group-hover:opacity-100">
            <Button size="sm" onClick={() => setOpen(true)}>
              Remplacer
            </Button>
            <Button size="sm" variant="danger" icon={X} onClick={() => onChange('')}>
              Retirer
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cx(
            'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-sm text-slate-500 transition hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700',
            aspect
          )}
        >
          <ImagePlus className="h-6 w-6" />
          {emptyLabel}
        </button>
      )}
      <MediaPicker open={open} onClose={() => setOpen(false)} onSelect={(a) => onChange(a.url, a)} kind={kind} />
    </>
  );
}