import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Eye,
  FilePlus2,
  Image as ImageIcon,
  Inbox,
  Mail,
  MousePointerClick,
  Newspaper,
  Radio,
  Users,
  XCircle,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { countryFlag, countryName, fmtDuration, fmtNumber, submissionExcerpt, submissionTitle, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, PageSkeleton, ScoreRing, StatCard } from '../ui/primitives';
import { BarList, Legend, TrendChart } from '../ui/charts';

const SERIES = [
  { key: 'views', label: 'Pages vues', color: '#00a89d' },
  { key: 'sessions', label: 'Visiteurs', color: '#6366f1' },
];

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, error, loading, reload } = useAsync(() => api.dashboard(), []);

  if (loading && !data) return <PageSkeleton />;
  if (error || !data) return <ErrorState message={error || ''} onRetry={reload} />;
  const a = data.analytics;
  const hour = new Date().getHours();

  const health = [
    { ok: data.health.gemini, label: 'Assistant IA (Gemini)', hint: 'Clé API configurée' },
    { ok: data.health.smtp, label: 'Envoi d’e-mails (SMTP)', hint: 'Notifications des formulaires et de la newsletter' },
    { ok: data.health.google, label: 'Google Search Console', hint: data.health.googleOAuthConfigured ? 'Connexion au compte Google' : 'Identifiants OAuth à configurer' },
    { ok: !data.maintenance, label: 'Site en ligne', hint: data.maintenance ? 'Mode maintenance actif' : 'Accessible aux visiteurs' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${hour < 18 ? 'Bonjour' : 'Bonsoir'} ${user?.name?.split(' ')[0] || ''}`.trim()}
        description="Vue d’ensemble de l’activité du site sur les 30 derniers jours."
        actions={
          can('editor') ? (
            <>
              <Link to="/posts">
                <Button icon={Newspaper}>Nouvel article</Button>
              </Link>
              <Link to="/pages">
                <Button variant="primary" icon={FilePlus2}>
                  Nouvelle page
                </Button>
              </Link>
            </>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pages vues" value={fmtNumber(a.pageViews)} icon={Eye} hint="30 derniers jours" />
        <StatCard label="Visiteurs uniques" value={fmtNumber(a.uniqueSessions)} icon={Users} tone="violet" hint={`Rebond ${a.bounceRate} %`} />
        <StatCard label="Temps moyen par page" value={fmtDuration(a.avgTimeOnPageSec)} icon={Clock} tone="sky" />
        <StatCard
          label="Demandes de contact"
          value={fmtNumber(data.counts.submissions)}
          icon={Inbox}
          tone="amber"
          hint={data.counts.unreadSubmissions ? <Badge tone="warning">{data.counts.unreadSubmissions} non lue(s)</Badge> : 'Tout est lu'}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Audience</h2>
              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <Radio className="h-3 w-3 text-emerald-500" /> {a.activeNow} visiteur(s) actif(s) en ce moment
              </p>
            </div>
            <Legend series={SERIES} />
          </div>
          <TrendChart data={a.timeseries} series={SERIES} />
          <div className="mt-2 text-right">
            <Link to="/analytics" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-700 hover:underline">
              Statistiques détaillées <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Santé du site</h2>
          <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <ScoreRing score={data.seoAverage} size={56} />
            <div>
              <p className="text-sm font-medium text-slate-900">Score SEO moyen</p>
              <p className="text-xs text-slate-500">Sur l’ensemble des pages publiées</p>
              <Link to="/seo" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                Optimiser <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <ul className="space-y-3">
            {health.map((h) => (
              <li key={h.label} className="flex items-start gap-3">
                {h.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}
                <div>
                  <p className="text-sm text-slate-800">{h.label}</p>
                  <p className="text-xs text-slate-500">{h.hint}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Pages les plus vues</h2>
          <BarList items={a.topPages.slice(0, 6).map((p) => ({ key: p.path, label: p.path, value: p.views, extra: fmtDuration(p.avgTimeSec) }))} />
        </Card>
        <Card>
          <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Pays des visiteurs</h2>
          <BarList
            items={a.countries.slice(0, 6).map((c) => ({
              key: c.country,
              label: (
                <span className="flex items-center gap-2">
                  <span className="text-base leading-none">{countryFlag(c.country)}</span>
                  {countryName(c.country)}
                </span>
              ),
              value: c.views,
            }))}
          />
        </Card>
        <Card padded={false} className="lg:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Dernières demandes</h2>
            <Link to="/forms" className="text-[13px] font-medium text-brand-700 hover:underline">
              Tout voir
            </Link>
          </div>
          {data.recentSubmissions.length === 0 ? (
            <EmptyState icon={Mail} title="Aucune demande" description="Les messages du formulaire de contact apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recentSubmissions.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link to={`/forms?open=${s.id}`} className="flex items-start gap-3 px-5 py-3 transition hover:bg-slate-50">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: s.read ? 'transparent' : '#00a89d' }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{submissionTitle(s.payload)}</p>
                      <p className="truncate text-xs text-slate-500">{submissionExcerpt(s.payload)}</p>
                    </div>
                    <span className="shrink-0 text-xs text-slate-400">{timeAgo(s.createdAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { to: '/pages', icon: FilePlus2, label: 'Pages', value: `${data.counts.publishedPages} publiées / ${data.counts.pages}` },
          { to: '/posts', icon: Newspaper, label: 'Articles', value: `${data.counts.posts} dont ${data.counts.draftPosts} brouillon(s)` },
          { to: '/newsletter', icon: MousePointerClick, label: 'Abonnés newsletter', value: fmtNumber(data.counts.subscribers) },
          { to: '/media', icon: ImageIcon, label: 'Médias', value: `${data.counts.media} fichier(s)` },
        ].map((q) => (
          <Link key={q.label} to={q.to} className="group">
            <Card className="flex items-center gap-4 transition group-hover:border-slate-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-brand-50 group-hover:text-brand-700">
                <q.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{q.label}</p>
                <p className="truncate text-xs text-slate-500">{q.value}</p>
              </div>
              <ArrowRight className="ml-auto h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
