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

/** Typo / placement issus de l’onglet Style de l’éditeur. */
type TextLayout = {
  textAlign: NonNullable<BlockStyle['textAlign']>;
  titleSize: NonNullable<BlockStyle['titleSize']>;
  bodySize: NonNullable<BlockStyle['bodySize']>;
};
const TextLayoutContext = createContext<TextLayout>({ textAlign: 'center', titleSize: 'md', bodySize: 'md' });
export const useTextLayout = () => useContext(TextLayoutContext);

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
  const { ref, inView } = useInView<HTMLDivElement>(0.12);
  if (animation === 'none') return <div className={className}>{children}</div>;
  return (
    <div
      ref={ref}
      data-anim={animation}
      style={{ transitionDelay: `${delay}ms` }}
      className={cx('px-reveal', inView && 'is-visible', className)}
    >
      {children}
    </div>
  );
}

export function CountUp({
  end,
  prefix = '',
  suffix = '',
  duration = 1800,
  decimals = 0,
}: {
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.4);
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let frame = 0;
    const start = performance.now();
    const factor = 10 ** decimals;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setValue(Math.round(end * eased * factor) / factor);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, end, duration, decimals]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {value.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
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
  soft: 'bg-gradient-to-br from-px-surface via-white to-px-surface-2',
  navy: 'bg-px-navy text-white',
  brand: 'bg-gradient-to-r from-px-primary-dark via-px-accent-mid to-px-accent px-gradient-pan text-white',
  image: 'bg-px-navy',
  video: 'bg-px-navy',
};

export function isDarkStyle(s: BlockStyle) {
  return s.background === 'navy' || s.background === 'brand' || ((s.background === 'image' || s.background === 'video') && s.overlayTone !== 'light');
}

/** Voile soyeux : halos doux + léger balayage lumineux (plein cadre, sans couture). */
function SilkLayer({ dark }: { dark: boolean }) {
  return (
    <div className="px-decor inset-0 overflow-hidden" aria-hidden="true">
      <div className={cx('px-decor inset-0', dark ? 'px-silk-mesh-dark' : 'px-silk-mesh-light')} />
      <div className={cx('px-decor inset-0', dark ? 'px-silk-glow-dark' : 'px-silk-glow-light')} />
      <div className={cx('px-decor inset-0 px-silk-sheen', dark && 'opacity-40')} />
      <div className={cx('px-decor inset-0 px-noise', dark ? 'opacity-[0.04]' : 'opacity-[0.03]')} />
    </div>
  );
}

function Decor({ decor, dark }: { decor: BlockStyle['decor']; dark: boolean }) {
  /* Toutes les couches restent en inset:0 pour éviter la couture entre sections (overflow clip). */
  switch (decor) {
    case 'dots':
      return <div className={cx('px-decor inset-0 px-dots-drift', dark ? 'px-dots opacity-25 invert' : 'px-dots opacity-40')} />;
    case 'grid':
      return <div className={cx('px-decor inset-0 px-grid-bg px-grid-drift', dark && 'opacity-40 invert')} />;
    case 'rings':
      return <div className="px-decor inset-0 px-rings-alive opacity-50" />;
    case 'diagonal':
      return <div className="px-decor inset-0 px-diagonal px-diagonal-shift opacity-70" />;
    case 'glow':
      return <div className={cx('px-decor inset-0', dark ? 'px-glow-alive-dark' : 'px-glow-alive-light')} />;
    case 'waves':
    case 'silk':
      return <SilkLayer dark={dark} />;
    default:
      return null;
  }
}

/** Fond vivant : navy/brand (aurora) ; image (voile) ; sections claires via décor silk. */
function AmbientBackdrop({ background }: { background: BlockStyle['background']; dark: boolean }) {
  if (background === 'navy' || background === 'brand') {
    return (
      <>
        <div className="px-decor inset-0 px-bg-alive-dark" />
        <div className="px-decor inset-0 px-aurora-alive opacity-70" />
        <div className="px-decor inset-0 px-noise opacity-[0.06]" />
        <div className="px-decor inset-0 px-beam" />
      </>
    );
  }
  if (background === 'image') {
    return <div className="px-decor inset-0 px-aurora-alive opacity-40 mix-blend-soft-light" />;
  }
  return null;
}

/** Trait fin dégradé entre deux blocs clairs de fonds différents. */
export function BlockSeam() {
  return (
    <div className="px-seam" aria-hidden="true">
      <div className="px-seam-line" />
    </div>
  );
}

