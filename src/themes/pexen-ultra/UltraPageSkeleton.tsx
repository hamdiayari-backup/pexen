import React from 'react';

type SkeletonKind = 'listing' | 'project' | 'contact' | 'legal' | 'default';

function kindFromPath(path: string): SkeletonKind {
  const p = path.endsWith('/') ? path : `${path}/`;
  if (/^\/realisations\/.+/i.test(p)) return 'project';
  if (
    p === '/realisations/' ||
    p === '/solutions/' ||
    p === '/secteurs/' ||
    p === '/expertises/' ||
    p === '/partenaires/'
  ) {
    return 'listing';
  }
  if (p.startsWith('/contact')) return 'contact';
  if (
    p === '/mentions-legales/' ||
    p === '/politique-de-confidentialite/' ||
    p === '/cookies/'
  ) {
    return 'legal';
  }
  return 'default';
}

function Bone({ className = '' }: { className?: string }) {
  return <span className={`px-ultra-sk__bone ${className}`} aria-hidden="true" />;
}

function SectionHead() {
  return (
    <div className="px-ultra-sk__head">
      <Bone className="px-ultra-sk__pill" />
      <Bone className="px-ultra-sk__title" />
      <Bone className="px-ultra-sk__lead" />
    </div>
  );
}

function CardGrid({ count = 6, tall }: { count?: number; tall?: boolean }) {
  return (
    <div className={`px-ultra-sk__grid ${tall ? 'px-ultra-sk__grid--tall' : ''}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="px-ultra-sk__card">
          <Bone className="px-ultra-sk__card-media" />
          <div className="px-ultra-sk__card-body">
            <Bone className="px-ultra-sk__line px-ultra-sk__line--md" />
            <Bone className="px-ultra-sk__line" />
            <Bone className="px-ultra-sk__line px-ultra-sk__line--sm" />
            <Bone className="px-ultra-sk__cta" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListingSkeleton() {
  return (
    <>
      <div className="px-ultra-sk__hero px-ultra-sk__hero--short">
        <div className="container">
          <Bone className="px-ultra-sk__crumb" />
          <Bone className="px-ultra-sk__hero-title" />
          <Bone className="px-ultra-sk__hero-lead" />
        </div>
      </div>
      <div className="container px-ultra-sk__section">
        <SectionHead />
        <CardGrid count={6} tall />
      </div>
    </>
  );
}

function ProjectSkeleton() {
  return (
    <>
      <div className="px-ultra-sk__hero px-ultra-sk__hero--project">
        <div className="container">
          <Bone className="px-ultra-sk__crumb" />
          <Bone className="px-ultra-sk__hero-title px-ultra-sk__hero-title--wide" />
          <div className="px-ultra-sk__chips">
            <Bone className="px-ultra-sk__chip" />
            <Bone className="px-ultra-sk__chip" />
            <Bone className="px-ultra-sk__chip" />
          </div>
        </div>
      </div>
      <div className="container px-ultra-sk__section">
        <div className="px-ultra-sk__split">
          <div className="px-ultra-sk__split-main">
            <Bone className="px-ultra-sk__line px-ultra-sk__line--lg" />
            <Bone className="px-ultra-sk__line" />
            <Bone className="px-ultra-sk__line" />
            <Bone className="px-ultra-sk__line px-ultra-sk__line--md" />
            <Bone className="px-ultra-sk__block" />
            <Bone className="px-ultra-sk__line" />
            <Bone className="px-ultra-sk__line px-ultra-sk__line--sm" />
          </div>
          <aside className="px-ultra-sk__split-aside">
            <Bone className="px-ultra-sk__aside-card" />
            <Bone className="px-ultra-sk__aside-card px-ultra-sk__aside-card--sm" />
          </aside>
        </div>
      </div>
    </>
  );
}

function ContactSkeleton() {
  return (
    <>
      <div className="px-ultra-sk__hero px-ultra-sk__hero--navy">
        <div className="container">
          <Bone className="px-ultra-sk__pill px-ultra-sk__pill--on-dark" />
          <Bone className="px-ultra-sk__hero-title px-ultra-sk__bone--on-dark" />
          <Bone className="px-ultra-sk__hero-lead px-ultra-sk__bone--on-dark" />
        </div>
      </div>
      <div className="container px-ultra-sk__section">
        <div className="px-ultra-sk__contact">
          <div className="px-ultra-sk__contact-copy">
            <Bone className="px-ultra-sk__line px-ultra-sk__line--lg" />
            <Bone className="px-ultra-sk__line" />
            <Bone className="px-ultra-sk__line px-ultra-sk__line--md" />
            <div className="px-ultra-sk__facts">
              <Bone className="px-ultra-sk__fact" />
              <Bone className="px-ultra-sk__fact" />
            </div>
          </div>
          <div className="px-ultra-sk__form">
            {Array.from({ length: 5 }, (_, i) => (
              <Bone key={i} className="px-ultra-sk__field" />
            ))}
            <Bone className="px-ultra-sk__submit" />
          </div>
        </div>
      </div>
    </>
  );
}

function LegalSkeleton() {
  return (
    <div className="container px-ultra-sk__section px-ultra-sk__legal">
      <Bone className="px-ultra-sk__pill" />
      <Bone className="px-ultra-sk__title" />
      <div className="px-ultra-sk__legal-body">
        {Array.from({ length: 10 }, (_, i) => (
          <Bone
            key={i}
            className={`px-ultra-sk__line ${i % 4 === 3 ? 'px-ultra-sk__line--sm' : i % 5 === 0 ? 'px-ultra-sk__line--lg' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

function DefaultSkeleton() {
  return (
    <>
      <div className="px-ultra-sk__hero px-ultra-sk__hero--short">
        <div className="container">
          <Bone className="px-ultra-sk__crumb" />
          <Bone className="px-ultra-sk__hero-title" />
          <Bone className="px-ultra-sk__hero-lead" />
        </div>
      </div>
      <div className="container px-ultra-sk__section">
        <div className="px-ultra-sk__split">
          <div className="px-ultra-sk__split-main">
            <Bone className="px-ultra-sk__line px-ultra-sk__line--lg" />
            <Bone className="px-ultra-sk__line" />
            <Bone className="px-ultra-sk__line px-ultra-sk__line--md" />
            <Bone className="px-ultra-sk__block" />
          </div>
          <Bone className="px-ultra-sk__media" />
        </div>
      </div>
      <div className="container px-ultra-sk__section">
        <SectionHead />
        <CardGrid count={3} />
      </div>
    </>
  );
}

/** Skeleton de chargement Ultra — variantes selon la page (hors accueil). */
export function UltraPageSkeleton({ path }: { path: string }) {
  const kind = kindFromPath(path);
  return (
    <div className="px-ultra-sk" data-sk={kind} aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Chargement de la page…</span>
      {kind === 'listing' ? <ListingSkeleton /> : null}
      {kind === 'project' ? <ProjectSkeleton /> : null}
      {kind === 'contact' ? <ContactSkeleton /> : null}
      {kind === 'legal' ? <LegalSkeleton /> : null}
      {kind === 'default' ? <DefaultSkeleton /> : null}
    </div>
  );
}
