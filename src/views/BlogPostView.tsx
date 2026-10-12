import React, { useEffect, useState } from 'react';
import type { BlogPost } from '../../server/cms/types';
import { BlockRenderer } from '../components/cms/BlockRenderer';

export function BlogPostView({ slug, onNavigate }: { slug: string; onNavigate: (path: string) => void }) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/public/posts/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error('404');
        return r.json();
      })
      .then(setPost)
      .catch(() => setError(true));
  }, [slug]);

  if (error) {
    return (
      <div className="py-20 text-center">
        <p>Article introuvable.</p>
        <button type="button" className="mt-4 text-px-primary-dark underline" onClick={() => onNavigate('/')}>
          Accueil
        </button>
      </div>
    );
  }
  if (!post) return <div className="py-20 text-center text-slate-500">Chargement…</div>;

  return (
    <article className="py-10">
      <header className="max-w-3xl mx-auto px-4 mb-8">
        <p className="text-xs uppercase tracking-wider text-slate-500">Blog PEXEN</p>
        <h1 className="mt-2 text-3xl font-bold text-px-navy">{post.title}</h1>
        {post.excerpt ? <p className="mt-3 text-lg text-slate-600">{post.excerpt}</p> : null}
      </header>
      {post.coverImage ? (
        <img src={post.coverImage} alt="" className="mx-auto mb-10 max-h-96 w-full max-w-5xl rounded-2xl object-cover px-4" />
      ) : null}
      <BlockRenderer blocks={post.blocks} onNavigate={onNavigate} />
    </article>
  );
}
