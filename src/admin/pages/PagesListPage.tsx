import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Copy, ExternalLink, FilePlus2, FileText, MoreHorizontal, Pencil, Search, Trash2 } from 'lucide-react';
import type { CmsPage } from '../../../server/cms/types';
import { api, type PageWithScore } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { slugify, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { publicUrl, useSite } from '../context/SiteContext';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, PageSkeleton, ScoreDot, Segmented, Select, StatusBadge, Table, Td, Th } from '../ui/primitives';
import { Dropdown, DropdownItem, Modal, useConfirm } from '../ui/overlays';

type Filter = 'all' | CmsPage['status'];

export function CreatePageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { reload } = useSite();
  const [title, setTitle] = useState('');
  const [path, setPath] = useState('');
  const [pathTouched, setPathTouched] = useState(false);
  const [template, setTemplate] = useState<CmsPage['template']>('default');
  const [saving, setSaving] = useState(false);
  const effectivePath = pathTouched ? path : title ? `/${slugify(title)}/` : '';

  const submit = async () => {
    setSaving(true);
    try {
      const page = await api.createPage({ title: title.trim(), path: effectivePath, template });
      toast.success('Page créée en brouillon');
      void reload();
      onClose();
      navigate(`/pages/${page.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle page"
      description="La page est créée en brouillon : elle ne sera visible qu’après publication."
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={saving} disabled={!title.trim()} onClick={submit}>
            Créer et modifier
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) void submit();
        }}
      >
        <Field label="Titre de la page">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Audit énergétique industriel" />
        </Field>
        <Field label="Adresse (URL)" hint="Générée automatiquement à partir du titre. Vous pourrez la modifier plus tard.">
          <Input
            value={effectivePath}
            onChange={(e) => {
              setPathTouched(true);
              setPath(e.target.value);
            }}
            placeholder="/audit-energetique/"
          />
        </Field>
        <Field label="Modèle">
          <Select
            value={template}
            onChange={(v) => setTemplate(v as CmsPage['template'])}
            options={[
              { value: 'default', label: 'Standard' },
              { value: 'landing', label: 'Page d’atterrissage (pleine largeur)' },
              { value: 'legal', label: 'Page légale (texte)' },
            ]}
          />
        </Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}

export default function PagesListPage() {
  const { can } = useAuth();
  const { site, reload: reloadSite } = useSite();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const { data, setData, error, loading, reload } = useAsync(() => api.pages(), []);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const counts = useMemo(() => {
    const c = { all: 0, published: 0, draft: 0, scheduled: 0 };
    (data || []).forEach((p) => {
      c.all++;
      c[p.status]++;
    });
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return (data || [])
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => !nq || p.title.toLowerCase().includes(nq) || p.path.includes(nq))
      .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)));
  }, [data, q, filter]);

  const duplicate = async (p: PageWithScore) => {
    try {
      const copy = await api.createPage({
        title: `${p.title} (copie)`,
        path: `${p.path.replace(/\/$/, '')}-copie/`,
        template: p.template,
        blocks: structuredClone(p.blocks),
        seo: { ...structuredClone(p.seo), slug: `${p.seo.slug}-copie` },
      });
      toast.success('Page dupliquée');
      void reloadSite();
      navigate(`/pages/${copy.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const remove = async (p: PageWithScore) => {
    const ok = await confirm({
      title: 'Supprimer cette page ?',
      message: (
        <>
          La page <strong>{p.title}</strong> ({p.path}) sera définitivement supprimée. Pensez à créer une redirection si elle était indexée par Google.
        </>
      ),
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deletePage(p.id);
      setData((d) => (d || []).filter((x) => x.id !== p.id));
      void reloadSite();
      toast.success('Page supprimée');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pages"
        description="Gérez les pages du site, leur contenu, leur statut de publication et leur référencement."
        actions={
          can('editor') ? (
            <Button variant="primary" icon={FilePlus2} onClick={() => setCreateOpen(true)}>
              Nouvelle page
            </Button>
          ) : null
        }
      />

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `Toutes (${counts.all})` },
              { value: 'published', label: `Publiées (${counts.published})` },
              { value: 'draft', label: `Brouillons (${counts.draft})` },
              { value: 'scheduled', label: `Planifiées (${counts.scheduled})` },
            ]}
          />
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher une page…" className="pl-9" />
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
        ) : rows.length === 0 ? (
          <EmptyState icon={FileText} title="Aucune page trouvée" description={q ? 'Essayez un autre terme de recherche.' : 'Créez votre première page.'} />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Titre</Th>
                <Th>Type de contenu</Th>
                <Th>Statut</Th>
                <Th>SEO</Th>
                <Th>Modifiée</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/60">
                  <Td>
                    <Link to={`/pages/${p.id}`} className="block">
                      <span className="font-medium text-slate-900 group-hover:text-brand-700">{p.title}</span>
                      <span className="block text-xs text-slate-500">{p.path}</span>
                    </Link>
                  </Td>
                  <Td>{p.contentSource === 'cms' ? <Badge tone="brand">Éditeur visuel</Badge> : <Badge>Gabarit du site</Badge>}</Td>
                  <Td>
                    <StatusBadge status={p.status} />
                    {p.status === 'scheduled' && p.scheduledAt ? <span className="mt-1 block text-xs text-slate-500">{new Date(p.scheduledAt).toLocaleString('fr-FR')}</span> : null}
                    {p.seo.noindex ? <span className="mt-1 block text-xs text-amber-600">Non indexée</span> : null}
                  </Td>
                  <Td>
                    <ScoreDot score={p.seoScore} />
                  </Td>
                  <Td className="whitespace-nowrap text-slate-500">{timeAgo(p.updatedAt)}</Td>
                  <Td>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/pages/${p.id}`)}>
                        Modifier
                      </DropdownItem>
                      <DropdownItem icon={ExternalLink} onClick={() => window.open(publicUrl(site, p.path), '_blank', 'noopener')}>
                        Voir sur le site
                      </DropdownItem>
                      {can('editor') ? (
                        <DropdownItem icon={Copy} onClick={() => void duplicate(p)}>
                          Dupliquer
                        </DropdownItem>
                      ) : null}
                      {can() && p.path !== '/' ? (
                        <DropdownItem icon={Trash2} danger onClick={() => void remove(p)}>
                          Supprimer
                        </DropdownItem>
                      ) : null}
                    </Dropdown>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <CreatePageModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
