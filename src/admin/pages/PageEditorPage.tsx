import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, History, Layers, Search, Settings2 } from 'lucide-react';
import type { CmsPage } from '../../../server/cms/types';
import type { ProjectMeta } from '../../../server/cms/blocks';
import { api, type PageWithScore } from '../lib/api';
import { useAsync, useEditable } from '../lib/hooks';
import { fmtDateTime } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { publicUrl, useSite } from '../context/SiteContext';
import { Button, cx, ErrorState, Field, Input, Kbd, ScoreDot, Select, Spinner, StatusBadge } from '../ui/primitives';
import { Modal } from '../ui/overlays';
import { SaveBar } from '../ui/SaveBar';
import { SeoPanel } from '../editor/SeoPanel';
import { fromLocalInput, RevisionsDrawer, toLocalInput } from '../editor/EditorBits';
import { BlocksPanel } from '../editor/BlocksPanel';
import { FieldsForm } from '../editor/fields';
import { PROJECT_FIELDS } from '../editor/blockSchemas';
import { DeviceSwitch, PreviewFrame, type Device } from '../editor/PreviewFrame';

const EMPTY_PROJECT: ProjectMeta = { client: '', location: '', sector: 'Industrie', solution: '', summary: '', image: '', results: [] };

function PageSettings({
  page,
  set,
  readOnly,
  seoOnly,
  onRevisions,
}: {
  page: PageWithScore;
  set: (p: Partial<CmsPage>) => void;
  readOnly: boolean;
  seoOnly: boolean;
  onRevisions: () => void;
}) {
  return (
    <div className="space-y-5 p-4">
      <Field label="Titre de la page" hint="Utilisé dans l’administration, le fil d’Ariane et par défaut pour le référencement.">
        <Input value={page.title} disabled={readOnly} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Statut">
          <Select
            value={page.status}
            disabled={seoOnly}
            onChange={(v) => set({ status: v as CmsPage['status'] })}
            options={[
              { value: 'draft', label: 'Brouillon' },
              { value: 'published', label: 'Publiée' },
              { value: 'scheduled', label: 'Planifiée' },
            ]}
          />
        </Field>
        <Field label="Modèle">
          <Select
            value={page.template}
            disabled={readOnly}
            onChange={(v) => set({ template: v as CmsPage['template'], ...(v === 'project' && !page.project ? { project: EMPTY_PROJECT } : {}) })}
            options={[
              { value: 'default', label: 'Standard' },
              { value: 'landing', label: 'Atterrissage' },
              { value: 'project', label: 'Réalisation' },
              { value: 'legal', label: 'Page légale' },
            ]}
          />
        </Field>
      </div>
      {page.status === 'scheduled' ? (
        <Field label="Date de publication">
          <Input type="datetime-local" value={toLocalInput(page.scheduledAt)} onChange={(e) => set({ scheduledAt: fromLocalInput(e.target.value) })} />
        </Field>
      ) : null}
      <Field
        label="Adresse"
        hint={page.path === '/' ? 'L’adresse de la page d’accueil ne peut pas être modifiée.' : 'Si la page est déjà indexée, ajoutez une redirection depuis l’ancienne adresse (SEO › Redirections).'}
      >
        <Input value={page.path} disabled={page.path === '/' || readOnly} onChange={(e) => set({ path: e.target.value })} />
      </Field>

      {page.template === 'project' ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <p className="mb-1 text-sm font-semibold text-slate-900">Fiche réalisation</p>
          <p className="mb-4 text-xs text-slate-500">Ces informations alimentent les blocs « Réalisations » (accueil, secteurs, liste des réalisations).</p>
          <div className={readOnly ? 'pointer-events-none opacity-70' : ''}>
            <FieldsForm
              fields={PROJECT_FIELDS}
              value={(page.project ?? EMPTY_PROJECT) as unknown as Record<string, unknown>}
              onChange={(p) => set({ project: { ...(page.project ?? EMPTY_PROJECT), ...(p as Partial<ProjectMeta>) } })}
            />
          </div>
        </div>
      ) : null}

      <dl className="space-y-2 rounded-xl border border-slate-200 p-4 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-slate-500">Publiée le</dt>
          <dd className="text-slate-800">{fmtDateTime(page.publishedAt)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Dernière modification</dt>
          <dd className="text-slate-800">{fmtDateTime(page.updatedAt)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-500">Score SEO enregistré</dt>
          <dd>
            <ScoreDot score={page.seoScore} />
          </dd>
        </div>
      </dl>
      <Button className="w-full justify-center" icon={History} onClick={onRevisions}>
        Historique des versions
      </Button>
    </div>
  );
}

export default function PageEditorPage() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { site, reload: reloadSite } = useSite();
  const { data, error, loading, reload } = useAsync(async () => {
    const page = (await api.pages()).find((p) => p.id === id);
    if (!page) throw new Error('Cette page n’existe pas ou a été supprimée.');
    return page;
  }, [id]);

  const save = useCallback(
    async (p: PageWithScore) => {
      const slug = p.path.split('/').filter(Boolean).pop() || '';
      const saved = await api.updatePage(p.id, { ...p, contentSource: 'cms', seo: { ...p.seo, slug } });
      void reloadSite();
      return saved;
    },
    [reloadSite]
  );
  const ed = useEditable<PageWithScore>(data, save, { successMessage: 'Page enregistrée' });
  const [revOpen, setRevOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [tab, setTab] = useState<'blocks' | 'page'>('blocks');
  const [device, setDevice] = useState<Device>('desktop');
  const [selected, setSelected] = useState<string | null>(null);
  const [scroll, setScroll] = useState<{ id: string | null; n: number }>({ id: null, n: 0 });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const page = ed.value;
  const payload = useMemo(
    () => ({ page: page ? { ...page, contentSource: 'cms' as const } : null, selectedBlockId: selected, scrollToBlockId: scroll.id, scrollNonce: scroll.n }),
    [page, selected, scroll]
  );
  const select = useCallback((blockId: string | null, doScroll = false) => {
    setSelected(blockId);
    if (blockId && doScroll) setScroll((s) => ({ id: blockId, n: s.n + 1 }));
  }, []);

  if (error) {
    return (
      <div className="pt-10">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }
  if (loading || !page || !data) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-50">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }
  const readOnly = !can('editor');
  const seoOnly = readOnly && can('seo');
  const set = (p: Partial<CmsPage>) => ed.patch(p as Partial<PageWithScore>);
  const saveLabel = page.status === 'published' ? 'Mettre à jour' : page.status === 'scheduled' ? 'Planifier' : 'Enregistrer le brouillon';

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-100">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
        <Link to="/pages" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" title="Toutes les pages">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-slate-900">{page.title || 'Sans titre'}</h1>
            <StatusBadge status={page.status} />
          </div>
          <p className="truncate text-xs text-slate-500">{page.path}</p>
        </div>
        <div className="mx-auto hidden md:block">
          <DeviceSwitch value={device} onChange={setDevice} />
        </div>
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          {ed.dirty ? (
            <span className="hidden items-center gap-1.5 text-xs text-amber-700 lg:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
              Non enregistré · <Kbd>Ctrl S</Kbd>
            </span>
          ) : null}
          {ed.dirty ? (
            <Button size="sm" variant="ghost" onClick={ed.reset} disabled={ed.saving}>
              Annuler
            </Button>
          ) : null}
          <Button size="sm" icon={Search} onClick={() => setSeoOpen(true)}>
            SEO
          </Button>
          {page.status === 'published' ? (
            <a href={publicUrl(site, page.path)} target="_blank" rel="noreferrer" title="Voir la page publiée">
              <Button size="sm" icon={ExternalLink} className="hidden sm:inline-flex">
                Voir
              </Button>
            </a>
          ) : null}
          <Button size="sm" variant="secondary" loading={ed.saving} disabled={!ed.dirty} onClick={() => void ed.commit()}>
            {saveLabel}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full max-w-[400px] shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="grid shrink-0 grid-cols-2 gap-1 border-b border-slate-200 p-1.5">
            {(
              [
                ['blocks', 'Blocs', Layers],
                ['page', 'Page', Settings2],
              ] as const
            ).map(([k, label, I]) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={cx('flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[13px] font-medium transition', tab === k ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800')}
              >
                <I className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1">
            {tab === 'blocks' ? (
              <BlocksPanel blocks={page.blocks} onChange={(blocks) => set({ blocks })} selectedId={selected} onSelect={select} readOnly={readOnly} />
            ) : (
              <div className="h-full overflow-y-auto scrollbar-thin">
                <PageSettings page={page} set={set} readOnly={readOnly} seoOnly={seoOnly} onRevisions={() => setRevOpen(true)} />
              </div>
            )}
          </div>
        </aside>

        <main className="relative hidden min-w-0 flex-1 md:block">
          <PreviewFrame
            path={data.path}
            payload={payload}
            device={device}
            onBlockClick={(blockId) => {
              setTab('blocks');
              select(blockId);
            }}
          />
        </main>
      </div>

      <Modal open={seoOpen} onClose={() => setSeoOpen(false)} size="xl" title="Référencement (SEO)" description="Titre et description Google, partage sur les réseaux sociaux, indexation.">
        <SeoPanel
          seo={page.seo}
          onChange={(seo) => set({ seo })}
          blocks={page.blocks}
          kind="page"
          url={publicUrl(site, page.path)}
          siteName={site?.branding.siteName || 'PEXEN'}
          defaultOgImage={site?.settings.seo.defaultOgImage}
          slugLocked
        />
      </Modal>
      <SaveBar dirty={false} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
      <RevisionsDrawer
        open={revOpen}
        onClose={() => setRevOpen(false)}
        load={() => api.pageRevisions(page.id)}
        restore={(rev) => api.restorePage(page.id, rev)}
        onRestored={() => void reload()}
      />
    </div>
  );
}