import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Copy, ImageIcon, Search, Trash2, UploadCloud } from 'lucide-react';
import type { MediaAsset } from '../../../server/cms/types';
import { api } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { fmtBytes, fmtDateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, cx, EmptyState, ErrorState, Field, Input, PageHeader, PageSkeleton, Segmented, Spinner } from '../ui/primitives';
import { Drawer, useConfirm } from '../ui/overlays';
import { ACCEPT_ALL, DropZone, MediaThumb, uploadFiles } from '../ui/media';

type Kind = 'all' | 'image' | 'video' | 'application';

function MediaDetails({ asset, onClose, onSaved, onDeleted }: { asset: MediaAsset | null; onClose: () => void; onSaved: (a: MediaAsset) => void; onDeleted: (id: string) => void }) {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [alt, setAlt] = useState(asset?.alt || '');
  const [saving, setSaving] = useState(false);
  React.useEffect(() => setAlt(asset?.alt || ''), [asset]);
  if (!asset) return null;
  const absolute = `${window.location.origin}${asset.url}`;

  return (
    <Drawer
      open={!!asset}
      onClose={onClose}
      title="Détails du fichier"
      footer={
        can('editor') ? (
          <>
            <Button
              variant="ghost"
              className="mr-auto text-rose-600 hover:bg-rose-50"
              icon={Trash2}
              onClick={async () => {
                if (!(await confirm({ title: 'Supprimer ce fichier ?', message: 'Les pages qui l’utilisent afficheront une image manquante.', confirmLabel: 'Supprimer', danger: true }))) return;
                try {
                  await api.deleteMedia(asset.id);
                  onDeleted(asset.id);
                  toast.success('Fichier supprimé');
                } catch (e) {
                  toast.error(errorMessage(e));
                }
              }}
            >
              Supprimer
            </Button>
            <Button
              variant="primary"
              loading={saving}
              disabled={alt === (asset.alt || '')}
              onClick={async () => {
                setSaving(true);
                try {
                  await api.updateMedia(asset.id, alt);
                  onSaved({ ...asset, alt });
                  toast.success('Texte alternatif enregistré');
                } catch (e) {
                  toast.error(errorMessage(e));
                } finally {
                  setSaving(false);
                }
              }}
            >
              Enregistrer
            </Button>
          </>
        ) : undefined
      }
    >
      <div className="space-y-5">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:16px_16px]">
          {asset.mimeType.startsWith('image/') ? (
            <img src={asset.url} alt={asset.alt || ''} className="mx-auto max-h-80 object-contain" />
          ) : asset.mimeType.startsWith('video/') ? (
            <video src={asset.url} controls className="max-h-80 w-full" />
          ) : (
            <div className="aspect-video">
              <MediaThumb asset={asset} />
            </div>
          )}
        </div>
        <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-sm">
          <dt className="text-slate-500">Nom</dt>
          <dd className="break-all text-slate-800">{asset.filename}</dd>
          <dt className="text-slate-500">Type</dt>
          <dd className="text-slate-800">{asset.mimeType}</dd>
          <dt className="text-slate-500">Taille</dt>
          <dd className="text-slate-800">{fmtBytes(asset.sizeBytes)}</dd>
          <dt className="text-slate-500">Importé le</dt>
          <dd className="text-slate-800">{fmtDateTime(asset.createdAt)}</dd>
        </dl>
        <Field label="Adresse du fichier">
          <div className="flex gap-2">
            <Input readOnly value={absolute} onFocus={(e) => e.target.select()} />
            <Button
              icon={Copy}
              onClick={async () => {
                await navigator.clipboard.writeText(absolute);
                toast.success('Adresse copiée');
              }}
            >
              Copier
            </Button>
          </div>
        </Field>
        {asset.mimeType.startsWith('image/') ? (
          <Field label="Texte alternatif" hint="Décrivez l’image en quelques mots. Utilisé par Google Images et les lecteurs d’écran.">
            <Input value={alt} disabled={!can('editor')} onChange={(e) => setAlt(e.target.value)} placeholder="Ex. : ingénieur PEXEN inspectant une centrale frigorifique" />
          </Field>
        ) : null}
      </div>
    </Drawer>
  );
}

