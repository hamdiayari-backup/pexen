import React, { useCallback, useState } from 'react';
import { TagInput } from '../ui/TagInput';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, History, Save } from 'lucide-react';
import type { BlogPost } from '../../../server/cms/types';
import { api, type PostWithScore } from '../lib/api';
import { useAsync, useEditable } from '../lib/hooks';
import { fmtDateTime, slugify } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { publicUrl, useSite } from '../context/SiteContext';
import { Button, ErrorState, Field, Input, PageSkeleton, ScoreDot, Select, StatusBadge, Textarea } from '../ui/primitives';
import { ImageField } from '../ui/media';
import { SaveBar } from '../ui/SaveBar';
import { BlocksPanel } from '../editor/BlocksPanel';
import { SeoPanel } from '../editor/SeoPanel';
import { fromLocalInput, RevisionsDrawer, SideCard, toLocalInput } from '../editor/EditorBits';

export default function PostEditorPage() {
  const { id = '' } = useParams();
  const { can } = useAuth();
  const { site, reload: reloadSite } = useSite();
  const { data, error, loading, reload } = useAsync(async () => {
    const post = (await api.posts()).find((p) => p.id === id);
    if (!post) throw new Error('Cet article n’existe pas ou a été supprimé.');
    return post;
  }, [id]);
  const save = useCallback(
    async (p: PostWithScore) => {
      const saved = await api.updatePost(p.id, { ...p, seo: { ...p.seo, slug: p.slug } });
      void reloadSite();
      return saved;
    },
    [reloadSite]
  );
  const ed = useEditable<PostWithScore>(data, save, { successMessage: 'Article enregistré' });
  const [revOpen, setRevOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading || !ed.value) return <PageSkeleton />;
  const post = ed.value;
  const set = (p: Partial<BlogPost>) => ed.patch(p as Partial<PostWithScore>);
  const editable = can('editor');
  const url = publicUrl(site, `/blog/${post.slug}/`);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Link to="/posts" className="mb-1.5 inline-flex items-center gap-1 text-[13px] text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Tous les articles
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="truncate text-[22px] font-semibold tracking-tight text-slate-900">{post.title || 'Sans titre'}</h1>
            <StatusBadge status={post.status} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {post.status === 'published' ? (
            <a href={url} target="_blank" rel="noreferrer">
              <Button icon={ExternalLink}>Voir l’article</Button>
            </a>
          ) : null}
          <Button variant="primary" icon={Save} loading={ed.saving} disabled={!ed.dirty} onClick={() => void ed.commit()}>
            Enregistrer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <Input value={post.title} disabled={!editable} onChange={(e) => set({ title: e.target.value })} className="h-12 text-lg font-semibold" placeholder="Titre de l’article" aria-label="Titre" />
          <Field label="Extrait" hint="Résumé affiché dans la liste des articles et utilisé dans l’analyse SEO." counter={{ value: post.excerpt.length, max: 300 }}>
            <Textarea value={post.excerpt} disabled={!editable} onChange={(e) => set({ excerpt: e.target.value })} rows={3} />
          </Field>
          <div className="h-[640px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <BlocksPanel blocks={post.blocks} onChange={(blocks) => set({ blocks })} selectedId={selected} onSelect={(sid) => setSelected(sid)} readOnly={!editable} />
          </div>
          <SeoPanel
            seo={post.seo}
            onChange={(seo) => set({ seo })}
            blocks={post.blocks}
            kind="post"
            extraText={post.excerpt}
            url={url}
            siteName={site?.branding.siteName || 'PEXEN'}
            defaultOgImage={post.coverImage || site?.settings.seo.defaultOgImage}
            slugLocked
          />
        </div>

        <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          <SideCard title="Publication">
            <Field label="Statut">
              <Select
                value={post.status}
                disabled={!editable}
                onChange={(v) => set({ status: v as BlogPost['status'] })}
                options={[
                  { value: 'draft', label: 'Brouillon' },
                  { value: 'published', label: 'Publié' },
                ]}
              />
            </Field>
            <Field label="Date de publication" hint="Laissez vide pour utiliser la date de mise en ligne.">
              <Input type="datetime-local" disabled={!editable} value={toLocalInput(post.publishedAt)} onChange={(e) => set({ publishedAt: fromLocalInput(e.target.value) })} />
            </Field>
            <dl className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-slate-500">Dernière modification</dt>
                <dd className="text-slate-800">{fmtDateTime(post.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Score SEO enregistré</dt>
                <dd>
                  <ScoreDot score={post.seoScore} />
                </dd>
              </div>
            </dl>
            <Button variant="secondary" className="w-full justify-center" loading={ed.saving} disabled={!ed.dirty} onClick={() => void ed.commit()}>
              {post.status === 'published' ? 'Mettre à jour' : 'Enregistrer le brouillon'}
            </Button>
          </SideCard>

          <SideCard title="Image à la une">
            <ImageField value={post.coverImage} onChange={(url) => set({ coverImage: url || undefined })} aspect="aspect-[16/10]" />
          </SideCard>

          <SideCard title="Classement">
            <Field label="Adresse (slug)" hint={`/blog/${post.slug}/`}>
              <Input value={post.slug} disabled={!editable} onChange={(e) => set({ slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} onBlur={() => set({ slug: slugify(post.slug) })} />
            </Field>
            <Field label="Étiquettes">
              <TagInput value={post.tags} onChange={(tags) => set({ tags })} />
            </Field>
            <Field label="Auteur">
              <Input value={post.author || ''} disabled={!editable} onChange={(e) => set({ author: e.target.value })} />
            </Field>
          </SideCard>

          <SideCard title="Révisions">
            <Button className="w-full justify-center" icon={History} onClick={() => setRevOpen(true)}>
              Voir l’historique
            </Button>
          </SideCard>
        </aside>
      </div>

      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
      <RevisionsDrawer
        open={revOpen}
        onClose={() => setRevOpen(false)}
        load={() => api.postRevisions(post.id)}
        restore={(rev) => api.restorePost(post.id, rev)}
        onRestored={() => void reload()}
      />
    </div>
  );
}
