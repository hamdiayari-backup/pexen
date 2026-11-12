import React, { useEffect, useState } from 'react';
import { CeeSimulator } from '../../components/CeeSimulator';
import { usePexenInfo } from '../../context/SiteConfigContext';
import { CEE_SHEETS, FAQ_HOME, SECTEURS } from '../../data/pexenData';
import type { ContactFormConfig, ContactFormField } from '../../../server/cms/types';
import type { SimulatorData } from '../../../server/cms/blocks';
import { mergeSimulatorData } from '../../../server/cms/ceeDefaults';

/* ==========================================================================
   COMPOSANTS PARTAGÉS DU THÈME PEXEN ULTRA (fidèles à /themes/ultra-s/ + brief Amina)
   ========================================================================== */

/** Symbole ∞ PEXEN (path logo) — transformée pour le cadre about */
const PX_LOGO_D =
  'M473.13 236.7C388.33 283.9 298.73 329.6 204.13 353.5C161.83 364.2 110.83 372.2 70.23 351.5C16.63 324.1 26.33 273.2 60.63 234.6C108.73 180.5 185.33 152.5 256.13 146.4C413.23 132.8 537.33 245.9 664.13 319.7C706.63 344.5 751.03 366.5 798.13 381.1C927.13 421.3 1072.23 405.1 1186.13 330.7C1208.13 316.3 1228.93 298.9 1245.73 278.6C1257.33 264.7 1267.03 249.3 1273.83 232.6C1323.03 110.9 1177.23 29 1079.13 7.7C919.23 -27.1 759.03 64.1 635.13 156C652.63 150.9 678.83 134.8 697.13 126C718.03 116 739.53 107.1 761.13 98.8C848.03 65.2 940.33 60.8 1029.13 89.7C1088.83 109.1 1147.43 140.1 1194.33 182.1C1212.73 198.5 1235.83 221.2 1237.43 247.5C1238.93 271.5 1219.73 289.7 1202.23 303C1162.03 333.5 1111.53 351 1062.13 359.1C896.53 386.1 761.13 267.9 629.13 188.5C510.33 117 389.83 78.9 251.13 106.2C201.53 116 152.63 134.3 109.23 160.3C58.53 190.8 -6.27 244.4 0.73 310.5C2.93 331.8 13.83 351.5 29.13 366.3C40.03 377 53.23 384.8 67.13 391C84.63 398.8 104.13 402.6 123.13 403.8C220.93 410.2 311.03 356.1 388.13 302.2C415.53 283 450.23 260.3 473.13 236.7Z';
const PX_LOGO_TF = 'translate(28, 28) scale(0.5, 0.82)';

