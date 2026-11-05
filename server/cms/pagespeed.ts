/**
 * Client Google PageSpeed Insights (Lighthouse + Core Web Vitals).
 * https://developers.google.com/speed/docs/insights/v5/get-started
 */
import { HttpError } from '../http';

export type PsiStrategy = 'mobile' | 'desktop';

export interface PsiMetric {
  id: string;
  title: string;
  displayValue: string;
  score: number | null;
}

export interface PsiOpportunity {
  id: string;
  title: string;
  description: string;
  displayValue?: string;
  score: number | null;
}

export interface PsiCategoryScore {
  id: string;
  title: string;
  score: number;
}

export interface PsiResult {
  url: string;
  strategy: PsiStrategy;
  fetchedAt: string;
  lighthouseVersion?: string;
  categories: PsiCategoryScore[];
  metrics: PsiMetric[];
  opportunities: PsiOpportunity[];
  /** Données terrain CrUX (si disponibles pour l’URL / l’origine). */
  field?: {
    overallCategory?: string;
    metrics: { id: string; category: string; percentile?: number }[];
  };
  reportUrl: string;
}

const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'] as const;

const METRIC_IDS = [
  'first-contentful-paint',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'speed-index',
  'interactive',
] as const;

type LighthouseAudit = {
  id?: string;
  title?: string;
  description?: string;
  displayValue?: string;
  score?: number | null;
  details?: { type?: string; overallSavingsMs?: number };
};

type PsiApiResponse = {
  error?: { message?: string; code?: number };
  lighthouseResult?: {
    finalUrl?: string;
    lighthouseVersion?: string;
    categories?: Record<string, { id?: string; title?: string; score?: number | null }>;
    audits?: Record<string, LighthouseAudit>;
  };
  loadingExperience?: {
    overall_category?: string;
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
  originLoadingExperience?: {
    overall_category?: string;
    metrics?: Record<string, { percentile?: number; category?: string }>;
  };
};

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function score100(score: number | null | undefined): number {
  if (score == null || Number.isNaN(score)) return 0;
  return Math.round(score * 100);
}

/** N’autorise que l’hôte du site public (anti-SSRF). */
export function resolveAuditUrl(rawPathOrUrl: string, publicUrl: string): string {
  const base = publicUrl.replace(/\/+$/, '') || 'https://pexen.fr';
  let baseHost: string;
  try {
    baseHost = new URL(base).hostname;
  } catch {
    throw new HttpError(400, 'URL publique du site invalide (Paramètres → Site)');
  }

  const input = (rawPathOrUrl || '/').trim() || '/';
  let target: URL;
  try {
    target = input.startsWith('http://') || input.startsWith('https://') ? new URL(input) : new URL(input.startsWith('/') ? input : `/${input}`, `${base}/`);
  } catch {
    throw new HttpError(400, 'URL invalide');
  }

  if (target.protocol !== 'http:' && target.protocol !== 'https:') {
    throw new HttpError(400, 'Seules les URLs http(s) sont autorisées');
  }
  if (target.hostname !== baseHost) {
    throw new HttpError(400, `L’URL doit appartenir à ${baseHost} (réglée dans Paramètres)`);
  }
  target.hash = '';
  return target.toString();
}

export async function runPageSpeed(url: string, strategy: PsiStrategy): Promise<PsiResult> {
  const params = new URLSearchParams({ url, strategy, category: CATEGORIES[0] });
  for (const c of CATEGORIES.slice(1)) params.append('category', c);
  const key = process.env.PAGESPEED_API_KEY || process.env.GOOGLE_API_KEY;
  if (key) params.set('key', key);

  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 90_000);
  let res: Response;
  try {
    res = await fetch(endpoint, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw new HttpError(504, 'Analyse trop longue (délai dépassé)');
    throw new HttpError(502, 'Impossible de joindre Google PageSpeed Insights');
  } finally {
    clearTimeout(timer);
  }

  const data = (await res.json().catch(() => null)) as PsiApiResponse | null;
  if (!data) throw new HttpError(502, 'Réponse PageSpeed illisible');
  if (!res.ok || data.error) {
    const msg = data.error?.message || `Erreur PageSpeed (${res.status})`;
    if (res.status === 429 || data.error?.code === 429) {
      throw new HttpError(429, 'Quota PageSpeed atteint. Ajoutez une clé PAGESPEED_API_KEY ou réessayez plus tard.');
    }
    throw new HttpError(res.status >= 400 && res.status < 600 ? res.status : 502, msg);
  }

  const lh = data.lighthouseResult;
  if (!lh?.categories) throw new HttpError(502, 'Aucun résultat Lighthouse reçu');

  const categories: PsiCategoryScore[] = CATEGORIES.map((id) => {
    const cat = lh.categories?.[id];
    return {
      id,
      title: cat?.title || id,
      score: score100(cat?.score),
    };
  });

  const audits = lh.audits || {};
  const metrics: PsiMetric[] = METRIC_IDS.filter((id) => audits[id]).map((id) => {
    const a = audits[id]!;
    return {
      id,
      title: a.title || id,
      displayValue: a.displayValue || '—',
      score: a.score == null ? null : score100(a.score),
    };
  });

  const opportunities: PsiOpportunity[] = Object.values(audits)
    .filter((a) => a.details?.type === 'opportunity' && (a.score == null || a.score < 0.9))
    .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
    .slice(0, 8)
    .map((a) => ({
      id: a.id || '',
      title: a.title || '',
      description: stripHtml(a.description || ''),
      displayValue: a.displayValue,
      score: a.score == null ? null : score100(a.score),
    }));

  const fieldSrc = data.loadingExperience?.metrics ? data.loadingExperience : data.originLoadingExperience;
  const field = fieldSrc?.metrics
    ? {
        overallCategory: fieldSrc.overall_category,
        metrics: Object.entries(fieldSrc.metrics).map(([id, m]) => ({
          id,
          category: m.category || 'NONE',
          percentile: m.percentile,
        })),
      }
    : undefined;

  const reportUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}&form_factor=${strategy === 'desktop' ? 'desktop' : 'mobile'}`;

  return {
    url: lh.finalUrl || url,
    strategy,
    fetchedAt: new Date().toISOString(),
    lighthouseVersion: lh.lighthouseVersion,
    categories,
    metrics,
    opportunities,
    field,
    reportUrl,
  };
}

/** Anti-abus : une analyse par stratégie toutes les 25 s. */
const lastRun = new Map<string, number>();

export function assertPsiCooldown(strategy: PsiStrategy) {
  const key = strategy;
  const prev = lastRun.get(key) || 0;
  const wait = 25_000 - (Date.now() - prev);
  if (wait > 0) throw new HttpError(429, `Patientez ${Math.ceil(wait / 1000)} s avant une nouvelle analyse ${strategy}.`);
  lastRun.set(key, Date.now());
}
