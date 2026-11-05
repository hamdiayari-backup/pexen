import 'dotenv/config';
import { defaultSimulatorData } from '../server/cms/ceeDefaults';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const FROM = '/simulateur-cee/';
const TO = '/estimation-financement/';
const PAGE_INTRO =
  'Décrivez votre site et les travaux envisagés : vous obtenez un premier ordre de grandeur du financement des travaux énergétiques mobilisable. Il ne remplace ni la visite technique, ni les relevés, ni la note de calcul : un ingénieur PEXEN l’établit ensuite à partir de votre installation réelle.';

function rewriteValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return value
      .replaceAll('/simulateur-cee/', TO)
      .replaceAll('Simulateur CEE', 'Estimer le financement')
      .replaceAll('Simuler ma prime CEE', 'Estimer le financement')
      .replaceAll('Calculateur CEE', 'Estimez le financement de votre projet')
      .replaceAll('Simulateur prime CEE', 'Estimez le financement de votre projet');
  }
  if (Array.isArray(value)) return value.map(rewriteValue);
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) next[k] = rewriteValue(v);
    return next;
  }
  return value;
}

const snap = await updateSnapshot((s) => {
  if (!s.redirects.some((r) => r.from === FROM)) {
    s.redirects.push({ from: FROM, to: TO, permanent: true });
  }
  if (!s.redirects.some((r) => r.from === '/simulateur-cee')) {
    s.redirects.push({ from: '/simulateur-cee', to: TO, permanent: true });
  }

  for (const page of s.pages) {
    page.blocks = rewriteValue(page.blocks) as typeof page.blocks;
    if (page.path === FROM) page.status = 'draft';
  }

  const home = s.pages.find((p) => p.path === '/');
  const homeSim = home?.blocks.find((b) => b.type === 'simulator');
  if (homeSim) {
    homeSim.data = {
      ...defaultSimulatorData('teaser'),
      ...homeSim.data,
      variant: 'teaser',
      title: 'Estimer le financement de votre projet',
      teaserCtaLink: TO,
      teaserCtaLabel: 'Estimer le financement',
    };
  }

  const est = s.pages.find((p) => p.path === TO);
  if (est) {
    est.status = 'published';
    est.title = 'Estimer le financement';
    est.seo = {
      ...est.seo,
      slug: 'estimation-financement',
      seoTitle: 'Financement des travaux énergétiques : estimation | PEXEN',
      metaDescription:
        'Estimez le financement de vos travaux énergétiques : type de site, travaux envisagés, puissance. Première estimation indicative, établie ensuite après analyse du site.',
      noindex: false,
    };
    const header = est.blocks.find((b) => b.type === 'pageHeader');
    if (header) {
      const prev = header.data as Record<string, unknown>;
      header.data = {
        ...prev,
        title: 'Estimez le financement de votre projet',
        intro: PAGE_INTRO,
        buttons: [],
        breadcrumb: true,
        parentLabel: 'Accueil',
        parentLink: '/',
        image: String(prev.image || prev.backgroundImage || '/themes/ultra-s/images/pexen/centrale-froid.webp'),
      };
    }
    const sim = est.blocks.find((b) => b.type === 'simulator');
    const tool = defaultSimulatorData('tool');
    if (sim) {
      const prev = sim.data as Record<string, unknown>;
      const keep = (key: string) => (Array.isArray(prev[key]) && (prev[key] as unknown[]).length ? prev[key] : tool[key as keyof typeof tool]);
      sim.data = {
        ...tool,
        ...prev,
        variant: 'tool',
        formId: String(prev.formId || 'contact-main'),
        title: 'Décrivez votre site et les travaux envisagés',
        intro: '',
        eyebrow: tool.eyebrow,
        howTitle: tool.howTitle,
        howText: tool.howText,
        contactTitle: tool.contactTitle,
        contactText: tool.contactText,
        disclaimer: tool.disclaimer,
        resultPrefix: tool.resultPrefix,
        resultNote: tool.resultNote,
        ctaLabel: tool.ctaLabel,
        privacyPath: tool.privacyPath,
        siteTypes: keep('siteTypes') as typeof tool.siteTypes,
        regions: keep('regions') as typeof tool.regions,
        operations: keep('operations') as typeof tool.operations,
        energies: keep('energies') as typeof tool.energies,
      };
      sim.style = { ...sim.style, background: 'white', paddingTop: 'lg', paddingBottom: 'lg' };
    }
  }
});

const est = snap.pages.find((p) => p.path === TO);
const old = snap.pages.find((p) => p.path === FROM);
console.log('redirects', snap.redirects.filter((r) => r.from.includes('simulateur') || r.to === TO));
console.log('old page', old?.status, old?.title);
console.log(
  'estimation',
  est?.status,
  est?.blocks.map((b) => `${b.type}:${String((b.data as { variant?: string; title?: string }).variant || (b.data as { title?: string }).title || '').slice(0, 50)}`)
);
console.log('home sim', snap.pages.find((p) => p.path === '/')?.blocks.find((b) => b.type === 'simulator')?.data?.variant);
await pool.end();
