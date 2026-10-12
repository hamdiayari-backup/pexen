import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import type { BlockStyle, HeroData, MarqueeData, PageHeaderData } from '../../../../server/cms/blocks';
import { ButtonRow, cx, Highlighted, Reveal, Section, useCms, useDark, useGo, VideoPlayer } from '../kit';

function useMouseParallax(enabled: boolean, strength = 18) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (e: MouseEvent) => {
      const r = node.getBoundingClientRect();
      setOffset({ x: ((e.clientX - r.left) / r.width - 0.5) * strength, y: ((e.clientY - r.top) / r.height - 0.5) * strength });
    };
    const leave = () => setOffset({ x: 0, y: 0 });
    node.addEventListener('mousemove', move);
    node.addEventListener('mouseleave', leave);
    return () => {
      node.removeEventListener('mousemove', move);
      node.removeEventListener('mouseleave', leave);
    };
  }, [enabled, strength]);
  return { ref, offset };
}

function RotatingTitle({ title, words, highlight }: { title: string; words: string[]; highlight?: string }) {
  const [i, setI] = useState(0);
  const { t } = useCms();
  useEffect(() => {
    if (words.length < 2) return;
    const timer = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(timer);
  }, [words.length]);
  const word = words.length ? words[i % words.length] : highlight;
  return (
    <>
      {t(title)}
      {word ? (
        <span className="relative block w-fit">
          <span key={i} className="px-word-in inline-block bg-gradient-to-r from-px-primary via-px-accent-mid to-px-accent bg-clip-text text-transparent">
            {t(word)}
          </span>
          <svg className="absolute -bottom-2 left-0 h-3 w-full overflow-visible" viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
            <path
              key={i}
              d="M2 8 Q 100 1 198 7"
              fill="none"
              stroke="url(#pxHeroLine)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="210"
              strokeDashoffset="210"
              style={{ animation: 'pxDash 0.9s 0.2s ease-out forwards' }}
            />
            <defs>
              <linearGradient id="pxHeroLine" x1="0" x2="1">
                <stop offset="0" stopColor="var(--px-primary)" />
                <stop offset="1" stopColor="var(--px-accent)" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      ) : null}
    </>
  );
}

