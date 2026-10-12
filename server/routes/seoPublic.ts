import type { Request, Response, NextFunction } from 'express';
import { loadSnapshot } from '../cms/store';
import { asyncRouter } from '../http';
import type { CmsSnapshot, SeoMeta } from '../cms/types';

const xmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function createSeoPublicRouter() {
  const router = asyncRouter();

  router.get('/sitemap.xml', async (_req, res) => {
    const s = await loadSnapshot();
    const base = s.settings.publicUrl.replace(/\/$/, '');
    const entries: { loc: string; lastmod: string; priority: string }[] = [];
    for (const page of s.pages) {
      if (page.status !== 'published' || page.seo.noindex) continue;
      entries.push({ loc: `${base}${page.path}`, lastmod: page.updatedAt.slice(0, 10), priority: page.path === '/' ? '1.0' : '0.8' });
    }
    for (const post of s.posts) {
      if (post.status !== 'published' || post.seo.noindex) continue;
      entries.push({ loc: `${base}/blog/${post.slug}/`, lastmod: post.updatedAt.slice(0, 10), priority: '0.6' });
    }
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
        .map((e) => `  <url><loc>${xmlEscape(e.loc)}</loc><lastmod>${e.lastmod}</lastmod><priority>${e.priority}</priority></url>`)
        .join('\n')}\n</urlset>`
    );
  });

  router.get('/robots.txt', async (_req, res) => {
    const s = await loadSnapshot();
    const base = s.settings.publicUrl.replace(/\/$/, '');
    const lines = [
      'User-agent: *',
      s.settings.maintenance.enabled ? 'Disallow: /' : 'Allow: /',
      'Disallow: /administrator',
      'Disallow: /api/',
      s.settings.robotsTxtExtra?.trim() || '',
      s.settings.sitemapAuto ? `\nSitemap: ${base}/sitemap.xml` : '',
    ].filter(Boolean);
    res.type('text/plain').send(lines.join('\n'));
  });

  return router;
}

/** Redirections 301/302 réelles pour les robots et liens externes. */
export async function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'GET' || req.path.startsWith('/api/') || req.path.startsWith('/assets/')) return next();
  try {
    const s = await loadSnapshot();
    const p = req.path.endsWith('/') ? req.path : `${req.path}/`;
    const rule = s.redirects.find((r) => r.from === p);
    if (rule) return res.redirect(rule.permanent ? 301 : 302, rule.to);
  } catch {
    /* les redirections ne doivent jamais bloquer le site */
  }
  next();
}

interface ResolvedMeta {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  ogImage?: string;
  ogType: string;
  seo?: SeoMeta;
  jsonLd: object[];
}

function resolveMeta(s: CmsSnapshot, reqPath: string): ResolvedMeta {
  const base = s.settings.publicUrl.replace(/\/$/, '');
  const p = reqPath.endsWith('/') ? reqPath : `${reqPath}/`;
  const g = s.settings.seo;
  const suffix = g.titleSuffix ? ` ${g.titleSeparator} ${g.titleSuffix}` : '';
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: g.organizationName || s.general.legalName,
    url: base,
    logo: g.organizationLogo ? `${base}${g.organizationLogo}` : undefined,
    telephone: s.general.phoneClean,
    email: s.general.contactEmail,
    sameAs: g.socialProfiles?.length ? g.socialProfiles : undefined,
  };

  const blogSlug = p.startsWith('/blog/') ? p.split('/')[2] : undefined;
  const post = blogSlug ? s.posts.find((x) => x.slug === blogSlug && x.status === 'published') : undefined;
  const page = post ? undefined : s.pages.find((x) => x.path === p && x.status === 'published');
  const seo = post?.seo || page?.seo;
  const title = seo?.seoTitle || (post?.title || page?.title ? `${post?.title || page?.title}${suffix}` : `${s.branding.siteName}${suffix}`);
  const jsonLd: object[] = [org];
  if (post) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.seo.metaDescription || post.excerpt,
      image: post.coverImage ? `${base}${post.coverImage}` : undefined,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { '@type': 'Person', name: post.author || g.organizationName },
      publisher: { '@type': 'Organization', name: g.organizationName },
    });
  }
  const img = seo?.ogImage || post?.coverImage || g.defaultOgImage;
  return {
    title,
    description: seo?.metaDescription || post?.excerpt || '',
    canonical: seo?.canonicalUrl || `${base}${p}`,
    robots: `${seo?.noindex || s.settings.maintenance.enabled ? 'noindex' : 'index'},${seo?.nofollow ? 'nofollow' : 'follow'}`,
    ogImage: img ? (img.startsWith('http') ? img : `${base}${img}`) : undefined,
    ogType: post ? 'article' : 'website',
    seo,
    jsonLd,
  };
}

/** Injecte les balises SEO de la page dans le HTML de la SPA (lisible par Google sans exécuter le JS). */
export async function injectSeo(html: string, reqPath: string): Promise<string> {
  try {
    const s = await loadSnapshot();
    const m = resolveMeta(s, reqPath);
    const tags = [
      `<title>${attr(m.title)}</title>`,
      m.description ? `<meta name="description" content="${attr(m.description)}" />` : '',
      `<link rel="canonical" href="${attr(m.canonical)}" />`,
      `<meta name="robots" content="${m.robots}" />`,
      `<meta property="og:title" content="${attr(m.seo?.ogTitle || m.title)}" />`,
      m.description ? `<meta property="og:description" content="${attr(m.seo?.ogDescription || m.description)}" />` : '',
      `<meta property="og:type" content="${m.ogType}" />`,
      `<meta property="og:url" content="${attr(m.canonical)}" />`,
      `<meta property="og:site_name" content="${attr(s.branding.siteName)}" />`,
      m.ogImage ? `<meta property="og:image" content="${attr(m.ogImage)}" />` : '',
      `<meta name="twitter:card" content="${m.seo?.twitterCard || 'summary_large_image'}" />`,
      s.settings.seo.googleVerification ? `<meta name="google-site-verification" content="${attr(s.settings.seo.googleVerification)}" />` : '',
      s.settings.seo.bingVerification ? `<meta name="msvalidate.01" content="${attr(s.settings.seo.bingVerification)}" />` : '',
      ...m.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
    ]
      .filter(Boolean)
      .join('\n    ');

    return html
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta\s+(name|property)="(description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/g, '')
      .replace('</head>', `    ${tags}\n  </head>`);
  } catch {
    return html;
  }
}
