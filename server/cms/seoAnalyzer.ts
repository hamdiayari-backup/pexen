import { blockToHtml } from './blocks';
import type { BlogPost, CmsBlock, CmsPage, SeoMeta } from './types';

/* Module pur : partagé entre le serveur et l'éditeur (analyse en direct). */

export type CheckStatus = 'pass' | 'warn' | 'fail';
export interface SeoCheck {
  id: string;
  group: 'seo' | 'readability';
  label: string;
  status: CheckStatus;
  hint?: string;
}
export interface SeoAnalysis {
  score: number;
  status: 'bad' | 'ok' | 'good';
  readabilityScore: number;
  readabilityStatus: 'bad' | 'ok' | 'good';
  checks: SeoCheck[];
  stats: { words: number; keyphraseCount: number; density: number; internalLinks: number; externalLinks: number; images: number };
}

interface ContentModel {
  html: string;
  text: string;
  headings: string[];
  paragraphs: string[];
  images: { alt: string }[];
  links: string[];
}

const stripTags = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalize = (s: string | null | undefined) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ');

const words = (s: string | null | undefined) =>
  String(s ?? '')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w));

function blocksToContent(blocks: CmsBlock[], extraText = ''): ContentModel {
  const htmlParts: string[] = [];
  const images: { alt: string }[] = [];
  for (const b of blocks) {
    const { html, alts } = blockToHtml(b);
    htmlParts.push(html);
    for (const alt of alts) images.push({ alt });
  }
  const html = (extraText ? `<p>${extraText}</p>` : '') + htmlParts.join('\n');
  for (const m of html.matchAll(/<img[^>]*?(?:alt="([^"]*)")?[^>]*>/gi)) images.push({ alt: m[1] || '' });
  return {
    html,
    text: stripTags(html),
    headings: [...html.matchAll(/<h[2-4][^>]*>([\s\S]*?)<\/h[2-4]>/gi)].map((m) => stripTags(m[1])),
    paragraphs: [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1])).filter(Boolean),
    images,
    links: [...html.matchAll(/<a[^>]*href="([^"]+)"/gi)].map((m) => m[1]),
  };
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = ` ${normalize(haystack).replace(/[^\p{L}\p{N}]+/gu, ' ')} `;
  const n = ` ${normalize(needle).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()} `;
  if (n.trim() === '') return 0;
  let count = 0;
  let idx = h.indexOf(n);
  while (idx !== -1) {
    count++;
    idx = h.indexOf(n, idx + n.length - 1);
  }
  return count;
}

const has = (text: string, kp: string) => countOccurrences(text, kp) > 0;

const TRANSITIONS = [
  'ainsi', 'donc', 'cependant', 'en effet', 'par consequent', 'de plus', 'enfin', 'd abord', 'ensuite', 'toutefois',
  'neanmoins', 'en outre', 'par exemple', 'car', 'puisque', 'alors', 'en revanche', 'finalement', 'notamment', 'pourtant',
  'c est pourquoi', 'en resume', 'premierement', 'egalement', 'afin de',
];

function scoreOf(checks: SeoCheck[]): number {
  if (!checks.length) return 0;
  const pts = checks.reduce((s, c) => s + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0);
  return Math.round((pts / checks.length) * 100);
}
const statusOf = (score: number) => (score >= 75 ? 'good' : score >= 50 ? 'ok' : 'bad') as SeoAnalysis['status'];