function HeroVisual({ d }: { d: HeroData }) {
  const { ref, offset } = useMouseParallax(d.parallax);
  const { t } = useCms();
  if (d.media === 'none') return null;
  if (d.media === 'video') {
    return (
      <div className="relative aspect-video overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(11,21,40,0.45)]">
        <VideoPlayer source={/youtu|vimeo/.test(d.video || '') ? 'embed' : 'file'} url={d.video} poster={d.videoPoster} autoplay />
      </div>
    );
  }
  if (d.media === 'image') {
    return (
      <div className="relative h-[360px] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(11,21,40,0.45)] sm:h-[460px]">
        {d.mainImage ? <img src={d.mainImage} alt={d.mainImageAlt || ''} className="h-full w-full object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-tr from-px-navy/50 via-transparent to-transparent" />
      </div>
    );
  }
  return (
    <div ref={ref} className="relative h-[420px] sm:h-[500px] lg:h-[540px]">
      <div
        className="absolute inset-y-0 right-0 w-[86%] overflow-hidden rounded-[2rem] shadow-[0_40px_80px_-30px_rgba(11,21,40,0.45)] transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${offset.x * -0.6}px, ${offset.y * -0.6}px, 0)` }}
      >
        {d.mainImage ? <img src={d.mainImage} alt={d.mainImageAlt || ''} className="h-full w-full scale-105 object-cover" /> : null}
        <div className="absolute inset-0 bg-gradient-to-tr from-px-navy/60 via-px-navy/5 to-transparent" />
      </div>

      {d.chipText ? (
        <div
          className="absolute bottom-6 right-4 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-px-navy shadow-lg backdrop-blur lg:flex"
          style={{ transform: `translate3d(${offset.x * 0.4}px, ${offset.y * 0.4}px, 0)` }}
        >
          {t(d.chipText)}
        </div>
      ) : null}

      {d.secondaryImage ? (
        <div
          className="absolute left-0 top-10 hidden aspect-[4/5] w-[42%] overflow-hidden rounded-[1.5rem] border-4 border-white shadow-2xl transition-transform duration-300 ease-out sm:block"
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(-4deg)` }}
        >
          <img src={d.secondaryImage} alt={d.secondaryImageAlt || ''} className="h-full w-full object-cover object-[72%_center]" />
          {d.secondaryCaption ? (
            <div className="absolute inset-x-0 bottom-0 bg-white/95 px-3 py-1.5 text-center">
              <span className="font-hand text-lg leading-none text-px-navy">{t(d.secondaryCaption)}</span>
            </div>
          ) : null}
        </div>
      ) : null}

      {d.statValue ? (
        <div className="px-float absolute bottom-20 left-2 sm:left-[6%] lg:bottom-24" style={{ transform: `translate3d(${offset.x * 1.4}px, ${offset.y * 1.4}px, 0)` }}>
          <div className="flex items-center gap-4 rounded-2xl border border-px-border bg-white/95 px-5 py-4 shadow-xl backdrop-blur-md">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-px-primary to-px-accent text-white">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold leading-none text-px-navy">{t(d.statValue)}</div>
              {d.statLabel ? <div className="mt-1 text-[11px] text-slate-500">{t(d.statLabel)}</div> : null}
            </div>
          </div>
        </div>
      ) : null}

      {d.badgeCardTitle ? (
        <div className="px-float-delay absolute right-4 top-6" style={{ transform: `translate3d(${offset.x * 0.9}px, ${offset.y * 0.9}px, 0)` }}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-px-navy/90 px-4 py-3 text-white shadow-xl backdrop-blur-md">
            <CheckCircle2 className="h-5 w-5 text-px-primary-light" />
            <div>
              <div className="text-sm font-semibold leading-none">{t(d.badgeCardTitle)}</div>
              {d.badgeCardText ? <div className="mt-1 text-[10px] text-white/60">{t(d.badgeCardText)}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Marquee({ d, embedded }: { d: MarqueeData; embedded?: boolean }) {
  const { t } = useCms();
  if (!d.items.length) return null;
  const speed = d.speed === 'slow' ? 'px-marquee-slow' : d.speed === 'fast' ? 'px-marquee-fast' : '';
  return (
    <div className={cx('relative overflow-hidden py-4', embedded ? 'border-y border-px-border bg-px-surface' : '')}>
      <div className="absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-px-surface to-transparent" />
      <div className="absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-px-surface to-transparent" />
      <div className={cx('px-marquee flex w-max items-center gap-12 whitespace-nowrap', speed)}>
        {[0, 1].map((loop) => (
          <React.Fragment key={loop}>
            {d.items.map((it) =>
              it.logo ? (
                <img key={`${loop}-${it.id}`} src={it.logo} alt={it.text || ''} className="h-8 w-auto opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0" />
              ) : (
                <span key={`${loop}-${it.id}`} className="inline-flex items-center gap-3 text-sm font-semibold text-slate-400 transition-colors hover:text-px-navy">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-px-primary to-px-accent" />
                  {t(it.text)}
                </span>
              )
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function HeroBlock({ d, style }: { d: HeroData; style: BlockStyle }) {
  const { t } = useCms();
  const centered = d.layout === 'centered' || d.media === 'none';
  return (
    <>
      <Section style={style} className="overflow-hidden">
        <div className="pointer-events-none absolute -left-32 -top-40 h-[560px] w-[560px] rounded-full bg-px-primary/15 blur-[110px] px-blob" aria-hidden="true" />
        <HeroInner d={d} centered={centered} t={t} />
      </Section>
      {d.marquee.length ? <Marquee d={{ speed: 'normal', items: d.marquee.map((text, i) => ({ id: String(i), text })) }} embedded /> : null}
    </>
  );
}

function HeroInner({ d, centered, t }: { d: HeroData; centered: boolean; t: (s?: string) => string }) {
  const dark = useDark();
  return (
    <div className={cx('relative grid grid-cols-1 items-center gap-12 lg:gap-10', !centered && 'lg:grid-cols-12')}>
      <div className={cx('space-y-7', centered ? 'mx-auto max-w-3xl text-center' : 'lg:col-span-7')}>
        {d.badgeText ? (
          <Reveal>
            <div
              className={cx(
                'inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-xs font-medium shadow-sm',
                dark ? 'border-white/15 bg-white/10 text-white/80' : 'border-px-border bg-white text-slate-600'
              )}
            >
              {d.badgeTag ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-px-primary to-px-accent px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Sparkles className="h-3 w-3" /> {t(d.badgeTag)}
                </span>
              ) : null}
              {t(d.badgeText)}
            </div>
          </Reveal>
        ) : null}

        <Reveal delay={80}>
          <h1
            className={cx(
              'text-[2.2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.9rem] lg:text-[3.1rem] xl:text-[3.3rem]',
              dark ? 'text-white' : 'text-px-navy',
              centered && '[&_.block]:mx-auto'
            )}
          >
            {d.rotatingWords.length ? <RotatingTitle title={d.title} words={d.rotatingWords} highlight={d.highlight} /> : <Highlighted title={d.title} highlight={d.highlight} />}
          </h1>
        </Reveal>

        {d.subtitle ? (
          <Reveal delay={160}>
            <p className={cx('max-w-xl text-base leading-relaxed sm:text-lg', dark ? 'text-white/75' : 'text-slate-600', centered && 'mx-auto')}>{t(d.subtitle)}</p>
          </Reveal>
        ) : null}

        <Reveal delay={240}>
          <ButtonRow buttons={d.buttons} center={centered} />
        </Reveal>

        {d.liveText || d.trustItems.length ? (
          <Reveal delay={320}>
            <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-3 pt-2', centered && 'justify-center')}>
              {d.liveText ? (
                <div className={cx('flex items-center gap-2 text-xs font-medium', dark ? 'text-white/70' : 'text-slate-600')}>
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-px-primary opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-px-primary-dark" />
                  </span>
                  {t(d.liveText)}
                </div>
              ) : null}
              {d.liveText && d.trustItems.length ? <span className="hidden h-4 w-px bg-slate-200 sm:block" /> : null}
              {d.trustItems.map((badge) => (
                <span key={badge} className={cx('inline-flex items-center gap-1.5 text-xs font-medium', dark ? 'text-white/60' : 'text-slate-500')}>
                  <ShieldCheck className="h-3.5 w-3.5 text-px-primary-dark" />
                  {t(badge)}
                </span>
              ))}
            </div>
          </Reveal>
        ) : null}
      </div>

      {!centered ? (
        <div className="lg:col-span-5">
          <HeroVisual d={d} />
        </div>
      ) : null}
    </div>
  );
}

export function PageHeaderBlock({ d, style }: { d: PageHeaderData; style: BlockStyle }) {
  const { t } = useCms();
  const go = useGo();
  return (
    <Section style={style}>
      <PageHeaderInner d={d} t={t} go={go} />
    </Section>
  );
}

function PageHeaderInner({ d, t, go }: { d: PageHeaderData; t: (s?: string) => string; go: ReturnType<typeof useGo> }) {
  const dark = useDark();
  const muted = dark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-px-navy';
  return (
    <div className="space-y-4">
      {d.breadcrumb ? (
        <nav className={cx('flex flex-wrap items-center gap-2 text-xs font-medium', dark ? 'text-white/60' : 'text-slate-500')} aria-label="Fil d'Ariane">
          <button type="button" onClick={() => go('/')} className={muted}>
            Accueil
          </button>
          {d.parentLabel ? (
            <>
              <span>/</span>
              <button type="button" onClick={() => go(d.parentLink)} className={muted}>
                {t(d.parentLabel)}
              </button>
            </>
          ) : null}
          <span>/</span>
          <span className="text-px-primary-dark">{t(d.title).replace(/[:—].*$/, '').trim()}</span>
        </nav>
      ) : null}
      {d.backLabel && d.backLink ? (
        <button type="button" onClick={() => go(d.backLink)} className={cx('inline-flex items-center gap-2 text-xs font-semibold transition-colors', muted)}>
          <ArrowLeft className="h-4 w-4" />
          {t(d.backLabel)}
        </button>
      ) : null}
      <div className={cx('grid grid-cols-1 items-center gap-8', d.image && 'lg:grid-cols-12')}>
        <Reveal className={cx('space-y-4', d.image ? 'lg:col-span-7' : 'max-w-4xl')}>
          {d.eyebrow ? <div className={cx('text-xs font-semibold uppercase tracking-wider', dark ? 'text-px-primary-light' : 'text-px-primary-dark')}>{t(d.eyebrow)}</div> : null}
          <h1 className={cx('text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl', dark ? 'text-white' : 'text-px-navy')}>
            <Highlighted title={d.title} highlight={d.highlight} />
          </h1>
          {d.intro ? <p className={cx('text-base leading-relaxed sm:text-lg', dark ? 'text-white/75' : 'text-slate-600')}>{t(d.intro)}</p> : null}
          <ButtonRow buttons={d.buttons} className="pt-2" />
        </Reveal>
        {d.image ? (
          <Reveal delay={120} className="lg:col-span-5">
            <div className="aspect-16/10 overflow-hidden rounded-3xl border border-px-border shadow-lg">
              <img src={d.image} alt={d.imageAlt || ''} className="h-full w-full object-cover" />
            </div>
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}

export function MarqueeBlock({ d, style }: { d: MarqueeData; style: BlockStyle }) {
  return (
    <Section style={{ ...style, width: 'full' }}>
      <Marquee d={d} />
    </Section>
  );
}