export default function MediaPage() {
  const { can } = useAuth();
  const { data, setData, error, loading, reload } = useAsync(() => api.media(), []);
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<MediaAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const items = useMemo(
    () =>
      (data || [])
        .filter((m) => kind === 'all' || m.mimeType.startsWith(kind))
        .filter((m) => !q || m.filename.toLowerCase().includes(q.toLowerCase()) || (m.alt || '').toLowerCase().includes(q.toLowerCase())),
    [data, kind, q]
  );
  const missingAlt = (data || []).filter((m) => m.mimeType.startsWith('image/') && !m.alt?.trim()).length;
  const totalSize = (data || []).reduce((s, m) => s + m.sizeBytes, 0);

  const onFiles = async (files: File[]) => {
    setUploading(true);
    const added = await uploadFiles(files);
    setUploading(false);
    if (added.length) setData((d) => [...added, ...(d || [])]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Médiathèque"
        description={data ? `${data.length} fichier(s) · ${fmtBytes(totalSize)}` : 'Images, vidéos et documents du site.'}
        actions={
          can('editor') ? (
            <label>
              <span className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-navy-900 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-navy-800">
                <UploadCloud className="h-4 w-4" /> Importer
              </span>
              <input type="file" multiple accept={ACCEPT_ALL} className="hidden" onChange={(e) => void onFiles([...(e.target.files || [])]).then(() => (e.target.value = ''))} />
            </label>
          ) : null
        }
      />

      {can('editor') ? <DropZone onFiles={onFiles} compact /> : null}
      {uploading ? (
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Spinner className="h-4 w-4" /> Import en cours…
        </p>
      ) : null}

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={kind}
              onChange={setKind}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'image', label: 'Images' },
                { value: 'video', label: 'Vidéos' },
                { value: 'application', label: 'Documents' },
              ]}
            />
            {missingAlt ? (
              <Badge tone="warning">
                <AlertTriangle className="h-3 w-3" /> {missingAlt} image(s) sans texte alternatif
              </Badge>
            ) : null}
          </div>
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9" />
          </div>
        </div>
        {loading && !data ? (
          <div className="p-5">
            <PageSkeleton />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorState message={error} onRetry={reload} />
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={ImageIcon} title="Aucun fichier" description="Glissez des fichiers dans la zone ci-dessus pour les importer." />
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {items.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                className={cx('group overflow-hidden rounded-xl border bg-white text-left transition hover:shadow-md', selected?.id === m.id ? 'border-brand-500 ring-3 ring-brand-500/20' : 'border-slate-200')}
              >
                <div className="relative aspect-square bg-slate-50">
                  <MediaThumb asset={m} />
                  {m.mimeType.startsWith('image/') && !m.alt?.trim() ? (
                    <span className="absolute right-2 top-2 rounded-full bg-amber-400 p-1 text-white shadow" title="Texte alternatif manquant">
                      <AlertTriangle className="h-3 w-3" />
                    </span>
                  ) : null}
                </div>
                <div className="px-2.5 py-2">
                  <p className="truncate text-xs font-medium text-slate-700">{m.filename}</p>
                  <p className="text-[11px] text-slate-400">{fmtBytes(m.sizeBytes)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <MediaDetails
        asset={selected}
        onClose={() => setSelected(null)}
        onSaved={(a) => {
          setData((d) => (d || []).map((x) => (x.id === a.id ? a : x)));
          setSelected(a);
        }}
        onDeleted={(id) => {
          setData((d) => (d || []).filter((x) => x.id !== id));
          setSelected(null);
        }}
      />
    </div>
  );
}
