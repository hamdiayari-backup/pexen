import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Download, Mail, Phone } from 'lucide-react';
import type { BlockStyle, ButtonData, SectionHeading as HeadingData, TokenValues } from '../../../server/cms/blocks';
import { applyTokens } from '../../../server/cms/blocks';
import { useTokens } from '../../context/SiteConfigContext';
import { IS_PREVIEW } from '../../preview';
import { cmsIcon } from '../../cms/icons';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

/* ------------------------------------------------------------------ Contexte */

interface CmsCtx {
  navigate: (path: string) => void;
  tokens: TokenValues;
}
const CmsContext = createContext<CmsCtx>({ navigate: () => undefined, tokens: { phone: '', phoneClean: '', email: '', sla: '', company: '' } });

export function CmsProvider({ onNavigate, children }: { onNavigate: (p: string) => void; children: React.ReactNode }) {
  const tokens = useTokens();
  return <CmsContext.Provider value={{ navigate: onNavigate, tokens }}>{children}</CmsContext.Provider>;
}

export function useCms() {
  const ctx = useContext(CmsContext);
  const t = (s?: string) => applyTokens(s, ctx.tokens);
  return { ...ctx, t };
}

/** Section sombre : les titres et textes passent en clair. */
const DarkContext = createContext(false);
export const useDark = () => useContext(DarkContext);

/* ------------------------------------------------------------------ Liens */

export function useGo() {
  const { navigate, t } = useCms();
  return (raw?: string, newTab?: boolean) => {
    const link = t(raw).trim();
    if (!link) return;
    if (IS_PREVIEW && !link.startsWith('/')) return;
    if (link === '#preferences-cookies') {
      window.dispatchEvent(new CustomEvent('pexen:open-cookies'));
    } else if (/^(https?:)?\/\//.test(link) || newTab) {
      window.open(link, '_blank', 'noopener');
    } else if (/^(tel|mailto):/.test(link)) {
      window.location.href = link;
    } else if (link.startsWith('#')) {
      document.getElementById(link.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(link);
    }
  };
}

/* ------------------------------------------------------------------ Animation */

export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: '0px 0px -60px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const AnimationContext = createContext<BlockStyle['animation']>('fade-up');

export function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const animation = useContext(AnimationContext);
  const { ref, inView } = useInView<HTMLDivElement>();
  if (animation === 'none') return <div className={className}>{children}</div>;
  return (
    <div ref={ref} data-anim={animation} style={{ transitionDelay: `${delay}ms` }} className={cx('px-reveal', inView && 'is-visible', className)}>
      {children}
    </div>
  );
}

export function CountUp({ end, prefix = '', suffix = '', duration = 1800 }: { end: number; prefix?: string; suffix?: string; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(end * (1 - Math.pow(1 - progress, 4))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, end, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString('fr-FR')}
      {suffix}
    </span>
  );
}

/* ------------------------------------------------------------------ Section */

const PAD_TOP: Record<BlockStyle['paddingTop'], string> = { none: 'pt-0', sm: 'pt-8 sm:pt-10', md: 'pt-12 sm:pt-16', lg: 'pt-20 sm:pt-24', xl: 'pt-24 sm:pt-32' };
const PAD_BOTTOM: Record<BlockStyle['paddingBottom'], string> = { none: 'pb-0', sm: 'pb-8 sm:pb-10', md: 'pb-12 sm:pb-16', lg: 'pb-20 sm:pb-24', xl: 'pb-24 sm:pb-32' };
const WIDTH: Record<BlockStyle['width'], string> = {
  narrow: 'max-w-3xl mx-auto px-4 sm:px-6',
  default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  wide: 'max-w-[88rem] mx-auto px-4 sm:px-6 lg:px-8',
  full: 'w-full',
};

const BG: Record<BlockStyle['background'], string> = {
  none: '',
  white: 'bg-white',
  surface: 'bg-px-surface',
  soft: 'bg-gradient-to-br from-px-surface via-px-surface to-px-surface-2',
  navy: 'bg-px-navy text-white',
  brand: 'bg-gradient-to-r from-px-primary-dark via-px-accent-mid to-px-accent px-gradient-pan text-white',
  image: 'bg-px-navy',
  video: 'bg-px-navy',
};

export function isDarkStyle(s: BlockStyle) {
  return s.background === 'navy' || s.background === 'brand' || ((s.background === 'image' || s.background === 'video') && s.overlayTone !== 'light');
}

function Decor({ decor, dark }: { decor: BlockStyle['decor']; dark: boolean }) {
  switch (decor) {
    case 'dots':
      return <div className={cx('px-decor inset-y-0 right-0 w-2/3 px-fade-right', dark ? 'px-dots opacity-30 invert' : 'px-dots')} />;
    case 'grid':
      return <div className={cx('px-decor inset-0 px-grid-bg', dark && 'opacity-40 invert')} />;
    case 'rings':
      return <div className="px-decor -top-40 -right-40 w-[720px] h-[720px] px-rings px-fade-mask" />;
    case 'diagonal':
      return <div className="px-decor inset-y-0 left-0 w-1/2 px-diagonal px-fade-left" />;
    case 'glow':
      return (
        <>
          <div className="px-decor -top-32 right-[10%] w-[480px] h-[480px] rounded-full bg-px-primary/12 blur-[110px] px-drift" />
          <div className="px-decor -bottom-40 -left-32 w-[460px] h-[460px] rounded-full bg-px-accent/8 blur-[110px] px-drift [animation-delay:-8s]" />
        </>
      );
    default:
      return null;
  }
}

