/**
 * Polish final recette : em dashes, logos PNG dans le snapshot, blog liste vide, CTAs etude.
 */
import 'dotenv/config';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import type { BlockKind, BlockStyle } from '../server/cms/blocks';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock, CmsPage } from '../server/cms/types';
import { pool } from '../server/db/client';

const now = () => new Date().toISOString();

function b<K extends BlockKind>(type: K, data: Record<string, unknown>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

function rewriteLogos(value: unknown): { value: unknown; n: number } {
  let n = 0;
  const repl = (s: string) => {
    const next = s
      .replace(/\/themes\/ultra-s\/images\/pexen\/partners\/(intermarche|carrefour-market|cedim|colorcon)\.webp/g, (_, m) => {
        n++;
        return `/themes/ultra-s/images/pexen/partners/${m}.png`;
      })
      .replace(/\/themes\/ultra-s\/images\/pexen\/quali\/(qualipac|qualisol|opqibi|mic)\.webp/g, (_, m) => {
        n++;
        return `/themes/ultra-s/images/pexen/quali/${m}.png`;
      })
      .replace(/\/themes\/ultra-s\/images\/pexen\/quali\/assurance-decennale\.webp(?:\?v=\d+)?/g, () => {
        n++;
        return `/themes/ultra-s/images/pexen/quali/assurance-decennale.png`;
      });
    return next;
  };
  if (typeof value === 'string') return { value: repl(value), n };
  if (Array.isArray(value)) {
    const out = [];
    for (const it of value) {
      const r = rewriteLogos(it);
      n += r.n;
      out.push(r.value);
    }
    return { value: out, n };
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const r = rewriteLogos(v);
      n += r.n;
      out[k] = r.value;
    }
    return { value: out, n };
  }
  return { value, n };
}

function stripEmDash(s: string): string {
  return s
    .replace(/\s*—\s*/g, ' : ')
    .replace(/\s*–\s*/g, ', ')
    .replace(/ : {2,}/g, ' : ');
}

const snap = await updateSnapshot((s) => {
  let logoHits = 0;
  let dashHits = 0;

  for (const page of s.pages) {
    const r = rewriteLogos(page.blocks);
    page.blocks = r.value as CmsBlock[];
    logoHits += r.n;

    const walk = (node: unknown): unknown => {
      if (typeof node === 'string') {
        if (!/[—–]/.test(node)) return node;
        dashHits += (node.match(/[—–]/g) || []).length;
        return stripEmDash(node);
      }
      if (Array.isArray(node)) return node.map(walk);
      if (node && typeof node === 'object') {
        const o: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) o[k] = walk(v);
        return o;
      }
      return node;
    };
    page.blocks = walk(page.blocks) as CmsBlock[];
    page.updatedAt = now();
  }

  /* Blog : modèle liste vide (pas de skeleton infini) */
  const blog: CmsPage = {
    id: s.pages.find((p) => p.path === '/blog/')?.id || uid('p'),
    path: '/blog/',
    title: 'Blog',
    status: 'published',
    blocks: [
      b(
        'pageHeader',
        {
          breadcrumb: true,
          eyebrow: 'PEXEN',
          title: 'Blog',
          intro: 'Articles et retours de chantier à venir.',
          image: '',
          imageAlt: '',
          buttons: [],
          metrics: [],
          heroVariant: 'default',
        },
        { background: 'soft', paddingTop: 'lg', paddingBottom: 'md' }
      ),
      b(
        'richText',
        {
          html: `<div class="px-ultra-blog-empty">
  <p class="px-ultra-blog-empty__kicker">Journal</p>
  <h2>Aucun article pour le moment</h2>
  <p>Le blog PEXEN regroupera bientôt des retours de chantier, des notes techniques et l’actualité réglementaire (CEE, décret tertiaire, décret BACS).</p>
  <p><a href="/contact/">Parler de votre projet →</a></p>
</div>`,
          size: 'normal',
        },
        { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
      ),
      b(
        'cta',
        {
          variant: 'dark',
          layout: 'centered',
          title: 'Un projet ? Parlons-en.',
          text: 'Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.',
          buttons: [button('Parler de votre projet', '/contact/'), button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone')],
        },
        { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
      ),
    ],
    seo: {
      focusKeyphrase: 'blog efficacité énergétique',
      seoTitle: 'Blog | PEXEN',
      metaDescription: 'Blog PEXEN : retours de chantier et notes techniques sur l’efficacité énergétique. Articles à venir.',
    },
    updatedAt: now(),
    createdAt: s.pages.find((p) => p.path === '/blog/')?.createdAt || now(),
  };
  const bi = s.pages.findIndex((p) => p.path === '/blog/');
  if (bi >= 0) s.pages[bi] = { ...s.pages[bi], ...blog, id: s.pages[bi].id };
  else s.pages.push(blog);

  /* Ensure study CTAs already point to ?demande=etude where label matches */
  let etudeLinks = 0;
  for (const page of s.pages) {
    for (const bl of page.blocks) {
      const data = bl.data as { buttons?: { label?: string; link?: string }[]; title?: string };
      for (const btn of data.buttons || []) {
        if (/demander une étude/i.test(btn.label || '') && btn.link && !/demande=etude/.test(btn.link)) {
          btn.link = '/contact/?demande=etude';
          etudeLinks++;
        }
      }
    }
  }

  console.log({ logoHits, dashHits, etudeLinks });
});

console.log('blog blocks', snap.pages.find((p) => p.path === '/blog/')?.blocks.length);
await pool.end();
