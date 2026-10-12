import type { CmsPage, CmsSnapshot } from './types';
import { cmsNow, defaultSeoForPath } from './defaults';
import { ensureDefaultAdmin } from './auth';

const CORE_PATHS: { path: string; title: string; template: CmsPage['template'] }[] = [
  { path: '/', title: 'Accueil', template: 'landing' },
  { path: '/expertises/', title: 'Expertises', template: 'default' },
  { path: '/secteurs/', title: 'Secteurs', template: 'default' },
  { path: '/realisations/', title: 'Réalisations', template: 'default' },
  { path: '/notre-approche/', title: 'Notre approche', template: 'default' },
  { path: '/contact/', title: 'Contact', template: 'default' },
  { path: '/mentions-legales/', title: 'Mentions légales', template: 'legal' },
  { path: '/politique-de-confidentialite/', title: 'Politique de confidentialité', template: 'legal' },
  { path: '/cookies/', title: 'Cookies', template: 'legal' },
];

export async function ensureSeeded(snapshot: CmsSnapshot): Promise<void> {
  snapshot.users = await ensureDefaultAdmin(snapshot.users);

  if (snapshot.pages.length === 0) {
    const t = cmsNow();
    snapshot.pages = CORE_PATHS.map((p, i) => ({
      id: `page-${i + 1}`,
      path: p.path,
      title: p.title,
      status: 'published' as const,
      publishedAt: t,
      contentSource: p.template === 'legal' ? ('cms' as const) : ('react' as const),
      template: p.template,
      blocks:
        p.path === '/'
          ? [
              {
                id: 'hero-home',
                type: 'hero' as const,
                data: {
                  title: 'Ingénierie & performance énergétique',
                  subtitle: 'Audit, travaux, financement CEE et suivi des économies — partout en France.',
                  ctaLabel: 'Parler de votre projet',
                  ctaPath: '/contact/',
                  backgroundStyle: 'gradient',
                },
              },
            ]
          : [
              {
                id: `intro-${i}`,
                type: 'richText' as const,
                data: {
                  html: `<p>Contenu géré depuis le backoffice pour <strong>${p.title}</strong>. Le front React actuel reste la vue par défaut tant que la page n'est pas entièrement reconstruite en blocs.</p>`,
                },
              },
            ],
      seo: defaultSeoForPath(p.path, p.title),
      createdAt: t,
      updatedAt: t,
    }));
  }

  if (snapshot.redirects.length === 0) {
    snapshot.redirects = [
      { from: '/contactez-nous/', to: '/contact/', permanent: true },
      { from: '/nos-solutions/', to: '/expertises/', permanent: true },
    ];
  }
}
