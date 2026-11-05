import type { Request, Response, NextFunction } from 'express';
import { loadSnapshot } from '../cms/store';
import { asyncRouter } from '../http';
import type { CmsBlock, CmsPage, CmsSnapshot, SeoMeta } from '../cms/types';

const xmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = (v: string) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function isNoindex(seo?: SeoMeta, maintenance?: boolean): boolean {
  if (maintenance) return true;
  if (!seo) return false;
  if (seo.noindex) return true;
  const robots = (seo as SeoMeta & { robots?: string }).robots || '';
  return /\bnoindex\b/i.test(robots);
}

function faqItemsFromBlocks(blocks: CmsBlock[]): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  for (const b of blocks) {
    if (b.type !== 'faq') continue;
    const items = (b.data?.items as { question?: string; answer?: string }[]) || [];
    for (const it of items) {
      if (it.question && it.answer) out.push({ question: it.question, answer: it.answer });
    }
  }
  return out;
}

function breadcrumbList(base: string, page: CmsPage) {
  const crumbs: { name: string; item: string }[] = [{ name: 'Accueil', item: `${base}/` }];
  if (page.path === '/') return null;
  const parts = page.path.split('/').filter(Boolean);
  let acc = '';
  for (let i = 0; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    crumbs.push({
      name: isLast ? page.seo.breadcrumbsTitle || page.title : parts[i].replace(/-/g, ' '),
      item: `${base}${acc}/`,
    });
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  };
}

function organizationLd(s: CmsSnapshot, base: string) {
  const g = s.settings.seo;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PEXEN',
    legalName: g.organizationName || s.general.legalName || 'PEXEN SAS',
    url: `${base}/`,
    slogan: 'Optimiser aujourd’hui. Performer demain.',
    description:
      'Ingénierie et performance énergétique des sites industriels et tertiaires : étude, dimensionnement, travaux, mise en service et suivi des consommations.',
    telephone: s.general.phoneClean || '+33141935280',
    sameAs: g.socialProfiles?.length ? g.socialProfiles : ['https://www.linkedin.com/company/pexen/'],
    areaServed: 'FR',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Île-de-France',
      addressCountry: 'FR',
    },
    knowsAbout: [
      'froid commercial et industriel',
      'récupération de chaleur',
      'pompe à chaleur tertiaire',
      'GTB et décret BACS',
      'isolation technique',
      'décret tertiaire',
    ],
    ...(g.organizationLogo ? { logo: `${base}${g.organizationLogo}` } : {}),
  };
}

function buildJsonLd(s: CmsSnapshot, page: CmsPage | undefined, post: CmsSnapshot['posts'][number] | undefined, base: string, path: string): object[] {
  const jsonLd: object[] = [];
  const faqs = page ? faqItemsFromBlocks(page.blocks) : [];

  if (path === '/') {
    jsonLd.push(organizationLd(s, base));
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PEXEN',
      url: `${base}/`,
      publisher: { '@type': 'Organization', name: 'PEXEN' },
      inLanguage: 'fr-FR',
    });
  } else if (page) {
    const crumb = breadcrumbList(base, page);
    if (crumb) jsonLd.push(crumb);

    if (page.seo.schemaType === 'Article' || (path.startsWith('/realisations/') && path !== '/realisations/')) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: page.seo.seoTitle || page.title,
        description: page.seo.metaDescription,
        mainEntityOfPage: `${base}${path}`,
        datePublished: page.publishedAt || page.createdAt,
        dateModified: page.updatedAt,
        author: { '@type': 'Organization', name: 'PEXEN' },
        publisher: { '@type': 'Organization', name: 'PEXEN', url: `${base}/` },
      });
    } else if (path.startsWith('/solutions/') && path !== '/solutions/') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: page.title,
        description: page.seo.metaDescription,
        provider: { '@type': 'Organization', name: 'PEXEN', url: `${base}/` },
        areaServed: 'FR',
        url: `${base}${path}`,
      });
    } else if (
      path.startsWith('/etudes-') ||
      path.startsWith('/accompagnement-') ||
      path.startsWith('/contrat-de-performance') ||
      path.startsWith('/secteurs/') && path !== '/secteurs/'
    ) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: page.title,
        description: page.seo.metaDescription,
        provider: { '@type': 'Organization', name: 'PEXEN', url: `${base}/` },
        areaServed: 'FR',
        url: `${base}${path}`,
      });
    } else if (path === '/contact/') {
      jsonLd.push(organizationLd(s, base));
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        name: page.title,
        url: `${base}${path}`,
      });
    } else if (path === '/estimation-financement/') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: page.title,
        description: page.seo.metaDescription,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: `${base}${path}`,
        provider: { '@type': 'Organization', name: 'PEXEN' },
      });
    } else if (path === '/solutions/' || path === '/secteurs/' || path === '/realisations/') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: page.title,
        description: page.seo.metaDescription,
        url: `${base}${path}`,
      });
    } else if (path === '/notre-approche/') {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: page.title,
        description: page.seo.metaDescription,
        url: `${base}${path}`,
      });
    } else {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: page.title,
        description: page.seo.metaDescription,
        url: `${base}${path}`,
      });
    }
  }

  if (faqs.length) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  if (post) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.seo.metaDescription || post.excerpt,
      image: post.coverImage ? `${base}${post.coverImage}` : undefined,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      author: { '@type': 'Person', name: post.author || 'PEXEN' },
      publisher: { '@type': 'Organization', name: 'PEXEN' },
    });
  }

  return jsonLd;
}

