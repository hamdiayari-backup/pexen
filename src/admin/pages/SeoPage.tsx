import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Copy,
  ExternalLink,
  FileCode2,
  Globe,
  Link2,
  LogOut,
  MousePointerClick,
  Percent,
  Plus,
  Search,
  Settings2,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { RedirectRule, SeoGlobalSettings } from '../../../server/cms/types';
import { api, type SeoOverviewRow } from '../lib/api';
import { errorMessage, useAsync, useEditable } from '../lib/hooks';
import { fmtDateTime, fmtNumber } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { publicUrl, useSite, useSiteData } from '../context/SiteContext';
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
  Section,
  Segmented,
  Select,
  StatCard,
  StatusBadge,
  Switch,
  Table,
  Tabs,
  Td,
  Textarea,
  Th,
} from '../ui/primitives';
import { useConfirm } from '../ui/overlays';
import { ImageField } from '../ui/media';
import { SaveBar } from '../ui/SaveBar';
import { TagInput } from '../ui/TagInput';
import { Legend, TrendChart } from '../ui/charts';

type Tab = 'overview' | 'google' | 'settings' | 'redirects' | 'indexing';

/* ------------------------------------------------------------------ Vue d'ensemble */

function Overview() {
  const { data, error, loading, reload } = useAsync(() => api.seoOverview(), []);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'bad' | 'ok' | 'good'>('all');

  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return (data || [])
      .filter((r) => !nq || r.title.toLowerCase().includes(nq) || r.url.includes(nq) || r.seo.focusKeyphrase.toLowerCase().includes(nq))
      .filter((r) => filter === 'all' || (filter === 'bad' ? r.analysis.score < 50 : filter === 'ok' ? r.analysis.score >= 50 && r.analysis.score < 75 : r.analysis.score >= 75))
      .sort((a, b) => a.analysis.score - b.analysis.score);
  }, [data, q, filter]);

  if (loading && !data) return <PageSkeleton />;
  if (error || !data) return <ErrorState message={error || ''} onRetry={reload} />;

  const published = data.filter((r) => r.status === 'published');
  const avg = published.length ? Math.round(published.reduce((s, r) => s + r.analysis.score, 0) / published.length) : 0;
  const noKeyphrase = data.filter((r) => !r.seo.focusKeyphrase.trim()).length;
  const noDesc = data.filter((r) => !r.seo.metaDescription.trim()).length;
  const noindex = data.filter((r) => r.seo.noindex).length;
  const editLink = (r: SeoOverviewRow) => (r.kind === 'page' ? `/pages/${r.id}` : `/posts/${r.id}`);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="flex items-center gap-4">
          <ScoreRing score={avg} size={60} />
          <div>
            <p className="text-[13px] font-medium text-slate-500">Score SEO moyen</p>
            <p className="text-xs text-slate-400">{published.length} contenu(s) publié(s)</p>
          </div>
        </Card>
        <StatCard label="Sans expression clé" value={noKeyphrase} icon={Target} tone="amber" hint="Analyse incomplète" />
        <StatCard label="Sans meta description" value={noDesc} icon={FileCode2} tone="rose" hint="Google choisira un extrait" />
        <StatCard label="Exclus de Google" value={noindex} icon={AlertTriangle} tone="violet" hint="Pages en noindex" />
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'bad', label: 'À corriger' },
              { value: 'ok', label: 'À améliorer' },
              { value: 'good', label: 'Optimisés' },
            ]}
          />
          <div className="relative sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Titre, URL ou expression clé…" className="pl-9" />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={Search} title="Aucun contenu" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Contenu</Th>
                <Th>Expression clé</Th>
                <Th>SEO</Th>
                <Th>Lisibilité</Th>
                <Th>Problèmes</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const fails = r.analysis.checks.filter((c) => c.status === 'fail');
                return (
                  <tr key={`${r.kind}-${r.id}`} className="group hover:bg-slate-50/60">
                    <Td>
                      <Link to={editLink(r)} className="block">
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 group-hover:text-brand-700">{r.title}</span>
                          {r.kind === 'post' ? <Badge>Article</Badge> : null}
                          {r.status !== 'published' ? <StatusBadge status={r.status} /> : null}
                        </span>
                        <span className="block text-xs text-slate-500">{r.url}</span>
                      </Link>
                    </Td>
                    <Td>{r.seo.focusKeyphrase ? <span className="text-slate-700">{r.seo.focusKeyphrase}</span> : <span className="text-xs text-amber-600">Non définie</span>}</Td>
                    <Td>
                      <ScoreRing score={r.analysis.score} size={36} />
                    </Td>
                    <Td>
                      <ScoreRing score={r.analysis.readabilityScore} size={36} />
                    </Td>
                    <Td className="max-w-[280px]">
                      {fails.length ? (
                        <span className="text-xs text-slate-600" title={fails.map((f) => f.label).join('\n')}>
                          <span className="font-medium text-rose-600">{fails.length}</span> · {fails[0].label}
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-600">Aucun</span>
                      )}
                    </Td>
                    <Td>
                      <Link to={editLink(r)} className="text-slate-400 hover:text-slate-700" aria-label="Optimiser">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ Google Search Console */

const GSC_SERIES = [
  { key: 'clicks', label: 'Clics', color: '#00a89d' },
  { key: 'impressions', label: 'Impressions', color: '#6366f1' },
];

function GoogleTab() {
  const { can } = useAuth();
  const { patchSite, site } = useSite();
  const confirm = useConfirm();
  const { data: status, error, loading, reload } = useAsync(() => api.google.status(), []);
  const [days, setDays] = useState('28');
  const sites = useAsync(() => (status?.connected ? api.google.sites() : Promise.resolve([])), [status?.connected]);
  const perf = useAsync(() => (status?.connected && status.property ? api.google.performance(Number(days)) : Promise.resolve(null)), [status?.connected, status?.property, days]);
  const [connecting, setConnecting] = useState(false);

  if (loading && !status) return <PageSkeleton />;
  if (error || !status) return <ErrorState message={error || ''} onRetry={reload} />;

  if (!status.configured) {
    return (
      <Section title="Connecter Google Search Console" description="Suivez vos positions, clics et impressions Google directement depuis l’administration.">
        <Alert tone="warning" title="Configuration serveur requise">
          Les identifiants OAuth Google ne sont pas encore définis. Un administrateur technique doit les ajouter au fichier <code>.env</code> du serveur.
        </Alert>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-600">
          <li>
            Dans la{' '}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="font-medium text-brand-700 hover:underline">
              console Google Cloud
            </a>
            , créez un identifiant « ID client OAuth » de type Application Web.
          </li>
          <li>Activez l’API « Google Search Console ».</li>
          <li>Ajoutez cette URI de redirection autorisée :</li>
        </ol>
        <div className="flex gap-2">
          <Input readOnly value={status.redirectUri} className="font-mono text-xs" />
          <Button
            icon={Copy}
            onClick={async () => {
              await navigator.clipboard.writeText(status.redirectUri);
              toast.success('URI copiée');
            }}
          >
            Copier
          </Button>
        </div>
        <p className="text-sm text-slate-600">
          Renseignez ensuite <code className="rounded bg-slate-100 px-1">GOOGLE_CLIENT_ID</code> et <code className="rounded bg-slate-100 px-1">GOOGLE_CLIENT_SECRET</code> puis redémarrez le
          serveur.
        </p>
      </Section>
    );
  }

  if (!status.connected) {
    return (
      <Card className="py-14 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <Globe className="h-6 w-6 text-slate-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Connectez votre compte Google</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Accès en lecture seule à Search Console : requêtes, positions, clics et pages les plus performantes.</p>
        <Button
          className="mt-6"
          variant="primary"
          size="lg"
          loading={connecting}
          onClick={async () => {
            setConnecting(true);
            try {
              const { authUrl } = await api.google.connect();
              window.location.href = authUrl;
            } catch (e) {
              toast.error(errorMessage(e));
              setConnecting(false);
            }
          }}
        >
          Se connecter avec Google
        </Button>
      </Card>
    );
  }

  const saveProperty = async (property: string) => {
    try {
      await api.saveSection('google', { searchConsoleProperty: property });
      if (site) patchSite('google', { ...site.google, searchConsoleProperty: property });
      await reload();
      toast.success('Propriété sélectionnée');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const p = perf.data;
  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Globe className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">Compte Google connecté</p>
            <p className="text-xs text-slate-500">Dernière synchronisation : {fmtDateTime(status.lastSyncAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status.property || ''}
            onChange={(v) => v && void saveProperty(v)}
            options={[{ value: '', label: sites.loading ? 'Chargement des propriétés…' : 'Choisir une propriété…' }, ...(sites.data || []).map((s) => ({ value: s.siteUrl, label: s.siteUrl }))]}
            className="w-72"
          />
          {can() ? (
            <Button
              icon={LogOut}
              variant="ghost"
              onClick={async () => {
                if (!(await confirm({ title: 'Déconnecter Google ?', message: 'Les données Search Console ne seront plus affichées.', confirmLabel: 'Déconnecter', danger: true }))) return;
                await api.google.disconnect();
                await reload();
              }}
            >
              Déconnecter
            </Button>
          ) : null}
        </div>
      </Card>

      {sites.error ? <Alert tone="danger">{sites.error}</Alert> : null}
      {!status.property ? (
        <Alert tone="info">Sélectionnez la propriété Search Console correspondant à votre site pour afficher les performances.</Alert>
      ) : perf.loading && !p ? (
        <PageSkeleton />
      ) : perf.error ? (
        <ErrorState message={perf.error} onRetry={perf.reload} />
      ) : p ? (
        <>
          <div className="flex justify-end">
            <Segmented
              value={days}
              onChange={setDays}
              options={[
                { value: '7', label: '7 jours' },
                { value: '28', label: '28 jours' },
                { value: '90', label: '3 mois' },
                { value: '480', label: '16 mois' },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Clics" value={fmtNumber(p.totals.clicks)} icon={MousePointerClick} />
            <StatCard label="Impressions" value={fmtNumber(p.totals.impressions)} icon={BarChart3} tone="violet" />
            <StatCard label="CTR moyen" value={`${(p.totals.ctr * 100).toFixed(1).replace('.', ',')} %`} icon={Percent} tone="sky" />
            <StatCard label="Position moyenne" value={p.totals.position.toFixed(1).replace('.', ',')} icon={TrendingUp} tone="amber" />
          </div>
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900">Performances dans la recherche Google</h2>
              <Legend series={GSC_SERIES} />
            </div>
            <TrendChart data={p.timeseries} series={GSC_SERIES} />
          </Card>
          <div className="grid gap-6 xl:grid-cols-2">
            <GscTable title="Requêtes" rows={p.queries.map((r) => ({ key: r.query, ...r }))} />
            <GscTable title="Pages" rows={p.pages.map((r) => ({ key: r.page.replace(/^https?:\/\/[^/]+/, '') || '/', ...r }))} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function GscTable({ title, rows }: { title: string; rows: { key: string; clicks: number; impressions: number; ctr: number; position: number }[] }) {
  return (
    <Card padded={false}>
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">Pas encore de données</p>
      ) : (
        <Table className="max-h-[440px] overflow-y-auto">
          <thead>
            <tr>
              <Th>{title.slice(0, -1)}</Th>
              <Th className="text-right">Clics</Th>
              <Th className="text-right">Impr.</Th>
              <Th className="text-right">CTR</Th>
              <Th className="text-right">Pos.</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="hover:bg-slate-50/60">
                <Td className="max-w-[260px] truncate text-slate-800">{r.key}</Td>
                <Td className="text-right tabular-nums">{fmtNumber(r.clicks)}</Td>
                <Td className="text-right tabular-nums text-slate-500">{fmtNumber(r.impressions)}</Td>
                <Td className="text-right tabular-nums text-slate-500">{(r.ctr * 100).toFixed(1)} %</Td>
                <Td className="text-right tabular-nums">
                  <span className={r.position <= 3 ? 'font-medium text-emerald-600' : r.position <= 10 ? 'text-slate-800' : 'text-slate-400'}>{r.position.toFixed(1)}</span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ Réglages globaux */

const SEPARATORS = ['–', '|', '·', '•', '—', '»', '/'];

function GlobalSettings() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const save = useCallback(
    async (seo: SeoGlobalSettings) => {
      await api.saveSection('seo-settings', seo);
      patchSite('settings', { ...site.settings, seo });
    },
    [site.settings, patchSite]
  );
  const ed = useEditable<SeoGlobalSettings>(site.settings.seo, save, { successMessage: 'Réglages SEO enregistrés' });
  if (!ed.value) return null;
  const s = ed.value;
  const example = `Audit énergétique ${s.titleSeparator} ${s.titleSuffix || site.branding.siteName}`;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Format des titres" description="S’applique automatiquement aux pages dont le titre SEO ne contient pas déjà le nom du site.">
        <Field label="Séparateur">
          <div className="flex flex-wrap gap-2">
            {SEPARATORS.map((sep) => (
              <button
                key={sep}
                type="button"
                onClick={() => ed.patch({ titleSeparator: sep })}
                className={`flex h-10 w-10 items-center justify-center rounded-lg border text-lg transition ${s.titleSeparator === sep ? 'border-brand-500 bg-brand-50 text-brand-700 ring-3 ring-brand-500/15' : 'border-slate-200 hover:border-slate-300'}`}
              >
                {sep}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Suffixe des titres">
          <Input value={s.titleSuffix} onChange={(e) => ed.patch({ titleSuffix: e.target.value })} placeholder={site.branding.siteName} />
        </Field>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Exemple dans Google</p>
          <p className="mt-1 text-lg text-[#1a0dab]">{example}</p>
        </div>
      </Section>

      <Section title="Organisation (données structurées)" description="Aide Google à afficher votre fiche entreprise (Knowledge Graph).">
        <Field label="Nom de l’organisation">
          <Input value={s.organizationName} onChange={(e) => ed.patch({ organizationName: e.target.value })} />
        </Field>
        <Field label="Logo de l’organisation" hint="Carré, 112 × 112 px minimum.">
          <div className="w-40">
            <ImageField value={s.organizationLogo} onChange={(organizationLogo) => ed.patch({ organizationLogo })} aspect="aspect-square" />
          </div>
        </Field>
        <Field label="Profils sociaux" hint="URL complètes (LinkedIn, YouTube…).">
          <TagInput value={s.socialProfiles} onChange={(socialProfiles) => ed.patch({ socialProfiles })} validate={(v) => /^https?:\/\//.test(v)} placeholder="https://www.linkedin.com/company/… puis Entrée" />
        </Field>
      </Section>

      <Section title="Partage sur les réseaux sociaux">
        <Field label="Image de partage par défaut" hint="Utilisée quand une page n’a pas sa propre image. 1200 × 630 px.">
          <ImageField value={s.defaultOgImage} onChange={(defaultOgImage) => ed.patch({ defaultOgImage })} aspect="aspect-[1.91/1]" />
        </Field>
      </Section>

      <Section title="Validation des outils pour webmasters" description="Collez uniquement le code (valeur de l’attribut content).">
        <Field label="Google Analytics 4 (ID de mesure)" hint="Chargé sur le site public uniquement après consentement cookies (Consent Mode v2 basic).">
          <Input value={s.gaMeasurementId || ''} onChange={(e) => ed.patch({ gaMeasurementId: e.target.value.trim() })} placeholder="G-XXXXXXXXXX" className="font-mono" />
        </Field>
        <Field label="Google Search Console">
          <Input value={s.googleVerification || ''} onChange={(e) => ed.patch({ googleVerification: e.target.value.replace(/.*content="([^"]+)".*/, '$1') })} placeholder="abc123…" className="font-mono" />
        </Field>
        <Field label="Bing Webmaster Tools">
          <Input value={s.bingVerification || ''} onChange={(e) => ed.patch({ bingVerification: e.target.value.replace(/.*content="([^"]+)".*/, '$1') })} placeholder="ABC123…" className="font-mono" />
        </Field>
      </Section>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}

/* ------------------------------------------------------------------ Redirections */

function Redirects() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const save = useCallback(
    async (list: RedirectRule[]) => {
      const clean = list.filter((r) => r.from.trim() && r.to.trim());
      await api.saveRedirects(clean);
      const fresh = await api.snapshot();
      patchSite('redirects', fresh.redirects);
      return fresh.redirects;
    },
    [patchSite]
  );
  const ed = useEditable<RedirectRule[]>(site.redirects, save, { successMessage: 'Redirections enregistrées' });
  const [q, setQ] = useState('');
  if (!ed.value) return null;
  const list = ed.value;
  const update = (i: number, p: Partial<RedirectRule>) => ed.setValue(list.map((r, j) => (j === i ? { ...r, ...p } : r)));
  const dupes = new Set(list.map((r) => r.from).filter((f, i, a) => f && a.indexOf(f) !== i));

  return (
    <Section
      title="Redirections"
      description="Redirigez une ancienne adresse vers une nouvelle pour conserver le référencement et éviter les erreurs 404."
      actions={
        <Button size="sm" variant="primary" icon={Plus} onClick={() => ed.setValue([{ from: '', to: '', permanent: true }, ...list])}>
          Ajouter
        </Button>
      }
    >
      {list.length > 8 ? (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer…" className="pl-9" />
        </div>
      ) : null}
      {list.length === 0 ? (
        <EmptyState icon={Link2} title="Aucune redirection" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_24px_1fr_150px_40px] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid">
            <span>Ancienne adresse</span>
            <span />
            <span>Nouvelle adresse</span>
            <span>Type</span>
            <span />
          </div>
          <div className="divide-y divide-slate-100">
            {list.map((r, i) =>
              q && !`${r.from} ${r.to}`.includes(q) ? null : (
                <div key={i} className="grid items-center gap-3 px-4 py-2.5 md:grid-cols-[1fr_24px_1fr_150px_40px]">
                  <Input value={r.from} onChange={(e) => update(i, { from: e.target.value })} placeholder="/ancienne-page/" invalid={dupes.has(r.from)} />
                  <ArrowRight className="hidden h-4 w-4 text-slate-300 md:block" />
                  <Input list="admin-site-links" value={r.to} onChange={(e) => update(i, { to: e.target.value })} placeholder="/nouvelle-page/" />
                  <Select
                    value={r.permanent ? '301' : '302'}
                    onChange={(v) => update(i, { permanent: v === '301' })}
                    options={[
                      { value: '301', label: '301 · Définitive' },
                      { value: '302', label: '302 · Temporaire' },
                    ]}
                  />
                  <Button size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => ed.setValue(list.filter((_, j) => j !== i))} aria-label="Supprimer">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
      )}
      {dupes.size ? <Alert tone="danger">Certaines adresses d’origine sont en double.</Alert> : null}
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </Section>
  );
}

/* ------------------------------------------------------------------ Indexation */

function Indexing() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const { can } = useAuth();
  const initial = useMemo(() => ({ robotsTxtExtra: site.settings.robotsTxtExtra || '', sitemapAuto: site.settings.sitemapAuto }), [site.settings]);
  const save = useCallback(
    async (v: { robotsTxtExtra: string; sitemapAuto: boolean }) => {
      await api.saveSection('seo-settings', { robotsTxtExtra: v.robotsTxtExtra });
      if (v.sitemapAuto !== site.settings.sitemapAuto) await api.saveSection('settings', { sitemapAuto: v.sitemapAuto });
      patchSite('settings', { ...site.settings, ...v });
    },
    [site.settings, patchSite]
  );
  const ed = useEditable(initial, save, { successMessage: 'Indexation mise à jour' });
  const robots = useAsync(() => fetch('/robots.txt').then((r) => r.text()), [site.settings.robotsTxtExtra, site.settings.maintenance.enabled]);
  if (!ed.value) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Plan du site (sitemap.xml)" description="Liste les pages publiées et indexables pour Google, avec leur date de mise à jour.">
        <Switch
          checked={ed.value.sitemapAuto}
          disabled={!can()}
          onChange={(sitemapAuto) => ed.patch({ sitemapAuto })}
          label="Générer le sitemap automatiquement"
          description="Mis à jour à chaque publication. Les pages en noindex en sont exclues."
        />
        <div className="flex flex-wrap gap-2">
          <a href={publicUrl(site, '/sitemap.xml')} target="_blank" rel="noreferrer">
            <Button icon={ExternalLink}>Ouvrir le sitemap</Button>
          </a>
          <Button
            icon={Copy}
            onClick={async () => {
              await navigator.clipboard.writeText(publicUrl(site, '/sitemap.xml'));
              toast.success('Adresse copiée — soumettez-la dans Search Console › Sitemaps');
            }}
          >
            Copier l’adresse
          </Button>
        </div>
      </Section>
      <Section title="Fichier robots.txt" description="Indique aux robots les zones à ne pas explorer. L’administration est toujours exclue.">
        <Field label="Règles supplémentaires">
          <Textarea value={ed.value.robotsTxtExtra} onChange={(e) => ed.patch({ robotsTxtExtra: e.target.value })} rows={5} className="font-mono text-xs" placeholder={'Disallow: /prive/\nUser-agent: GPTBot\nDisallow: /'} spellCheck={false} />
        </Field>
        <Field label="Fichier actuellement servi">
          <pre className="max-h-56 overflow-auto rounded-lg bg-navy-950 p-4 font-mono text-xs leading-relaxed text-slate-200 scrollbar-thin">{robots.data || '…'}</pre>
        </Field>
        {site.settings.maintenance.enabled ? <Alert tone="warning">Mode maintenance actif : le robots.txt bloque actuellement toute l’exploration.</Alert> : null}
      </Section>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}

/* ------------------------------------------------------------------ Page */

export default function SeoPage() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(params.get('google') ? 'google' : 'overview');

  useEffect(() => {
    const g = params.get('google');
    if (g === 'connected') toast.success('Compte Google connecté avec succès');
    if (g === 'error') toast.error('La connexion à Google a échoué. Réessayez.');
    if (g) setParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Référencement (SEO)" description="Analyse de chaque contenu, Google Search Console, redirections et réglages d’indexation." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'overview', label: 'Analyse des contenus', icon: Target },
          { value: 'google', label: 'Google Search Console', icon: Globe },
          { value: 'settings', label: 'Réglages globaux', icon: Settings2 },
          { value: 'redirects', label: 'Redirections', icon: Link2 },
          { value: 'indexing', label: 'Sitemap & robots.txt', icon: FileCode2 },
        ]}
      />
      {tab === 'overview' ? <Overview /> : null}
      {tab === 'google' ? <GoogleTab /> : null}
      {tab === 'settings' ? <GlobalSettings /> : null}
      {tab === 'redirects' ? <Redirects /> : null}
      {tab === 'indexing' ? <Indexing /> : null}
    </div>
  );
}
