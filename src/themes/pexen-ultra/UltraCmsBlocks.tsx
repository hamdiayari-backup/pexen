/**
 * Rendu Ultra des blocs CMS — chaque bloc reste sélectionnable / éditable dans le backoffice.
 * Les données viennent de page.blocks (PostgreSQL), pas de sections React en dur.
 */
import React from 'react';
import type {
  BlockStyle,
  CardsData,
  ChecklistData,
  ContactFormData,
  CtaData,
  FaqData,
  GalleryData,
  HeroData,
  MarqueeData,
  PageHeaderData,
  PanelsData,
  ProjectsData,
  RichTextData,
  SimulatorData,
  StatsData,
  StepsData,
  TableData,
  TextMediaData,
} from '../../../server/cms/blocks';
import { CtaBlock } from '../../components/cms/blocks/ConversionBlocks';
import { RichHtml, useCms, VideoPlayer } from '../../components/cms/kit';
import {
  UltraDiagonalSkillsSection,
  UltraEnjeuxSection,
  UltraExpertisesSection,
  UltraFaqSection,
  UltraGarantiesSection,
  UltraInterlocuteurSection,
  UltraMarqueeSection,
  UltraMethodTimelineSection,
  UltraPreuvesSection,
  UltraProgressiveContactSection,
  UltraRealisationsMixSection,
  UltraSecteursSection,
  UltraSimulatorSection,
} from './UltraSections';

function isEmbedUrl(url?: string) {
  return !!url && /youtu\.?be|vimeo\.com/i.test(url);
}

/**
 * Fond du hero Ultra — lit les DEUX sources du backoffice :
 * 1) Style & animation → background / backgroundVideo / backgroundImage (ce que tu édites)
 * 2) Contenu → media / video / mainImage (onglet Contenu)
 */
function UltraHeroMedia({ d, style }: { d: HeroData; style: BlockStyle }) {
  const styleVideo = style.background === 'video' ? style.backgroundVideo : undefined;
  const styleImage = style.background === 'image' || style.background === 'video' ? style.backgroundImage : undefined;
  const contentVideo = d.media === 'video' ? d.video : undefined;
  const contentPoster = d.videoPoster || d.mainImage;
  const contentImage = d.media === 'image' || d.media === 'composition' ? d.mainImage : undefined;

  const videoUrl = styleVideo || contentVideo;
  const posterUrl = styleImage || contentPoster;
  const imageUrl = (!videoUrl && (style.background === 'image' ? style.backgroundImage : undefined)) || (!videoUrl ? contentImage : undefined);

  if (videoUrl) {
    return (
      <VideoPlayer
        key={`hero-bg-${videoUrl}`}
        source={isEmbedUrl(videoUrl) ? 'embed' : 'file'}
        url={videoUrl}
        poster={posterUrl}
        autoplay
        className="px-hero__video"
      />
    );
  }
  if (imageUrl) {
    return <img key={`hero-bg-${imageUrl}`} className="px-hero__video" src={imageUrl} alt={d.mainImageAlt || ''} />;
  }
  if (style.background === 'video' || d.media === 'video') {
    return (
      <div className="px-hero__video d-flex align-items-center justify-content-center text-white-50">
        Vidéo à choisir (Style → Arrière-plan, ou Contenu → Vidéo)
      </div>
    );
  }
  return null;
}

