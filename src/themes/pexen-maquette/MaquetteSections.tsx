import React, { useState } from 'react';
import { MaquetteInfinity } from './MaquetteInfinity';
import {
  UltraFaqSection,
  UltraProgressiveContactSection,
  UltraRealisationsMixSection,
  UltraSimulatorSection,
} from '../pexen-ultra/UltraSections';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;

const ENJEUX_ICONS = ['fa-snowflake', 'fa-building', 'fa-desktop', 'fa-drafting-compass'];
const ENJEUX_CTAS = [
  'Optimiser mon froid',
  'Préparer mon décret tertiaire',
  'Mettre mon site en conformité BACS',
  'Faire étudier mes installations',
];
const ENJEUX_IMAGES = [
  IMG('centrale-froid.webp'),
  IMG('drive-secteur-batiment-tertiaire.webp'),
  IMG('drive-pilotage-gtb-gtc.webp'),
  IMG('drive-chauffage-traitement-dair.webp'),
];

type Partner = string | { name: string; logo?: string };
type Quali = { label: string; alt?: string; logo?: string; caption?: string };

const DEFAULT_PARTNERS: Partner[] = [
  { name: 'Intermarché', logo: IMG('partners/intermarche.webp') },
  { name: 'Carrefour Market', logo: IMG('partners/carrefour-market.webp') },
  { name: 'CEDIM', logo: IMG('partners/cedim.webp') },
  { name: 'Colorcon', logo: IMG('partners/colorcon.webp') },
];

const DEFAULT_QUALI: Quali[] = [
  { label: 'RGE QualiPAC', logo: IMG('quali/qualipac.webp') },
  { label: 'RGE Qualisol', logo: IMG('quali/qualisol.webp') },
  { label: 'OPQIBI', logo: IMG('quali/opqibi.webp'), caption: 'Partenaire Leo Energy' },
  { label: 'Décennale MIC', logo: IMG('quali/mic.webp') },
];

export function MaquetteHeroSection({
  onNavigate,
  d,
}: {
  onNavigate: (p: string) => void;
  d: {
    badgeText?: string;
    title: string;
    subtitle?: string;
    buttons?: { label: string; link?: string; variant?: string }[];
    mainImage?: string;
    videoPoster?: string;
  };
}) {
  const primary = d.buttons?.[0];
  const secondary = d.buttons?.[1];
  const bg = d.mainImage || d.videoPoster || IMG('centrale-froid.webp');

  return (
    <section className="px-maq-hero" id="accueil">
      <div className="px-maq-hero__bg" style={{ backgroundImage: `url('${bg}')` }} aria-hidden="true" />
      <div className="px-maq-hero__veil" aria-hidden="true" />
      <div className="px-maq-hero__grid">
        <div>
          {d.badgeText ? <span className="px-maq-hero__kicker">{d.badgeText}</span> : null}
          <h1 className="px-maq-hero__title">{d.title}</h1>
          {d.subtitle ? <p className="px-maq-hero__lead">{d.subtitle}</p> : null}
          <div className="px-maq-hero__actions">
            {primary ? (
              <button type="button" className="px-maq-btn px-maq-btn--cyan" onClick={() => onNavigate(primary.link || '/contact/')}>
                {primary.label}
              </button>
            ) : null}
            {secondary ? (
              <button type="button" className="px-maq-btn px-maq-btn--secondary" onClick={() => onNavigate(secondary.link || '/realisations/')}>
                {secondary.label}
              </button>
            ) : null}
          </div>
        </div>
        <MaquetteInfinity photo={bg} />
      </div>
    </section>
  );
}