export function Section({
  style,
  children,
  className,
  contentClassName,
  /** Désactive les fonds animés (ex. hero déjà géré à part). */
  ambient = true,
}: {
  style: BlockStyle;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  ambient?: boolean;
}) {
  const dark = isDarkStyle(style);
  const overlay = Math.min(Math.max(style.overlay ?? 55, 0), 95) / 100;
  const light = style.overlayTone === 'light';
  const textLayout: TextLayout = {
    textAlign: style.textAlign || 'center',
    titleSize: style.titleSize || 'md',
    bodySize: style.bodySize || 'md',
  };
  /*
   * Fond animé intelligent :
   * - navy / brand → glow (sections sombres)
   * - white / surface / soft → aucun décor auto (calme)
   * - silk uniquement si demandé explicitement dans le style du bloc
   */
  const autoDecor =
    ambient && style.decor === 'none' && (style.background === 'navy' || style.background === 'brand')
      ? 'glow'
      : style.decor;
  return (
    <AnimationContext.Provider value={style.animation}>
      <DarkContext.Provider value={dark}>
      <TextLayoutContext.Provider value={textLayout}>
        {style.borderTop ? <BlockSeam /> : null}
        <section
          id={style.anchor || undefined}
          data-text-align={textLayout.textAlign}
          data-title-size={textLayout.titleSize}
          data-body-size={textLayout.bodySize}
          className={cx(
            'px-section scroll-mt-24',
            BG[style.background],
            PAD_TOP[style.paddingTop],
            PAD_BOTTOM[style.paddingBottom],
            style.hideOnMobile && 'hidden md:block',
            style.hideOnDesktop && 'md:hidden',
            className
          )}
        >
          {style.background === 'image' && style.backgroundImage ? (
            <div
              className="px-decor inset-0 bg-cover bg-center px-kenburns"
              style={{ backgroundImage: `url('${style.backgroundImage}')` }}
            />
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
          {ambient ? <AmbientBackdrop background={style.background} dark={dark} /> : null}
          {ambient ? <Decor decor={autoDecor} dark={dark} /> : null}
          <div className={cx(WIDTH[style.width], contentClassName)}>{children}</div>
        </section>
      </TextLayoutContext.Provider>
      </DarkContext.Provider>
    </AnimationContext.Provider>
  );
}

const TITLE_SIZE: Record<NonNullable<BlockStyle['titleSize']>, string> = {
  sm: 'text-2xl sm:text-3xl',
  md: 'text-3xl sm:text-[2.6rem]',
  lg: 'text-4xl sm:text-[3rem]',
  xl: 'text-4xl sm:text-[3.4rem]',
};
const BODY_SIZE: Record<NonNullable<BlockStyle['bodySize']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

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
  const layout = useTextLayout();
  if (!h.eyebrow && !h.title && !h.intro) return null;
  const align = h.align || layout.textAlign;
  const center = align === 'center';
  const right = align === 'right';
  const Tag = as;
  return (
    <Reveal
      className={cx(
        'mb-12 flex flex-col gap-6',
        center && 'items-center text-center',
        right && 'items-end text-right',
        !center && !right && 'md:flex-row md:items-end md:justify-between',
        className
      )}
    >
      <div className="max-w-2xl space-y-3">
        {h.eyebrow ? <Eyebrow>{t(h.eyebrow)}</Eyebrow> : null}
        {h.title ? (
          <Tag className={cx(TITLE_SIZE[layout.titleSize], 'font-semibold tracking-tight leading-tight', dark ? 'text-white' : 'text-px-navy')}>
            <Highlighted title={h.title} highlight={h.highlight} />
          </Tag>
        ) : null}
        {h.intro ? <p className={cx(BODY_SIZE[layout.bodySize], dark ? 'text-white/70' : 'text-slate-600')}>{t(h.intro)}</p> : null}
      </div>
      {h.headerLinkLabel && h.headerLink && align === 'left' ? (
        <button type="button" onClick={() => go(h.headerLink)} className={cx('group inline-flex shrink-0 items-center gap-2 text-sm font-semibold', dark ? 'text-white' : 'text-px-navy')}>          <span className="border-b-2 border-px-primary pb-0.5 transition-colors group-hover:border-px-accent">{t(h.headerLinkLabel)}</span>
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
  const phoneLabel = b.icon === 'phone' || /^(?:\+33|0)\s*[\d\s.()-]{8,}$/.test(label.replace(/\s/g, ' ').trim());
  return (
    <button type="button" onClick={() => go(b.link, b.newTab)} className={cx(cls, className)}>
      {lead ? iconEl : null}
      <span className={phoneLabel ? 'px-phone' : undefined}>{label}</span>
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
    return (
      <iframe
        key={src}
        src={src}
        title={title || 'Vidéo'}
        className={cx('h-full w-full', className)}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        loading="lazy"
      />
    );
  }
  /* key=url : force le rechargement quand l’éditeur change la vidéo (sinon le navigateur garde l’ancienne) */
  return autoplay ? (
    <video key={url} src={url} poster={poster} className={cx('h-full w-full object-cover', className)} autoPlay muted loop playsInline />
  ) : (
    <video key={url} src={url} poster={poster} className={cx('h-full w-full object-cover', className)} controls preload="metadata" />
  );
}

export function Placeholder({ label, className }: { label: string; className?: string }) {
  return <div className={cx('flex items-center justify-center bg-gradient-to-br from-px-surface to-px-surface-2 text-sm text-slate-400', className)}>{label}</div>;
}
