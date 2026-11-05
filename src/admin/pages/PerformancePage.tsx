/**
 * Pexen — analyse PageSpeed Insights (Lighthouse + Core Web Vitals)
 */
import React, { useMemo, useState } from 'react';
import {
  ExternalLink,
  Gauge,
  Loader2,
  Monitor,
  Play,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { api, ApiError, type PsiResult } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { fmtDateTime } from '../lib/format';
import {
  Alert,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  PageHeader,
  PageSkeleton,
  ScoreRing,
  Segmented,
  Select,
} from '../ui/primitives';

const FIELD_LABEL: Record<string, string> = {
  FAST: 'Bon',
  AVERAGE: 'À améliorer',
  SLOW: 'Lent',
  NONE: '—',
};

const FIELD_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  FAST: 'success',
  AVERAGE: 'warning',
  SLOW: 'danger',
  NONE: 'neutral',
};

function scoreHint(score: number) {
  if (score >= 90) return { label: 'Excellent', tone: 'success' as const };
  if (score >= 50) return { label: 'À améliorer', tone: 'warning' as const };
  return { label: 'Faible', tone: 'danger' as const };
}

function CategoryCard({ title, score }: { title: string; score: number }) {
  const hint = scoreHint(score);
  return (
    <Card className="flex flex-col items-center gap-3 py-6 text-center">
      <ScoreRing score={score} size={72} label={title} />
      <div>
        <p className="text-[13px] font-semibold text-slate-900">{title}</p>
        <Badge tone={hint.tone} className="mt-1">
          {hint.label}
        </Badge>
      </div>
    </Card>
  );
}