/** Section À propos avec la FORME DU LOGO PEXEN à la place du « N » */
export function UltraAboutLogoSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: { eyebrow?: string; title?: string; html?: string; bullets?: string[]; image?: string };
}) {
  const eyebrow = override?.eyebrow || 'PEXEN';
  const title = override?.title || 'Un seul interlocuteur pour votre consommation, vos obligations et vos aides.';
  const body =
    (override?.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ||
    'Nous concevons et déployons des solutions de performance énergétique — de la prévisite au contrôle COFRAC.';
  const bullets = override?.bullets?.length ? override.bullets : ['Gains mesurés', 'Financement CEE & performance'];
  const img = override?.image || '/themes/ultra-s/images/pexen/audit-batiment.webp';
  /* ids uniques si plusieurs instances (aperçu BO) */
  const uid = React.useId().replace(/:/g, '');
  const clipId = `px-logo-traits-${uid}`;
  return (
    <section className="about-sec4 sec-padding overflow-hidden px-ultra-schema-bg px-ultra-schema-bg--mark">
      <div className="container">
        <div className="row align-items-center gy-5">
          <div className="col-lg-6">
            <div className="about-media position-relative px-ultra-logo-shape wow fadeInUp">
              {/* Photo dans les TRAITS du ∞ (ruban du symbole), contours cyan discrets */}
              <svg viewBox="0 0 680 420" role="img" aria-label="Chantier PEXEN dans les traits du logo">
                <defs>
                  <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
                    <path d={PX_LOGO_D} transform={PX_LOGO_TF} />
                  </clipPath>
                </defs>
                <image
                  className="anim-zoom"
                  href={img}
                  width="680"
                  height="420"
                  preserveAspectRatio="xMidYMid slice"
                  clipPath={`url(#${clipId})`}
                />
                {/* Contour lumineux cyan — ne masque pas la photo */}
                <path
                  d={PX_LOGO_D}
                  transform={PX_LOGO_TF}
                  fill="none"
                  stroke="var(--px-accent)"
                  strokeOpacity="0.55"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
                <path
                  d={PX_LOGO_D}
                  transform={PX_LOGO_TF}
                  fill="none"
                  stroke="#ffffff"
                  strokeOpacity="0.35"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="about-stat bg-secondary px-ultra-block" style={{ right: 20, bottom: 10 }}>
                <h2>30+</h2>
                <span>
                  Fiches
                  <br />
                  CEE
                </span>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="about-content2">
              <span className="sub-title wow fadeInUp">{eyebrow}</span>
              <h2 className="sec-title">{title}</h2>
              <div className="about-infos d-sm-flex align-items-center">
                {bullets.slice(0, 2).map((label, i) => (
                  <div key={label} className={`d-flex s-info gap-3 align-items-center ${i === 0 ? 'mb-4 mb-sm-0' : ''}`}>
                    <span className="icon d-inline-flex align-items-center justify-content-center">
                      <img src={i === 0 ? '/themes/ultra-s/images/icons/graph.svg' : '/themes/ultra-s/images/icons/target.svg'} alt="" />
                    </span>
                    <h3 className="h6 mb-0">{label}</h3>
                  </div>
                ))}
              </div>
              <p>{body}</p>
              <button type="button" onClick={() => onNavigate('/contact/')} className="btn btn-primary px-cta px-cta--l1 mt-4">
                Parler de votre projet <i className="fa fa-arrow-right" /> <span />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const EXPERTISE_PLACEHOLDERS = [
  '/themes/ultra-s/images/pexen/centrale-froid.webp',
  '/themes/ultra-s/images/pexen/installation-technique.webp',
  '/themes/ultra-s/images/pexen/pompes-a-chaleur-toiture.webp',
  '/themes/ultra-s/images/pexen/climatisation-toiture.webp',
  '/themes/ultra-s/images/pexen/cee-tertiaire.webp',
];

/** Section Cinq expertises style ingénierie Bizen (colonnes + traits + bouton +) */
export function UltraExpertisesSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    footerLabel?: string;
    footerLink?: string;
    /** Colonnes desktop (2–5), défaut = nombre d’items */
    columns?: number;
    items?: {
      num: string;
      title: string;
      text: string;
      path: string;
      image?: string;
      imageAlt?: string;
      ctaLabel?: string;
      ceeBadge?: string;
    }[];
  };
}) {
  const defaults = [
    {
      num: '01',
      title: 'Froid commercial & industriel',
      text: 'HP/BP flottante, condenseurs haute efficacité, variateurs et fermeture de meubles frigorifiques.',
      path: '/expertises/froid-commercial-industriel/',
      image: EXPERTISE_PLACEHOLDERS[0],
    },
    {
      num: '02',
      title: 'Récupération de chaleur',
      text: 'Valorisation de la chaleur sur groupes froids et process pour le chauffage et l’eau chaude sanitaire.',
      path: '/expertises/recuperation-de-chaleur/',
      image: EXPERTISE_PLACEHOLDERS[1],
    },
    {
      num: '03',
      title: 'Chauffage & traitement d’air',
      text: 'Pompes à chaleur haute performance en remplacement chaufferie et déstratification des grands volumes.',
      path: '/expertises/pompe-a-chaleur-tertiaire/',
      image: EXPERTISE_PLACEHOLDERS[2],
    },
    {
      num: '04',
      title: 'Pilotage GTB / GTC & BACS',
      text: 'Systèmes GTB de classe A ou B conformes au décret BACS (2025 / 2030) et suivi des consommations.',
      path: '/expertises/gtb-tertiaire-gtc/',
      image: EXPERTISE_PLACEHOLDERS[3],
    },
    {
      num: '05',
      title: 'Isolation & financement CEE',
      text: 'Matelas thermiques, réseaux, toitures et montage intégral de vos dossiers CEE jusqu’au contrôle COFRAC.',
      path: '/expertises/financement-cee-reglementation/',
      image: EXPERTISE_PLACEHOLDERS[4],
    },
  ];
  const hideHomeSolution = (path: string, title: string) =>
    /renovation-globale|eclairage-led|éclairage.?led/i.test(`${path} ${title}`);
  const items = (override?.items?.length ? override.items : defaults)
    .filter((it) => !hideHomeSolution(String(it.path || ''), String(it.title || '')))
    .map((it, i) => ({
      ...it,
      image: it.image || EXPERTISE_PLACEHOLDERS[i % EXPERTISE_PLACEHOLDERS.length],
      imageAlt: ('imageAlt' in it ? it.imageAlt : undefined) as string | undefined,
    }));
  const mainItems = items.slice(0, 5);
  /* LED / rénovation masqués homepage — pages CMS restent accessibles (brief Amina v1.1) */
  const extraItems: typeof items = [];
  const eyebrow = override?.eyebrow || 'Expertises';
  const title = override?.title || 'Cinq expertises, une seule exigence';

  const colCount = override?.columns
    ? Math.min(Math.max(override.columns, 1), 5)
    : Math.min(Math.max(mainItems.length, 2), 5);
  const renderCard = (it: (typeof items)[number]) => {
    const clickable = Boolean(it.path && it.path !== '#' && it.ctaLabel !== '');
    return (
      <div
        key={it.num}
        className={`px-ultra-serv-col px-ultra-serv-col--rich${clickable ? '' : ' px-ultra-serv-col--static'}`}
        onClick={clickable ? () => onNavigate(it.path) : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNavigate(it.path);
                }
              }
            : undefined
        }
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
      >
        <div className="px-ultra-serv-col__media">
          <img src={it.image} alt={it.imageAlt || it.title} loading="lazy" />
          <span className="px-ultra-serv-col__badge">{it.num}</span>
        </div>
        <div className="px-ultra-serv-col__body">
          <h3>{it.title}</h3>
          <p>{it.text}</p>
          {it.ceeBadge ? (
            <span className="px-ultra-serv-col__cee">
              <strong>Fiches CEE</strong> {it.ceeBadge}
            </span>
          ) : null}
          {clickable ? (
            <span className="px-cta px-cta--l3 px-ultra-btn--card">
              {it.ctaLabel || 'Découvrir'} <span className="px-cta__arrow" aria-hidden="true">→</span>
            </span>
          ) : null}
        </div>
      </div>
    );
  };
  const footerLabel = override && 'footerLabel' in override ? override.footerLabel : 'Découvrir toutes nos solutions';
  const footerLink = override?.footerLink || '/solutions/';
  const showFooter = Boolean(footerLabel);

  return (
    <section id="expertises" className="services-sec4 sec-padding bg-light position-relative overflow-hidden px-ultra-schema-bg">
      <div className="container">
        <div className="sec-intro text-center mb-5">
          <span className="sub-title wow fadeInUp">{eyebrow}</span>
          <h2 className="sec-title">{title}</h2>
          {override?.intro ? <p className="px-ultra-serv-intro mx-auto">{override.intro}</p> : null}
        </div>
        <div className="px-ultra-serv-wrap px-ultra-serv-wrap--rich bg-white px-ultra-block">
          <div className="px-ultra-serv-grid" style={{ ['--px-serv-cols' as string]: String(colCount) }}>
            {mainItems.map(renderCard)}
          </div>
          {extraItems.length ? (
            <div className="px-ultra-serv-grid px-ultra-serv-grid--extras">{extraItems.map(renderCard)}</div>
          ) : null}
        </div>
        {showFooter ? (
          <div className="row text-center mt-5 pt-2">
            <p className="mb-0">
              <button
                type="button"
                onClick={() => onNavigate(footerLink)}
                className="btn btn-outline px-btn--secondary px-cta px-cta--l2"
              >
                {footerLabel} <i className="fa fa-arrow-right" aria-hidden="true" />
              </button>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Section Nos leviers techniques avec LECTURE EN DIAGONALE (placeholders chantier) */
export function UltraMarqueeSection({
  override,
}: {
  override?: { items?: { text?: string; logo?: string }[]; speed?: 'slow' | 'normal' | 'fast' };
}) {
  const items =
    override?.items?.filter((it) => it.text || it.logo).length
      ? override.items.filter((it) => it.text || it.logo)
      : [
          { text: 'Froid commercial & industriel' },
          { text: 'Récupération de chaleur' },
          { text: 'CEE & contrôle COFRAC' },
          { text: 'GTB / décret BACS' },
          { text: 'PAC tertiaire & sortie fioul' },
          { text: 'Gains mesurés, pas promis' },
        ];
  const dur = override?.speed === 'slow' ? '48s' : override?.speed === 'fast' ? '22s' : '34s';
  const loop = [...items, ...items];
  return (
    <section className="px-ultra-marquee brands-sec overflow-hidden border" aria-label="Domaines PEXEN">
      <div className="px-ultra-marquee__track" style={{ animationDuration: dur }}>
        {loop.map((it, i) => (
          <span key={`${it.text || it.logo}-${i}`} className="px-ultra-marquee__item">
            {it.logo ? <img src={it.logo} alt={it.text || ''} /> : null}
            {it.text ? <span>{it.text}</span> : null}
          </span>
        ))}
      </div>
    </section>
  );
}

export function UltraDiagonalSkillsSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    images?: { image: string; caption?: string }[];
    bars?: { label: string; pct: number }[];
  };
}) {
  const defaults = [
    { image: '/themes/ultra-s/images/pexen/centrale-froid.webp', caption: '01 · Audit & relevés terrain' },
    { image: '/themes/ultra-s/images/pexen/professionnel-pac.webp', caption: '02 · Déploiement sans arrêt' },
    { image: '/themes/ultra-s/images/pexen/climatisation-toiture.webp', caption: '03 · Contrôle COFRAC & CEE' },
  ];
  const imgs = override?.images?.length ? override.images.slice(0, 3) : defaults;
  while (imgs.length < 3) imgs.push(defaults[imgs.length]);
  const bars = override?.bars?.length
    ? override.bars
    : [
        { label: 'Froid commercial & industriel / CVC', pct: 95 },
        { label: 'Montage & financement CEE', pct: 85 },
        { label: 'Pilotage GTB & conformité décret BACS', pct: 90 },
      ];
  return (
    <section id="approche" className="skill-sec2 sec-padding px-ultra-schema-bg">
      <div className="container">
        <div className="row align-items-center gy-5">
          <div className="col-lg-6">
            <div className="px-ultra-diag-stairs">
              {imgs.map((img, i) => (
                <div
                  key={img.image + i}
                  className={`px-ultra-diag-stairs__card px-ultra-diag-stairs__card--${i + 1} wow fadeInUp`}
                  data-wow-delay={`${0.1 + i * 0.15}s`}
                >
                  <img className="anim-zoom" src={img.image} alt={img.caption || `Levier ${i + 1}`} />
                  <span className="px-ultra-diag__tag">{img.caption || defaults[i].caption}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="col-lg-6">
            <div className="skill-txt">
              <span className="sub-title wow fadeInUp">{override?.eyebrow || 'Approche'}</span>
              <h2 className="sec-title">{override?.title || 'Nos leviers techniques'}</h2>
              <p>
                {override?.intro ||
                  'De l’audit énergétique terrain à la réception COFRAC, nous combinons ingénierie frigorifique, génie climatique et valorisation CEE pour maximiser vos gains tout en réduisant votre reste à charge.'}
              </p>
              <div className="progress-wrap wow fadeInUp mt-4" data-wow-delay=".4s">
                {bars.map((bar) => (
                  <div key={bar.label} className="progress-item mb-4" data-percent={`${bar.pct}%`}>
                    <div className="progress-data d-flex justify-content-between mb-2 fw-bold" style={{ color: 'var(--px-navy)' }}>
                      <span className="progress-title">{bar.label}</span>
                      <span className="progress-no">{bar.pct}%</span>
                    </div>
                    <div className="prog-bar">
                      <div className="count-bar" style={{ width: `${bar.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => onNavigate('/expertises/')} className="btn btn-primary px-cta px-cta--l1 mt-3">
                Voir les expertises <i className="fa fa-arrow-right" /> <span />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Bloc 4 — Un seul interlocuteur (4 colonnes texte) */
const ULTRA_INTER_ICONS = ['fa-cogs', 'fa-hard-hat', 'fa-chart-line', 'fa-euro-sign'];

export function UltraInterlocuteurSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    items?: { num?: string; title: string; text: string; path?: string }[];
  };
}) {
  const items = override?.items?.length
    ? override.items
    : [
        { num: '01', title: 'Ingénierie', text: 'Ingénierie fluides et efficacité énergétique, réalisées en interne.', path: '/expertises/bureau-etudes-fluides/' },
        { num: '02', title: 'Travaux', text: 'Installation par nos équipes, suivi de chantier et AMO, sans interrompre votre exploitation.', path: '/expertises/assistance-maitrise-ouvrage/' },
        { num: '03', title: 'Suivi de performance', text: 'Contrôle de conformité, suivi des consommations, contrat de performance énergétique.', path: '/expertises/contrat-performance-energetique/' },
        { num: '04', title: 'Financement CEE', text: 'Éligibilité vérifiée dès l’étude, dossier constitué avec les pièces du chantier.', path: '/expertises/financement-cee-reglementation/' },
      ];
  return (
    <section className="sec-padding bg-white px-ultra-schema-bg" id="interlocuteur">
      <div className="container">
        <div className="sec-intro text-center mb-5">
          <span className="sub-title wow fadeInUp">{override?.eyebrow || 'Nos expertises'}</span>
          <h2 className="sec-title">{override?.title || 'Un seul interlocuteur, de l’étude à la performance suivie'}</h2>
        </div>
        <div className="row g-4 justify-content-center">
          {items.slice(0, 4).map((it, i) => (
            <div key={it.title} className={items.length <= 2 ? 'col-md-6' : 'col-md-6 col-xl-3'}>
              <div className="bg-white p-4 h-100 border d-flex flex-column" style={{ borderColor: '#E2E8F0' }}>
                {items.length > 2 ? (
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <i className={`fa ${ULTRA_INTER_ICONS[i] || 'fa-bolt'} fs-4`} style={{ color: 'var(--px-primary)' }} />
                    <span className="fw-bold" style={{ color: '#94A3B8', fontSize: '0.9rem' }}>
                      {it.num || String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                ) : null}
                <h3 className="h5 mb-2" style={{ color: 'var(--px-navy)' }}>
                  {it.title}
                </h3>
                <p className="small text-muted flex-grow-1 mb-0">{it.text}</p>
              </div>
            </div>
          ))}
        </div>
        {override?.intro || items.length > 2 ? (
          <div className="px-ultra-inter-callout">
            <p>
              {override?.intro ||
                'Nos travaux ne se limitent pas aux opérations CEE : chaque solution est d’abord dimensionnée pour la performance de votre site.'}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Section Méthode : timeline process 5 étapes (wireframe navy) */
export function UltraMethodTimelineSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    /** Bandeau phases custom (ex. études). Si fourni, remplace Avant/Pendant/Après. */
    phaseBanner?: string;
    items?: { num: string; title: string; text: string }[];
    buttons?: { label: string; link: string }[];
  };
}) {
  const defaultSteps = [
    { num: '01', title: 'Étude et éligibilité', text: 'Audit énergétique, relevés sur site et calcul du gisement. Étude de faisabilité technique et vérification de l’éligibilité aux dispositifs de financement.' },
    { num: '02', title: 'Ingénierie et planification', text: 'Notes de dimensionnement, choix des équipements, devis et plan de financement. Planning des travaux et organisation de l’assistance à maîtrise d’ouvrage.' },
    { num: '03', title: 'Travaux et suivi de chantier', text: 'Installation par nos équipes, suivi de chantier et AMO, mise en service et réglages, sans interrompre l’exploitation.' },
    { num: '04', title: 'Fin de travaux et contrôle', text: 'Documents de fin de travaux et procès-verbal de réception. Pour les opérations CEE : contrôle par un organisme accrédité COFRAC (dossier, visite sur site).' },
    { num: '05', title: 'Prise en charge et suivi', text: 'Rapport final et suivi du dossier de financement jusqu’à la prise en charge complète. Suivi des consommations après travaux.' },
  ];
  const raw = override?.items?.length ? override.items : defaultSteps;
  const steps = raw.map((s, i) => ({ ...s, final: i === raw.length - 1 }));
  const eyebrow = override?.eyebrow || 'Votre projet';
  const title = override?.title || 'Votre projet en 5 étapes, de l’étude au suivi';
  /* CMS : intro/buttons vides = rien afficher (évite le fallback « Notre approche » sur /notre-approche/). */
  const closing =
    override && 'intro' in override
      ? (override.intro || '').trim()
      : 'Un seul interlocuteur du premier relevé jusqu’à la prise en charge complète du dossier. Vos équipes n’ont pas à coordonner les intervenants.';
  const ctaButtons =
    override && 'buttons' in override
      ? override.buttons || []
      : [{ label: 'Notre approche', link: '/notre-approche/' }];
  const phaseBanner = override?.phaseBanner;

  return (
    <section className="sec-padding px-ultra-atm" data-px-atm="enjeux">
      <div className="px-ultra-atm__veil" aria-hidden="true" />
      <div className="px-ultra-atm__schema" aria-hidden="true" />
      <div className="container">
        <div className="sec-intro text-center mb-4">
          <span className="sub-title text-white border-white border-opacity-25 wow fadeInUp">{eyebrow}</span>
          <h2 className="sec-title text-white mb-0">{title}</h2>
        </div>
        {phaseBanner ? (
          <p className="px-ultra-timeline-phases px-ultra-timeline-phases--banner text-center text-white-50 mb-4">{phaseBanner}</p>
        ) : (
          <div className="px-ultra-timeline-phases">
            <div className="px-ultra-timeline-phases__avant">Avant travaux (01, 02)</div>
            <div className="px-ultra-timeline-phases__pendant">Pendant les travaux (03)</div>
            <div className="px-ultra-timeline-phases__apres">Après travaux (04, 05)</div>
          </div>
        )}
        <div className="px-ultra-timeline" data-px-timeline>
          <div className="px-ultra-timeline__track" aria-hidden="true">
            <div className="px-ultra-timeline__progress" />
          </div>
          {steps.map((s) => (
            <div key={s.num} className={`px-ultra-tl-step ${s.final ? 'px-ultra-tl-step--final' : ''}`}>
              <div className="px-ultra-tl-dot">{s.num}</div>
              <h4 className="text-white">{s.title}</h4>
              <p className="text-white-50">{s.text}</p>
            </div>
          ))}
        </div>
        {closing ? <p className="px-ultra-timeline-closing">{closing}</p> : null}
        {ctaButtons.length ? (
          <div className="mt-5 text-center d-flex flex-wrap justify-content-center gap-3">
            {ctaButtons.map((btn) => (
              <button
                key={`${btn.link}-${btn.label}`}
                type="button"
                onClick={() => onNavigate(btn.link)}
                className="btn btn-outline px-cta px-cta--l2 px-cta--l2-on-dark text-white border-white"
              >
                {btn.label} <i className="fa fa-arrow-right ms-1" /> <span />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export interface PublicProjectDto {
  id: string;
  path: string;
  title: string;
  client: string;
  location: string;
  department?: string;
  sector: string;
  badge?: string;
  primeCee?: string;
  cumac?: string;
  ceeSheet?: string;
  solution: string;
  summary: string;
  image: string;
  results: string[];
  featured?: boolean;
}

const FALLBACK_PROJECTS: PublicProjectDto[] = [
  {
    id: 'intermarche',
    path: '/realisations/intermarche-sortie-du-fioul/',
    title: 'Intermarché',
    client: 'Intermarché',
    location: 'Bourgogne-Franche-Comté',
    sector: 'Grande distribution',
    cumac: '14,8 GWh cumac',
    solution: '1 650 m² chauffés et sortis du fioul',
    summary: 'Bourgogne-Franche-Comté · Grande distribution',
    image: '/themes/ultra-s/images/pexen/pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp',
    results: ['14,8 GWh cumac* · sortie complète du fioul'],
    featured: true,
  },
  {
    id: 'carrefour',
    path: '/realisations/carrefour-market-recuperation-de-chaleur/',
    title: 'Carrefour Market',
    client: 'Carrefour Market',
    location: 'Île-de-France',
    sector: 'Grande distribution',
    cumac: '30,6 GWh cumac',
    solution: 'Froid, chaleur et toiture sous contrat de performance',
    summary: 'Île-de-France · Grande distribution',
    image: '/themes/ultra-s/images/pexen/recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp',
    results: ['30,6 GWh cumac* · objectif −40 %*'],
    featured: true,
  },
  {
    id: 'cedim',
    path: '/realisations/cedim-destratification/',
    title: 'CEDIM',
    client: 'CEDIM',
    location: 'Centre-Val de Loire',
    sector: 'Négoce et entrepôt',
    cumac: '2,1 GWh cumac',
    solution: 'Déstratification d’air en grande hauteur',
    summary: 'Centre-Val de Loire · Négoce et entrepôt',
    image: '/themes/ultra-s/images/pexen/destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp',
    results: ['2,1 GWh cumac*'],
    featured: true,
  },
  {
    id: 'colorcon',
    path: '/realisations/colorcon-efficacite-energetique-industrielle/',
    title: 'Colorcon',
    client: 'Colorcon',
    location: 'Île-de-France',
    sector: 'Industrie',
    cumac: '',
    solution: 'Chaufferie vapeur et froid process',
    summary: 'Île-de-France · Industrie pharmaceutique',
    image: '/themes/ultra-s/images/pexen/chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp',
    results: ['Utilités industrielles · fiches IND-UT'],
    featured: true,
  },
];

/** Section Réalisations : branchée sur les pages "project" du backoffice (/api/public/projects) */
export function UltraRealisationsMixSection({
  onNavigate,
  showAll = false,
  override,
}: {
  onNavigate: (p: string) => void;
  showAll?: boolean;
  override?: { eyebrow?: string; title?: string; intro?: string; showFilters?: boolean };
}) {
  const [projects, setProjects] = useState<PublicProjectDto[]>(FALLBACK_PROJECTS);
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  useEffect(() => {
    let alive = true;
    fetch('/api/public/projects')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PublicProjectDto[] | null) => {
        if (!alive || !Array.isArray(data) || data.length === 0) return;
        setProjects(
          data.map((p) => ({
            ...p,
            id: p.id || p.path,
            title: p.title || p.client || 'Réalisation',
            image: p.image || FALLBACK_PROJECTS[0].image,
            results: p.results || [],
            solution: p.solution || p.title || '',
            summary: p.summary || [p.location, p.sector].filter(Boolean).join(' · '),
          }))
        );
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  /* Listing /realisations/ : grille + onglets filtre. Teaser homepage : 3 cartes sans filtres. */
  const showFilters = showAll ? override?.showFilters !== false : override?.showFilters === true;
  const secEyebrow = override?.eyebrow || 'Nos réalisations';
  const secTitle = override?.title || 'Des projets concrets qui performent — commerce, industrie, tertiaire.';

  const sectors = ['all', ...Array.from(new Set(projects.map((p) => p.sector).filter(Boolean)))];
  const filtered = sectorFilter === 'all' ? projects : projects.filter((p) => p.sector === sectorFilter);
  const list = showAll ? filtered : filtered.slice(0, 3);

  /* Sur la page /realisations/ le pageHeader CMS porte déjà le titre — on allège le bandeau interne */
  const listingPage = showAll;
  const colClass = listingPage ? 'col-lg-6 col-md-6' : 'col-lg-4 col-md-6';
  return (
    <section
      id="realisations"
      className={`px-ultra-real-sec px-ultra-atm${listingPage ? '' : ' px-ultra-real-sec--standalone'}`}
      data-px-atm="realisations"
    >
      <div
        className="px-ultra-atm__photo"
        style={{ backgroundImage: "url('/themes/ultra-s/images/pexen/installation-technique.webp')" }}
        aria-hidden="true"
      />
      <div className="px-ultra-atm__veil" aria-hidden="true" />
      <div className="px-ultra-atm__schema" aria-hidden="true" />
      <div className="container">
        <div className={`px-ultra-real-sec__head ${listingPage ? 'mb-4' : 'mb-5'}`}>
          {listingPage ? (
            <>
              <span className="sub-title wow fadeInUp text-white border-white border-opacity-25">{secEyebrow}</span>
              <h2 className="sec-title text-white mb-0 mt-2">{secTitle}</h2>
              {override?.intro ? <p className="text-white-50 mb-0 mt-2 mx-auto" style={{ maxWidth: 560 }}>{override.intro}</p> : null}
            </>
          ) : (
            <div className="sec-intro text-center">
              <span className="sub-title wow fadeInUp text-white border-white border-opacity-25">{secEyebrow}</span>
              <h2 className="sec-title text-white mb-0">{secTitle}</h2>
            </div>
          )}
          {showFilters ? (
            <div className="px-ultra-real-sec__tabs d-flex flex-wrap gap-2 justify-content-center mt-4" role="tablist" aria-label="Filtrer les réalisations">
              {sectors.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={sectorFilter === s}
                  onClick={() => setSectorFilter(s)}
                  className={`px-ultra-real-sec__tab${sectorFilter === s ? ' is-active' : ''}`}
                >
                  {s === 'all' ? `Tous (${projects.length})` : s}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="row g-4">
          {list.map((c) => {
            /* Brief 01 / PDF conformité : pas d’€, pas de fiche, pas de ville — client · région/secteur · chiffre · cumac* */
            const techLines = (c.results || []).filter(
              (b) => b && !/€|BAT-|IND-|EQ-|EN-/i.test(b)
            );
            const meta = c.summary || [c.location, c.sector].filter(Boolean).join(' · ');
            const headline = c.solution || c.title;
            const detail = techLines[0] || (c.cumac ? (c.cumac.includes('*') ? c.cumac : `${c.cumac}*`) : '');
            return (
            <div key={c.id || c.path || c.title} className={colClass}>
              <article
                className="px-ultra-tera-card"
                onClick={() => onNavigate(c.path || '/realisations/')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onNavigate(c.path || '/realisations/');
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <img
                  src={c.image}
                  alt={c.client || c.title}
                  className={`px-ultra-tera-card__img${/intermarch[eé]/i.test(`${c.client} ${c.title} ${c.path} ${c.id}`) ? ' px-ultra-tera-card__img--intermarche' : ''}`}
                  loading="lazy"
                />
                <div className="px-ultra-tera-card__body">
                  <h3 className="mb-1">{c.client || c.title}</h3>
                  {meta ? <p className="small text-muted mb-2">{meta}</p> : null}
                  <p className="fw-semibold mb-2" style={{ color: 'var(--px-navy)' }}>{headline}</p>
                  {detail ? <p className="small mb-0">{detail}</p> : null}
                  <div className="px-ultra-tera-card__foot">
                    <strong>Voir le projet →</strong>
                  </div>
                </div>
              </article>
            </div>
            );
          })}
          {list.length === 0 ? (
            <div className="col-12">
              <p className="text-center text-white-50 mb-0">Aucune réalisation dans cette catégorie.</p>
            </div>
          ) : null}
        </div>
        {!showAll ? (
          <div className="text-center mt-5">
            <button type="button" onClick={() => onNavigate('/realisations/')} className="btn btn-outline px-cta px-cta--l2 px-cta--l2-on-dark text-white border-white">
              Voir toutes nos réalisations <i className="fa fa-arrow-right" />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

const PREUVES_LINKS: Record<string, string> = {
  '535': '/realisations/carrefour-market-recuperation-de-chaleur/',
  '1650': '/realisations/intermarche-sortie-du-fioul/',
  '47.5': '/realisations/',
  '40': '/expertises/contrat-performance-energetique/',
};

type PreuvesPartner = string | { name: string; logo?: string };

type PreuvesQuali = { label: string; alt?: string; logo?: string; caption?: string };

const PREUVES_CLIENTS: PreuvesPartner[] = [
  { name: 'Intermarché', logo: '/themes/ultra-s/images/pexen/partners/intermarche.png' },
  { name: 'Carrefour Market', logo: '/themes/ultra-s/images/pexen/partners/carrefour-market.png' },
  { name: 'CEDIM', logo: '/themes/ultra-s/images/pexen/partners/cedim.png' },
  { name: 'Colorcon', logo: '/themes/ultra-s/images/pexen/partners/colorcon.png' },
];

const PREUVES_QUALI: PreuvesQuali[] = [
  { label: 'RGE QualiPAC', alt: 'Qualification RGE QualiPAC de PEXEN', logo: '/themes/ultra-s/images/pexen/quali/qualipac.png?v=4' },
  { label: 'RGE Qualisol', alt: 'Qualification RGE Qualisol de PEXEN', logo: '/themes/ultra-s/images/pexen/quali/qualisol.png?v=4' },
  { label: 'OPQIBI', alt: 'Qualifications OPQIBI de PEXEN', logo: '/themes/ultra-s/images/pexen/quali/opqibi.png', caption: 'Via notre partenaire' },
  {
    label: 'Assurance décennale',
    alt: 'Qualification Assurance décennale',
    logo: '/themes/ultra-s/images/pexen/quali/assurance-decennale.png',
  },
];

function formatPreuvesFigure(value: string, decimals: number) {
  const [intPart, decPart] = (decimals ? Number(value).toFixed(decimals) : String(Math.round(Number(value)))).split('.');
  const spaced = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return decPart ? `${spaced},${decPart}` : spaced;
}

/** Suffixe « GWh cumac* » → GWh sur une ligne, cumac* en dessous (astérisque réduit). */
function PreuvesSuffix({ suffix }: { suffix: string }) {
  const trimmed = suffix.trim();
  const m = trimmed.match(/^GWh\s+cumac(\*?)$/i);
  if (m) {
    return (
      <span className="px-ultra-count-s px-ultra-count-s--stack">
        <span className="px-ultra-count-s__unit">GWh</span>
        <span className="px-ultra-count-s__sub">
          cumac{m[1] ? <sup className="px-ultra-count-s__star">*</sup> : null}
        </span>
      </span>
    );
  }
  if (trimmed.endsWith('*')) {
    return (
      <span className="px-ultra-count-s">
        {trimmed.slice(0, -1)}
        <sup className="px-ultra-count-s__star">*</sup>
      </span>
    );
  }
  return <span className="px-ultra-count-s">{suffix}</span>;
}

/** Bloc 2 — Preuves (logos clients + 4 chiffres + qualifications) — bande navy sous le hero */
export function UltraPreuvesSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    footnote?: string;
    partners?: PreuvesPartner[];
    qualifications?: PreuvesQuali[];
    items?: { value: string; suffix?: string; prefix?: string; label: string; hint?: string; link?: string }[];
  };
}) {
  const partners = override?.partners?.length ? override.partners : PREUVES_CLIENTS;
  const quali = override?.qualifications?.length ? override.qualifications : PREUVES_QUALI;
  const items = override?.items?.length
    ? override.items
    : [
        { value: '535', suffix: ' kW', label: 'de chaleur récupérée sur le froid commercial · Carrefour Market', link: PREUVES_LINKS['535'] },
        { value: '1650', suffix: ' m²', label: 'chauffés et sortis du fioul · Intermarché', link: PREUVES_LINKS['1650'] },
        { value: '47.5', suffix: ' GWh cumac*', label: 'd’économies d’énergie estimées sur 3 chantiers', link: PREUVES_LINKS['47.5'] },
        { value: '40', suffix: ' %*', label: 'd’économie d’énergie visée sur 10 ans par contrat de performance', link: PREUVES_LINKS['40'] },
      ];
  /* 3× pour une boucle marquee fluide sans logos collés */
  const brandLoop = [...partners, ...partners, ...partners];

  return (
    <section className="px-ultra-preuves" id="preuves">
      <div className="container">
        <p className="px-ultra-preuves__kicker">{override?.eyebrow || 'Ils nous confient leurs sites'}</p>
      </div>
      {/* Bande logos pleine largeur — sans dégradé ni encadré (retour V2 25/10) */}
      <div className="px-ultra-preuves__carousel" aria-label="Logos clients">
        <div className="px-ultra-preuves__carousel-track">
          {brandLoop.map((p, i) => {
            const name = typeof p === 'string' ? p : p.name;
            const logo = typeof p === 'string' ? undefined : p.logo;
            return (
              <div key={`${name}-${i}`} className="px-ultra-preuves__brand">
                {logo ? <img src={logo} alt={name} loading="lazy" /> : <span>{name}</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="container">
        <div className="px-ultra-preuves__grid">
          {items.slice(0, 4).map((it, i) => {
            const countRaw = String(it.value).replace(/[^\d.-]/g, '');
            const canCount = countRaw !== '' && !Number.isNaN(Number(countRaw));
            const decimals = countRaw.includes('.') ? 1 : 0;
            const display = canCount ? formatPreuvesFigure(countRaw, decimals) : it.value;
            const href = it.link || PREUVES_LINKS[countRaw] || '/realisations/';
            return (
              <button
                key={it.label + i}
                type="button"
                className="px-ultra-preuves__item"
                onClick={() => onNavigate(href)}
              >
                <div
                  className="px-ultra-preuves__fig"
                  {...(canCount
                    ? {
                        'data-px-count': countRaw,
                        'data-px-prefix': it.prefix || '',
                        'data-px-suffix': it.suffix || '',
                      }
                    : {})}
                >
                  {it.prefix || ''}
                  <span className="px-ultra-count-n">{display}</span>
                  {it.suffix ? <PreuvesSuffix suffix={it.suffix} /> : null}
                </div>
                <p className="px-ultra-preuves__label">{it.label}</p>
              </button>
            );
          })}
        </div>

        <p className="px-ultra-preuves__kicker px-ultra-preuves__kicker--after">Qualifiés et assurés</p>
        <a href="#qualifications" className="px-ultra-preuves__quali" onClick={(e) => {
          e.preventDefault();
          document.getElementById('qualifications')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}>
          {quali.map((q) => (
            <span
              key={q.label}
              title={q.alt || q.label}
              className={`px-ultra-preuves__quali-item${
                q.label === 'RGE QualiPAC' ? ' px-ultra-preuves__quali-item--lg' : ''
              }${/décennale|decennale/i.test(q.label) ? ' px-ultra-preuves__quali-item--wide' : ''}`}
            >
              {q.logo ? <img src={q.logo} alt={q.alt || q.label} /> : <strong>{q.label}</strong>}
              {q.caption ? <em>{q.caption}</em> : null}
            </span>
          ))}
        </a>
      </div>
    </section>
  );
}

/** Bloc 3 — Vos enjeux énergétiques (fond clair, 4 cartes) */
const ULTRA_ENJEUX_FALLBACK: {
  label: string;
  hint: string;
  link: string;
  image: string;
  ctaLabel: string;
}[] = [
  {
    label: 'Le froid, un poste énergétique majeur',
    hint: 'Sur les sites alimentaires et logistiques, la production frigorifique peut représenter une part majeure des consommations électriques. Régulation, HP flottante, récupération de chaleur ou modernisation des équipements : le potentiel d’optimisation se détermine à partir des conditions réelles d’exploitation.',
    link: '/solutions/froid-commercial-industriel/',
    image: '/themes/ultra-s/images/pexen/centrale-froid.webp',
    ctaLabel: 'Optimiser mon froid',
  },
  {
    label: 'Le décret tertiaire fixe une trajectoire',
    hint: '−40 % de consommation en 2030, −50 % en 2040, −60 % en 2050 pour les bâtiments tertiaires de 1 000 m² et plus, avec une déclaration annuelle sur OPERAT.',
    link: '/expertises/financement-cee-reglementation/',
    image: '/themes/ultra-s/images/pexen/drive-secteur-batiment-tertiaire.webp',
    ctaLabel: 'Préparer mon décret tertiaire',
  },
  {
    label: 'Le décret BACS impose le pilotage',
    hint: 'Un système d’automatisation et de contrôle est obligatoire au-delà de 290 kW de chauffage ou de climatisation depuis 2025, au-delà de 70 kW en 2030.',
    link: '/solutions/gtb-tertiaire-gtc/',
    image: '/themes/ultra-s/images/pexen/drive-pilotage-gtb-gtc.webp',
    ctaLabel: 'Mettre mon site en conformité BACS',
  },
  {
    label: 'Des installations à moderniser',
    hint: 'Chaudières fioul, réseaux non isolés, régulations figées : chaque équipement se dimensionne à partir d’un relevé sur site et d’une note de calcul.',
    link: '/expertises/bureau-etudes-fluides/',
    image: '/themes/ultra-s/images/pexen/drive-chauffage-traitement-dair.webp',
    ctaLabel: 'Faire étudier mes installations',
  },
];

export function UltraEnjeuxSection({
  onNavigate,
  override,
  variant = 'light',
}: {
  onNavigate: (p: string) => void;
  variant?: 'light' | 'navy';
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    items?: {
      value?: string;
      suffix?: string;
      prefix?: string;
      label: string;
      hint?: string;
      link?: string;
      image?: string;
      imageAlt?: string;
      ctaLabel?: string;
    }[];
  };
}) {
  const items = (override?.items?.length ? override.items : ULTRA_ENJEUX_FALLBACK).map((it, i) => {
    const fb = ULTRA_ENJEUX_FALLBACK[i] || ULTRA_ENJEUX_FALLBACK[0];
    return {
      label: it.label || fb.label,
      hint: it.hint || fb.hint,
      link: it.link || fb.link,
      image: it.image || fb.image,
      imageAlt: it.imageAlt || it.label || fb.label,
      ctaLabel: it.ctaLabel || fb.ctaLabel,
    };
  });

  return (
    <section id="enjeux" className={`px-enjeux sec-padding ${variant === 'navy' ? 'px-ultra-atm' : 'bg-light'}`} {...(variant === 'navy' ? { 'data-px-atm': 'enjeux' } : {})}>
      <div className="container">
        <div className="sec-intro text-center mb-5">
          <span className="sub-title wow fadeInUp">{override?.eyebrow || 'Vos enjeux'}</span>
          <h2 className="sec-title mb-0">{override?.title || 'Vos enjeux énergétiques'}</h2>
        </div>
        <div className="row g-4">
          {items.slice(0, 4).map((it, i) => (
            <div key={it.label + i} className="col-md-6 col-xl-3">
              <article
                className="px-ultra-enjeux-card"
                role="button"
                tabIndex={0}
                onClick={() => onNavigate(it.link || '/solutions/')}
                onKeyDown={(e) => e.key === 'Enter' && onNavigate(it.link || '/solutions/')}
              >
                <div
                  className="px-ultra-enjeux-card__img"
                  style={{ backgroundImage: `url('${it.image}')` }}
                  role="img"
                  aria-label={it.imageAlt}
                />
                <div className="px-ultra-enjeux-card__body">
                  <h3>{it.label}</h3>
                  {it.hint ? <p>{it.hint}</p> : null}
                  <span className="px-cta px-cta--l3 px-ultra-enjeux-card__action">
                    {it.ctaLabel}{' '}
                    <span className="px-cta__arrow" aria-hidden="true">→</span>
                  </span>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BRIEF_CONTACT_FIELDS: ContactFormField[] = [
  {
    id: 'f-vousEtes',
    name: 'vousEtes',
    label: 'Vous êtes',
    type: 'select',
    required: true,
    width: 'half',
    placeholder: 'Sélectionnez',
    error: 'Sélectionnez votre profil.',
    options: [
      'Entreprise ou gestionnaire de site',
      'Bailleur, syndic ou gestionnaire de bâtiments collectifs',
      'Partenaire professionnel (délégataire, mandataire, fabricant, bureau d’études)',
      'Autres',
    ],
  },
  {
    id: 'f-typeSite',
    name: 'typeSite',
    label: 'Type de site',
    type: 'select',
    required: true,
    width: 'half',
    placeholder: 'Sélectionnez',
    error: 'Sélectionnez le type de site.',
    options: ['Industrie', 'Tertiaire', 'Bâtiment collectif', 'Autres'],
  },
  { id: 'f-nomPrenom', name: 'nomPrenom', label: 'Nom et prénom', type: 'text', required: true, width: 'half', placeholder: 'Ex. : Claire Martin', error: 'Indiquez votre nom et prénom.' },
  { id: 'f-societe', name: 'societe', label: 'Société', type: 'text', required: true, width: 'half', placeholder: 'Ex. : Groupe Martin Distribution', error: 'Indiquez le nom de votre société.' },
  { id: 'f-email', name: 'email', label: 'E-mail professionnel', type: 'email', required: true, width: 'half', placeholder: 'prenom.nom@societe.fr', error: 'Indiquez une adresse e-mail valide.' },
  { id: 'f-telephone', name: 'telephone', label: 'Téléphone', type: 'tel', required: true, width: 'half', placeholder: '01 23 45 67 89', error: 'Indiquez un numéro de téléphone valide.' },
  {
    id: 'f-fonction',
    name: 'fonction',
    label: 'Fonction',
    type: 'select',
    required: false,
    width: 'half',
    placeholder: 'Sélectionnez',
    options: ['Direction technique', 'Responsable de site', 'Services généraux', 'Direction générale', "Bureau d'études", 'Autre'],
  },
  { id: 'f-projet', name: 'projet', label: 'Votre projet', type: 'textarea', required: true, width: 'full', placeholder: 'Site, installations concernées, échéance…', error: 'Décrivez votre projet en quelques mots.' },
  {
    id: 'f-rgpd',
    name: 'rgpdAccepted',
    label: 'J’accepte que PEXEN utilise ces informations pour répondre à ma demande, conformément à la politique de confidentialité.',
    type: 'checkbox',
    required: true,
    width: 'full',
    error: 'Votre accord est nécessaire pour traiter votre demande.',
  },
];

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isFrPhone(raw: string): boolean {
  const compact = raw.replace(/[\s.\-()]/g, '');
  return /^(?:\+33|0033)[1-9]\d{8}$/.test(compact) || /^0[1-9]\d{8}$/.test(compact);
}

function readDemandeParam(): string {
  try {
    return new URLSearchParams(window.location.search).get('demande')?.trim().toLowerCase() || '';
  } catch {
    return '';
  }
}

function trackLead(profil: string, typeSite: string, demande = '') {
  try {
    const saved = localStorage.getItem('pexen_cookie_consent');
    if (!saved) return;
    const parsed = JSON.parse(saved) as { analytics?: boolean };
    if (!parsed.analytics) return;
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    const params = {
      profil,
      type_site: typeSite,
      page: window.location.pathname,
      demande: demande || undefined,
    };
    w.gtag?.('event', 'generate_lead', params);
    w.gtag?.('event', 'lead_envoye', params);
    if (demande === 'etude') w.gtag?.('event', 'demande_etude', params);
  } catch {
    /* ignore */
  }
}

const SUCCESS_COPY = 'Merci, votre demande a bien été envoyée. Elle sera traitée dans les meilleurs délais par un ingénieur PEXEN.';

/** Formulaire court 00c — champs CMS, honeypot, confirmation puis /contact/merci/ */
export function UltraProgressiveContactSection({
  onNavigate,
  formId = 'contact-main',
  override,
}: {
  onNavigate: (p: string) => void;
  formId?: string;
  override?: {
    title?: string;
    intro?: string;
    privacyPath?: string;
    phoneHint?: string;
    listItems?: string[];
    submitLabel?: string;
    hidePhone?: boolean;
  };
}) {
  const info = usePexenInfo();
  const [demande, setDemande] = useState(() => (typeof window !== 'undefined' ? readDemandeParam() : ''));
  const isEtude = demande === 'etude';
  const formTitle = override?.title || (isEtude ? 'Demander une étude' : 'Parlons de votre projet');
  const formIntro =
    override?.intro ||
    (isEtude
      ? 'Décrivez votre site et vos installations. Un ingénieur PEXEN dimensionne le gisement et vous répond sous 48 h ouvrées.'
      : 'Décrivez votre site, vos installations et vos échéances. Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.');
  const privacyPath = override?.privacyPath || '/politique-de-confidentialite/';
  const hidePhone = override?.hidePhone === true || !override?.phoneHint;
  const afterItems =
    override?.listItems?.length
      ? override.listItems
      : [
          'Un ingénieur étudie votre demande.',
          'Il prend contact avec vous pour qualifier le besoin.',
          'Nous organisons la visite technique de votre site.',
        ];
  const [formCfg, setFormCfg] = useState<Omit<ContactFormConfig, 'recipientEmails'> | null>(null);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isContactPage = typeof window !== 'undefined' && /^\/contact\/?$/.test(window.location.pathname);
  const TitleTag: 'h1' | 'h2' = isContactPage ? 'h1' : 'h2';

  useEffect(() => {
    const sync = () => setDemande(readDemandeParam());
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(`/api/public/forms/${encodeURIComponent(formId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Omit<ContactFormConfig, 'recipientEmails'> | null) => {
        if (alive && data && Array.isArray(data.fields)) setFormCfg(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [formId]);

  /* ?demande=etude : préremplit le champ projet + suivi Analytics distinct. */
  useEffect(() => {
    if (!isEtude) return;
    setValues((prev) => {
      if (prev.projet) return prev;
      return {
        ...prev,
        projet:
          'Demande d’étude énergétique : relever les installations, chiffrer le gisement et les CEE, proposer un plan d’actions.',
      };
    });
  }, [isEtude]);

  const fields: ContactFormField[] = formCfg?.fields?.length ? formCfg.fields : BRIEF_CONTACT_FIELDS;

  const visible = fields.filter((f) => f.type !== 'checkbox');
  const boxes = fields.filter((f) => f.type === 'checkbox');
  const setVal = (name: string, val: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    for (const f of fields) {
      const v = values[f.name];
      const empty = v === undefined || v === '' || v === false;
      if (f.required && empty) errs[f.name] = f.error || `Merci de renseigner : ${f.label.toLowerCase()}.`;
      else if (!empty && f.type === 'email' && !EMAIL_OK.test(String(v))) errs[f.name] = f.error || 'Indiquez une adresse e-mail valide.';
      else if (!empty && f.type === 'tel' && !isFrPhone(String(v))) errs[f.name] = f.error || 'Indiquez un numéro de téléphone valide.';
    }
    return errs;
  };

  const renderRgpdLabel = (label: string) => {
    const parts = label.split(/(politique de confidentialité)/i);
    return parts.map((part, i) =>
      /politique de confidentialité/i.test(part) ? (
        <a key={i} href={privacyPath} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      )
    );
  };

  const renderField = (f: ContactFormField) => {
    const full = f.width === 'full' || f.type === 'textarea' || f.type === 'checkbox';
    const val = String(values[f.name] ?? '');
    const err = errors[f.name];
    return (
      <div key={f.id} className={`${full ? 'col-12' : 'col-md-6'} form-group`}>
        <label htmlFor={`u-${f.name}`}>
          {f.label} {f.required ? '*' : ''}
        </label>
        {f.type === 'select' ? (
          <select id={`u-${f.name}`} className="form-control" value={val} onChange={(e) => setVal(f.name, e.target.value)} required={f.required} aria-invalid={!!err}>
            <option value="">{f.placeholder || 'Sélectionnez'}</option>
            {(f.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : f.type === 'textarea' ? (
          <textarea
            id={`u-${f.name}`}
            rows={4}
            className="form-control"
            placeholder={f.placeholder || ''}
            value={val}
            onChange={(e) => setVal(f.name, e.target.value)}
            required={f.required}
            aria-invalid={!!err}
          />
        ) : (
          <input
            id={`u-${f.name}`}
            type={f.type}
            className="form-control"
            placeholder={f.placeholder || ''}
            value={val}
            onChange={(e) => setVal(f.name, e.target.value)}
            required={f.required}
            autoComplete={f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : undefined}
            aria-invalid={!!err}
          />
        )}
        {err ? (
          <p className="px-contact__error" role="alert">
            {err}
          </p>
        ) : null}
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus({ kind: 'err', text: Object.values(errs)[0] });
      return;
    }

    const honeypot = formCfg?.honeypotField || 'website_url';
    const hpInput = (e.currentTarget as HTMLFormElement).elements.namedItem(honeypot) as HTMLInputElement | null;
    const payload: Record<string, unknown> = {
      ...values,
      [honeypot]: hpInput?.value || '',
      ...(demande ? { demande } : {}),
    };
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/forms/${encodeURIComponent(formId)}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        trackLead(String(values.vousEtes || ''), String(values.typeSite || ''), demande);
        setStatus({ kind: 'ok', text: formCfg?.successMessage || SUCCESS_COPY });
        setValues({});
        window.setTimeout(() => onNavigate(body?.redirect || formCfg?.successPath || '/contact/merci/'), 1600);
      } else if (res.status === 429) {
        setStatus({ kind: 'err', text: 'Trop de demandes envoyées. Réessayez dans quelques minutes ou appelez-nous au ' + info.phone + '.' });
      } else {
        if (body?.fields) setErrors(body.fields as Record<string, string>);
        setStatus({ kind: 'err', text: body?.error || "L’envoi n’a pas abouti. Réessayez dans quelques instants ou appelez-nous au " + info.phone + '.' });
      }
    } catch {
      setStatus({ kind: 'err', text: "L’envoi n’a pas abouti. Réessayez dans quelques instants ou appelez-nous au " + info.phone + '.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="px-contact px-contact--navy sec-padding px-ultra-atm" data-px-atm="cta">
      <div className="px-ultra-atm__photo" style={{ backgroundImage: "url('/themes/ultra-s/images/pexen/performance-energetique.webp')" }} aria-hidden="true" />
      <div className="px-ultra-atm__veil" aria-hidden="true" />
      <div className="px-ultra-atm__schema" aria-hidden="true" />
      <div className="container">
        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            {isContactPage ? (
              <nav className="px-ultra-crumbs" aria-label="Fil d’Ariane">
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate('/');
                  }}
                >
                  Accueil
                </a>
                <span aria-hidden="true">/</span>
                <span aria-current="page">Contact</span>
              </nav>
            ) : null}
            <span className="sub-title text-white border-white border-opacity-25">Contact</span>
            <TitleTag className="sec-title text-white">{formTitle}</TitleTag>
            <p className="lead-sm text-white-50 mb-4">{formIntro}</p>
            <ul className="px-contact__facts">
              {!hidePhone ? (
                <li>
                  <i className="fa fa-phone" />
                  <span>
                    Téléphone : <a href={`tel:${info.phoneClean}`}>{info.phone}</a>
                  </span>
                </li>
              ) : null}
              <li>
                <i className="fa fa-map-marker-alt" />
                <span>Île-de-France, interventions dans toute la France</span>
              </li>
            </ul>
            <h3 className="px-contact__after-title">Ce qui se passe après votre demande</h3>
            <ol className="px-contact__after">
              {afterItems.map((it, idx) => (
                <li key={it}>
                  <strong className="me-1">{idx + 1}.</strong> {it}
                </li>
              ))}
            </ol>
          </div>
          <div className="col-lg-7">
            <div className="px-contact__card">
              {status?.kind === 'ok' ? (
                <div className="px-form-msg px-form-msg--ok" role="status">
                  {status.text}
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  <div className="px-hp" aria-hidden="true">
                    <input id="u-website_url" type="text" name="website_url" tabIndex={-1} autoComplete="off" defaultValue="" />
                  </div>
                  <div className="row g-3">
                    {/* Étape 1 : Vous êtes & Type de site */}
                    {visible.filter((f) => ['vousEtes', 'typeSite'].includes(f.name)).map((f) => renderField(f))}
                    {/* Étape 2 : s'affiche dès que l'étape 1 est renseignée */}
                    {(values.vousEtes || values.typeSite || Object.keys(errors).length > 0)
                      ? visible.filter((f) => ['nomPrenom', 'societe', 'email', 'telephone', 'fonction'].includes(f.name)).map((f) => renderField(f))
                      : null}
                    {/* Étape 3 : Projet */}
                    {(values.nomPrenom || values.email || values.societe || Object.keys(errors).length > 0)
                      ? visible.filter((f) => !['vousEtes', 'typeSite', 'nomPrenom', 'societe', 'email', 'telephone', 'fonction'].includes(f.name)).map((f) => renderField(f))
                      : null}
                  </div>
                  {/* Indice « suite » tant que l’étape 2 n’est pas ouverte */}
                  {!(values.vousEtes || values.typeSite || Object.keys(errors).length > 0) ? (
                    <div className="px-contact__more" aria-hidden="true">
                      <span>Sélectionnez pour afficher la suite</span>
                      <i className="fa fa-chevron-down" />
                    </div>
                  ) : null}
                  {/* Cases consentement, bouton et mentions */}
                  {(values.nomPrenom || values.email || values.societe || Object.keys(errors).length > 0) ? (
                    <>
                      {boxes.map((cb) => (
                        <div key={cb.id} className="form-group mt-3">
                          <label className="px-ultra-rgpd">
                            <input type="checkbox" checked={Boolean(values[cb.name])} onChange={(e) => setVal(cb.name, e.target.checked)} required={cb.required} />
                            <span>
                              {renderRgpdLabel(cb.label)}
                              {cb.required ? ' *' : ''}
                            </span>
                          </label>
                          {errors[cb.name] ? (
                            <p className="px-contact__error" role="alert">
                              {errors[cb.name]}
                            </p>
                          ) : null}
                        </div>
                      ))}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mt-3">
                        <button type="submit" disabled={submitting} className="px-contact__submit">
                          {submitting ? 'Envoi en cours…' : override?.submitLabel || 'Envoyer ma demande'}
                        </button>
                        <a className="px-contact__legal" href="/mentions-legales/" target="_blank" rel="noopener noreferrer">
                          Mentions légales
                        </a>
                      </div>
                      <p className="px-contact__gdpr-note">
                        Vos données sont traitées par PEXEN SAS pour répondre à votre demande et ne sont jamais cédées. Vous pouvez exercer vos droits à tout moment :{' '}
                        <a href="mailto:rgpd@pexen.fr">rgpd@pexen.fr</a>.
                      </p>
                    </>
                  ) : null}
                  {status?.kind === 'err' ? (
                    <div className="px-form-msg px-form-msg--err" role="alert">
                      {status.text}
                    </div>
                  ) : null}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section Secteurs d'intervention (Industrie, Tertiaire, Résidentiel collectif) */
export function UltraSecteursSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    items?: { image: string; imageAlt?: string; title: string; text?: string; bullets: string[]; link?: string; linkLabel?: string }[];
  };
}) {
  const fromCms = override?.items?.filter((it) => it.title);
  const list = fromCms?.length
    ? fromCms.map((it) => ({
        key: it.link || it.title,
        image: it.image || '/themes/ultra-s/images/pexen/efficacite-energetique-tertiaire-pexen.webp',
        imageAlt: it.imageAlt || it.title,
        title: it.title,
        text: it.text || '',
        path: it.link || '/secteurs/',
        cta: it.linkLabel || 'Découvrir →',
      }))
    : SECTEURS.map((s) => ({
        key: s.slug,
        image: s.image,
        imageAlt: s.title,
        title: s.title,
        text: s.heroTitle,
        path: `/secteurs/${s.slug}/`,
        cta: 'Découvrir →',
      }));

  return (
    <section className="sec-padding bg-white px-ultra-schema-bg">
      <div className="container">
        <div className="sec-intro text-center mb-5">
          <span className="sub-title wow fadeInUp">{override?.eyebrow || 'Secteurs'}</span>
          <h2 className="sec-title mb-0">
            {(override?.title || 'Industrie, tertiaire, bâtiments collectifs :\nune approche 100 % B2B')
              .split(/\n/)
              .map((line, i, arr) => (
                <span key={`${i}-${line.slice(0, 12)}`}>
                  {line}
                  {i < arr.length - 1 ? <br /> : null}
                </span>
              ))}
          </h2>
        </div>
        <div className="row g-4">
          {list.map((s) => (
            <div key={s.key} className="col-lg-3 col-md-6">
              <article className="px-ultra-tera-card h-100" onClick={() => onNavigate(s.path)} role="button" tabIndex={0}>
                <img src={s.image} alt={s.imageAlt || s.title} className="px-ultra-tera-card__img" style={{ height: 200 }} loading="lazy" />
                <div className="px-ultra-tera-card__body">
                  <h3>{s.title}</h3>
                  {s.text ? <p className="px-ultra-tera-card__text">{s.text}</p> : null}
                  <div className="px-ultra-tera-card__foot">
                    <span className="px-cta px-cta--l3 px-ultra-btn--card">
                      {(s.cta || 'Découvrir →').replace(/\s*→\s*$/, '')}{' '}
                      <span className="px-cta__arrow" aria-hidden="true">→</span>
                    </span>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Répertoire interactif des Fiches CEE maîtrisées par PEXEN */
export function UltraCeeTableSection({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [q, setQ] = useState('');
  const filtered = CEE_SHEETS.filter(
    (s) =>
      !q.trim() ||
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.codeTertiaire.toLowerCase().includes(q.toLowerCase()) ||
      s.codeIndustrie.toLowerCase().includes(q.toLowerCase()) ||
      s.description.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <section className="sec-padding bg-white">
      <div className="container">
        <div className="row align-items-end mb-4 gy-3">
          <div className="col-lg-7">
            <span className="sub-title wow fadeInUp">Référentiel réglementaire</span>
            <h2 className="sec-title mb-2">Les principales fiches CEE mobilisées par nos ingénieurs</h2>
            <p className="mb-0">
              Recherchez par technologie ou par code officiel (ex. <strong>BAT-TH-134</strong>, <strong>IND-UT-116</strong>, <strong>BAT-TH-116</strong>).
            </p>
          </div>
          <div className="col-lg-5">
            <input
              type="search"
              className="form-control"
              placeholder="Rechercher une fiche CEE (ex: HP flottante, BAT-TH-134, BACS…)"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ borderRadius: 12, padding: '.75rem 1rem', border: '1px solid #CBD5E1' }}
            />
          </div>
        </div>

        <div className="table-responsive px-ultra-block border" style={{ borderColor: '#E2E8F0' }}>
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: 'var(--px-navy)', color: '#fff' }}>
              <tr>
                <th className="py-3 px-4">Opération standardisée</th>
                <th className="py-3 px-3">Code Tertiaire</th>
                <th className="py-3 px-3">Code Industrie</th>
                <th className="py-3 px-3">Gains énergétiques typiques</th>
                <th className="py-3 px-4">Financement CEE</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-4">
                    <strong style={{ color: 'var(--px-navy)', display: 'block' }}>{item.name}</strong>
                    <small className="text-muted">{item.description}</small>
                  </td>
                  <td className="py-3 px-3">
                    <span className="badge" style={{ background: '#E0F7FC', color: 'var(--px-navy)', fontWeight: 700, padding: '.4rem .65rem' }}>
                      {item.codeTertiaire}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="badge" style={{ background: '#F1F5F9', color: 'var(--px-navy)', fontWeight: 700, padding: '.4rem .65rem' }}>
                      {item.codeIndustrie}
                    </span>
                  </td>
                  <td className="py-3 px-3 fw-semibold" style={{ color: 'var(--px-navy)', fontSize: '.9rem' }}>
                    {item.typicalSavings}
                  </td>
                  <td className="py-3 px-4" style={{ fontSize: '.88rem', color: 'var(--px-primary)', fontWeight: 700 }}>
                    {item.coverageEstimate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <p className="mb-0 small text-muted">
            * Le volume de kWh cumac dépend de la zone climatique, de la puissance nominale et du régime de fonctionnement de votre site.
          </p>
          <button type="button" onClick={() => onNavigate('/estimation-financement/')} className="btn btn-primary px-cta px-cta--l1">
            Estimer le financement <i className="fa fa-arrow-right ms-1" /> <span />
          </button>
        </div>
      </div>
    </section>
  );
}

type GarantLogo = { src: string; alt?: string; size?: 'sm' | 'md' | 'lg' | 'wide' };
type GarantCard = {
  tag?: string;
  title?: string;
  icon?: string;
  logos?: GarantLogo[];
  items: string[];
  /** Descriptions CMS (checklist entries.text), alignées sur items */
  itemDetails?: (string | undefined)[];
};

const LIVRABLE_BLURBS: [RegExp, string][] = [
  [/audit/i, 'État des lieux, consommations par usage, scénarios de travaux chiffrés.'],
  [/dpe|tertiaire/i, 'Diagnostic de performance énergétique des bâtiments tertiaires.'],
  [/dimensionnement|note|sign/i, 'Notes datées et signées, exigées pour valoriser de nombreuses opérations.'],
  [/gisement|calcul|action/i, "Calcul du gisement d'économies, action par action."],
];

function livrableDetail(title: string, cms?: string) {
  const fromCms = (cms || '').trim();
  if (fromCms) return fromCms;
  const t = title.toLowerCase();
  for (const [re, blurb] of LIVRABLE_BLURBS) {
    if (re.test(t)) return blurb;
  }
  return 'Document remis à l’issue de l’étude, prêt pour la décision et le financement.';
}

function parseColonItem(raw: string): { heading?: string; body: string } {
  const m = raw.match(/^([^:]{3,120}):\s*(.+)$/s);
  if (m) return { heading: m[1].trim(), body: m[2].trim() };
  return { body: raw.trim() };
}

function parseLivrableLine(raw: string, cmsDetail?: string): { title: string; detail: string } {
  const merged = raw.match(/^(.+?)\s+[—–-]\s+(.+)$/s);
  if (merged) {
    return { title: merged[1].trim(), detail: merged[2].trim() };
  }
  return { title: raw.trim(), detail: livrableDetail(raw, cmsDetail) };
}

/** Grille livrables : clic → texte descriptif sur la photo */
function UltraLivrablesVizSection({
  eyebrow,
  sectionTitle,
  lead,
  rows,
}: {
  eyebrow?: string;
  sectionTitle: string;
  lead: string;
  rows: { title: string; detail: string; image: string }[];
}) {
  const [open, setOpen] = useState<number | null>(null);
  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  return (
    <section className="sec-padding px-ultra-livrables px-ultra-livrables--viz">
      <div className="container">
        <header className="px-ultra-livrables__viz-head">
          {eyebrow ? <span className="px-ultra-livrables__eyebrow">{eyebrow}</span> : null}
          <h2 className="px-ultra-livrables__heading">{sectionTitle}</h2>
          <p className="px-ultra-livrables__lead">{lead}</p>
        </header>
        <div className="px-ultra-livrables__viz-grid">
          {rows.map((row, i) => {
            const isOpen = open === i;
            return (
              <article
                key={`${row.title}-${i}`}
                className={`px-ultra-livrables__tile${isOpen ? ' px-ultra-livrables__tile--open' : ''}`}
                onClick={() => toggle(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle(i);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isOpen}
              >
                <img className="px-ultra-livrables__img" src={row.image} alt="" loading="lazy" />
                <div className="px-ultra-livrables__shade" aria-hidden="true" />
                <div className="px-ultra-livrables__copy">
                  <span className="px-ultra-livrables__badge">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="px-ultra-livrables__label">{row.title}</h3>
                  <p className="px-ultra-livrables__detail">{row.detail}</p>
                  <span className="px-ultra-livrables__hint" aria-hidden="true">
                    {isOpen ? 'Fermer' : 'Cliquer pour le détail'}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const GARANT_FALLBACK_LOGOS: GarantLogo[][] = [
  [
    { src: '/themes/ultra-s/images/pexen/quali/qualipac.png?v=4', alt: 'RGE QualiPAC', size: 'lg' },
    { src: '/themes/ultra-s/images/pexen/quali/qualisol.png?v=4', alt: 'RGE Qualisol', size: 'md' },
  ],
  [{ src: '/themes/ultra-s/images/pexen/quali/opqibi.png', alt: 'OPQIBI', size: 'lg' }],
  [
    {
      src: '/themes/ultra-s/images/pexen/quali/assurance-decennale.png',
      alt: 'Qualification Assurance décennale',
      size: 'wide',
    },
  ],
];

function garantLogoClass(size?: GarantLogo['size']) {
  if (size === 'lg') return 'px-ultra-garant-logo px-ultra-garant-logo--opqibi';
  if (size === 'wide') return 'px-ultra-garant-logo px-ultra-garant-logo--decennale';
  if (size === 'sm') return 'px-ultra-garant-logo px-ultra-garant-logo--sm';
  return 'px-ultra-garant-logo';
}

/** Section Qualifications — logos éditables (CMS) + fallbacks thème */
export function UltraGarantiesSection({
  override,
}: {
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    cards?: GarantCard[];
  };
}) {
  const cards: GarantCard[] = override?.cards?.length
    ? override.cards
    : [
        {
          title: 'Qualifications PEXEN',
          icon: 'fa-certificate',
          logos: GARANT_FALLBACK_LOGOS[0],
          items: [
            'RGE QualiPAC (chauffage et eau chaude sanitaire)',
            'RGE Qualisol CESI',
          ],
        },
        {
          title: 'Audit énergétique, via notre bureau d’études partenaire',
          icon: 'fa-drafting-compass',
          logos: GARANT_FALLBACK_LOGOS[1],
          items: [
            'OPQIBI 1905 (bâtiments tertiaires et collectifs)',
            'OPQIBI 1717 (industrie)',
          ],
        },
        {
          title: 'Assurances et contrôle',
          icon: 'fa-shield-alt',
          logos: GARANT_FALLBACK_LOGOS[2],
          items: [
            'RC Pro et décennale MIC Insurance',
            'Opérations CEE contrôlées par un organisme accrédité COFRAC',
          ],
        },
      ];
  const introRaw = (override?.intro || '').trim();
  const showIntro = introRaw && !/logos officiels|ancre #/i.test(introRaw);
  const fromCms = Boolean(override?.cards?.length);
  const n = cards.length;
  const colClass = n <= 1 ? 'col-12' : n === 2 ? 'col-md-6' : 'col-lg-4';
  const isListPanel = fromCms && n === 1;

  /* Checklist CMS 1 carte → variantes pro selon le type de contenu. */
  if (isListPanel) {
    const panel = cards[0];
    const items = panel?.items || [];
    const sectionTitle = override?.title || panel?.title || 'Nos livrables';
    const titleKey = sectionTitle.toLowerCase();
    const isLivrables = /livrables|documents remis/.test(titleKey);
    const isDiag = /pourquoi|consomment|trop|enjeu|cause|probl/.test(titleKey);
    const isMetrics = /indicateur|suivons|mesure|suivi|monit/.test(titleKey);
    const DOC_ICONS = ['fa-file-alt', 'fa-file-signature', 'fa-drafting-compass', 'fa-chart-line', 'fa-clipboard-check', 'fa-folder-open'];
    const DIAG_ICONS = ['fa-temperature-high', 'fa-store', 'fa-tachometer-alt', 'fa-fan', 'fa-bolt', 'fa-exclamation-triangle'];
    const METRIC_ICONS = ['fa-thermometer-half', 'fa-sync-alt', 'fa-bolt', 'fa-snowflake', 'fa-chart-area', 'fa-clock'];

    const renderEnumerate = (tone: 'navy' | 'light', defaultEyebrow: string, defaultLead?: string) => (
      <section className={`sec-padding px-ultra-diag${tone === 'light' ? ' px-ultra-diag--light' : ''}`}>
        <div className="container">
          <header className="px-ultra-diag__head">
            {override?.eyebrow ? <span className="px-ultra-diag__eyebrow">{override.eyebrow}</span> : (
              <span className="px-ultra-diag__eyebrow">{defaultEyebrow}</span>
            )}
            <h2 className="px-ultra-diag__title">{sectionTitle}</h2>
            {showIntro ? <p className="px-ultra-diag__lead">{introRaw}</p> : defaultLead ? (
              <p className="px-ultra-diag__lead">{defaultLead}</p>
            ) : null}
          </header>
          <div className="px-ultra-diag__grid px-ultra-diag__grid--auto">
            {items.map((it, i) => {
              const line = parseColonItem(it);
              return (
                <article key={`${it.slice(0, 24)}-${i}`} className="px-ultra-diag__card">
                  <div className="px-ultra-diag__top">
                    <span className="px-ultra-diag__num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="px-ultra-diag__icon" aria-hidden="true">
                      <i className={`fa ${DIAG_ICONS[i % DIAG_ICONS.length]}`} />
                    </span>
                  </div>
                  <p className="px-ultra-diag__text">
                    {line.heading ? <span className="px-ultra-diag__item-title">{line.heading}</span> : null}
                    {line.heading ? ' ' : null}
                    {line.body}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    );

    if (isDiag) {
      return renderEnumerate(
        'navy',
        'Diagnostic',
        'Les causes les plus fréquentes d’une surconsommation frigorifique.',
      );
    }

    if (isMetrics) {
      return (
        <section className="sec-padding px-ultra-metrics">
          <div className="container">
            <header className="px-ultra-metrics__head">
              {override?.eyebrow ? <span className="px-ultra-metrics__eyebrow">{override.eyebrow}</span> : (
                <span className="px-ultra-metrics__eyebrow">Pilot</span>
              )}
              <h2 className="px-ultra-metrics__title">{sectionTitle}</h2>
              {showIntro ? <p className="px-ultra-metrics__lead">{introRaw}</p> : (
                <p className="px-ultra-metrics__lead">Des grandeurs mesurées avant et après travaux, pour prouver le gain.</p>
              )}
            </header>
            <div className="px-ultra-metrics__rail">
              {items.map((it, i) => (
                <article key={it} className="px-ultra-metrics__tile">
                  <div className="px-ultra-metrics__icon" aria-hidden="true">
                    <i className={`fa ${METRIC_ICONS[i % METRIC_ICONS.length]}`} />
                  </div>
                  <div className="px-ultra-metrics__body">
                    <span className="px-ultra-metrics__num">Indicateur {String(i + 1).padStart(2, '0')}</span>
                    <h3 className="px-ultra-metrics__label">{it}</h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      );
    }

    if (!isLivrables) {
      return renderEnumerate('light', 'Repères', '');
    }

    const kicker = panel?.title && panel.title !== override?.title ? panel.title : 'Documents remis à chaque étape';
    const IMG = '/themes/ultra-s/images/pexen';
    const FALLBACK_SHOTS = [
      `${IMG}/audit-energetique-entreprise.webp`,
      `${IMG}/cee-tertiaire.webp`,
      `${IMG}/ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp`,
      `${IMG}/performance-energetique.webp`,
      `${IMG}/audit-batiment.webp`,
      `${IMG}/contrat-de-performance-energetique-sur-une-centrale-de-froid-commercial.webp`,
    ];
    const shotFor = (label: string, i: number) => {
      const t = label.toLowerCase();
      if (/audit/.test(t)) return `${IMG}/audit-energetique-entreprise.webp`;
      if (/dpe|tertiaire|operat/.test(t)) return `${IMG}/cee-tertiaire.webp`;
      if (/dimensionnement|note|sign/.test(t)) return `${IMG}/ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp`;
      if (/gisement|calcul|action/.test(t)) return `${IMG}/performance-energetique.webp`;
      return FALLBACK_SHOTS[i % FALLBACK_SHOTS.length];
    };
    void DOC_ICONS;

    const details = panel?.itemDetails;
    const rows = items.map((it, i) => {
      const parsed = parseLivrableLine(it, details?.[i]);
      return {
        title: parsed.title,
        detail: parsed.detail,
        image: shotFor(parsed.title, i),
      };
    });

    return (
      <UltraLivrablesVizSection
        eyebrow={override?.eyebrow}
        sectionTitle={sectionTitle}
        lead={showIntro ? introRaw : kicker}
        rows={rows}
      />
    );
  }

  return (
    <section id="qualifications" className="sec-padding bg-light">
      <div className="container">
        <div className="sec-intro text-center mb-4 mb-lg-5">
          {override?.eyebrow || !fromCms ? (
            <span className="sub-title wow fadeInUp">{override?.eyebrow || 'Qualifications & Assurances'}</span>
          ) : null}
          <h2 className="sec-title">{override?.title || 'Qualifiés, assurés, contrôlés'}</h2>
          {showIntro ? (
            <p className="lead-sm mx-auto" style={{ maxWidth: 680 }}>
              {introRaw}
            </p>
          ) : null}
        </div>
        <div className={`row g-4 ${n === 1 ? '' : 'justify-content-center'}`}>
          {cards.map((c, idx) => {
            const explicitLogos = c.logos?.filter((l) => l.src) || [];
            /* Fallbacks RGE uniquement sur la section homepage (pas de cards CMS). */
            const logos = explicitLogos.length ? explicitLogos : fromCms ? [] : GARANT_FALLBACK_LOGOS[idx] || [];
            const showLogoRow = logos.length > 0 || Boolean(c.icon);
            return (
            <div key={c.title || c.tag || idx} className={colClass}>
              <div
                className="px-ultra-garant-card bg-white h-100 border d-flex flex-column p-4"
                style={{ borderColor: '#E2E8F0' }}
              >
                {showLogoRow ? (
                  <div
                    className="px-ultra-garant-logos d-flex align-items-center justify-content-center mb-4 pb-2 border-bottom"
                    style={{ borderColor: '#F1F5F9', minHeight: 64 }}
                  >
                    {logos.length ? (
                      <div className="d-flex align-items-center justify-content-center gap-3 flex-wrap">
                        {logos.map((logo) => (
                          <img
                            key={`${logo.src}-${logo.alt || ''}`}
                            src={logo.src}
                            alt={logo.alt || c.title || 'Logo'}
                            className={garantLogoClass(logo.size)}
                          />
                        ))}
                      </div>
                    ) : c.icon ? (
                      <i className={`fa ${c.icon} fs-3`} style={{ color: 'var(--px-primary)' }} aria-hidden="true" />
                    ) : null}
                  </div>
                ) : null}
                {c.title ? (
                  <h3 className="h5 mb-3" style={{ color: 'var(--px-navy)' }}>
                    {c.title}
                  </h3>
                ) : null}
                <ul className="list-unstyled mb-0 flex-grow-1">
                  {c.items.map((it) => (
                    <li key={it} className="d-flex align-items-start gap-2 mb-2" style={{ fontSize: '.9rem', color: '#334155' }}>
                      <i className="fa fa-check mt-1" style={{ color: '#01CDF3', fontSize: '0.8rem' }} />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Section FAQ interactive en accordéon */
export function UltraFaqSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    items?: { question: string; answer: string }[];
    showContactCard?: boolean;
  };
}) {
  const [openIdx, setOpenIdx] = useState<number>(0);
  const faqItems = override?.items?.length ? override.items : FAQ_HOME;
  const eyebrow = override?.eyebrow || 'Questions fréquentes';
  const title = override?.title || 'Questions fréquentes sur la performance énergétique';
  const showAside = override?.showContactCard !== false;

  return (
    <section className="sec-padding bg-white px-ultra-schema-bg">
      <div className="container">
        <div className="row gy-5 align-items-start">
          <div className={showAside ? 'col-lg-5' : 'col-lg-4'}>
            <span className="sub-title wow fadeInUp">{eyebrow}</span>
            <h2 className="sec-title">{title}</h2>
            {showAside ? (
              <div className="px-ultra-faq-aside p-4 mt-4" style={{ background: 'var(--px-navy)', color: '#fff' }}>
                <h3 className="h5 text-white mb-2">Une question spécifique sur vos installations ?</h3>
                <p className="small text-white-50 mb-3">Échangez directement avec un ingénieur PEXEN.</p>
                <button type="button" onClick={() => onNavigate('/contact/')} className="btn btn-primary px-cta px-cta--l1 btn-sm">
                  Poser ma question <i className="fa fa-arrow-right ms-1" /> <span />
                </button>
              </div>
            ) : null}
          </div>
          <div className={showAside ? 'col-lg-7' : 'col-lg-8'}>
            <div className="d-flex flex-column gap-3">
              {faqItems.map((item, idx) => {
                const isOpen = openIdx === idx;
                return (
                  <div
                    key={item.question}
                    className="px-ultra-faq-item border overflow-hidden"
                    style={{
                      borderColor: isOpen ? 'var(--px-primary)' : '#E2E8F0',
                      background: isOpen ? '#F8FAFC' : '#fff',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                      className="w-100 text-start p-4 bg-transparent border-0 d-flex align-items-center justify-content-between gap-3 fw-bold"
                      style={{ color: 'var(--px-navy)', fontSize: '1rem' }}
                      aria-expanded={isOpen}
                    >
                      <span>{item.question}</span>
                      <i className={`fa ${isOpen ? 'fa-minus' : 'fa-plus'}`} style={{ color: 'var(--px-primary)' }} />
                    </button>
                    {/* Réponses toujours dans le DOM pour SEO / FAQPage (HTML riche depuis le BO) */}
                    <div
                      className="px-4 pb-4 px-ultra-faq-answer"
                      hidden={!isOpen}
                      style={{ color: '#475569', fontSize: '.94rem', lineHeight: 1.65 }}
                      dangerouslySetInnerHTML={{
                        __html: /<[a-z][\s\S]*>/i.test(item.answer || '')
                          ? item.answer
                          : `<p>${(item.answer || '')
                              .replace(/&/g, '&amp;')
                              .replace(/</g, '&lt;')
                              .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
                              .replace(/(\/estimation-financement\/?)/g, '<a href="$1">Estimer le financement</a>')}</p>`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Bandeau d’estimation (accueil) ou outil 3 étapes — jamais le mot « simulation ». */
export function UltraSimulatorSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: Partial<SimulatorData>;
}) {
  const d = mergeSimulatorData(override);

  if (d.variant === 'teaser') {
    return (
      <section className="py-4 bg-white border-top border-bottom" id="estimation">
        <div className="container">
          <div className="row align-items-center gy-3">
            <div className="col-lg-8">
              <h2 className="h5 mb-1" style={{ color: 'var(--px-navy)' }}>
                {d.title || 'Estimer le financement de votre projet'}
              </h2>
              {d.intro ? <p className="mb-1 small text-secondary">{d.intro}</p> : null}
              <p className="mb-0" style={{ fontSize: 12, color: '#94a3b8' }}>
                {d.teaserNote || 'Première estimation indicative : le dimensionnement est établi après analyse du site.'}
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button type="button" onClick={() => onNavigate(d.teaserCtaLink || '/estimation-financement/')} className="btn btn-outline px-cta px-cta--l2">
                {d.teaserCtaLabel || 'Estimer le financement'} <i className="fa fa-arrow-right ms-1" /> <span />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="sec-padding bg-white px-ultra-schema-bg" id="outil-estimation">
      <div className="container">
        {d.title || d.intro ? (
          <div className="sec-intro mb-4 mb-lg-5">
            {d.eyebrow ? <span className="sub-title wow fadeInUp">{d.eyebrow}</span> : null}
            {d.title ? <h2 className="sec-title">{d.title}</h2> : null}
            {d.intro ? (
              <p className="lead-sm" style={{ maxWidth: 720 }}>
                {d.intro}
              </p>
            ) : null}
          </div>
        ) : null}
        <CeeSimulator config={d} onNavigate={onNavigate} />
        {d.howTitle || d.howText ? (
          <div className="px-cee-how">
            {d.howTitle ? <h2>{d.howTitle}</h2> : null}
            {d.howText ? <p>{d.howText}</p> : null}
          </div>
        ) : null}
        {d.contactTitle || d.contactText ? (
          <div className="px-cee-talk">
            <div>
              <h2>{d.contactTitle || 'Un projet ? Parlons-en.'}</h2>
              <p>{d.contactText}</p>
            </div>
            <button type="button" className="btn btn-primary px-cta px-cta--l1" onClick={() => onNavigate('/contact/')}>
              Parler de votre projet <i className="fa fa-arrow-right" />
              <span />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