export function Section({ style, children, className, contentClassName }: { style: BlockStyle; children: React.ReactNode; className?: string; contentClassName?: string }) {
  const dark = isDarkStyle(style);
  const overlay = Math.min(Math.max(style.overlay ?? 55, 0), 95) / 100;
  const light = style.overlayTone === 'light';
  return (
    <AnimationContext.Provider value={style.animation}>
      <DarkContext.Provider value={dark}>
        <section
          id={style.anchor || undefined}
          className={cx(
            'px-section scroll-mt-24',
            BG[style.background],
            PAD_TOP[style.paddingTop],
            PAD_BOTTOM[style.paddingBottom],
            style.borderTop && 'border-t border-px-border-soft',
            style.hideOnMobile && 'hidden md:block',
            style.hideOnDesktop && 'md:hidden',
            className
          )}
        >
          {style.background === 'image' && style.backgroundImage ? (
            <div className="px-decor inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${style.backgroundImage}')` }} />
          ) : null}
          {style.background === 'video' && style.backgroundVideo ? (
            <video className="px-decor inset-0 h-full w-full object-cover" src={style.backgroundVideo} poster={style.backgroundImage} autoPlay muted loop playsInline />
          ) : null}
          {style.background === 'image' || style.background === 'video' ? (
            light ? (
              <>
                <div className="px-decor inset-0 bg-white" style={{ opacity: overlay }} />
                <div className="px-decor inset-0 bg-gradient-to-r from-white/85 via-white/45 to-white/10" />
              </>
            ) : (
              <div className="px-decor inset-0 bg-px-navy" style={{ opacity: overlay }} />
            )
          ) : null}
          <Decor decor={style.decor} dark={dark} />
          <div className={cx(WIDTH[style.width], contentClassName)}>{children}</div>
        </section>
      </DarkContext.Provider>
    </AnimationContext.Provider>
  );
}

/* ------------------------------------------------------------------ Typographie */

export function Eyebrow({ children }: { children: React.ReactNode }) {
  const dark = useDark();
  return (
    <div className={cx('inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]', dark ? 'text-px-primary-light' : 'text-px-primary-dark')}>
      <span className={cx('h-px w-6', dark ? 'bg-px-primary-light' : 'bg-gradient-to-r from-px-primary to-px-accent')} />
      {children}
    </div>
  );
}

export function Highlighted({ title, highlight }: { title?: string; highlight?: string }) {
  const dark = useDark();
  const { t } = useCms();
  return (
    <>
      {t(title)}
      {highlight ? (
        <>
          {' '}
          <span className={dark ? 'text-px-primary-light' : 'text-px-primary-dark'}>{t(highlight)}</span>
        </>
      ) : null}
    </>
  );
}

