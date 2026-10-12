import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ExternalLink, ImageIcon, MoreHorizontal, Newspaper, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { api, type PostWithScore } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { fmtDate } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { publicUrl, useSite } from '../context/SiteContext';
import { Badge, Button, Card, EmptyState, ErrorState, Input, PageHeader, PageSkeleton, ScoreDot, Segmented, StatusBadge, Table, Td, Th } from '../ui/primitives';
import { Dropdown, DropdownItem, useConfirm } from '../ui/overlays';

export default function PostsListPage() {
  const { can } = useAuth();
  const { site, reload: reloadSite } = useSite();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { data, setData, error, loading, reload } = useAsync(() => api.posts(), []);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [creating, setCreating] = useState(false);

  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return (data || [])
      .filter((p) => filter === 'all' || p.status === filter)
      .filter((p) => !nq || p.title.toLowerCase().includes(nq) || p.tags.some((t) => t.toLowerCase().includes(nq)));
  }, [data, q, filter]);

  const create = async () => {
    setCreating(true);
    try {
      const post = await api.createPost({ title: 'Nouvel article' });
      void reloadSite();
      navigate(`/posts/${post.id}`);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const remove = async (p: PostWithScore) => {
    if (!(await confirm({ title: 'Supprimer cet article ?', message: <>« {p.title} » sera définitivement supprimé.</>, confirmLabel: 'Supprimer', danger: true }))) return;
    try {
      await api.deletePost(p.id);
      setData((d) => (d || []).filter((x) => x.id !== p.id));
      void reloadSite();
      toast.success('Article supprimé');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const published = (data || []).filter((p) => p.status === 'published').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Articles"
        description="Rédigez et publiez les actualités et articles de blog."
        actions={
          can('editor') ? (
            <Button variant="primary" icon={Plus} loading={creating} onClick={create}>
              Nouvel article
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
              { value: 'all', label: `Tous (${data?.length || 0})` },
              { value: 'published', label: `Publiés (${published})` },
              { value: 'draft', label: `Brouillons (${(data?.length || 0) - published})` },
            ]}
          />
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre ou étiquette…" className="pl-9" />
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
          <EmptyState
            icon={Newspaper}
            title={data?.length ? 'Aucun article trouvé' : 'Aucun article pour le moment'}
            description={data?.length ? 'Modifiez votre recherche.' : 'Publiez des articles pour améliorer votre référencement et informer vos clients.'}
            action={
              !data?.length && can('editor') ? (
                <Button variant="primary" icon={Plus} onClick={create}>
                  Rédiger le premier article
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Article</Th>
                <Th>Étiquettes</Th>
                <Th>Statut</Th>
                <Th>SEO</Th>
                <Th>Date</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="group hover:bg-slate-50/60">
                  <Td>
                    <Link to={`/posts/${p.id}`} className="flex items-center gap-3">
                      <span className="flex h-11 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                        {p.coverImage ? <img src={p.coverImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-4 w-4 text-slate-300" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900 group-hover:text-brand-700">{p.title}</span>
                        <span className="block truncate text-xs text-slate-500">{p.author ? `Par ${p.author}` : `/blog/${p.slug}/`}</span>
                      </span>
                    </Link>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1">
                      {p.tags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={p.status} />
                  </Td>
                  <Td>
                    <ScoreDot score={p.seoScore} />
                  </Td>
                  <Td className="whitespace-nowrap text-slate-500">{fmtDate(p.publishedAt || p.updatedAt)}</Td>
                  <Td>
                    <Dropdown
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/posts/${p.id}`)}>
                        Modifier
                      </DropdownItem>
                      {p.status === 'published' ? (
                        <DropdownItem icon={ExternalLink} onClick={() => window.open(publicUrl(site, `/blog/${p.slug}/`), '_blank', 'noopener')}>
                          Voir sur le site
                        </DropdownItem>
                      ) : null}
                      {can('editor') ? (
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
    </div>
  );
}