/** Bande Preuves = logos clients + 4 KPIs cyan + chips quali (proposition.png) */
export function MaquetteKpisSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    footnote?: string;
    partners?: Partner[];
    qualifications?: Quali[];
    items?: { value: string; prefix?: string; suffix?: string; label: string; link?: string }[];
  };
}) {
  const partners = override?.partners?.length ? override.partners : DEFAULT_PARTNERS;
  const quali = override?.qualifications?.length ? override.qualifications : DEFAULT_QUALI;
  const items = override?.items?.length
    ? override.items
    : [
        { value: '535', suffix: ' kW', label: 'de chaleur récupérée sur le froid commercial · Carrefour Market', link: '/realisations/carrefour-market-recuperation-de-chaleur/' },
        { value: '1 650', suffix: ' m²', label: 'chauffés et sortis du fioul · Intermarché', link: '/realisations/intermarche-sortie-du-fioul/' },
        { value: '47,5', suffix: ' GWh cumac*', label: 'd’économies d’énergie estimées sur 3 chantiers', link: '/realisations/' },
        { value: '40', suffix: ' %*', label: 'd’économie d’énergie visée sur 10 ans par contrat de performance', link: '/contrat-de-performance-energetique/' },
      ];
  const loop = [...partners, ...partners, ...partners];

  return (
    <section className="px-maq-preuves" id="preuves">
      <div className="px-maq-container">
        <p className="px-maq-preuves__kicker">{override?.eyebrow || 'Ils nous confient leurs sites'}</p>
        <div className="px-maq-preuves__carousel" aria-label="Clients">
          <div className="px-maq-preuves__track">
            {loop.map((p, i) => {
              const name = typeof p === 'string' ? p : p.name;
              const logo = typeof p === 'string' ? undefined : p.logo;
              return (
                <div key={`${name}-${i}`} className="px-maq-preuves__brand">
                  {logo ? <img src={logo} alt={name} loading="lazy" /> : <span>{name}</span>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-maq-kpis__grid">
          {items.slice(0, 4).map((it, i) => {
            const countRaw = String(it.value).replace(/[^\d.-]/g, '');
            const canCount = countRaw !== '' && !Number.isNaN(Number(countRaw));
            return (
              <button key={it.label + i} type="button" className="px-maq-kpis__item" onClick={() => onNavigate(it.link || '/realisations/')}>
                <div
                  className="px-maq-kpis__fig"
                  {...(canCount
                    ? {
                        'data-px-count': countRaw,
                        'data-px-prefix': it.prefix || '',
                        'data-px-suffix': it.suffix || '',
                      }
                    : {})}
                >
                  {it.prefix || ''}
                  <span className="px-maq-count-n">{it.value}</span>
                  {it.suffix ? <span className="px-maq-count-s">{it.suffix}</span> : null}
                </div>
                <p className="px-maq-kpis__label">{it.label}</p>
              </button>
            );
          })}
        </div>

        <div className="px-maq-preuves__quali">
          <p className="px-maq-preuves__quali-title">Qualifiés et assurés</p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {quali.map((q) => (
              <span
                key={q.label}
                className={`px-maq-preuves__chip ${q.label === 'RGE QualiPAC' ? 'px-maq-preuves__chip--lg' : ''}`}
                title={q.alt || q.label}
              >
                {q.logo ? <img src={q.logo} alt={q.alt || q.label} /> : <strong>{q.label}</strong>}
                {q.caption ? (
                  <em style={{ fontStyle: 'normal', fontSize: '0.62rem', opacity: 0.7 }}>{q.caption}</em>
                ) : q.logo ? (
                  <em style={{ fontStyle: 'normal', fontSize: '0.62rem', opacity: 0.55 }}>{q.label}</em>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MaquetteEnjeuxSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    title?: string;
    items?: { label: string; hint?: string; link?: string }[];
  };
}) {
  const items = override?.items?.length
    ? override.items
    : [
        { label: 'Le froid, un poste énergétique majeur', hint: 'Sur les sites alimentaires et logistiques, la production frigorifique peut représenter une part majeure des consommations électriques.', link: '/solutions/froid-commercial-industriel/' },
        { label: 'Le décret tertiaire fixe une trajectoire', hint: '−40 % de consommation en 2030, −50 % en 2040, −60 % en 2050 pour les bâtiments tertiaires de 1 000 m² et plus.', link: '/decret-tertiaire-decret-bacs/' },
        { label: 'Le décret BACS impose le pilotage', hint: 'Un système d’automatisation et de contrôle est obligatoire au-delà de 290 kW depuis 2025, au-delà de 70 kW en 2030.', link: '/solutions/pilotage-gtb-decret-bacs/' },
        { label: 'Des installations à moderniser', hint: 'Chaudières fioul, réseaux non isolés, régulations figées : chaque équipement se dimensionne à partir d’un relevé sur site.', link: '/etudes-ingenierie-energetique/' },
      ];

  return (
    <section className="px-maq-sec px-maq-sec--white" id="enjeux">
      <div className="px-maq-container">
        <span className="px-maq-sec__eyebrow wow fadeInUp">Vos enjeux</span>
        <h2 className="px-maq-sec__title">{override?.title || 'Vos enjeux énergétiques'}</h2>
        <div className="px-maq-enjeux">
          {items.slice(0, 4).map((it, i) => (
            <article
              key={it.label + i}
              className="px-maq-enjeux__card"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(it.link || '/solutions/')}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate(it.link || '/solutions/')}
            >
              <div
                className="px-maq-enjeux__img"
                style={{ backgroundImage: `url('${ENJEUX_IMAGES[i] || IMG('centrale-froid.webp')}')` }}
                aria-hidden="true"
              />
              <span className="px-maq-enjeux__icon">
                <i className={`fa ${ENJEUX_ICONS[i] || 'fa-bolt'}`} />
              </span>
              <h3>{it.label}</h3>
              {it.hint ? <p>{it.hint}</p> : null}
              <span className="px-maq-enjeux__more px-maq-link-action">{ENJEUX_CTAS[i] || 'En savoir plus'} →</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const INTER_ICONS = ['fa-cogs', 'fa-hard-hat', 'fa-chart-line', 'fa-euro-sign'];

export function MaquetteInterlocuteurSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    items?: { title: string; text: string; path?: string }[];
  };
}) {
  const items = override?.items?.length
    ? override.items
    : [
        { title: 'Ingénierie', text: 'Ingénierie fluides (chauffage, ventilation, climatisation, plomberie) et efficacité énergétique, réalisées en interne.', path: '/etudes-ingenierie-energetique/' },
        { title: 'Travaux', text: 'Installation par nos équipes, suivi de chantier, AMO et mise en service, sans interrompre votre exploitation.', path: '/accompagnement-travaux/' },
        { title: 'Suivi de performance', text: 'Contrôle de conformité, suivi des consommations après travaux, contrat de performance énergétique.', path: '/contrat-de-performance-energetique/' },
        { title: 'Financement CEE', text: 'Éligibilité vérifiée dès l’étude, dossier constitué avec les pièces du chantier.', path: '/decret-tertiaire-decret-bacs/' },
      ];

  return (
    <section className="px-maq-sec px-maq-sec--surface" id="interlocuteur">
      <div className="px-maq-container">
        <span className="px-maq-sec__eyebrow wow fadeInUp">{override?.eyebrow || 'Nos expertises'}</span>
        <h2 className="px-maq-sec__title">{override?.title || 'Un seul interlocuteur, de l’étude à la performance suivie'}</h2>
        <div className="px-maq-inter">
          {items.slice(0, 4).map((it, i) => (
            <div key={it.title} className="px-maq-inter__item" role="button" tabIndex={0} onClick={() => onNavigate(it.path || '/')}>
              <span className="px-maq-inter__icon">
                <i className={`fa ${INTER_ICONS[i] || 'fa-bolt'}`} />
              </span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
              <span className="px-maq-btn px-maq-btn--card">Découvrir →</span>
            </div>
          ))}
        </div>
        <div className="px-maq-inter__callout">
          <p>
            {override?.intro ||
              'Nos travaux ne se limitent pas aux opérations CEE : chaque solution est d’abord dimensionnée pour la performance de votre site.'}
          </p>
        </div>
      </div>
    </section>
  );
}

export function MaquetteExpertisesMasonry({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    items?: { title: string; text?: string; path?: string; image?: string }[];
  };
}) {
  const fallback = [
    { title: 'Froid commercial et industriel', text: 'Régulation HP et BP flottantes, condenseurs haute efficacité, VEV, fermeture des meubles.', image: IMG('centrale-froid.webp'), path: '/solutions/froid-commercial-industriel/' },
    { title: 'Récupération de chaleur', text: 'La chaleur des groupes froids et des process chauffe les locaux et l’eau.', image: IMG('installation-technique.webp'), path: '/solutions/recuperation-de-chaleur/' },
    { title: 'Chauffage et traitement d’air', text: 'Pompes à chaleur, déstratification des grands volumes.', image: IMG('pompes-a-chaleur-toiture.webp'), path: '/solutions/pompe-a-chaleur-tertiaire/' },
    { title: 'Pilotage GTB / GTC', text: 'Gestion technique de classe A ou B, conformité décret BACS.', image: IMG('climatisation-toiture.webp'), path: '/solutions/pilotage-gtb-decret-bacs/' },
    { title: 'Isolation technique', text: 'Toitures-terrasses, calorifugeage, matelas isolants.', image: IMG('cee-tertiaire.webp'), path: '/solutions/isolation-technique/' },
  ];
  const items = (override?.items?.length ? override.items : fallback).map((it, i) => ({
    ...it,
    image: it.image || fallback[i % fallback.length]?.image,
  }));
  const mainItems = items.slice(0, 5);

  return (
    <section className="px-maq-sec px-maq-sec--white" id="expertises">
      <div className="px-maq-container">
        <span className="px-maq-sec__eyebrow wow fadeInUp">{override?.eyebrow || 'Solutions'}</span>
        <h2 className="px-maq-sec__title">{override?.title || 'Cinq expertises pour la performance énergétique de vos sites'}</h2>
        <div className="px-maq-masonry">
          {mainItems.map((it, i) => (
            <article
              key={it.title + i}
              className="px-maq-masonry__tile"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(it.path || '/solutions/')}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate(it.path || '/solutions/')}
            >
              <img src={it.image || IMG('centrale-froid.webp')} alt={it.title} loading="lazy" className="anim-zoom" />
              <div className="px-maq-masonry__body">
                <span className="px-maq-masonry__num">{String(i + 1).padStart(2, '0')}</span>
                <h3>{it.title}</h3>
                {it.text ? <p>{it.text}</p> : null}
                <button className="px-maq-masonry__discover" type="button">
                  Découvrir →
                </button>
              </div>
            </article>
          ))}
        </div>
        <p className="px-maq-masonry__all">
          <button type="button" className="px-maq-btn px-maq-btn--secondary" onClick={() => onNavigate('/solutions/')}>
            Découvrir toutes nos solutions
          </button>
        </p>
      </div>
    </section>
  );
}

export function MaquetteTimelineSection({
  onNavigate,
  override,
}: {
  onNavigate?: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    items?: { num: string; title: string; text: string }[];
    ctaLabel?: string;
    ctaPath?: string;
  };
}) {
  const items = override?.items?.length
    ? override.items
    : [
        { num: '01', title: 'Étude et éligibilité', text: 'Audit énergétique, relevés sur site et calcul du gisement.' },
        { num: '02', title: 'Ingénierie et planification', text: 'Notes de dimensionnement, devis et plan de financement.' },
        { num: '03', title: 'Travaux et suivi de chantier', text: 'Installation, AMO et mise en service sans interruption.' },
        { num: '04', title: 'Fin de travaux et contrôle', text: 'Réception et contrôle par un organisme accrédité COFRAC.' },
        { num: '05', title: 'Prise en charge et suivi', text: 'Suivi du dossier et des consommations après travaux.' },
      ];

  return (
    <section className="px-maq-sec px-maq-sec--navy" id="parcours">
      <div className="px-maq-container">
        <span className="px-maq-sec__eyebrow wow fadeInUp">{override?.eyebrow || 'Votre projet'}</span>
        <h2 className="px-maq-sec__title">{override?.title || 'Votre projet en 5 étapes, de l’étude au suivi'}</h2>
        <div className="px-maq-steps__phases">
          <span>Avant travaux</span>
          <span>Pendant les travaux</span>
          <span>Après travaux</span>
        </div>
        <div className="px-maq-steps">
          {items.slice(0, 5).map((it, i) => (
            <div key={it.num + it.title} className="px-maq-steps__item">
              <div className="px-maq-steps__num">{it.num || String(i + 1).padStart(2, '0')}</div>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </div>
          ))}
        </div>
        <p className="px-maq-steps__final">
          Un seul interlocuteur du premier relevé jusqu'à la prise en charge complète du dossier. Vos équipes n'ont pas à coordonner les intervenants.
        </p>
        {override?.ctaLabel && onNavigate ? (
          <div className="px-maq-steps__cta">
            <button type="button" className="px-maq-btn px-maq-btn--secondary" onClick={() => onNavigate(override.ctaPath || '/notre-approche/')}>
              {override.ctaLabel}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function MaquetteRealisationsSection({
  onNavigate,
  showAll = false,
  override,
}: {
  onNavigate: (p: string) => void;
  showAll?: boolean;
  override?: { eyebrow?: string; title?: string; intro?: string; showFilters?: boolean };
}) {
  return <UltraRealisationsMixSection onNavigate={onNavigate} showAll={showAll} override={override} />;
}

export function MaquetteQualiSection({
  override,
}: {
  override?: {
    eyebrow?: string;
    title?: string;
    intro?: string;
    cards?: { tag?: string; title: string; items: string[] }[];
  };
}) {
  const cards = override?.cards?.length
    ? override.cards
    : [
        { title: 'Qualifications PEXEN', items: ['RGE QualiPAC (chauffage et ECS)', 'RGE Qualisol CESI'] },
        { title: 'Audit énergétique, via notre bureau d’études partenaire', items: ['OPQIBI 1905 (tertiaire et collectifs)', 'OPQIBI 1717 (industrie)'] },
        { title: 'Assurances et contrôle', items: ['RC Pro et décennale MIC Insurance', 'Contrôle par organisme accrédité lors des réceptions'] },
      ];

  return (
    <section className="px-maq-sec px-maq-sec--surface" id="qualifications">
      <div className="px-maq-container">
        <h2 className="px-maq-sec__title">{override?.title || 'Qualifiés, assurés, contrôlés'}</h2>
        <div className="px-maq-quali">
          {cards.slice(0, 3).map((c) => (
            <article key={c.title} className="px-maq-quali__card">
              {c.title.includes('Qualifications') ? (
                <div className="px-maq-quali__logo px-maq-quali__logo--multi">
                  <img src={IMG('quali/qualipac.webp')} alt="RGE QualiPAC" />
                  <img src={IMG('quali/qualisol.webp')} alt="RGE Qualisol" />
                </div>
              ) : c.title.includes('Assurance') ? (
                <div className="px-maq-quali__logo">
                  <img src={IMG('quali/mic.webp')} alt="Assurance décennale MIC Insurance" />
                </div>
              ) : (
                <div className="px-maq-quali__logo">
                  <img src={IMG('quali/opqibi.webp')} alt="OPQIBI" />
                </div>
              )}
              <h3>{c.title.includes('Assurance') ? 'Assurance décennale & contrôle' : c.title}</h3>
              <ul>
                {c.items.map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MaquetteSecteursSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    items?: { title: string; text?: string; link?: string; image?: string }[];
  };
}) {
  const items = override?.items?.length
    ? override.items
    : [
        { title: 'Industrie', text: 'Froid process, vapeur et air comprimé optimisés pendant que la production tourne.', link: '/secteurs/efficacite-energetique-industrielle/', image: IMG('drive-secteur-industriel.webp') },
        { title: 'Tertiaire', text: 'Commerce, bureaux, logistique : trajectoire décret tertiaire et BACS.', link: '/secteurs/efficacite-energetique-tertiaire/', image: IMG('drive-secteur-batiment-tertiaire.webp') },
        { title: 'Bâtiments collectifs', text: 'Chaufferies et réseaux modernisés pour les résidences.', link: '/secteurs/batiments-collectifs/', image: IMG('drive-secteur-renovation-globale-collectif.webp') },
        { title: 'Partenaires', text: 'Délégataires, mandataires, fabricants et bureaux d’études.', link: '/partenaires/', image: IMG('drive-equipe-pexen.webp') },
      ];

  return (
    <section className="px-maq-sec px-maq-sec--white" id="secteurs">
      <div className="px-maq-container">
        <span className="px-maq-sec__eyebrow">{override?.eyebrow || 'Secteurs'}</span>
        <h2 className="px-maq-sec__title">{override?.title || 'Industrie, tertiaire, bâtiments collectifs : une approche 100 % B2B'}</h2>
        <div className="px-maq-secteurs">
          {items.slice(0, 4).map((it) => (
            <div
              key={it.title}
              className="px-maq-secteurs__card"
              role="button"
              tabIndex={0}
              onClick={() => onNavigate(it.link || '/secteurs/')}
              onKeyDown={(e) => e.key === 'Enter' && onNavigate(it.link || '/secteurs/')}
            >
              <div
                className="px-maq-secteurs__img"
                style={{ backgroundImage: `url('${it.image || IMG('centrale-froid.webp')}')` }}
                aria-hidden="true"
              />
              <div className="px-maq-secteurs__body">
                <h3>{it.title}</h3>
                {it.text ? <p>{it.text}</p> : null}
                <span className="px-maq-btn px-maq-btn--card">Découvrir →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MaquetteContactSection({
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
    listItems?: string[];
    submitLabel?: string;
  };
}) {
  return (
    <UltraProgressiveContactSection
      onNavigate={onNavigate}
      formId={formId}
      override={{ ...override, phoneHint: '', hidePhone: true }}
    />
  );
}

export function MaquetteFaqSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: {
    eyebrow?: string;
    title?: string;
    showContactCard?: boolean;
    items?: { question: string; answer: string }[];
  };
}) {
  const items = override?.items || [];
  const [open, setOpen] = useState<number | null>(0);

  if (!items.length) {
    return <UltraFaqSection onNavigate={onNavigate} override={override} />;
  }

  return (
    <section className="px-maq-sec px-maq-sec--white" id="faq">
      <div className="px-maq-container">
        <div className="px-maq-faq">
          <div>
            <span className="px-maq-sec__eyebrow">FAQ</span>
            <h2 className="px-maq-sec__title">{override?.title || 'Questions fréquentes sur la performance énergétique'}</h2>
          </div>
          <div className="px-maq-faq__list">
            {items.map((it, i) => {
              const isOpen = open === i;
              return (
                <div key={it.question} className="px-maq-faq__item">
                  <button type="button" className="px-maq-faq__q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)}>
                    {it.question}
                    <span>{isOpen ? '−' : '+'}</span>
                  </button>
                  <div
                    className="px-maq-faq__a"
                    dangerouslySetInnerHTML={{ __html: it.answer }}
                    hidden={!isOpen}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MaquetteSimulatorSection({
  onNavigate,
  override,
}: {
  onNavigate: (p: string) => void;
  override?: unknown;
}) {
  return <UltraSimulatorSection onNavigate={onNavigate} override={override as never} />;
}

export function MaquettePageHeader({
  onNavigate,
  d,
}: {
  onNavigate: (p: string) => void;
  d: {
    title: string;
    intro?: string;
    eyebrow?: string;
    image?: string;
    breadcrumb?: boolean;
    parentLabel?: string;
    parentLink?: string;
  };
}) {
  return (
    <section className="px-maq-page-hero">
      <div
        className="px-maq-page-hero__bg"
        style={{ backgroundImage: `url('${d.image || IMG('renovation-energetique.webp')}')` }}
        aria-hidden="true"
      />
      <div className="px-maq-page-hero__veil" aria-hidden="true" />
      <div className="px-maq-container">
        {d.breadcrumb ? (
          <nav className="px-maq-crumbs" aria-label="Fil d’Ariane">
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
              }}
            >
              Accueil
            </a>
            {d.parentLabel && d.parentLink && d.parentLink !== '/' ? (
              <>
                {' / '}
                <a
                  href={d.parentLink}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(d.parentLink || '/');
                  }}
                >
                  {d.parentLabel}
                </a>
              </>
            ) : null}
            {' / '}
            <span aria-current="page">{d.title}</span>
          </nav>
        ) : null}
        {d.eyebrow ? <span className="px-maq-sec__eyebrow">{d.eyebrow}</span> : null}
        <h1>{d.title}</h1>
        {d.intro ? <p>{d.intro}</p> : null}
      </div>
    </section>
  );
}