function ResultView({ result }: { result: PsiResult }) {
  const perf = result.categories.find((c) => c.id === 'performance');
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{result.url}</p>
          <p className="text-xs text-slate-500">
            {result.strategy === 'mobile' ? 'Mobile' : 'Ordinateur'} · {fmtDateTime(result.fetchedAt)}
            {result.lighthouseVersion ? ` · Lighthouse ${result.lighthouseVersion}` : ''}
          </p>
        </div>
        <a
          href={result.reportUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:underline"
        >
          Rapport complet PageSpeed <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {result.categories.map((c) => (
          <CategoryCard key={c.id} title={c.title} score={c.score} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Métriques labo (Lighthouse)</h2>
          <ul className="divide-y divide-slate-100">
            {result.metrics.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-slate-800">{m.title}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900">{m.displayValue}</span>
                  {m.score != null ? <ScoreRing score={m.score} size={32} /> : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="mb-1 text-[15px] font-semibold text-slate-900">Données terrain (CrUX)</h2>
          <p className="mb-4 text-xs text-slate-500">Mesures réelles des utilisateurs Chrome, si assez de trafic.</p>
          {!result.field?.metrics?.length ? (
            <p className="py-8 text-center text-sm text-slate-400">Pas encore assez de données terrain pour cette URL.</p>
          ) : (
            <>
              {result.field.overallCategory ? (
                <div className="mb-4">
                  <Badge tone={FIELD_TONE[result.field.overallCategory] || 'neutral'}>
                    Global : {FIELD_LABEL[result.field.overallCategory] || result.field.overallCategory}
                  </Badge>
                </div>
              ) : null}
              <ul className="divide-y divide-slate-100">
                {result.field.metrics.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-[13px] text-slate-700">{m.id.replace(/_/g, ' ')}</span>
                    <Badge tone={FIELD_TONE[m.category] || 'neutral'}>{FIELD_LABEL[m.category] || m.category}</Badge>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h2 className="text-[15px] font-semibold text-slate-900">Pistes d’amélioration</h2>
          {perf ? <Badge tone={scoreHint(perf.score).tone}>Performance {perf.score}</Badge> : null}
        </div>
        {result.opportunities.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Aucune opportunité majeure détectée.</p>
        ) : (
          <ul className="space-y-3">
            {result.opportunities.map((o) => (
              <li key={o.id} className="rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-semibold text-slate-900">{o.title}</p>
                  {o.displayValue ? <span className="text-xs font-medium text-amber-700">{o.displayValue}</span> : null}
                </div>
                {o.description ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{o.description}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

export default function PerformancePage() {
  const { data: targets, error, loading, reload } = useAsync(() => api.performance.targets(), []);
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile');
  const [pageId, setPageId] = useState('__home__');
  const [customPath, setCustomPath] = useState('/');
  const [busy, setBusy] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<PsiResult | null>(null);

  const pageOptions = useMemo(() => {
    const opts = [{ value: '__home__', label: 'Accueil (/)' }];
    for (const p of targets?.pages || []) {
      if (p.path === '/') continue;
      opts.push({ value: p.id, label: `${p.title} (${p.path})` });
    }
    opts.push({ value: '__custom__', label: 'Chemin personnalisé…' });
    return opts;
  }, [targets]);

  const run = async () => {
    if (!targets || busy) return;
    setBusy(true);
    setRunError(null);
    try {
      let path = '/';
      if (pageId === '__custom__') path = customPath.trim() || '/';
      else if (pageId !== '__home__') {
        const p = targets.pages.find((x) => x.id === pageId);
        path = p?.path || '/';
      }
      const data = await api.performance.run({ path, strategy });
      setResult(data);
    } catch (e) {
      setRunError(e instanceof ApiError ? e.message : 'Analyse impossible');
    } finally {
      setBusy(false);
    }
  };

  if (loading && !targets) return <PageSkeleton />;
  if (error || !targets) return <ErrorState message={error || ''} onRetry={reload} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="Mesurez la vitesse du site avec Google PageSpeed Insights (scores Lighthouse et Core Web Vitals), comme sur pagespeed.web.dev."
      />

      {!targets.hasApiKey ? (
        <Alert tone="info">
          Aucune clé <code className="text-[12px]">PAGESPEED_API_KEY</code> configurée : l’analyse fonctionne avec le quota public Google. Pour des
          analyses plus fréquentes, ajoutez une clé API PageSpeed dans le fichier <code className="text-[12px]">.env</code>.
        </Alert>
      ) : null}

      <Card>
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Page à analyser">
              <Select value={pageId} onChange={setPageId} options={pageOptions} />
            </Field>
            {pageId === '__custom__' ? (
              <Field label="Chemin" hint={`Sur ${targets.publicUrl}`}>
                <Input value={customPath} onChange={(e) => setCustomPath(e.target.value)} placeholder="/contact/" />
              </Field>
            ) : (
              <Field label="URL publique">
                <Input
                  readOnly
                  value={
                    pageId === '__home__'
                      ? `${targets.publicUrl}/`
                      : targets.pages.find((p) => p.id === pageId)?.url || targets.publicUrl
                  }
                />
              </Field>
            )}
          </div>
          <Field label="Appareil">
            <Segmented
              value={strategy}
              onChange={(v) => setStrategy(v as 'mobile' | 'desktop')}
              options={[
                { value: 'mobile', label: 'Mobile', icon: Smartphone },
                { value: 'desktop', label: 'Ordinateur', icon: Monitor },
              ]}
            />
          </Field>
          <Button icon={Play} loading={busy} onClick={() => void run()}>
            {busy ? 'Analyse en cours…' : 'Lancer l’analyse'}
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          L’analyse est réalisée par les serveurs Google (30 à 60 s). L’URL doit être accessible publiquement — le localhost n’est pas testable.
        </p>
        {runError ? (
          <div className="mt-3">
            <Alert tone="danger">{runError}</Alert>
          </div>
        ) : null}
      </Card>

      {busy && !result ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <p className="text-sm font-medium text-slate-800">Google analyse la page…</p>
          <p className="max-w-sm text-xs text-slate-500">Lighthouse simule un chargement {strategy === 'mobile' ? 'mobile' : 'desktop'} et calcule les scores.</p>
        </Card>
      ) : null}

      {result ? <ResultView result={result} /> : !busy ? <EmptyState icon={Gauge} title="Aucune analyse" description="Choisissez une page et lancez l’analyse pour obtenir les scores PageSpeed." /> : null}
    </div>
  );
}