export function SectionHeading({ h, className, as = 'h2' }: { h: HeadingData; className?: string; as?: 'h1' | 'h2' }) {
  const dark = useDark();
  const go = useGo();
  const { t } = useCms();
  if (!h.eyebrow && !h.title && !h.intro) return null;
  const center = h.align === 'center';
  const Tag = as;
  return (
    <Reveal className={cx('mb-12 flex flex-col gap-6', center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between', className)}>
      <div className={cx('space-y-3', center ? 'max-w-2xl' : 'max-w-2xl')}>
        {h.eyebrow ? <Eyebrow>{t(h.eyebrow)}</Eyebrow> : null}
        {h.title ? (
          <Tag className={cx('text-3xl sm:text-[2.6rem] font-semibold tracking-tight leading-tight', dark ? 'text-white' : 'text-px-navy')}>
            <Highlighted title={h.title} highlight={h.highlight} />
          </Tag>
        ) : null}
        {h.intro ? <p className={dark ? 'text-white/70' : 'text-slate-600'}>{t(h.intro)}</p> : null}
      </div>
      {h.headerLinkLabel && h.headerLink && !center ? (
        <button type="button" onClick={() => go(h.headerLink)} className={cx('group inline-flex shrink-0 items-center gap-2 text-sm font-semibold', dark ? 'text-white' : 'text-px-navy')}>
          <span className="border-b-2 border-px-primary pb-0.5 transition-colors group-hover:border-px-accent">{t(h.headerLinkLabel)}</span>
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </button>
      ) : null}
    </Reveal>
  );
}

/** HTML issu de l'éditeur riche : variables remplacées, liens internes routés côté client. */
export function RichHtml({ html, className }: { html: string; className?: string }) {
  const { t } = useCms();
  const go = useGo();
  const dark = useDark();
  return (
    <div
      className={cx('cms-prose', dark && 'cms-prose-dark', className)}
      dangerouslySetInnerHTML={{ __html: t(html) }}
      onClick={(e) => {
        const a = (e.target as HTMLElement).closest('a');
        const href = a?.getAttribute('href');
        if (!a || !href || a.target === '_blank' || /^(https?:|mailto:|tel:)/.test(href)) return;
        e.preventDefault();
        go(href);
      }}
    />
  );
}

export function Icon({ name, className }: { name?: string; className?: string }) {
  const C = cmsIcon(name);
  return C ? <C className={className ?? 'h-5 w-5'} /> : null;
}

/* ------------------------------------------------------------------ Boutons */

const BTN_ICON = {
  arrow: ArrowRight,
  'arrow-up-right': ArrowUpRight,
  phone: Phone,
  mail: Mail,
  download: Download,
  none: null,
} as const;

export function CmsButton({ b, size = 'md', className }: { b: ButtonData; size?: 'md' | 'lg'; className?: string }) {
  const go = useGo();
  const { t } = useCms();
  const dark = useDark();
  const IconC = BTN_ICON[b.icon] ?? null;
  const lead = b.icon === 'phone' || b.icon === 'mail';
  const big = size === 'lg' ? 'py-4! px-8! text-base!' : 'py-3.5! px-7!';
  let cls = '';
  switch (b.variant) {
    case 'primary':
      cls = cx('btn-primary-pexen px-shine', big);
      break;
    case 'secondary':
      cls = dark
        ? cx('inline-flex items-center justify-center gap-2 rounded-full border border-white/25 font-semibold text-white transition-colors hover:border-px-primary-light hover:bg-white/5', 'py-3.5 px-7 text-sm')
        : cx('btn-secondary-pexen', big);
      break;
    case 'dark':
      cls = 'group inline-flex items-center justify-center gap-2 rounded-full bg-px-navy px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-px-navy';
      break;
    case 'light':
      cls = 'group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-px-navy transition-colors hover:bg-px-primary-light';
      break;
    case 'glass':
      cls = 'inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/15 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/25';
      break;
    case 'link':
      cls = cx('group inline-flex items-center gap-2 text-sm font-semibold transition-colors', dark ? 'text-white hover:text-px-primary-light' : 'text-slate-700 hover:text-px-primary-dark');
      break;
  }
  const accentIcon = lead && ((b.variant === 'secondary' && dark) || b.variant === 'link');
  const iconEl = IconC ? <IconC className={cx('h-4 w-4', !lead && 'btn-arrow transition-transform group-hover:translate-x-1', accentIcon && (dark ? 'text-px-primary-light' : 'text-px-primary-dark'))} /> : null;
  const label = t(b.label);
  return (
    <button type="button" onClick={() => go(b.link, b.newTab)} className={cx(cls, className)}>
      {lead ? iconEl : null}
      <span>{label}</span>
      {!lead ? iconEl : null}
    </button>
  );
}

export function ButtonRow({ buttons, className, size, center }: { buttons?: ButtonData[]; className?: string; size?: 'md' | 'lg'; center?: boolean }) {
  if (!buttons?.length) return null;
  return (
    <div className={cx('flex flex-col items-stretch gap-3 sm:flex-row sm:items-center', center && 'justify-center', className)}>
      {buttons.map((b) => (
        <CmsButton key={b.id} b={b} size={size} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Médias */

export function toEmbedUrl(url: string, autoplay = false): string | null {
  try {
    const u = new URL(url);
    const params = autoplay ? '?autoplay=1&mute=1&rel=0' : '?rel=0';
    if (/youtu\.be$/.test(u.hostname)) return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}${params}`;
    if (/youtube\.com$/.test(u.hostname.replace(/^www\./, ''))) {
      const id = u.searchParams.get('v') || u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://www.youtube-nocookie.com/embed/${id}${params}` : null;
    }
    if (/vimeo\.com$/.test(u.hostname.replace(/^www\./, ''))) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}${autoplay ? '?autoplay=1&muted=1' : ''}` : null;
    }
    return url;
  } catch {
    return null;
  }
}

export function VideoPlayer({
  source,
  url,
  poster,
  autoplay,
  title,
  className,
}: {
  source: 'file' | 'embed';
  url?: string;
  poster?: string;
  autoplay?: boolean;
  title?: string;
  className?: string;
}) {
  if (!url) return <div className={cx('flex items-center justify-center bg-slate-100 text-sm text-slate-400', className)}>Vidéo à choisir</div>;
  if (source === 'embed') {
    const src = toEmbedUrl(url, autoplay);
    if (!src) return null;
    return <iframe src={src} title={title || 'Vidéo'} className={cx('h-full w-full', className)} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" loading="lazy" />;
  }
  return autoplay ? (
    <video src={url} poster={poster} className={cx('h-full w-full object-cover', className)} autoPlay muted loop playsInline />
  ) : (
    <video src={url} poster={poster} className={cx('h-full w-full object-cover', className)} controls preload="metadata" />
  );
}

export function Placeholder({ label, className }: { label: string; className?: string }) {
  return <div className={cx('flex items-center justify-center bg-gradient-to-br from-px-surface to-px-surface-2 text-sm text-slate-400', className)}>{label}</div>;
}
