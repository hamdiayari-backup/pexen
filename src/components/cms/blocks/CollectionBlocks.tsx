import React, { useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, ChevronRight, FileText, Phone, Plus, Quote } from 'lucide-react';
import type {
  BlockStyle,
  CardsData,
  ChecklistData,
  FaqData,
  GalleryData,
  PanelsData,
  ShowcaseData,
  StatsData,
  StepsData,
  TestimonialsData,
} from '../../../../server/cms/blocks';
import { ButtonRow, CountUp, cx, Eyebrow, Icon, Reveal, Section, SectionHeading, useCms, useDark, useGo } from '../kit';

const COLS = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-5',
} as const;

/* ------------------------------------------------------------------ Cartes */

export function CardsBlock({ d, style }: { d: CardsData; style: BlockStyle }) {
  return (
    <Section style={style}>
      <SectionHeading h={d} />
      <CardsGrid d={d} />
    </Section>
  );
}

function CardsGrid({ d }: { d: CardsData }) {
  const go = useGo();
  const dark = useDark();
  const { t } = useCms();
  return (
    <div className={cx('grid grid-cols-1 gap-5', COLS[d.columns] ?? COLS[3])}>
      {d.items.map((it, idx) => {
        const clickable = !!it.link;
        const onClick = clickable ? () => go(it.link) : undefined;
        const Tag = clickable ? 'button' : 'div';

        if (d.style === 'hoverDark') {
          return (
            <Reveal key={it.id} delay={idx * 80}>
              <Tag
                type={clickable ? 'button' : undefined}
                onClick={onClick}
                className="group relative h-full w-full overflow-hidden rounded-[1.5rem] border border-px-border bg-white text-left transition-all duration-500 hover:border-transparent hover:shadow-[0_30px_60px_-30px_rgba(11,21,40,0.35)]"
              >
                {it.image ? (
                  <div className="relative aspect-[16/10] overflow-hidden bg-px-navy">
                    <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-px-navy/55 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-95" />
                  </div>
                ) : null}
                <div className="relative p-7 sm:p-8">
                  <div className="absolute inset-0 translate-y-full bg-px-navy transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0" />
                  <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-px-primary to-px-accent transition-transform duration-500 group-hover:scale-x-100" />
                  <span className="absolute right-7 top-6 select-none text-6xl font-bold text-slate-100 transition-colors group-hover:text-white/5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="relative">
                    {it.icon ? (
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-px-primary/10 text-px-primary-dark transition-colors group-hover:bg-px-primary group-hover:text-px-navy">
                        <Icon name={it.icon} />
                      </div>
                    ) : null}
                    <h3 className={cx('pr-12 text-lg font-semibold text-px-navy transition-colors group-hover:text-white sm:text-xl', it.icon ? 'mt-6' : '')}>{t(it.title)}</h3>
                    {it.text ? (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600 transition-colors group-hover:text-white/75">
                        {d.textPrefix ? <span className="font-semibold text-px-primary-dark group-hover:text-px-primary-light">{t(d.textPrefix)} </span> : null}
                        {t(it.text)}
                      </p>
                    ) : null}
                    {it.linkLabel ? (
                      <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-px-navy transition-colors group-hover:text-px-primary-light">
                        {t(it.linkLabel)}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    ) : null}
                  </div>
                </div>
              </Tag>
            </Reveal>
          );
        }

        if (d.style === 'image') {
          return (
            <Reveal key={it.id} delay={idx * 80}>
              <Tag type={clickable ? 'button' : undefined} onClick={onClick} className="card-pexen group flex h-full w-full flex-col overflow-hidden text-left">
                <div className="relative aspect-16/10 overflow-hidden bg-px-navy">
                  {it.image ? (
                    <img
                      src={it.image}
                      alt={it.title}
                      loading="lazy"
                      className="h-full w-full object-cover opacity-90 transition-transform duration-[900ms] ease-out group-hover:scale-110"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-px-navy/85 via-px-navy/20 to-transparent" />
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 px-aurora mix-blend-soft-light" />
                  <h3 className="absolute bottom-4 left-4 right-4 text-xl font-semibold text-white drop-shadow-sm">{t(it.title)}</h3>
                </div>
                <div className="flex-1 space-y-4 p-6">
                  {it.text ? <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">{t(it.text)}</p> : null}
                  {it.tags.length ? (
                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      {d.tagsLabel ? <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{t(d.tagsLabel)}</div> : null}
                      <div className="flex flex-wrap gap-1.5">
                        {it.tags.map((tag) => (
                          <span key={tag} className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                            {t(tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
                {it.linkLabel ? (
                  <div className="flex items-center justify-between border-t border-slate-100 px-6 pb-6 pt-4 text-xs font-semibold text-px-primary-dark">
                    <span>{t(it.linkLabel)}</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                ) : null}
              </Tag>
            </Reveal>
          );
        }

        if (d.style === 'numbered') {
          return (
            <Reveal key={it.id} delay={idx * 80}>
              <Tag
                type={clickable ? 'button' : undefined}
                onClick={onClick}
                className={cx(
                  'group relative flex h-full w-full flex-col border-r border-px-border bg-white px-5 py-8 text-left last:border-r-0 sm:px-6',
                  clickable && 'transition hover:bg-px-surface/60'
                )}
              >
                <span className="mb-6 font-mono text-xs font-bold tracking-widest text-slate-300">{String(idx + 1).padStart(2, '0')}</span>
                {it.icon ? (
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-px-navy text-white">
                    <Icon name={it.icon} />
                  </div>
                ) : null}
                {it.title ? <h3 className="pr-8 text-lg font-semibold leading-snug text-px-navy">{t(it.title)}</h3> : null}
                {it.text ? <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-500">{t(it.text)}</p> : null}
                {clickable ? (
                  <span className="mt-8 inline-flex h-9 w-9 items-center justify-center rounded-full border border-px-border text-px-navy transition group-hover:border-px-primary group-hover:bg-px-primary group-hover:text-white">
                    <Plus className="h-4 w-4" />
                  </span>
                ) : null}
              </Tag>
            </Reveal>
          );
        }

        if (d.style === 'minimal') {
          return (
            <Reveal key={it.id} delay={idx * 80}>
              <Tag type={clickable ? 'button' : undefined} onClick={onClick} className={cx('group flex h-full w-full flex-col justify-between gap-4 text-left', clickable && 'card-pexen p-6')}>
                <div>
                  {it.icon ? (
                    <div className={cx('mb-4 flex h-10 w-10 items-center justify-center rounded-xl', dark ? 'bg-white/10 text-px-primary-light' : 'bg-px-primary/10 text-px-primary-dark')}>
                      <Icon name={it.icon} />
                    </div>
                  ) : null}
                  <h3 className={cx('text-base font-semibold transition-colors', dark ? 'text-white' : 'text-px-navy group-hover:text-px-primary-dark')}>{t(it.title)}</h3>
                  {it.text ? <p className={cx('mt-2 text-sm leading-relaxed', dark ? 'text-white/70' : 'text-slate-600')}>{t(it.text)}</p> : null}
                </div>
                {it.linkLabel ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-px-navy group-hover:text-px-primary-dark">
                    {t(it.linkLabel)} <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                ) : null}
              </Tag>
            </Reveal>
          );
        }

        return (
          <Reveal key={it.id} delay={idx * 80}>
            <Tag
              type={clickable ? 'button' : undefined}
              onClick={onClick}
              className={cx(
                'group flex h-full w-full flex-col justify-between overflow-hidden text-left transition-all duration-500',
                dark
                  ? 'rounded-[1.25rem] border border-white/10 bg-white/[0.06] backdrop-blur-sm hover:-translate-y-1 hover:border-px-primary/50 hover:bg-white/[0.1] hover:shadow-[0_24px_50px_-28px_rgba(0,159,204,0.45)]'
                  : cx('card-pexen', clickable && 'hover:border-px-primary/60')
              )}
            >
              {it.image ? (
                <div className={cx('relative aspect-[16/10] overflow-hidden', dark ? 'bg-black/40' : 'bg-px-navy')}>
                  <img src={it.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className={cx('absolute inset-0', dark ? 'bg-gradient-to-t from-px-navy/80 via-px-navy/20 to-transparent' : 'bg-gradient-to-t from-white/10 via-transparent to-transparent')} />
                  {it.icon ? (
                    <div
                      className={cx(
                        'absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-sm',
                        dark ? 'border border-white/20 bg-px-navy/50 text-px-primary-light' : 'border border-white/30 bg-white/90 text-px-primary-dark'
                      )}
                    >
                      <Icon name={it.icon} className="h-5 w-5" />
                    </div>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-1 flex-col justify-between space-y-4 p-7">
              <div className="space-y-4">
                {!it.image && it.icon ? (
                  <div
                    className={cx(
                      'flex h-12 w-12 items-center justify-center rounded-xl transition-colors',
                      dark
                        ? 'border border-white/15 bg-px-primary/15 text-px-primary-light group-hover:bg-px-primary group-hover:text-px-navy'
                        : 'border border-slate-200 bg-px-surface text-px-navy group-hover:bg-px-primary/10 group-hover:text-px-primary-dark'
                    )}
                  >
                    <Icon name={it.icon} className="h-6 w-6" />
                  </div>
                ) : null}
                <div>
                  <h3 className={cx('text-lg font-semibold transition-colors', dark ? 'text-white' : 'text-px-navy group-hover:text-px-primary-dark')}>{t(it.title)}</h3>
                  {it.text ? <p className={cx('mt-2 text-xs leading-relaxed sm:text-sm', dark ? 'text-white/65' : 'text-slate-500')}>{t(it.text)}</p> : null}
                </div>
                {it.tags.length ? (
                  <div className="pt-2">
                    {d.tagsLabel ? <div className={cx('mb-1.5 text-[11px] font-semibold uppercase tracking-wider', dark ? 'text-white/40' : 'text-slate-400')}>{t(d.tagsLabel)}</div> : null}
                    <div className="flex flex-wrap gap-1.5">
                      {it.tags.map((tag) => (
                        <span key={tag} className={cx('rounded px-2 py-0.5 font-mono text-[10px]', dark ? 'bg-white/10 text-white/80' : 'bg-slate-100 text-slate-700')}>
                          {t(tag)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              {it.linkLabel ? (
                <div
                  className={cx(
                    'mt-4 flex items-center justify-between border-t pt-6 text-xs font-semibold',
                    dark ? 'border-white/10 text-px-primary-light' : 'border-slate-100 text-px-primary-dark group-hover:text-px-navy'
                  )}
                >
                  <span>{t(it.linkLabel)}</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              ) : null}
              </div>
            </Tag>
          </Reveal>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ Vitrine à onglets */

export function ShowcaseBlock({ d, style }: { d: ShowcaseData; style: BlockStyle }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useGo();
  const { t } = useCms();
  const n = d.items.length;
  const interval = Math.max(d.interval || 6, 2) * 1000;
  useEffect(() => {
    if (paused || n < 2) return;
    const timer = setTimeout(() => setActive((i) => (i + 1) % n), interval);
    return () => clearTimeout(timer);
  }, [active, paused, n, interval]);
  if (!n) return null;
  const item = d.items[Math.min(active, n - 1)];
  return (
    <Section style={style}>
      <SectionHeading h={d} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
        <Reveal className="lg:col-span-5">
          <div className="flex flex-col gap-2">
            {d.items.map((it, idx) => {
              const on = idx === active;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => setActive(idx)}
                  className={cx(
                    'relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-5 py-4 text-left transition-all duration-300',
                    on ? 'border border-px-border bg-white shadow-[0_20px_40px_-25px_rgba(11,21,40,0.35)]' : 'border border-transparent hover:bg-white/70'
                  )}
                >
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors', on ? 'bg-gradient-to-br from-px-primary to-px-accent text-white' : 'border border-px-border bg-white text-slate-500')}>
                    <Icon name={it.icon} />
                  </span>
                  <span className={cx('flex-1 text-sm font-semibold sm:text-base', on ? 'text-px-navy' : 'text-slate-500')}>{t(it.title)}</span>
                  <ArrowRight className={cx('h-4 w-4 transition-all', on ? 'translate-x-0 text-px-primary-dark opacity-100' : '-translate-x-2 opacity-0')} />
                  {on ? (
                    <span
                      key={`${active}-${paused}`}
                      className="px-progress absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-px-primary to-px-accent"
                      style={{ animationDuration: `${interval}ms`, animationPlayState: paused ? 'paused' : 'running' }}
                    />
                  ) : null}
                </button>
              );
            })}
          </div>
        </Reveal>
        <Reveal delay={120} className="lg:col-span-7">
          <div className="relative h-full min-h-[440px] overflow-hidden rounded-[1.75rem] bg-px-navy">
            {d.items.map((it, idx) =>
              it.image ? (
                <img
                  key={it.id}
                  src={it.image}
                  alt={it.title}
                  className={cx('absolute inset-0 h-full w-full object-cover transition-all duration-1000', idx === active ? 'scale-100 opacity-60' : 'scale-110 opacity-0')}
                />
              ) : null
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-px-navy via-px-navy/60 to-px-navy/10" />
            <div key={item.id} className="px-word-in absolute inset-x-0 bottom-0 p-7 text-white sm:p-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-px-primary-light backdrop-blur">
                <Icon name={item.icon} className="h-4 w-4" />
                {String(active + 1).padStart(2, '0')}
              </div>
              <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">{t(item.title)}</h3>
              {item.text ? <p className="mt-3 max-w-xl leading-relaxed text-white/75">{t(item.text)}</p> : null}
              {item.chips.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {item.chips.map((c) => (
                    <span key={c} className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/85">
                      {t(c)}
                    </span>
                  ))}
                </div>
              ) : null}
              {item.buttonLabel && item.link ? (
                <button type="button" onClick={() => go(item.link)} className="group mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-px-navy transition-colors hover:bg-px-primary-light">
                  {t(item.buttonLabel)}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              ) : null}
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ Étapes */

export function StepsBlock({ d, style }: { d: StepsData; style: BlockStyle }) {
  const [active, setActive] = useState(0);
  const { t } = useCms();
  const dark = useDark();
  const n = d.items.length;
  useEffect(() => {
    if (d.style !== 'timeline' || n < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % n), 4500);
    return () => clearInterval(timer);
  }, [d.style, n]);

  return (
    <Section style={style}>
      <SectionHeading h={d} />
      {d.style === 'timeline' ? (
        <div className="relative">
          <div className={cx('absolute left-[12.5%] right-[12.5%] top-7 hidden h-[3px] rounded-full lg:block', dark ? 'bg-white/15' : 'bg-px-border')}>
            <div className="h-full rounded-full bg-gradient-to-r from-px-primary to-px-accent transition-all duration-700 ease-out" style={{ width: `${n > 1 ? (active / (n - 1)) * 100 : 0}%` }} />
          </div>
          <div className={cx('grid grid-cols-1 gap-5 sm:grid-cols-2', n >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
            {d.items.map((step, idx) => {
              const on = idx === active;
              const done = idx <= active;
              return (
                <Reveal key={step.id} delay={idx * 90}>
                  <button type="button" onClick={() => setActive(idx)} onMouseEnter={() => setActive(idx)} className="group flex h-full w-full flex-col text-left">
                    <div
                      className={cx(
                        'relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-500 lg:mx-0 lg:ml-[calc(50%-28px)]',
                        on
                          ? 'scale-110 bg-gradient-to-br from-px-primary to-px-accent text-white shadow-[0_12px_30px_-8px_rgba(0,159,204,0.55)]'
                          : done
                            ? dark
                              ? 'bg-white/15 text-white'
                              : 'bg-px-navy text-white'
                            : dark
                              ? 'border border-white/20 bg-white/5 text-white/50'
                              : 'border border-px-border bg-white text-slate-400'
                      )}
                    >
                      {step.num}
                    </div>
                    <div
                      className={cx(
                        'mt-6 flex-1 rounded-[1.25rem] border p-6 transition-all duration-500',
                        on
                          ? dark
                            ? '-translate-y-1 border-px-primary/60 bg-white/10 shadow-[0_24px_50px_-28px_rgba(0,159,204,0.35)]'
                            : '-translate-y-1 border-px-primary/50 bg-white shadow-[0_24px_50px_-28px_rgba(11,21,40,0.4)]'
                          : dark
                            ? 'border-white/10 bg-white/[0.04]'
                            : 'border-px-border bg-white/60'
                      )}
                    >
                      <h3 className={cx('text-base font-semibold leading-snug', dark ? 'text-white' : 'text-px-navy')}>{t(step.title)}</h3>
                      {step.text ? (
                        <p className={cx('mt-2 text-xs leading-relaxed transition-opacity', dark ? 'text-white/65' : 'text-slate-600', on ? 'opacity-100' : 'opacity-70')}>
                          {t(step.text)}
                        </p>
                      ) : null}
                      {step.deliverable ? (
                        <div className={cx('mt-4 border-t border-dashed pt-4', dark ? 'border-white/15' : 'border-px-border')}>
                          <div className={cx('text-[10px] font-semibold uppercase tracking-wider', dark ? 'text-white/40' : 'text-slate-400')}>{t(d.deliverableLabel)}</div>
                          <div className={cx('mt-1 flex items-start gap-1.5 text-xs font-medium', dark ? 'text-white' : 'text-px-navy')}>
                            <CheckCircle2 className={cx('mt-0.5 h-3.5 w-3.5 shrink-0', dark ? 'text-px-primary-light' : 'text-px-primary-dark')} />
                            {t(step.deliverable)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      ) : d.style === 'list' ? (
        <div className="space-y-6">
          {d.items.map((step, idx) => (
            <Reveal key={step.id} delay={idx * 80}>
              <div className="card-pexen flex flex-col items-start gap-6 border border-px-border bg-white p-6 sm:p-8 md:flex-row">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-px-primary to-px-accent font-mono text-lg font-bold text-white shadow-md">{step.num}</div>
                <div className="flex-1 space-y-2">
                  <h3 className="text-lg font-semibold text-px-navy">{t(step.title)}</h3>
                  {step.text ? <p className="text-sm leading-relaxed text-slate-600">{t(step.text)}</p> : null}
                  {step.deliverable ? (
                    <div className="flex items-center gap-2 border-t border-slate-100 pt-3 text-xs font-semibold text-px-primary-dark">
                      <FileText className="h-4 w-4" />
                      <span>
                        {t(d.deliverableLabel)} : {t(step.deliverable)}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="card-pexen border border-px-border bg-white p-8 sm:p-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {d.items.map((step) => (
              <div key={step.id} className="space-y-2 rounded-xl border border-slate-200/70 bg-px-surface p-4">
                <div className="font-mono text-xs font-bold text-px-primary-dark">Étape {step.num}</div>
                <div className="text-xs font-semibold text-px-navy">{t(step.title)}</div>
                {step.deliverable ? (
                  <div className="text-[11px] text-slate-500">
                    {t(d.deliverableLabel)} : {t(step.deliverable)}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
      {d.buttons.length ? (
        <Reveal className="mt-12">
          <ButtonRow buttons={d.buttons} center />
        </Reveal>
      ) : null}
    </Section>
  );
}

/* ------------------------------------------------------------------ Chiffres */

function parseStatNumber(raw: string): { num: number; decimals: number } | null {
  const cleaned = String(raw).trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  const decimals = cleaned.includes('.') ? cleaned.split('.')[1].length : 0;
  return { num, decimals };
}

function StatValue({
  it,
  countUp,
  size = 'md',
}: {
  it: StatsData['items'][number];
  countUp: boolean;
  size?: 'lg' | 'md';
}) {
  const { t } = useCms();
  const dark = useDark();
  const parsed = parseStatNumber(it.value);
  const valueCls = size === 'lg' ? 'text-5xl sm:text-6xl' : 'text-3xl sm:text-4xl';
  const suffixCls = size === 'lg' ? 'text-lg sm:text-xl' : 'text-sm sm:text-base';
  const number = (
    <span
      className={cx(
        'font-bold leading-none tracking-tight tabular-nums',
        valueCls,
        dark ? 'text-white' : 'bg-gradient-to-r from-px-primary-dark via-px-accent-mid to-px-accent bg-clip-text text-transparent'
      )}
    >
      {countUp && parsed ? (
        <CountUp end={parsed.num} prefix={it.prefix} decimals={parsed.decimals} />
      ) : (
        <>
          {it.prefix}
          {t(it.value)}
        </>
      )}
    </span>
  );
  const suffix = it.suffix ? (
    <span className={cx('font-semibold leading-snug', suffixCls, dark ? 'text-px-primary-light' : 'text-px-primary-dark')}>
      {t(it.suffix.trim())}
    </span>
  ) : null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {number}
      {suffix}
    </div>
  );
}

export function StatsBlock({ d, style }: { d: StatsData; style: BlockStyle }) {
  const dark = useDark();
  const { t } = useCms();
  const items = d.items;
  const featured = d.style === 'cards' && items.length >= 4 ? items[0] : null;
  const rest = featured ? items.slice(1) : items;

  const cardShell = (featuredCard: boolean) =>
    cx(
      'relative h-full overflow-hidden transition-all duration-500',
      featuredCard ? 'p-7 sm:p-9' : 'p-6 sm:p-7',
      dark
        ? 'rounded-[1.5rem] border border-white/10 bg-white/[0.06] hover:border-px-primary/40'
        : 'rounded-[1.5rem] border border-px-border bg-white/90 shadow-sm hover:-translate-y-0.5 hover:shadow-md'
    );

  const footnote = d.footnote ? (
    <Reveal delay={280}>
      <p className={cx('mt-6 max-w-4xl text-[11px] leading-relaxed sm:text-xs', dark ? 'text-white/45' : 'text-slate-500')}>{t(d.footnote)}</p>
    </Reveal>
  ) : null;

  return (
    <Section style={style}>
      <SectionHeading h={d} />
      {d.style === 'strip' ? (
        <Reveal>
          <div
            className={cx(
              'grid grid-cols-2 gap-px overflow-hidden rounded-2xl border md:grid-cols-4',
              dark ? 'border-white/10 bg-white/10' : 'border-px-border bg-px-border'
            )}
          >
            {items.map((it) => (
              <div key={it.id} className={cx('p-5 sm:p-6', dark ? 'bg-px-navy' : 'bg-white')}>
                <StatValue it={it} countUp={d.countUp} />
                <div className={cx('mt-2 text-sm font-medium', dark ? 'text-white/70' : 'text-slate-600')}>{t(it.label)}</div>
                {it.hint ? <div className={cx('mt-1 text-xs', dark ? 'text-white/45' : 'text-slate-400')}>{t(it.hint)}</div> : null}
              </div>
            ))}
          </div>
        </Reveal>
      ) : d.style === 'inline' ? (
        <div className={cx('grid grid-cols-2 gap-8', items.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
          {items.map((it, idx) => (
            <Reveal key={it.id} delay={idx * 80} className="text-center">
              <div className="flex justify-center">
                <StatValue it={it} countUp={d.countUp} />
              </div>
              <div className={cx('mt-2 text-sm font-semibold', dark ? 'text-white/80' : 'text-px-navy')}>{t(it.label)}</div>
              {it.hint ? <div className={cx('mt-1 text-xs', dark ? 'text-white/55' : 'text-slate-500')}>{t(it.hint)}</div> : null}
            </Reveal>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {featured ? (
            <Reveal>
              <div className={cardShell(true)}>
                <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-px-primary/15 blur-3xl" />
                <div className="relative grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div>
                    <StatValue it={featured} countUp={d.countUp} size="lg" />
                    <div className={cx('mt-3 text-base font-semibold sm:text-lg', dark ? 'text-white' : 'text-px-navy')}>{t(featured.label)}</div>
                    {featured.hint ? <div className={cx('mt-1 text-sm', dark ? 'text-white/55' : 'text-slate-500')}>{t(featured.hint)}</div> : null}
                  </div>
                </div>
              </div>
            </Reveal>
          ) : null}
          <div className={cx('grid gap-4', rest.length >= 3 ? 'grid-cols-1 sm:grid-cols-3' : rest.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1')}>
            {rest.map((it, idx) => (
              <Reveal key={it.id} delay={(idx + 1) * 70}>
                <div className={cardShell(false)}>
                  <StatValue it={it} countUp={d.countUp} />
                  <div className={cx('mt-3 text-sm font-semibold', dark ? 'text-white' : 'text-px-navy')}>{t(it.label)}</div>
                  {it.hint ? <div className={cx('mt-1 text-xs', dark ? 'text-white/55' : 'text-slate-500')}>{t(it.hint)}</div> : null}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      )}
      {footnote}
    </Section>
  );
}

/* ------------------------------------------------------------------ Panneaux extensibles */

export function PanelsBlock({ d, style }: { d: PanelsData; style: BlockStyle }) {
  const [active, setActive] = useState(Math.min(1, Math.max(d.items.length - 1, 0)));
  const go = useGo();
  const { t } = useCms();
  return (
    <Section style={style}>
      <SectionHeading h={d} />
      <Reveal>
        <div className="flex flex-col gap-4 lg:h-[520px] lg:flex-row">
          {d.items.map((it, idx) => {
            const on = idx === active;
            return (
              <div
                key={it.id}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setActive(idx)}
                onFocus={() => setActive(idx)}
                onClick={() => go(it.link)}
                onKeyDown={(e) => e.key === 'Enter' && go(it.link)}
                className={cx('group relative h-[340px] cursor-pointer overflow-hidden rounded-[1.75rem] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] lg:h-full', on ? 'lg:flex-[2.4]' : 'lg:flex-1')}
              >
                {it.image ? <img src={it.image} alt={it.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] group-hover:scale-105" /> : null}
                <div className={cx('absolute inset-0 transition-colors duration-700', on ? 'bg-gradient-to-t from-px-navy via-px-navy/50 to-transparent' : 'bg-px-navy/60')} />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                  {it.icon ? (
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-white/20 bg-white/15 backdrop-blur">
                      <Icon name={it.icon} />
                    </div>
                  ) : null}
                  <h3 className="text-2xl font-semibold">{t(it.title)}</h3>
                  {it.text ? <p className="mt-1 text-sm text-white/75">{t(it.text)}</p> : null}
                  {it.bullets.length ? (
                    <div className={cx('grid transition-all duration-700', on ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                      <ul className="space-y-2 overflow-hidden text-sm text-white/80">
                        {it.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2 first:pt-4">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-px-primary-light" />
                            <span className="line-clamp-2">{t(b)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {it.linkLabel ? (
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-px-primary-light">
                      {t(it.linkLabel)} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </Reveal>
    </Section>
  );
}

/* ------------------------------------------------------------------ Galerie */

const ROTATIONS = ['-2deg', '1.5deg', '-1.5deg', '2deg', '-2.5deg', '1deg', '-1deg', '2.5deg'];

export function GalleryBlock({ d, style }: { d: GalleryData; style: BlockStyle }) {
  const { t } = useCms();
  const heading = (
    <div className="mb-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <SectionHeading h={d} className="mb-0" />
      {d.handNote ? <div className="hidden shrink-0 -rotate-2 font-hand text-2xl text-px-accent md:block">{t(d.handNote)}</div> : null}
    </div>
  );
  if (d.style === 'polaroid') {
    return (
      <Section style={{ ...style, width: 'full' }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{heading}</div>
        <Reveal delay={120}>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-28" />
            <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-8 pt-6 [scrollbar-width:thin] sm:gap-8 sm:px-6 lg:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
              {d.items.map((p, i) => (
                <figure key={p.id} className="px-polaroid relative w-60 shrink-0 snap-center rounded-sm sm:w-72" style={{ transform: `rotate(${ROTATIONS[i % ROTATIONS.length]})` }}>
                  <span className="px-tape" aria-hidden="true" />
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                    {p.image ? <img src={p.image} alt={p.caption || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover" /> : null}
                  </div>
                  <figcaption className="py-3 text-center">
                    <span className="block font-hand text-xl leading-tight text-slate-700">{t(p.caption)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Reveal>
        {d.note ? (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="mt-2 text-[11px] text-slate-400">{t(d.note)}</p>
          </div>
        ) : null}
      </Section>
    );
  }
  return (
    <Section style={style}>
      {heading}
      <div className={cx('mt-8', d.style === 'masonry' ? 'columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4' : 'grid grid-cols-2 gap-4 lg:grid-cols-3')}>
        {d.items.map((p, i) => (
          <Reveal key={p.id} delay={(i % 6) * 60}>
            <figure className="group relative overflow-hidden rounded-2xl">
              {p.image ? <img src={p.image} alt={p.caption || ''} loading="lazy" className={cx('w-full object-cover transition-transform duration-700 group-hover:scale-105', d.style === 'grid' && 'aspect-[4/3]')} /> : null}
              {p.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-px-navy/80 to-transparent p-4 pt-10 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">{t(p.caption)}</figcaption>
              ) : null}
            </figure>
          </Reveal>
        ))}
      </div>
      {d.note ? <p className="mt-4 text-[11px] text-slate-400">{t(d.note)}</p> : null}
    </Section>
  );
}

/* ------------------------------------------------------------------ Garanties / listes */

export function ChecklistBlock({ d, style }: { d: ChecklistData; style: BlockStyle }) {
  const { t } = useCms();
  return (
    <Section style={style}>
      <SectionHeading h={d} />
      <div className={cx('grid grid-cols-1 gap-5', d.cards.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {d.cards.map((card, idx) => (
          <Reveal key={card.id} delay={idx * 90}>
            <div className="group relative h-full rounded-[1.5rem] bg-px-border p-[1px] transition-colors duration-500 hover:bg-gradient-to-br hover:from-px-primary hover:to-px-accent">
              <div className="h-full rounded-[calc(1.5rem-1px)] bg-white p-7">
                <div className="mb-6 flex items-center gap-3">
                  {card.icon ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-px-border bg-px-surface text-px-primary-dark transition-all group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-px-primary group-hover:to-px-accent group-hover:text-white">
                      <Icon name={card.icon} />
                    </span>
                  ) : null}
                  <div>
                    {card.tag ? <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{t(card.tag)}</span> : null}
                    {card.title ? <span className="block text-base font-semibold text-px-navy">{t(card.title)}</span> : null}
                  </div>
                </div>
                <ul className="space-y-4">
                  {card.entries.map((e) => (
                    <li key={e.id} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-px-primary-dark" />
                      <div>
                        <div className="text-sm font-semibold text-px-navy">{t(e.title)}</div>
                        {e.text ? <div className="text-xs text-slate-500">{t(e.text)}</div> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ FAQ */

export function FaqBlock({ d, style }: { d: FaqData; style: BlockStyle }) {
  const [open, setOpen] = useState<number | null>(0);
  const { t, tokens } = useCms();
  const dark = useDark();
  const list = (
    <div className="space-y-3">
      {d.items.map((faq, index) => {
        const isOpen = open === index;
        return (
          <Reveal key={faq.id} delay={index * 60}>
            <div
              className={cx(
                'rounded-[1.25rem] border transition-all duration-300',
                dark
                  ? isOpen
                    ? 'border-px-primary/50 bg-white/10 shadow-[0_20px_40px_-30px_rgba(0,159,204,0.35)]'
                    : 'border-white/10 bg-white/[0.05]'
                  : isOpen
                    ? 'border-px-primary/50 bg-white shadow-[0_20px_40px_-30px_rgba(11,21,40,0.35)]'
                    : 'border-px-border bg-white'
              )}
            >
              <button type="button" onClick={() => setOpen(isOpen ? null : index)} className="flex w-full items-center justify-between gap-4 p-5 text-left sm:p-6" aria-expanded={isOpen}>
                <span
                  className={cx(
                    'text-sm font-semibold transition-colors sm:text-base',
                    dark ? (isOpen ? 'text-px-primary-light' : 'text-white') : isOpen ? 'text-px-primary-dark' : 'text-px-navy'
                  )}
                >
                  {t(faq.question)}
                </span>
                <span
                  className={cx(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300',
                    isOpen
                      ? 'rotate-45 bg-px-primary text-px-navy'
                      : dark
                        ? 'border border-white/20 bg-white/5 text-white/60'
                        : 'border border-px-border bg-px-surface text-slate-500'
                  )}
                >
                  <Plus className="h-4 w-4" />
                </span>
              </button>
              <div className={cx('grid transition-all duration-500', isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                <div className="overflow-hidden">
                  <div
                    className={cx('cms-prose px-5 pb-6 text-sm leading-relaxed sm:px-6', dark ? 'cms-prose-dark text-white/70' : 'text-slate-600')}
                    dangerouslySetInnerHTML={{ __html: t(faq.answer) }}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
  if (d.layout === 'stacked') {
    return (
      <Section style={style}>
        <SectionHeading h={{ ...d, align: 'center' }} />
        <div className="mx-auto max-w-3xl">{list}</div>
      </Section>
    );
  }
  return (
    <Section style={style}>
      <div className="pointer-events-none absolute -left-16 bottom-0 select-none bg-gradient-to-b from-px-primary/12 to-px-accent/0 bg-clip-text text-[22rem] font-bold leading-[0.8] text-transparent sm:text-[28rem]" aria-hidden="true">
        ?
      </div>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <Reveal className="space-y-4 self-start lg:sticky lg:top-28 lg:col-span-4">
          {d.eyebrow ? <Eyebrow>{t(d.eyebrow)}</Eyebrow> : null}
          {d.title ? <h2 className={cx('text-3xl font-semibold leading-tight tracking-tight sm:text-[2.4rem]', dark ? 'text-white' : 'text-px-navy')}>{t(d.title)}</h2> : null}
          {d.intro ? <p className={cx('text-sm', dark ? 'text-white/70' : 'text-slate-600')}>{t(d.intro)}</p> : null}
          {d.showContactCard ? (
            <a href={`tel:${tokens.phoneClean}`} className="mt-2 inline-flex items-center gap-3 rounded-2xl border border-px-border bg-white p-3 pr-5 transition-colors hover:border-px-primary">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-px-primary to-px-accent text-white">
                <Phone className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-[11px] text-slate-500">{t(d.contactLabel) || 'Une autre question ?'}</span>
                <span className="px-phone block text-sm font-semibold text-px-navy">{tokens.phone}</span>
              </span>
            </a>
          ) : null}
        </Reveal>
        <div className="lg:col-span-8">{list}</div>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ Témoignages */

export function TestimonialsBlock({ d, style }: { d: TestimonialsData; style: BlockStyle }) {
  const { t } = useCms();
  const dark = useDark();
  return (
    <Section style={style}>
      <SectionHeading h={d} />
      <div className={cx('grid grid-cols-1 gap-5', d.items.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {d.items.map((it, idx) => (
          <Reveal key={it.id} delay={idx * 80}>
            <figure className={cx('flex h-full flex-col justify-between rounded-[1.5rem] border p-7', dark ? 'border-white/10 bg-white/5' : 'border-px-border bg-white')}>
              <div>
                <Quote className="h-7 w-7 text-px-primary" />
                <blockquote className={cx('mt-4 text-[15px] leading-relaxed', dark ? 'text-white/85' : 'text-slate-700')}>{t(it.quote)}</blockquote>
              </div>
              <figcaption className="mt-6 flex items-center gap-3">
                {it.image ? <img src={it.image} alt={it.author} className="h-11 w-11 rounded-full object-cover" /> : null}
                <div>
                  <div className={cx('text-sm font-semibold', dark ? 'text-white' : 'text-px-navy')}>{t(it.author)}</div>
                  {it.role ? <div className={cx('text-xs', dark ? 'text-white/55' : 'text-slate-500')}>{t(it.role)}</div> : null}
                </div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

export { ArrowUpRight };
