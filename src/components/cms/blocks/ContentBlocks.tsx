import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import type {
  BlockStyle,
  DetailsData,
  HtmlData,
  ImageData,
  RichTextData,
  SlidesData,
  SpacerData,
  TableData,
  TextMediaData,
  VideoData,
} from '../../../../server/cms/blocks';
import { ButtonRow, CmsButton, cx, Eyebrow, Highlighted, Placeholder, Reveal, RichHtml, Section, SectionHeading, useCms, useDark, useGo, VideoPlayer } from '../kit';

export function RichTextBlock({ d, style }: { d: RichTextData; style: BlockStyle }) {
  return (
    <Section style={style}>
      <Reveal>
        <RichHtml html={d.html} className={cx(d.size === 'large' && 'cms-prose-large')} />
      </Reveal>
    </Section>
  );
}

const RATIO = { landscape: 'aspect-[4/3]', square: 'aspect-square', portrait: 'aspect-[4/5]' } as const;

export function TextMediaBlock({ d, style }: { d: TextMediaData; style: BlockStyle }) {
  const dark = useDark();
  return (
    <Section style={style}>
      <TextMediaInner d={d} />
    </Section>
  );
}

function TextMediaInner({ d }: { d: TextMediaData }) {
  const dark = useDark();
  const { t } = useCms();

  if (d.mediaStyle === 'logoMask' && d.image) {
    const clipId = `pexen-logo-clip-${d.title?.slice(0, 8) || 'm'}`;
    return (
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal className="relative mx-auto w-full max-w-xl">
          <svg viewBox="0 0 1340 420" className="h-auto w-full drop-shadow-xl" role="img" aria-label={d.imageAlt || ''}>
            <defs>
              <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                <path d="M473.13 236.7C388.33 283.9 298.73 329.6 204.13 353.5C161.83 364.2 110.83 372.2 70.23 351.5C16.63 324.1 26.33 273.2 60.63 234.6C108.73 180.5 185.33 152.5 256.13 146.4C413.23 132.8 537.33 245.9 664.13 319.7C706.63 344.5 751.03 366.5 798.13 381.1C927.13 421.3 1072.23 405.1 1186.13 330.7C1208.13 316.3 1228.93 298.9 1245.73 278.6C1257.33 264.7 1267.03 249.3 1273.83 232.6C1323.03 110.9 1177.23 29 1079.13 7.7C919.23 -27.1 759.03 64.1 635.13 156C652.63 150.9 678.83 134.8 697.13 126C718.03 116 739.53 107.1 761.13 98.8C848.03 65.2 940.33 60.8 1029.13 89.7C1088.83 109.1 1147.43 140.1 1194.33 182.1C1212.73 198.5 1235.83 221.2 1237.43 247.5C1238.93 271.5 1219.73 289.7 1202.23 303C1162.03 333.5 1111.53 351 1062.13 359.1C896.53 386.1 761.13 267.9 629.13 188.5C510.33 117 389.83 78.9 251.13 106.2C201.53 116 152.63 134.3 109.23 160.3C58.53 190.8 -6.27 244.4 0.73 310.5C2.93 331.8 13.83 351.5 29.13 366.3C40.03 377 53.23 384.8 67.13 391C84.63 398.8 104.13 402.6 123.13 403.8C220.93 410.2 311.03 356.1 388.13 302.2C415.53 283 450.23 260.3 473.13 236.7Z" />
              </clipPath>
            </defs>
            <image href={d.image} x="0" y="-40" width="1340" height="500" preserveAspectRatio="xMidYMid slice" clipPath={`url(#${clipId})`} />
          </svg>
          <div className="absolute bottom-0 right-4 rounded-2xl bg-px-navy px-4 py-3 text-white shadow-xl sm:right-8">
            <strong className="block text-2xl font-bold leading-none">30+</strong>
            <span className="text-xs text-white/75">Fiches CEE</span>
          </div>
        </Reveal>
        <Reveal delay={80} className="space-y-5">
          {d.eyebrow ? <Eyebrow>{t(d.eyebrow)}</Eyebrow> : null}
          {d.title ? (
            <h2 className="text-3xl font-semibold leading-tight tracking-tight text-px-navy sm:text-[2.4rem]">
              <Highlighted title={d.title} highlight={d.highlight} />
            </h2>
          ) : null}
          {d.html ? <RichHtml html={d.html} /> : null}
          {d.bullets.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {d.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold text-px-navy">
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white', i % 2 ? 'bg-px-accent' : 'bg-px-navy')}>
                    <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  {t(b)}
                </li>
              ))}
            </ul>
          ) : null}
          <ButtonRow buttons={d.buttons} />
        </Reveal>
      </div>
    );
  }

  if (d.mediaStyle === 'diagonal' && d.image) {
    const pool = [
      d.image,
      d.poster,
      '/images/centrale-froid.webp',
      '/images/cee-tertiaire.webp',
      '/images/pompes-a-chaleur-toiture.webp',
      '/images/installation-technique.webp',
    ].filter(Boolean) as string[];
    const tiles = [...new Set(pool)].slice(0, 4);
    while (tiles.length < 4) tiles.push(d.image);
    return (
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="ultra-diagonal-grid mx-auto max-w-md">
            {tiles.map((src, i) => (
              <div
                key={i}
                className={cx(
                  'overflow-hidden rounded-[1.75rem] bg-px-surface shadow-lg ring-1 ring-black/5',
                  i % 2 === 0 ? 'aspect-[4/5]' : 'aspect-[3/4]'
                )}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={100} className="space-y-5">
          {d.eyebrow ? <Eyebrow>{t(d.eyebrow)}</Eyebrow> : null}
          {d.title ? (
            <h2 className="text-3xl font-semibold leading-tight text-px-navy">
              <Highlighted title={d.title} highlight={d.highlight} />
            </h2>
          ) : null}
          {d.html ? <RichHtml html={d.html} /> : null}
          {d.bullets.length ? (
            <ul className="space-y-3">
              {d.bullets.map((b, i) => {
                const m = b.match(/^(.+?)\s*[—–-]\s*(\d+)\s*%$/);
                if (m) {
                  return (
                    <li key={i}>
                      <div className="mb-1 flex justify-between text-sm font-semibold text-px-navy">
                        <span>{t(m[1])}</span>
                        <span>{m[2]}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-px-navy" style={{ width: `${m[2]}%` }} />
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={i} className="text-sm text-slate-600">
                    {t(b)}
                  </li>
                );
              })}
            </ul>
          ) : null}
          <ButtonRow buttons={d.buttons} />
        </Reveal>
      </div>
    );
  }

  const media = (
    <div className={cx('relative', d.mediaStyle === 'polaroid' && 'mx-auto max-w-md rotate-[-1.5deg]')}>
      <div
        className={cx(
          'relative overflow-hidden',
          RATIO[d.ratio],
          d.mediaStyle === 'rounded' && 'rounded-[1.75rem] shadow-[0_40px_80px_-40px_rgba(11,21,40,0.45)]',
          d.mediaStyle === 'framed' && 'rounded-[1.75rem] border-8 border-white shadow-2xl',
          d.mediaStyle === 'polaroid' && 'px-polaroid rounded-sm'
        )}
      >
        {d.mediaStyle === 'polaroid' ? <span className="px-tape" aria-hidden="true" /> : null}
        {d.mediaType === 'video' ? (
          <VideoPlayer source={d.videoSource} url={d.video} poster={d.poster} autoplay={d.autoplay} title={d.title} className="absolute inset-0" />
        ) : d.image ? (
          <img src={d.image} alt={d.imageAlt || ''} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <Placeholder label="Image à choisir" className="absolute inset-0" />
        )}
      </div>
      {d.caption ? (
        <p className={cx('mt-3 text-center', d.mediaStyle === 'polaroid' ? 'font-hand text-xl text-slate-700' : 'text-sm text-slate-500')}>{t(d.caption)}</p>
      ) : null}
    </div>
  );
  return (
    <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cx(d.mediaPosition === 'left' ? 'lg:order-2' : '', 'space-y-5')}>
        {d.eyebrow ? <Eyebrow>{t(d.eyebrow)}</Eyebrow> : null}
        {d.title ? (
          <h2 className={cx('text-3xl font-semibold leading-tight tracking-tight sm:text-[2.4rem]', dark ? 'text-white' : 'text-px-navy')}>
            <Highlighted title={d.title} highlight={d.highlight} />
          </h2>
        ) : null}
        {d.intro ? <p className={cx('text-lg', dark ? 'text-white/75' : 'text-slate-600')}>{t(d.intro)}</p> : null}
        {d.html ? <RichHtml html={d.html} /> : null}
        {d.bullets.length ? (
          <ul className="space-y-2.5">
            {d.bullets.map((b, i) => (
              <li key={i} className={cx('flex items-start gap-2.5 text-sm', dark ? 'text-white/80' : 'text-slate-700')}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-px-primary-dark" />
                <span>{t(b)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <ButtonRow buttons={d.buttons} className="pt-2" />
      </Reveal>
      <Reveal delay={120} className={d.mediaPosition === 'left' ? 'lg:order-1' : ''}>
        {media}
      </Reveal>
    </div>
  );
}

const WIDTHS = { normal: 'max-w-4xl mx-auto', wide: 'max-w-6xl mx-auto', full: '' } as const;

export function ImageBlock({ d, style }: { d: ImageData; style: BlockStyle }) {
  const { t } = useCms();
  return (
    <Section style={d.width === 'full' ? { ...style, width: 'full' } : style}>
      <Reveal className={WIDTHS[d.width]}>
        <figure>
          {d.url ? (
            <img src={d.url} alt={d.alt} loading="lazy" className={cx('w-full object-cover', d.rounded && d.width !== 'full' && 'rounded-3xl shadow-xl')} />
          ) : (
            <Placeholder label="Image à choisir" className="aspect-video rounded-3xl" />
          )}
          {d.caption ? <figcaption className="mt-3 text-center text-sm text-slate-500">{t(d.caption)}</figcaption> : null}
        </figure>
      </Reveal>
    </Section>
  );
}

export function VideoBlock({ d, style }: { d: VideoData; style: BlockStyle }) {
  const { t } = useCms();
  return (
    <Section style={d.width === 'full' ? { ...style, width: 'full' } : style}>
      <Reveal className={WIDTHS[d.width]}>
        <div className={cx('relative aspect-video overflow-hidden bg-px-navy', d.width !== 'full' && 'rounded-3xl shadow-xl')}>
          <VideoPlayer source={d.source} url={d.url} poster={d.poster} autoplay={d.autoplay} title={d.title} className="absolute inset-0" />
        </div>
        {d.title ? <p className="mt-3 text-center text-sm text-slate-500">{t(d.title)}</p> : null}
      </Reveal>
    </Section>
  );
}

const SLIDE_H = { md: 'h-[320px] sm:h-[420px]', lg: 'h-[380px] sm:h-[520px]', xl: 'h-[440px] sm:h-[640px]' } as const;

export function SlidesBlock({ d, style }: { d: SlidesData; style: BlockStyle }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const go = useGo();
  const { t } = useCms();
  const n = d.slides.length;
  useEffect(() => {
    if (!d.autoplay || paused || n < 2) return;
    const timer = setTimeout(() => setI((x) => (x + 1) % n), Math.max(d.interval, 2) * 1000);
    return () => clearTimeout(timer);
  }, [i, d.autoplay, d.interval, paused, n]);
  if (!n) return null;
  return (
    <Section style={style}>
      <Reveal>
        <div className={cx('relative overflow-hidden rounded-[1.75rem] bg-px-navy', SLIDE_H[d.height])} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          {d.slides.map((s, idx) => (
            <div key={s.id} className={cx('absolute inset-0 transition-all duration-1000', idx === i ? 'opacity-100' : 'pointer-events-none opacity-0')} aria-hidden={idx !== i}>
              {s.image ? <img src={s.image} alt={s.alt || s.title || ''} className={cx('h-full w-full object-cover transition-transform duration-[6000ms]', idx === i ? 'scale-105' : 'scale-100')} /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-px-navy via-px-navy/40 to-transparent" />
              {s.title || s.text ? (
                <div className="absolute inset-x-0 bottom-0 max-w-2xl p-7 text-white sm:p-10">
                  {s.title ? <h3 className="text-2xl font-semibold leading-tight sm:text-3xl">{t(s.title)}</h3> : null}
                  {s.text ? <p className="mt-3 text-white/75">{t(s.text)}</p> : null}
                  {s.link ? (
                    <button type="button" onClick={() => go(s.link)} className="group mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-px-navy hover:bg-px-primary-light">
                      En savoir plus <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
          {n > 1 ? (
            <>
              <button type="button" aria-label="Précédent" onClick={() => setI((i - 1 + n) % n)} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur hover:bg-white/30">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" aria-label="Suivant" onClick={() => setI((i + 1) % n)} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/15 p-2.5 text-white backdrop-blur hover:bg-white/30">
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 right-6 flex gap-1.5">
                {d.slides.map((s, idx) => (
                  <button key={s.id} type="button" aria-label={`Diapositive ${idx + 1}`} onClick={() => setI(idx)} className={cx('h-1.5 rounded-full transition-all', idx === i ? 'w-6 bg-white' : 'w-1.5 bg-white/50')} />
                ))}
              </div>
            </>
          ) : null}
        </div>
      </Reveal>
    </Section>
  );
}

export function DetailsBlock({ d, style }: { d: DetailsData; style: BlockStyle }) {
  const { t } = useCms();
  return (
    <Section style={style}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {d.sections.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <section className="card-pexen space-y-3 bg-white p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-px-navy">{t(s.title)}</h2>
                {s.text ? <p className="text-sm leading-relaxed text-slate-600">{t(s.text)}</p> : null}
                {s.bullets.length ? (
                  <ul className="space-y-2.5">
                    {s.bullets.map((b, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-px-primary-dark" />
                        <span>{t(b)}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            </Reveal>
          ))}
        </div>
        {d.facts.length || d.sideButton ? (
          <Reveal delay={120} className="lg:col-span-4">
            <div className="card-pexen space-y-4 bg-white p-6 lg:sticky lg:top-28">
              {d.sideTitle ? <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">{t(d.sideTitle)}</h3> : null}
              <dl className="space-y-3 divide-y divide-slate-100 text-xs">
                {d.facts.map((f) => (
                  <div key={f.id} className="flex justify-between gap-4 pt-2">
                    <dt className="text-slate-500">{t(f.label)}</dt>
                    <dd className="text-right font-semibold text-px-navy">{t(f.value)}</dd>
                  </div>
                ))}
              </dl>
              {d.sideButton?.label ? (
                <div className="border-t border-slate-100 pt-4">
                  <CmsButton b={d.sideButton} className="w-full! justify-center text-xs" />
                </div>
              ) : null}
            </div>
          </Reveal>
        ) : null}
      </div>
    </Section>
  );
}

export function TableBlock({ d, style }: { d: TableData; style: BlockStyle }) {
  const [q, setQ] = useState('');
  const { t } = useCms();
  const rows = q ? d.rows.filter((r) => r.cells.some((c) => c.toLowerCase().includes(q.toLowerCase()))) : d.rows;
  return (
    <Section style={style}>
      <SectionHeading h={d} className="mb-6" />
      {d.searchable ? (
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={d.searchPlaceholder || 'Rechercher…'}
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-px-primary focus:outline-hidden"
          />
        </div>
      ) : null}
      <Reveal>
        <div className="card-pexen overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-px-surface text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                <tr>
                  {d.columns.map((c, i) => (
                    <th key={i} className="px-4 py-3">
                      {t(c)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-slate-50/80">
                    {d.columns.map((_, i) => (
                      <td key={i} className={cx('px-4 py-3.5', i === 0 ? 'font-semibold text-px-navy' : 'text-slate-600')}>
                        {t(r.cells[i])}
                      </td>
                    ))}
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={d.columns.length} className="px-4 py-8 text-center text-slate-400">
                      Aucun résultat
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

export function HtmlBlock({ d, style }: { d: HtmlData; style: BlockStyle }) {
  return (
    <Section style={style}>
      <div dangerouslySetInnerHTML={{ __html: d.html }} />
    </Section>
  );
}

export function SpacerBlock({ d, style }: { d: SpacerData; style: BlockStyle }) {
  return (
    <div className={cx(style.background === 'surface' ? 'bg-px-surface' : style.background === 'white' ? 'bg-white' : '', style.hideOnMobile && 'hidden md:block', style.hideOnDesktop && 'md:hidden')} style={{ height: d.height }}>
      {d.divider ? (
        <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="h-px w-full bg-px-border" />
        </div>
      ) : null}
    </div>
  );
}