export function analyzeContent(seo: SeoMeta, blocks: CmsBlock[], opts: { kind: 'page' | 'post'; extraText?: string; siteHost?: string }): SeoAnalysis {
  const c = blocksToContent(blocks || [], opts.extraText);
  const seoTitle = String(seo?.seoTitle ?? '');
  const metaDescription = String(seo?.metaDescription ?? '');
  const slug = String(seo?.slug ?? '');
  const kp = String(seo?.focusKeyphrase ?? '').trim();
  const wc = words(c.text).length;
  const kpCount = countOccurrences(c.text, kp);
  const kpWords = kp ? words(kp).length : 1;
  const density = wc ? (kpCount * kpWords * 100) / wc : 0;
  const internal = c.links.filter((l) => l.startsWith('/') || (opts.siteHost && l.includes(opts.siteHost))).length;
  const external = c.links.length - internal;
  const checks: SeoCheck[] = [];
  const add = (id: string, group: SeoCheck['group'], label: string, status: CheckStatus, hint?: string) =>
    checks.push({ id, group, label, status, hint });

  /* --- SEO --- */
  if (!kp) {
    add('kp', 'seo', 'Expression clé principale', 'fail', 'Définissez l’expression sur laquelle cette page doit se positionner.');
  } else {
    const inTitle = has(seoTitle, kp);
    const atStart = normalize(seoTitle).startsWith(normalize(kp));
    add('kp-title', 'seo', 'Expression clé dans le titre SEO', inTitle ? (atStart ? 'pass' : 'warn') : 'fail',
      inTitle ? (atStart ? undefined : 'Idéalement placée en début de titre.') : `Ajoutez « ${kp} » au titre SEO.`);
    add('kp-desc', 'seo', 'Expression clé dans la meta description', has(metaDescription, kp) ? 'pass' : 'fail',
      has(metaDescription, kp) ? undefined : 'Google met en gras les termes recherchés dans la description.');
    const slugHit = words(normalize(kp)).every((w) => normalize(slug).includes(w.replace(/[^a-z0-9]/g, '')));
    add('kp-slug', 'seo', 'Expression clé dans l’URL', slugHit ? 'pass' : 'warn', slugHit ? undefined : 'Intégrez les mots-clés dans le slug.');
    const intro = c.paragraphs.slice(0, 2).join(' ') || c.text.slice(0, 400);
    add('kp-intro', 'seo', 'Expression clé dans l’introduction', has(intro, kp) ? 'pass' : 'fail',
      has(intro, kp) ? undefined : 'Mentionnez-la dans le premier paragraphe.');
    if (wc >= 100) {
      const ok = density >= 0.5 && density <= 3;
      add('kp-density', 'seo', `Densité de l’expression clé (${density.toFixed(1)} %)`, ok ? 'pass' : density > 3 ? 'fail' : 'warn',
        ok ? `${kpCount} occurrence(s).` : density > 3 ? 'Sur-optimisation : réduisez les répétitions.' : 'Viser entre 0,5 % et 3 %.');
    }
    const headHit = c.headings.some((h) => has(h, kp));
    add('kp-headings', 'seo', 'Expression clé dans un sous-titre', c.headings.length ? (headHit ? 'pass' : 'warn') : 'warn',
      c.headings.length ? (headHit ? undefined : 'Reprenez-la dans un H2 ou H3.') : 'Ajoutez des sous-titres (H2/H3).');
    if (c.images.length) {
      const altHit = c.images.some((i) => has(i.alt, kp));
      add('kp-alt', 'seo', 'Expression clé dans un texte alternatif d’image', altHit ? 'pass' : 'warn');
    }
  }

  const tl = seoTitle.trim().length;
  add('title-len', 'seo', `Longueur du titre SEO (${tl} car.)`, tl >= 30 && tl <= 60 ? 'pass' : tl === 0 ? 'fail' : 'warn',
    tl < 30 ? 'Trop court : 30 à 60 caractères.' : tl > 60 ? 'Sera tronqué dans Google au-delà de ~60 caractères.' : undefined);
  const dl = metaDescription.trim().length;
  add('desc-len', 'seo', `Longueur de la meta description (${dl} car.)`, dl >= 120 && dl <= 160 ? 'pass' : dl === 0 ? 'fail' : 'warn',
    dl < 120 ? 'Trop courte : 120 à 160 caractères.' : dl > 160 ? 'Sera tronquée au-delà de 160 caractères.' : undefined);
  const minWords = opts.kind === 'post' ? 600 : 300;
  add('length', 'seo', `Longueur du contenu (${wc} mots)`, wc >= minWords ? 'pass' : wc >= minWords / 2 ? 'warn' : 'fail',
    wc >= minWords ? undefined : `Visez au moins ${minWords} mots.`);
  add('internal', 'seo', 'Liens internes', internal > 0 ? 'pass' : 'warn', internal ? undefined : 'Ajoutez des liens vers d’autres pages du site.');
  add('external', 'seo', 'Liens sortants', external > 0 ? 'pass' : 'warn', external ? undefined : 'Citez une source externe de référence.');
  const missingAlt = c.images.filter((i) => !i.alt.trim()).length;
  add('alts', 'seo', 'Textes alternatifs des images', !c.images.length ? 'warn' : missingAlt ? 'fail' : 'pass',
    !c.images.length ? 'Aucune image : un visuel améliore l’engagement.' : missingAlt ? `${missingAlt} image(s) sans texte alternatif.` : undefined);
  add('og', 'seo', 'Image de partage social', seo.ogImage ? 'pass' : 'warn', seo.ogImage ? undefined : 'Définissez une image Open Graph (1200×630).');
  if (seo.noindex) add('noindex', 'seo', 'Indexation désactivée', 'fail', 'Cette page n’apparaîtra pas dans Google (noindex).');

  /* --- Lisibilité --- */
  const sentences = c.text.split(/(?<=[.!?…])\s+/).map((s) => words(s).length).filter((n) => n > 0);
  if (sentences.length >= 3) {
    const longShare = (sentences.filter((n) => n > 20).length / sentences.length) * 100;
    add('sentences', 'readability', `Phrases longues (${Math.round(longShare)} %)`, longShare <= 25 ? 'pass' : longShare <= 35 ? 'warn' : 'fail',
      longShare <= 25 ? undefined : 'Moins de 25 % des phrases devraient dépasser 20 mots.');
  }
  const longParas = c.paragraphs.filter((p) => words(p).length > 150).length;
  if (c.paragraphs.length) {
    add('paragraphs', 'readability', 'Longueur des paragraphes', longParas ? 'warn' : 'pass', longParas ? `${longParas} paragraphe(s) de plus de 150 mots.` : undefined);
  }
  if (wc > 300) {
    const perHeading = wc / (c.headings.length + 1);
    add('subheadings', 'readability', 'Répartition des sous-titres', perHeading <= 300 ? 'pass' : 'warn',
      perHeading <= 300 ? undefined : 'Ajoutez un sous-titre toutes les 300 mots environ.');
  }
  if (sentences.length >= 5) {
    const norm = normalize(c.text);
    const sentencesText = norm.split(/[.!?…]+/);
    const withTransition = sentencesText.filter((s) => TRANSITIONS.some((t) => ` ${s} `.includes(` ${t} `))).length;
    const share = (withTransition / sentencesText.length) * 100;
    add('transitions', 'readability', `Mots de liaison (${Math.round(share)} %)`, share >= 20 ? 'pass' : 'warn',
      share >= 20 ? undefined : 'Utilisez davantage de connecteurs (ainsi, en effet, par exemple…).');
  }
  if (!checks.some((c) => c.group === 'readability')) {
    add('readability-min', 'readability', 'Texte suffisant pour évaluer la lisibilité', 'warn', 'Rédigez davantage de contenu.');
  }

  const seoChecks = checks.filter((x) => x.group === 'seo');
  const readChecks = checks.filter((x) => x.group === 'readability');
  const score = scoreOf(seoChecks);
  const readabilityScore = scoreOf(readChecks);
  return {
    score,
    status: statusOf(score),
    readabilityScore,
    readabilityStatus: statusOf(readabilityScore),
    checks,
    stats: { words: wc, keyphraseCount: kpCount, density: Math.round(density * 10) / 10, internalLinks: internal, externalLinks: external, images: c.images.length },
  };
}

export function analyzePageSeo(page: CmsPage): SeoAnalysis {
  return analyzeContent(page.seo || ({} as SeoMeta), page.blocks || [], { kind: 'page' });
}

export function analyzePostSeo(post: BlogPost): SeoAnalysis {
  return analyzeContent(post.seo || ({} as SeoMeta), post.blocks || [], { kind: 'post', extraText: post.excerpt });
}