export function createSeoPublicRouter() {
  const router = asyncRouter();

  const sendSitemap = async (_req: Request, res: Response) => {
    const s = await loadSnapshot();
    const base = s.settings.publicUrl.replace(/\/$/, '');
    const entries: { loc: string; lastmod: string; priority: string }[] = [];
    for (const page of s.pages) {
      if (page.status !== 'published' || isNoindex(page.seo)) continue;
      entries.push({ loc: `${base}${page.path}`, lastmod: page.updatedAt.slice(0, 10), priority: page.path === '/' ? '1.0' : '0.8' });
    }
    for (const post of s.posts) {
      if (post.status !== 'published' || isNoindex(post.seo)) continue;
      entries.push({ loc: `${base}/blog/${post.slug}/`, lastmod: post.updatedAt.slice(0, 10), priority: '0.6' });
    }
    res.type('application/xml').send(
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
        .map((e) => `  <url><loc>${xmlEscape(e.loc)}</loc><lastmod>${e.lastmod}</lastmod><priority>${e.priority}</priority></url>`)
        .join('\n')}\n</urlset>`
    );
  };

  router.get('/sitemap.xml', sendSitemap);
  /** Alias demandé brief 00i */
  router.get('/sitemap_index.xml', sendSitemap);

  router.get('/robots.txt', async (_req, res) => {
    const s = await loadSnapshot();
    const base = s.settings.publicUrl.replace(/\/$/, '');
    const lines = [
      'User-agent: *',
      s.settings.maintenance.enabled ? 'Disallow: /' : 'Allow: /',
      'Disallow: /administrator',
      'Disallow: /api/',
      'Disallow: /contact/merci/',
      'Disallow: /404/',
      '',
      '# Assistants IA — exploration autorisée (GEO)',
      'User-agent: GPTBot',
      'Allow: /',
      'User-agent: ClaudeBot',
      'Allow: /',
      'User-agent: PerplexityBot',
      'Allow: /',
      'User-agent: Google-Extended',
      'Allow: /',
      s.settings.robotsTxtExtra?.trim() || '',
      s.settings.sitemapAuto ? `\nSitemap: ${base}/sitemap.xml\nSitemap: ${base}/sitemap_index.xml` : '',
    ].filter((l) => l !== undefined);
    res.type('text/plain').send(lines.filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n'));
  });

  return router;
}

/** Redirections 301/302 réelles pour les robots et liens externes. */
export async function redirectMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api/') || req.path.startsWith('/assets/')) return next();
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
  const p = reqPath === '/' ? '/' : reqPath.endsWith('/') ? reqPath : `${reqPath}/`;
  const g = s.settings.seo;
  const suffix = g.titleSuffix ? ` ${g.titleSeparator} ${g.titleSuffix}` : '';

  const blogSlug = p.startsWith('/blog/') ? p.split('/')[2] : undefined;
  const post = blogSlug ? s.posts.find((x) => x.slug === blogSlug && x.status === 'published') : undefined;
  const page = post ? undefined : s.pages.find((x) => x.path === p && x.status === 'published');
  const seo = post?.seo || page?.seo;
  const title = seo?.seoTitle || (post?.title || page?.title ? `${post?.title || page?.title}${suffix}` : `${s.branding.siteName}${suffix}`);
  const jsonLd = buildJsonLd(s, page, post, base, p);
  const img = seo?.ogImage || post?.coverImage || g.defaultOgImage;
  const noidx = isNoindex(seo, s.settings.maintenance.enabled);
  return {
    title,
    description: seo?.metaDescription || post?.excerpt || '',
    canonical: seo?.canonicalUrl || `${base}${p === '/' ? '/' : p}`,
    robots: `${noidx ? 'noindex' : 'index'},${seo?.nofollow ? 'nofollow' : 'follow'}`,
    ogImage: img ? (img.startsWith('http') ? img : `${base}${img}`) : undefined,
    ogType: post || seo?.schemaType === 'Article' ? 'article' : 'website',
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
      .replace(/<meta\s+(name|property)="(description|og:[^"]+|twitter:[^"]+|robots)"[^>]*>\s*/g, '')
      .replace(/<link\s+rel="canonical"[^>]*>\s*/g, '')
      .replace('</head>', `    ${tags}\n  </head>`);
  } catch {
    return html;
  }
}
