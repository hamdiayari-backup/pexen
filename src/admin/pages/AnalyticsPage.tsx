import React, { useState } from 'react';
import { Clock, Download, Eye, Monitor, Radio, Smartphone, Tablet, TrendingDown, Users } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync } from '../lib/hooks';
import { countryFlag, countryName, downloadCsv, fmtDateTime, fmtDuration, fmtNumber } from '../lib/format';
import { Badge, Button, Card, EmptyState, ErrorState, PageHeader, PageSkeleton, Segmented, StatCard, Table, Td, Th } from '../ui/primitives';
import { BarList, Legend, TrendChart } from '../ui/charts';

const SERIES = [
  { key: 'views', label: 'Pages vues', color: '#00a89d' },
  { key: 'sessions', label: 'Visiteurs', color: '#6366f1' },
];
const DEVICE: Record<string, { label: string; icon: React.ElementType }> = {
  desktop: { label: 'Ordinateur', icon: Monitor },
  mobile: { label: 'Mobile', icon: Smartphone },
  tablet: { label: 'Tablette', icon: Tablet },
  unknown: { label: 'Inconnu', icon: Monitor },
};

export default function AnalyticsPage() {
  const [days, setDays] = useState('30');
  const { data: a, error, loading, reload } = useAsync(() => api.analytics(Number(days)), [days]);

  const exportCsv = () => {
    if (!a) return;
    downloadCsv(`statistiques-${days}j.csv`, [
      ['Page', 'Vues', 'Temps moyen (s)'],
      ...a.topPages.map((p) => [p.path, p.views, p.avgTimeSec]),
      [],
      ['Pays', 'Vues'],
      ...a.countries.map((c) => [countryName(c.country), c.views]),
      [],
      ['Source', 'Vues'],
      ...a.referrers.map((r) => [r.source, r.views]),
    ]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistiques"
        description="Mesure d’audience interne, sans cookie tiers. Les visites de l’administration et des robots sont exclues."
        actions={
          <>
            <Segmented
              value={days}
              onChange={setDays}
              options={[
                { value: '7', label: '7 jours' },
                { value: '30', label: '30 jours' },
                { value: '90', label: '90 jours' },
                { value: '365', label: '12 mois' },
              ]}
            />
            <Button icon={Download} onClick={exportCsv} disabled={!a}>
              Exporter
            </Button>
          </>
        }
      />

      {loading && !a ? (
        <PageSkeleton />
      ) : error || !a ? (
        <ErrorState message={error || ''} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard label="Pages vues" value={fmtNumber(a.pageViews)} icon={Eye} />
            <StatCard label="Visiteurs uniques" value={fmtNumber(a.uniqueSessions)} icon={Users} tone="violet" />
            <StatCard label="Temps moyen par page" value={fmtDuration(a.avgTimeOnPageSec)} icon={Clock} tone="sky" />
            <StatCard label="Taux de rebond" value={`${a.bounceRate} %`} icon={TrendingDown} tone="amber" hint="Visites d’une seule page" />
            <StatCard label="En ce moment" value={fmtNumber(a.activeNow)} icon={Radio} tone="rose" hint="Actifs ces 5 dernières minutes" />
          </div>

          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-slate-900">Évolution du trafic</h2>
              <Legend series={SERIES} />
            </div>
            <TrendChart data={a.timeseries} series={SERIES} height={300} />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Pages les plus consultées</h2>
              <BarList valueLabel="Temps moyen · Vues" items={a.topPages.slice(0, 12).map((p) => ({ key: p.path, label: p.path, value: p.views, extra: fmtDuration(p.avgTimeSec) }))} />
            </Card>
            <Card>
              <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Pays</h2>
              <BarList
                valueLabel="Vues"
                items={a.countries.slice(0, 12).map((c) => ({
                  key: c.country,
                  label: (
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{countryFlag(c.country)}</span>
                      {countryName(c.country)}
                    </span>
                  ),
                  value: c.views,
                  extra: a.pageViews ? `${Math.round((c.views / a.pageViews) * 100)} %` : undefined,
                }))}
              />
            </Card>
            <Card>
              <h2 className="mb-3 text-[15px] font-semibold text-slate-900">Sources de trafic</h2>
              <BarList valueLabel="Vues" items={a.referrers.slice(0, 10).map((r) => ({ key: r.source, label: r.source, value: r.views }))} />
            </Card>
            <Card>
              <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Appareils</h2>
              {a.devices.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Pas encore de données</p>
              ) : (
                <div className="space-y-4">
                  {a.devices.map((d) => {
                    const meta = DEVICE[d.device] || DEVICE.unknown;
                    const pct = a.pageViews ? Math.round((d.views / a.pageViews) * 100) : 0;
                    return (
                      <div key={d.device}>
                        <div className="mb-1.5 flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 text-slate-700">
                            <meta.icon className="h-4 w-4 text-slate-400" /> {meta.label}
                          </span>
                          <span className="tabular-nums text-slate-900">
                            <span className="font-medium">{pct} %</span> <span className="text-xs text-slate-400">({fmtNumber(d.views)})</span>
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <Card padded={false}>
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-[15px] font-semibold text-slate-900">Activité récente</h2>
              <p className="text-xs text-slate-500">Dernières pages consultées, avec le temps passé lorsque le visiteur a quitté la page.</p>
            </div>
            {a.recent.length === 0 ? (
              <EmptyState icon={Eye} title="Aucune visite enregistrée" description="Les visites apparaîtront ici dès que le site recevra du trafic." />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Page</Th>
                    <Th>Événement</Th>
                    <Th>Localisation</Th>
                    <Th>Appareil</Th>
                    <Th>Provenance</Th>
                  </tr>
                </thead>
                <tbody>
                  {a.recent.slice(0, 50).map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(e.ts)}</Td>
                      <Td className="max-w-[260px] truncate font-medium text-slate-800">{e.path}</Td>
                      <Td>
                        {e.kind === 'leave' ? <Badge tone="info">Sortie · {fmtDuration(e.durationSec || 0)}</Badge> : <Badge tone="brand">Vue</Badge>}
                      </Td>
                      <Td className="whitespace-nowrap">
                        {e.country ? (
                          <span className="flex items-center gap-2">
                            {countryFlag(e.country)} {countryName(e.country)}
                            {e.city ? <span className="text-slate-400">· {e.city}</span> : null}
                          </span>
                        ) : (
                          <span className="text-slate-400">Inconnue</span>
                        )}
                      </Td>
                      <Td>{(DEVICE[e.device] || DEVICE.unknown).label}</Td>
                      <Td className="max-w-[200px] truncate text-slate-500">{e.referrer ? safeHost(e.referrer) : 'Accès direct'}</Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function safeHost(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