export function UltraCmsHero({ d, style }: { d: HeroData; style: BlockStyle }) {
  const { navigate } = useCms();
  const word = d.rotatingWords?.[0] || d.highlight || '';
  const primary = d.buttons?.[0];
  const secondary = d.buttons?.[1];
  const tertiary = d.buttons?.[2];

  return (
    <section className="px-hero" id="accueil">
      <div className="px-hero__media" aria-hidden="true">
        <UltraHeroMedia d={d} style={style} />
        <div className="px-hero__veil" />
        <div className="px-ultra-atm__schema px-hero__schema" />
      </div>
      <div className="container">
        <div className="row">
          <div className="col-12 col-xl-10">
            <div className="px-hero__content">
              {(d.badgeText || d.badgeTag) && (
                <span className="px-hero__kicker">
                  <i className="fa fa-bolt" /> {d.badgeText || d.badgeTag}
                </span>
              )}
              <h1 className="px-hero__title">
                {String(d.title || '')
                  .split(/\n/)
                  .map((line, i, arr) => (
                    <span key={i} className="px-hero__title-line">
                      {line}
                      {i < arr.length - 1 ? <br /> : null}
                    </span>
                  ))}
                {word ? (
                  <>
                    {' '}
                    <em>{word}</em>
                  </>
                ) : null}
              </h1>
              {d.subtitle ? <p className="px-hero__lead">{d.subtitle}</p> : null}
              <div className="px-hero__actions">
                {primary ? (
                  <button type="button" onClick={() => navigate(primary.link || '/contact/')} className="btn btn-primary px-cta px-cta--l1">
                    {primary.label} <i className="fa fa-arrow-right" />
                  </button>
                ) : null}
                {secondary ? (
                  <button type="button" onClick={() => navigate(secondary.link || '/realisations/')} className="btn btn-tertiary px-cta px-cta--l2 px-cta--l2-on-dark">
                    {secondary.label}
                  </button>
                ) : null}
                {tertiary ? (
                  <button type="button" onClick={() => navigate(tertiary.link || '/estimation-financement/')} className="px-cta px-cta--l3 px-cta--l3-on-dark px-hero__phone bg-transparent border-0">
                    <i className="fa fa-calculator" /> {tertiary.label} <i className="fa fa-arrow-right" />
                  </button>
                ) : null}
              </div>
              {d.trustItems?.length ? (
                <div className="px-hero__proof">
                  {d.trustItems.slice(0, 3).map((t) => (
                    <div key={t}>
                      <strong>{t.split('·')[0]?.trim() || t}</strong>
                      <span>{t.includes('·') ? t.split('·').slice(1).join('·').trim() : d.liveText || ''}</span>
                    </div>
                  ))}
                </div>
              ) : d.statValue ? (
                <div className="px-hero__proof">
                  <div>
                    <strong>{d.statValue}</strong>
                    <span>{d.statLabel}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function resolveHeroVariant(explicit: PageHeaderData['heroVariant'], parentLink?: string): 'expertise' | 'solution' | 'sector' | 'default' {
  if (explicit && explicit !== 'auto') return explicit;
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  const hint = `${path} ${parentLink || ''}`;
  if (/\/solutions(\/|$)/i.test(hint)) return 'solution';
  if (/\/secteurs(\/|$)/i.test(hint)) return 'sector';
  if (/\/expertises(\/|$)/i.test(hint)) return 'expertise';
  return 'default';
}

export function UltraCmsPageHeader({ d }: { d: PageHeaderData; style: BlockStyle }) {
  const { navigate } = useCms();
  const photo = d.image || '/themes/ultra-s/images/pexen/renovation-energetique.webp';
  const primary = d.buttons?.[0];
  const secondary = d.buttons?.[1];
  const metrics = (d.metrics || []).filter((m) => m?.value).slice(0, 3);
  const variant = resolveHeroVariant(d.heroVariant, d.parentLink);
  const hookOutsideTitle = variant === 'solution' || variant === 'sector';
  const isLight = variant === 'expertise';

  return (
    <section
      className={`px-ultra-page-hero px-ultra-page-hero--rich px-ultra-page-hero--${variant} ${
        isLight ? 'px-ultra-page-hero--light' : 'px-ultra-atm'
      } position-relative overflow-hidden`}
      data-px-atm={isLight ? undefined : 'hero'}
      data-hero-variant={variant}
    >
      {!isLight ? (
        <>
          <div className="px-ultra-atm__photo" style={{ backgroundImage: `url('${photo}')` }} aria-hidden="true" />
          <div className="px-ultra-atm__veil" aria-hidden="true" />
          <div className="px-ultra-atm__schema" aria-hidden="true" />
          <div className="px-ultra-page-hero__glow" aria-hidden="true" />
        </>
      ) : (
        <div className="px-ultra-page-hero__ice" aria-hidden="true" />
      )}
      <div className="container px-ultra-page-hero__inner">
        <div className={`row align-items-center gy-5 ${variant === 'sector' ? 'flex-lg-row-reverse' : ''}`}>
          <div className={variant === 'solution' ? 'col-lg-6' : 'col-lg-7 col-xl-6'}>
            {d.breadcrumb ? (
              <nav className={`px-ultra-crumbs ${isLight ? '' : 'px-ultra-crumbs--pills'}`} aria-label="Fil d’Ariane">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/');
                  }}
                >
                  Accueil
                </a>
                {d.parentLabel && d.parentLink && d.parentLink !== '/' ? (
                  <>
                    <span className="px-ultra-crumbs__sep" aria-hidden="true">
                      /
                    </span>
                    <a
                      href={d.parentLink}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(d.parentLink || '/');
                      }}
                    >
                      {d.parentLabel}
                    </a>
                  </>
                ) : null}
                <span className="px-ultra-crumbs__sep" aria-hidden="true">
                  /
                </span>
                <span aria-current="page">{d.title}</span>
              </nav>
            ) : null}

            {d.eyebrow ? (
              <div className="px-ultra-page-hero__kicker">
                <span className="px-ultra-page-hero__bar" aria-hidden="true" />
                <span className="px-ultra-page-hero__eyebrow">{d.eyebrow}</span>
              </div>
            ) : null}

            <h1 className="px-ultra-page-hero__title">
              {d.title}
              {!hookOutsideTitle && d.highlight ? (
                <>
                  {' '}
                  <em>{d.highlight}</em>
                </>
              ) : null}
            </h1>

            {hookOutsideTitle && d.highlight ? <p className="px-ultra-page-hero__hook">{d.highlight}</p> : null}

            {d.intro ? <p className="px-ultra-page-hero__lead">{d.intro}</p> : null}

            {(primary || secondary) && (
              <div className="px-ultra-page-hero__actions">
                {primary ? (
                  <button type="button" onClick={() => navigate(primary.link || '/contact/')} className="btn btn-primary px-cta px-cta--l1">
                    {primary.label} <i className="fa fa-arrow-right" /> <span />
                  </button>
                ) : null}
                {secondary ? (
                  <button
                    type="button"
                    onClick={() => navigate(secondary.link || '/simulateur-prime-cee/')}
                    className={`btn btn-outline px-cta px-cta--l2 ${isLight ? '' : 'px-cta--l2-on-dark text-white border-white'}`}
                  >
                    {secondary.label}
                  </button>
                ) : null}
              </div>
            )}

            {metrics.length ? (
              <ul className={`px-ultra-page-hero__metrics ${variant === 'sector' ? 'px-ultra-page-hero__metrics--reg' : ''}`}>
                {metrics.map((m) => (
                  <li key={m.id || m.value}>
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className={variant === 'solution' ? 'col-lg-6' : 'col-lg-5 col-xl-6'}>
            <div className={`px-ultra-page-hero__visual px-ultra-page-hero__visual--${variant}`}>
              <div className="px-ultra-page-hero__frame">
                <img src={photo} alt={d.imageAlt || d.title} loading="eager" />
                {!isLight ? <div className="px-ultra-page-hero__frame-veil" aria-hidden="true" /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function UltraCmsTextMedia({ d }: { d: TextMediaData; style: BlockStyle }) {
  const { navigate } = useCms();
  /* recette : texte à gauche / photo à droite par défaut ; mediaPosition left = photo à gauche */
  const flip = d.mediaPosition === 'left';
  const img = d.image || '/themes/ultra-s/images/pexen/audit-batiment.webp';
  const bullets = d.bullets?.filter(Boolean) || [];
  const cta = d.buttons?.[0];

  return (
    <section className={`px-ultra-tm sec-padding ${flip ? 'px-ultra-tm--flip' : ''} px-ultra-schema-bg`}>
      <div className="container">
        <div className="row align-items-center gy-5">
          <div className={`col-lg-6 ${flip ? 'order-lg-1' : 'order-lg-2'}`}>
            <div className="px-ultra-tm__media">
              <div className="px-ultra-tm__shot">
                <img src={img} alt={d.imageAlt || d.title} loading="lazy" />
              </div>
              <div className="px-ultra-tm__accent" aria-hidden="true" />
            </div>
          </div>
          <div className={`col-lg-6 ${flip ? 'order-lg-2' : 'order-lg-1'}`}>
            <div className="px-ultra-tm__copy">
              {d.eyebrow ? <span className="sub-title">{d.eyebrow}</span> : null}
              <h2 className="sec-title">{d.title}</h2>
              {bullets.length ? (
                <ul className="px-ultra-tm__chips">
                  {bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {d.html ? <RichHtml html={d.html} className="px-ultra-tm__prose cms-prose" /> : null}
              {cta?.label ? (
                <button type="button" onClick={() => navigate(cta.link || '/contact/')} className="btn btn-primary px-cta px-cta--l1 mt-4">
                  {cta.label} <i className="fa fa-arrow-right" /> <span />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function UltraCmsCards({ d }: { d: CardsData; style: BlockStyle }) {
  const { navigate } = useCms();
  const items = d.items || [];
  const hasImages = items.some((it) => Boolean(it.image));
  /* Cartes avec photos → grille Ultra (images + numéros). Sans image + style minimal/card → interlocuteur. */
  if ((d.style === 'minimal' || d.style === 'card') && !hasImages) {
    return (
      <UltraInterlocuteurSection
        onNavigate={navigate}
        override={{
          eyebrow: d.eyebrow,
          title: d.title,
          intro: d.intro,
          items: items.map((it, i) => ({
            num: String(i + 1).padStart(2, '0'),
            title: it.title,
            text: it.text || '',
            path: it.link || '/expertises/bureau-etudes-fluides/',
          })),
        }}
      />
    );
  }
  return (
    <UltraExpertisesSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.intro,
        /* headerLinkLabel défini (même '') → pas de fallback homepage ; sinon défaut Ultra */
        ...(d.headerLinkLabel !== undefined || d.headerLink
          ? { footerLabel: d.headerLinkLabel || '', footerLink: d.headerLink }
          : {}),
        ...(d.columns ? { columns: d.columns } : {}),
        items: items.map((it, i) => ({
          num: String(i + 1).padStart(2, '0'),
          title: it.title,
          text: it.text || '',
          path: it.link || '#',
          image: it.image,
          imageAlt: it.imageAlt,
          ctaLabel: it.linkLabel || (it.link ? 'Découvrir →' : ''),
          ceeBadge: (it.tags || []).filter(Boolean).join(' · ') || undefined,
        })),
      }}
    />
  );
}

export function UltraCmsSteps({ d }: { d: StepsData; style: BlockStyle }) {
  const { navigate } = useCms();
  const phaseBanner = (d as StepsData & { phaseBanner?: string }).phaseBanner;
  return (
    <UltraMethodTimelineSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.intro,
        phaseBanner,
        items: (d.items || []).map((it) => ({
          num: it.num || '',
          title: it.title,
          text: it.text || '',
        })),
        buttons: (d.buttons || [])
          .filter((b) => b?.label)
          .map((b) => ({ label: b.label, link: b.link || '/contact/' })),
      }}
    />
  );
}

export function UltraCmsProjects({ d }: { d: ProjectsData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <UltraRealisationsMixSection
      onNavigate={navigate}
      showAll={d.limit === 0 || d.limit >= 6}
      override={{ eyebrow: d.eyebrow, title: d.title, intro: d.intro, showFilters: d.showFilters }}
    />
  );
}

export function UltraCmsFaq({ d }: { d: FaqData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <UltraFaqSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow || 'FAQ',
        title: d.title,
        /* Recette R8 : jamais la carte « Poser ma question » à côté des FAQ */
        showContactCard: false,
        items: (d.items || []).map((it) => ({ question: it.question, answer: it.answer })),
      }}
    />
  );
}

export function UltraCmsContact({ d }: { d: ContactFormData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <UltraProgressiveContactSection
      onNavigate={navigate}
      formId={d.formId || 'contact-main'}
      override={{
        title: d.title,
        intro: d.intro,
        privacyPath: d.privacyPath,
        /* Brief : téléphone uniquement header/footer — pas dans le bloc contact homepage */
        phoneHint: '',
        listItems: d.listItems,
        submitLabel: d.submitLabel,
        hidePhone: true,
      }}
    />
  );
}

export function UltraCmsSimulator({ d }: { d: SimulatorData; style: BlockStyle }) {
  const { navigate } = useCms();
  return <UltraSimulatorSection onNavigate={navigate} override={d} />;
}

export function UltraCmsMarquee({ d }: { d: MarqueeData; style: BlockStyle }) {
  return <UltraMarqueeSection override={{ items: d.items, speed: d.speed }} />;
}

export function UltraCmsGallery({ d }: { d: GalleryData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <UltraDiagonalSkillsSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.note || d.handNote,
        images: (d.items || []).map((it) => ({ image: it.image, caption: it.caption })),
      }}
    />
  );
}

export function UltraCmsStats({ d, style }: { d: StatsData; style: BlockStyle }) {
  const { navigate } = useCms();
  if (d.style === 'strip' || d.style === 'inline') {
    return (
      <UltraPreuvesSection
        onNavigate={navigate}
        override={{
          eyebrow: d.eyebrow,
          title: d.title,
          intro: d.intro,
          footnote: d.footnote || '',
          partners: d.partners,
          qualifications: d.qualifications,
          items: (d.items || []).map((it) => ({
            value: it.value,
            prefix: it.prefix,
            suffix: it.suffix,
            label: it.label,
            hint: it.hint,
            link: it.link,
          })),
        }}
      />
    );
  }
  return (
    <UltraEnjeuxSection
      onNavigate={navigate}
      variant={style?.background === 'navy' ? 'navy' : 'light'}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.intro || d.footnote,
        items: (d.items || []).map((it) => ({
          value: it.value,
          prefix: it.prefix,
          suffix: it.suffix,
          label: it.label,
          hint: it.hint,
          link: it.link,
          image: it.image,
          imageAlt: it.imageAlt,
          ctaLabel: it.ctaLabel,
        })),
      }}
    />
  );
}

export function UltraCmsChecklist({ d }: { d: ChecklistData; style: BlockStyle }) {
  return (
    <UltraGarantiesSection
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.intro,
        cards: (d.cards || []).map((c) => ({
          tag: c.tag,
          title: c.title,
          icon: c.icon?.startsWith('fa') ? c.icon : c.icon ? `fa-${c.icon}` : undefined,
          logos: (c.logos || [])
            .filter((l) => l?.src)
            .map((l) => ({
              src: l.src,
              alt: l.alt || c.title || 'Logo',
              size: l.size || 'md',
            })),
          items: (c.entries || []).map((e) => e.title),
          itemDetails: (c.entries || []).map((e) => e.text),
        })),
      }}
    />
  );
}

export function UltraCmsPanels({ d }: { d: PanelsData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <UltraSecteursSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        items: (d.items || []).map((it) => ({
          image: it.image,
          imageAlt: it.imageAlt,
          title: it.title,
          text: it.text,
          bullets: it.bullets || [],
          link: it.link,
          linkLabel: it.linkLabel,
        })),
      }}
    />
  );
}

/** Découpe un HTML richText en sections H2 → blocs Ultra animés (contenu inchangé). */
function splitRichSections(html: string): { id: string; title: string; body: string }[] {
  const raw = String(html || '').trim();
  if (!raw) return [];
  // Ancre éventuelle sur <article id="…"> enveloppe (fiches réalisations)
  const wrapId = (raw.match(/<article\b[^>]*\bid=["']([^"']+)["']/i) || [])[1] || '';
  const re = /<h2\b([^>]*)>/gi;
  const matches: { index: number; attrs: string }[] = [];
  let hm: RegExpExecArray | null;
  while ((hm = re.exec(raw))) {
    matches.push({ index: hm.index, attrs: hm[1] || '' });
  }
  if (!matches.length) {
    return [{ id: wrapId, title: '', body: raw }];
  }
  const out: { id: string; title: string; body: string }[] = [];
  const before = raw.slice(0, matches[0].index).trim();
  if (before && !/^<\/?article\b/i.test(before.replace(/\s+/g, ' ').trim())) {
    // Intro hors H2 (hors simple wrapper article)
    const introOnly = before.replace(/^<article\b[^>]*>/i, '').replace(/<\/article>\s*$/i, '').trim();
    if (introOnly) out.push({ id: '', title: '', body: introOnly });
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const openEnd = raw.indexOf('>', start) + 1;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    const chunk = raw.slice(openEnd, end);
    const close = chunk.match(/^([\s\S]*?)<\/h2>([\s\S]*)$/i);
    const attrs = matches[i].attrs;
    const idFromH2 = (attrs.match(/\bid=["']([^"']+)["']/i) || [])[1] || '';
    const id = idFromH2 || (i === 0 ? wrapId : '');
    if (!close) {
      const t = chunk.replace(/<\/?article\b[^>]*>/gi, '').replace(/<[^>]+>/g, '').trim();
      if (t) out.push({ id, title: t, body: '' });
      continue;
    }
    const title = close[1].replace(/<[^>]+>/g, '').trim();
    let body = close[2].replace(/<\/article>\s*$/i, '').trim();
    body = body.replace(/^<\/article>\s*/i, '').trim();
    out.push({ id, title, body });
  }
  return out.length ? out : [{ id: wrapId, title: '', body: raw }];
}

/** Découpe meta + image + reste pour le gabarit compact réalisations. */
function splitRefBody(html: string): { meta: string; media: string; content: string } {
  let rest = String(html || '').trim();
  let meta = '';
  let media = '';
  const metaMatch = rest.match(/<p\b[^>]*class=["'][^"']*px-ultra-ref__meta[^"']*["'][^>]*>[\s\S]*?<\/p>/i);
  if (metaMatch) {
    meta = metaMatch[0];
    rest = rest.replace(metaMatch[0], '').trim();
  }
  const mediaMatch =
    rest.match(/<p\b[^>]*>\s*<img\b[^>]*>\s*<\/p>/i) ||
    rest.match(/<img\b[^>]*>/i);
  if (mediaMatch) {
    media = mediaMatch[0];
    rest = rest.replace(mediaMatch[0], '').trim();
  }
  return { meta, media, content: rest };
}

const STUDY_CTA_RE = /demander une étude|étude chiffrée|une étude|demande=etude/i;

/** CTA Ultra — bandeau animé (étude) ou finale navy. */
export function UltraCmsCta({ d }: { d: CtaData; style: BlockStyle }) {
  const { navigate, t } = useCms();
  if (d.layout !== 'centered') {
    return <CtaBlock d={d} style={style} />;
  }

  const primary = d.buttons?.[0];
  const isStudy = STUDY_CTA_RE.test(`${d.title} ${primary?.label || ''} ${primary?.link || ''}`);
  const isNavy = d.variant === 'dark';
  const tone = isNavy ? 'navy' : 'study';

  const btnLabel = t(primary?.label || '').trim();
  const titleRaw = t(d.title || '').trim();
  const title =
    titleRaw && btnLabel && titleRaw.toLowerCase() === btnLabel.toLowerCase()
      ? 'Votre projet mérite une étude chiffrée'
      : titleRaw || (isStudy ? 'Votre projet mérite une étude chiffrée' : 'Parlons de votre projet');

  const lead =
    t(d.text || '').trim() ||
    (isStudy
      ? 'Un ingénieur PEXEN qualifie votre site, dimensionne les solutions et vous répond sous 48 h ouvrées.'
      : "Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.");

  const badge = t(d.badge || '').trim() || (isStudy ? 'Réponse sous 48 h ouvrées' : '');
  const eyebrow = t(d.eyebrow || '').trim() || (isStudy ? 'Étude & dimensionnement' : '');
  const bgShot =
    d.backgroundImage || '/themes/ultra-s/images/pexen/ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp';

  return (
    <section
      className={`sec-padding px-ultra-action-cta px-ultra-action-cta--${tone}${isStudy ? ' px-ultra-action-cta--study' : ''}${tone === 'navy' ? ' px-ultra-atm' : ''}`}
      {...(tone === 'navy' ? { 'data-px-atm': 'cta' } : {})}
    >
      {tone === 'navy' ? (
        <>
          <div className="px-ultra-atm__photo" style={{ backgroundImage: `url('${bgShot}')` }} aria-hidden="true" />
          <div className="px-ultra-atm__veil" aria-hidden="true" />
          <div className="px-ultra-atm__schema" aria-hidden="true" />
        </>
      ) : (
        <div className="px-ultra-action-cta__fx" aria-hidden="true">
          <span className="px-ultra-action-cta__mesh" />
          <span className="px-ultra-action-cta__orb px-ultra-action-cta__orb--a" />
          <span className="px-ultra-action-cta__orb px-ultra-action-cta__orb--b" />
          <span className="px-ultra-action-cta__beam" />
        </div>
      )}
      <div className="container position-relative">
        <article className="px-ultra-action-cta__card">
          {badge ? <span className="px-ultra-action-cta__badge">{badge}</span> : null}
          {eyebrow ? <span className="px-ultra-action-cta__eyebrow">{eyebrow}</span> : null}
          <h2 className="px-ultra-action-cta__title">{title}</h2>
          {d.highlight ? (
            <p className="px-ultra-action-cta__highlight">{t(d.highlight)}</p>
          ) : null}
          {lead ? <p className="px-ultra-action-cta__lead">{lead}</p> : null}
          <div className="px-ultra-action-cta__btns">
            {(d.buttons || []).map((b) => {
              const raw = b.link || '/contact/';
              const href =
                isStudy && /demander une étude|étude chiffrée/i.test(`${b.label || ''} ${raw}`) && !/demande=etude/i.test(raw)
                  ? '/contact/?demande=etude'
                  : raw;
              return (
              <button
                key={b.id}
                type="button"
                className={`px-ultra-action-cta__btn${b.variant === 'secondary' ? ' px-ultra-action-cta__btn--ghost' : ''}`}
                onClick={() => navigate(href)}
              >
                <span className="px-ultra-action-cta__btn-shine" aria-hidden="true" />
                {t(b.label)}
                <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
              );
            })}
          </div>
        </article>
      </div>
    </section>
  );
}

/** Tableau Ultra — échéances / comparatifs (remplace le TableBlock générique). */
export function UltraCmsTable({ d }: { d: TableData; style: BlockStyle }) {
  const { t } = useCms();
  const rows = d.rows || [];
  return (
    <section className="sec-padding px-ultra-table-sec">
      <div className="container">
        <header className="px-ultra-table-sec__head">
          {d.eyebrow ? <span className="px-ultra-table-sec__eyebrow">{t(d.eyebrow)}</span> : null}
          {d.title ? <h2 className="px-ultra-table-sec__title">{t(d.title)}</h2> : null}
          {d.intro ? <p className="px-ultra-table-sec__lead">{t(d.intro)}</p> : null}
        </header>
        <div className="px-ultra-table-wrap">
          <table className="px-ultra-table">
            <thead>
              <tr>
                {(d.columns || []).map((c, i) => (
                  <th key={`${c}-${i}`}>{t(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={r.id || ri}>
                  {(d.columns || []).map((_, i) => (
                    <td key={`${r.id}-${i}`} className={i === 0 ? 'px-ultra-table__cell--key' : 'px-ultra-table__cell--val'}>
                      {t(r.cells[i] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/** Rich text Ultra : chaque H2 devient un bloc moderne animé (charte navy / cyan). */
export function UltraCmsRichText({ d }: { d: RichTextData; style: BlockStyle }) {
  const raw = d.html || '';
  const large = d.size === 'large';

  /* Gabarits structurés : ne jamais découper sur les H2 internes */
  if (/px-ultra-case(?:-list|\s|"|'|>)|px-ultra-ops|px-ultra-op(?:\s|"|'|>)|px-ultra-grade|px-ultra-reg|px-ultra-ref-grid|px-ultra-zig|px-ultra-pillars|px-ultra-mission|px-ultra-method|px-ultra-featgrid|px-ultra-benefits/i.test(raw)) {
    const secClass = /px-ultra-zig/i.test(raw)
      ? 'px-ultra-zig-sec'
      : /px-ultra-mission/i.test(raw)
        ? 'px-ultra-mission-sec'
        : /px-ultra-method/i.test(raw)
          ? 'px-ultra-method-sec'
          : /px-ultra-featgrid/i.test(raw)
            ? 'px-ultra-featgrid-sec'
            : /px-ultra-benefits/i.test(raw)
              ? 'px-ultra-benefits-sec'
              : /px-ultra-pillars/i.test(raw)
                ? 'px-ultra-pillars-sec'
                : /px-ultra-grade/i.test(raw)
                  ? 'px-ultra-grade-sec'
                  : /px-ultra-reg/i.test(raw)
                    ? 'px-ultra-reg-sec'
                    : /px-ultra-ref-grid/i.test(raw)
                      ? 'px-ultra-case-sec px-ultra-case-sec--refs'
                      : 'px-ultra-case-sec';
    return (
      <section className={secClass}>
        <div className="container">
          <RichHtml html={raw} />
        </div>
      </section>
    );
  }

  const plain = raw.replace(/<[^>]+>/g, '').trim();
  const isFootnote =
    (/text-xs|text-slate-500|px-ultra-legal-note|kwh cumac|fiches d’opérations standardisées/i.test(raw) &&
      plain.length < 520) ||
    /^\s*\*?\s*estimation calculée selon les fiches/i.test(plain);
  if (isFootnote) {
    return (
      <section className="px-ultra-ed px-ultra-ed--soft px-ultra-ed--note">
        <div className="container">
          <div className="px-ultra-ed__inner px-ultra-ed__inner--note">
            <RichHtml html={raw} className="px-ultra-ed__prose" />
          </div>
        </div>
      </section>
    );
  }

  const sections = splitRichSections(raw);

  if (sections.length <= 1 && !sections[0]?.title) {
    const soloId = sections[0]?.id || '';
    return (
      <section
        id={soloId || undefined}
        className="px-ultra-ed px-ultra-ed--white"
      >
        <div className="container">
          <div className={`px-ultra-ed__inner ${large ? 'px-ultra-ed__inner--lg' : ''}`}>
            <RichHtml html={raw} className="px-ultra-ed__prose" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="px-ultra-rt">
      {sections.map((sec, i) => {
        const isRef = Boolean(sec.id);
        const tone = i % 2 === 0 ? 'white' : 'soft';
        const hasBody = Boolean(sec.body && sec.body.replace(/<[^>]+>/g, '').trim());
        if (isRef) {
          const parts = splitRefBody(sec.body || '');
          return (
            <section
              key={`${i}-${sec.title.slice(0, 24)}`}
              id={sec.id}
              className={`px-ultra-ref-sec px-ultra-ref-sec--${tone}`}
              style={{ animationDelay: `${Math.min(i, 6) * 70}ms` }}
            >
              <div className="container">
                <article className={`px-ultra-ref${parts.media ? ' px-ultra-ref--split' : ''}`}>
                  <header className="px-ultra-ref__head">
                    {sec.title ? <h2 className="px-ultra-ref__title">{sec.title}</h2> : null}
                    {parts.meta ? <RichHtml html={parts.meta} className="px-ultra-ref__meta-wrap" /> : null}
                  </header>
                  {parts.media ? <div className="px-ultra-ref__media"><RichHtml html={parts.media} /></div> : null}
                  {hasBody && parts.content ? (
                    <div className="px-ultra-ref__content">
                      <RichHtml html={parts.content} className="px-ultra-ref__body" />
                    </div>
                  ) : null}
                </article>
              </div>
            </section>
          );
        }
        return (
          <section
            key={`${i}-${sec.title.slice(0, 24)}`}
            className={`px-ultra-ed px-ultra-ed--${tone}`}
          >
            <div className="container">
              <div className={`px-ultra-ed__inner ${large ? 'px-ultra-ed__inner--lg' : ''}`}>
                {sec.title ? <h2 className="px-ultra-ed__title">{sec.title}</h2> : null}
                {hasBody ? <RichHtml html={sec.body} className="px-ultra-ed__prose" /> : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
