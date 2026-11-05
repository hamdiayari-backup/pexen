/**
 * Adapters CMS → sections Maquette (mêmes blocs / données que Ultra).
 */
import React from 'react';
import type {
  BlockStyle,
  CardsData,
  ChecklistData,
  ContactFormData,
  FaqData,
  GalleryData,
  HeroData,
  MarqueeData,
  PageHeaderData,
  PanelsData,
  ProjectsData,
  SimulatorData,
  StatsData,
  StepsData,
  TextMediaData,
} from '../../../server/cms/blocks';
import { useCms } from '../../components/cms/kit';
import {
  MaquetteContactSection,
  MaquetteEnjeuxSection,
  MaquetteExpertisesMasonry,
  MaquetteFaqSection,
  MaquetteHeroSection,
  MaquetteInterlocuteurSection,
  MaquetteKpisSection,
  MaquettePageHeader,
  MaquetteQualiSection,
  MaquetteRealisationsSection,
  MaquetteSecteursSection,
  MaquetteSimulatorSection,
  MaquetteTimelineSection,
} from './MaquetteSections';
import { UltraAboutLogoSection, UltraMarqueeSection } from '../pexen-ultra/UltraSections';

export function MaquetteCmsHero({ d }: { d: HeroData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <MaquetteHeroSection
      onNavigate={navigate}
      d={{
        badgeText: d.badgeText || d.badgeTag,
        title: d.title,
        subtitle: d.subtitle,
        buttons: d.buttons,
        mainImage: d.mainImage,
        videoPoster: d.videoPoster,
      }}
    />
  );
}

export function MaquetteCmsPageHeader({ d }: { d: PageHeaderData; style: BlockStyle }) {
  const { navigate } = useCms();
  return <MaquettePageHeader onNavigate={navigate} d={d} />;
}

export function MaquetteCmsTextMedia({ d }: { d: TextMediaData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <UltraAboutLogoSection
      onNavigate={navigate}
      override={{ eyebrow: d.eyebrow, title: d.title, html: d.html, bullets: d.bullets, image: d.image }}
    />
  );
}

export function MaquetteCmsCards({ d }: { d: CardsData; style: BlockStyle }) {
  const { navigate } = useCms();
  if (d.style === 'minimal' || d.style === 'card') {
    return (
      <MaquetteInterlocuteurSection
        onNavigate={navigate}
        override={{
          eyebrow: d.eyebrow,
          title: d.title,
          intro: d.intro,
          items: (d.items || []).map((it) => ({
            title: it.title,
            text: it.text || '',
            path: it.link || '/etudes-ingenierie-energetique/',
          })),
        }}
      />
    );
  }
  return (
    <MaquetteExpertisesMasonry
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        items: (d.items || []).map((it) => ({
          title: it.title,
          text: it.text || '',
          path: it.link || '/solutions/',
          image: it.image,
        })),
      }}
    />
  );
}

export function MaquetteCmsSteps({ d }: { d: StepsData; style: BlockStyle }) {
  const { navigate } = useCms();
  const cta = d.buttons?.[0];
  return (
    <MaquetteTimelineSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.intro,
        items: (d.items || []).map((it) => ({
          num: it.num || '',
          title: it.title,
          text: it.text || '',
        })),
        ctaLabel: cta?.label,
        ctaPath: cta?.link || '/notre-approche/',
      }}
    />
  );
}

export function MaquetteCmsProjects({ d }: { d: ProjectsData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <MaquetteRealisationsSection
      onNavigate={navigate}
      showAll={d.limit === 0 || d.limit >= 6}
      override={{ eyebrow: d.eyebrow, title: d.title, intro: d.intro, showFilters: d.showFilters }}
    />
  );
}

export function MaquetteCmsFaq({ d }: { d: FaqData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <MaquetteFaqSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        showContactCard: d.showContactCard,
        items: (d.items || []).map((it) => ({ question: it.question, answer: it.answer })),
      }}
    />
  );
}

export function MaquetteCmsContact({ d }: { d: ContactFormData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <MaquetteContactSection
      onNavigate={navigate}
      formId={d.formId || 'contact-main'}
      override={{
        title: d.title,
        intro: d.intro,
        privacyPath: d.privacyPath,
        listItems: d.listItems,
        submitLabel: d.submitLabel,
      }}
    />
  );
}

export function MaquetteCmsSimulator({ d }: { d: SimulatorData; style: BlockStyle }) {
  const { navigate } = useCms();
  return <MaquetteSimulatorSection onNavigate={navigate} override={d} />;
}

export function MaquetteCmsMarquee({ d }: { d: MarqueeData; style: BlockStyle }) {
  return <UltraMarqueeSection override={{ items: d.items, speed: d.speed }} />;
}

export function MaquetteCmsGallery({ d }: { d: GalleryData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <MaquetteExpertisesMasonry
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        items: (d.items || []).map((it) => ({
          title: it.caption || '',
          image: it.image,
          path: '/solutions/',
        })),
      }}
    />
  );
}

export function MaquetteCmsStats({ d }: { d: StatsData; style: BlockStyle }) {
  const { navigate } = useCms();
  if (d.style === 'strip' || d.style === 'inline') {
    return (
      <MaquetteKpisSection
        onNavigate={navigate}
        override={{
          eyebrow: d.eyebrow,
          footnote: d.footnote,
          partners: d.partners,
          qualifications: d.qualifications,
          items: (d.items || []).map((it) => ({
            value: it.value,
            prefix: it.prefix,
            suffix: it.suffix,
            label: it.label,
            link: it.link,
          })),
        }}
      />
    );
  }
  const ENJEUX_LINKS = [
    '/solutions/froid-commercial-industriel/',
    '/decret-tertiaire-decret-bacs/',
    '/solutions/pilotage-gtb-decret-bacs/',
    '/etudes-ingenierie-energetique/',
  ];
  return (
    <MaquetteEnjeuxSection
      onNavigate={navigate}
      override={{
        title: d.title,
        items: (d.items || []).map((it, i) => ({
          label: it.label,
          hint: it.hint,
          link: it.link || ENJEUX_LINKS[i],
        })),
      }}
    />
  );
}

export function MaquetteCmsChecklist({ d }: { d: ChecklistData; style: BlockStyle }) {
  return (
    <MaquetteQualiSection
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        intro: d.intro,
        cards: (d.cards || []).map((c) => ({
          tag: c.tag,
          title: c.title || '',
          items: (c.entries || []).map((e) => (e.text ? `${e.title} — ${e.text}` : e.title)),
        })),
      }}
    />
  );
}

export function MaquetteCmsPanels({ d }: { d: PanelsData; style: BlockStyle }) {
  const { navigate } = useCms();
  return (
    <MaquetteSecteursSection
      onNavigate={navigate}
      override={{
        eyebrow: d.eyebrow,
        title: d.title,
        items: (d.items || []).map((it) => ({
          title: it.title,
          text: it.text,
          link: it.link,
        })),
      }}
    />
  );
}
