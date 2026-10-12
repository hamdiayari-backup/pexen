import React from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmtNumber } from '../lib/format';
import { cx } from './primitives';

const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });

export interface TrendSeries {
  key: string;
  label: string;
  color: string;
}

export function TrendChart({ data, series, height = 260 }: { data: Record<string, number | string>[]; series: TrendSeries[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid stroke="#eef2f6" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d: string) => shortDate.format(new Date(d))}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={48} />
        <Tooltip
          cursor={{ stroke: '#cbd5e1', strokeDasharray: 4 }}
          content={({ active, payload, label }) =>
            active && payload?.length ? (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                <p className="mb-1 font-medium text-slate-900">{new Date(String(label)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                {payload.map((p) => (
                  <p key={String(p.dataKey)} className="flex items-center gap-2 text-slate-600">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                    {series.find((s) => s.key === p.dataKey)?.label} : <span className="font-medium text-slate-900">{fmtNumber(Number(p.value))}</span>
                  </p>
                ))}
              </div>
            ) : null
          }
        />
        {series.map((s) => (
          <Area key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={2} fill={`url(#grad-${s.key})`} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Liste avec barres proportionnelles (pays, pages, sources). */
export function BarList({
  items,
  valueLabel,
  emptyLabel = 'Pas encore de données',
}: {
  items: { key: string; label: React.ReactNode; value: number; extra?: React.ReactNode }[];
  valueLabel?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-400">{emptyLabel}</p>;
  return (
    <div className="space-y-1.5">
      {valueLabel ? (
        <div className="flex justify-end pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">{valueLabel}</div>
      ) : null}
      {items.map((i) => (
        <div key={i.key} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-1.5 text-sm">
          <div className="absolute inset-y-0 left-0 rounded-md bg-brand-50" style={{ width: `${(i.value / max) * 100}%` }} />
          <span className="relative min-w-0 truncate text-slate-700">{i.label}</span>
          <span className="relative flex shrink-0 items-center gap-3 tabular-nums">
            {i.extra ? <span className="text-xs text-slate-400">{i.extra}</span> : null}
            <span className="font-medium text-slate-900">{fmtNumber(i.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ series, className }: { series: TrendSeries[]; className?: string }) {
  return (
    <div className={cx('flex items-center gap-4 text-xs text-slate-500', className)}>
      {series.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
