import fs from 'fs/promises';
import crypto from 'crypto';
import { createReadStream } from 'fs';
import readline from 'readline';
import { sql } from 'drizzle-orm';
import type { AnalyticsEvent, AnalyticsSummary } from './types';
import { db, type Tx } from '../db/client';
import { analyticsEvents } from '../db/schema';

export type { AnalyticsSummary } from './types';

const RETENTION_DAYS = 400;
const MAX_DURATION_SEC = 1800;

const toRow = (e: AnalyticsEvent): typeof analyticsEvents.$inferInsert => ({
  id: /^[0-9a-f-]{36}$/i.test(e.id) ? e.id : crypto.randomUUID(),
  kind: e.kind ?? (e.durationSec ? 'leave' : 'view'),
  sessionId: e.sessionId,
  path: e.path,
  referrer: e.referrer ?? null,
  country: e.country ?? null,
  city: e.city ?? null,
  device: e.device ?? 'unknown',
  durationSec: typeof e.durationSec === 'number' ? Math.round(e.durationSec) : null,
  ts: new Date(e.ts),
});

export async function appendAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    await db.insert(analyticsEvents).values(toRow(event)).onConflictDoNothing();
  } catch (e) {
    console.error('[analytics] écriture impossible', e);
  }
}

export async function pruneAnalytics(): Promise<number> {
  const res = await db.execute(sql`delete from analytics_events where ts < now() - make_interval(days => ${RETENTION_DAYS})`);
  return res.rowCount ?? 0;
}

/** Import unique de l'ancien journal JSONL (et des événements hérités du snapshot). */
export async function importLegacyAnalytics(tx: Tx, file: string, legacy?: AnalyticsEvent[]): Promise<void> {
  const rows: (typeof analyticsEvents.$inferInsert)[] = (legacy ?? []).map(toRow);
  try {
    const rl = readline.createInterface({ input: createReadStream(file, 'utf-8'), crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      try {
        rows.push(toRow(JSON.parse(line) as AnalyticsEvent));
      } catch {
        /* ligne corrompue ignorée */
      }
    }
  } catch {
    /* pas d'ancien journal */
  }
  for (let i = 0; i < rows.length; i += 1000) {
    await tx.insert(analyticsEvents).values(rows.slice(i, i + 1000)).onConflictDoNothing();
  }
  if (rows.length) {
    await fs.rename(file, `${file}.imported`).catch(() => undefined);
  }
}

function referrerSource(ref?: string | null): string {
  if (!ref) return 'Accès direct';
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (/google\./.test(host)) return 'Google';
    if (/bing\./.test(host)) return 'Bing';
    if (/linkedin\./.test(host)) return 'LinkedIn';
    if (/facebook\.|fb\./.test(host)) return 'Facebook';
    return host;
  } catch {
    return 'Autre';
  }
}

const n = (v: unknown) => Number(v ?? 0);

/** Agrégats calculés par PostgreSQL : le volume d'événements n'est jamais chargé en mémoire. */
export async function summarizeAnalytics(days: number, ownHost?: string): Promise<AnalyticsSummary> {
  const since = new Date(Date.now() - days * 86400000);
  const views = sql`kind = 'view' and ts >= ${since}`;

  const [totals, timeseries, topPages, countries, devices, referrers, recent] = await Promise.all([
    db.execute(sql`
      with s as (
        select session_id, count(*) as n from analytics_events where ${views} group by session_id
      )
      select
        (select count(*) from analytics_events where ${views}) as page_views,
        (select count(*) from s) as sessions,
        (select count(*) from s where n = 1) as bounced,
        (select avg(least(duration_sec, ${MAX_DURATION_SEC})) from analytics_events
           where kind = 'leave' and duration_sec is not null and ts >= ${since}) as avg_time,
        (select count(distinct session_id) from analytics_events where ts >= now() - interval '5 minutes') as active_now
    `),
    db.execute(sql`
      select to_char(ts at time zone 'UTC', 'YYYY-MM-DD') as day, count(*) as views, count(distinct session_id) as sessions
      from analytics_events where ${views} group by 1
    `),
    db.execute(sql`
      with v as (
        select path, count(*) as views from analytics_events where ${views} group by path order by views desc limit 15
      ),
      t as (
        select path, avg(least(duration_sec, ${MAX_DURATION_SEC})) as avg_time from analytics_events
        where kind = 'leave' and duration_sec is not null and ts >= ${since} group by path
      )
      select v.path, v.views, coalesce(t.avg_time, 0) as avg_time from v left join t using (path) order by v.views desc
    `),
    db.execute(sql`
      select coalesce(country, '??') as country, count(*) as views from analytics_events
      where ${views} group by 1 order by views desc
    `),
    db.execute(sql`
      select device, count(*) as views from analytics_events where ${views} group by 1 order by views desc
    `),
    db.execute(sql`
      select referrer, count(*) as views from analytics_events
      where ${views} ${ownHost ? sql`and (referrer is null or position(${ownHost} in referrer) = 0)` : sql``}
      group by referrer
    `),
    db.select().from(analyticsEvents).orderBy(sql`ts desc`).limit(50),
  ]);

  const tot = totals.rows[0] as Record<string, unknown>;
  const sessions = n(tot.sessions);

  const byDay = new Map(timeseries.rows.map((r) => [String(r.day), r]));
  const series: AnalyticsSummary['timeseries'] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const row = byDay.get(date);
    series.push({ date, views: n(row?.views), sessions: n(row?.sessions) });
  }

  const sources = new Map<string, number>();
  for (const r of referrers.rows) {
    const key = referrerSource(r.referrer as string | null);
    sources.set(key, (sources.get(key) || 0) + n(r.views));
  }

  return {
    days,
    pageViews: n(tot.page_views),
    uniqueSessions: sessions,
    avgTimeOnPageSec: Math.round(n(tot.avg_time)),
    bounceRate: sessions ? Math.round((n(tot.bounced) / sessions) * 100) : 0,
    activeNow: n(tot.active_now),
    timeseries: series,
    topPages: topPages.rows.map((r) => ({ path: String(r.path), views: n(r.views), avgTimeSec: Math.round(n(r.avg_time)) })),
    countries: countries.rows.map((r) => ({ country: String(r.country), views: n(r.views) })),
    devices: devices.rows.map((r) => ({ device: String(r.device), views: n(r.views) })),
    referrers: [...sources.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([source, views]) => ({ source, views })),
    recent: recent.map((r) => ({
      id: r.id,
      kind: r.kind,
      sessionId: r.sessionId,
      path: r.path,
      ...(r.referrer ? { referrer: r.referrer } : {}),
      ...(r.country ? { country: r.country } : {}),
      ...(r.city ? { city: r.city } : {}),
      device: r.device,
      ...(r.durationSec != null ? { durationSec: r.durationSec } : {}),
      ts: r.ts.toISOString(),
    })),
  };
}
