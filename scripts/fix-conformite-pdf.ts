/**
 * Applique le PDF « Homepage PEXEN – conformité contenu 22/10 » + onglet 01_Accueil.
 */
import 'dotenv/config';
import { uid } from '../server/cms/blocks';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const PARTNERS = [
  { name: 'Intermarché', logo: '/themes/ultra-s/images/pexen/partners/intermarche.webp' },
  { name: 'Carrefour Market', logo: '/themes/ultra-s/images/pexen/partners/carrefour-market.webp' },
  { name: 'CEDIM', logo: '/themes/ultra-s/images/pexen/partners/cedim.webp' },
  { name: 'Colorcon', logo: '/themes/ultra-s/images/pexen/partners/colorcon.webp' },
];

const ENJEUX_LINKS = [
  '/solutions/froid-commercial-industriel/',
  '/decret-tertiaire-decret-bacs/',
  '/solutions/pilotage-gtb-decret-bacs/',
  '/etudes-ingenierie-energetique/',
];

const EXTRA_SOLUTIONS = [
  {
    id: uid('c'),
    icon: 'home',
    link: '/solutions/renovation-globale-tertiaire/',
    tags: [] as string[],
    text: 'Un bouquet de travaux sur l’enveloppe, les systèmes et le pilotage.',
    image: '/themes/ultra-s/images/pexen/chantier-de-renovation-globale-tertiaire.webp',
    title: 'Rénovation globale',
    imageAlt: 'Rénovation globale tertiaire réalisée par PEXEN',
    linkLabel: 'Découvrir',
  },
  {
    id: uid('c'),
    icon: 'bolt',
    link: '/solutions/eclairage-led/',
    tags: [] as string[],
    text: 'Luminaires LED, détection de présence, gradation selon la lumière du jour.',
    image: '/themes/ultra-s/images/pexen/eclairage-led-tertiaire-pexen.webp',
    title: 'Éclairage LED',
    imageAlt: 'Éclairage LED tertiaire installé par PEXEN',
    linkLabel: 'Découvrir',
  },
];

const EXPERTISE_IMAGES: Record<string, string> = {
  '/solutions/froid-commercial-industriel/': '/themes/ultra-s/images/pexen/drive-froid-commercial-industriel.webp',
  '/solutions/recuperation-de-chaleur/': '/themes/ultra-s/images/pexen/drive-recuperateur-de-chaleur.webp',
  '/solutions/pompe-a-chaleur-tertiaire/': '/themes/ultra-s/images/pexen/drive-chauffage-traitement-dair.webp',
  '/solutions/pilotage-gtb-decret-bacs/': '/themes/ultra-s/images/pexen/drive-pilotage-gtb-gtc.webp',
  '/solutions/isolation-technique/': '/themes/ultra-s/images/pexen/drive-isolation-technique-sur-reseau-hvac-industriel.webp',
};

const SECTOR_IMAGES: Record<string, string> = {
  '/secteurs/efficacite-energetique-industrielle/': '/themes/ultra-s/images/pexen/drive-secteur-industriel.webp',
  '/secteurs/efficacite-energetique-tertiaire/': '/themes/ultra-s/images/pexen/drive-secteur-batiment-tertiaire.webp',
  '/secteurs/batiments-collectifs/': '/themes/ultra-s/images/pexen/drive-secteur-renovation-globale-collectif.webp',
  '/partenaires/': '/themes/ultra-s/images/pexen/drive-equipe-pexen.webp',
};

const PROJECTS: Record<
  string,
  {
    client: string;
    location: string;
    sector: string;
    solution: string;
    summary: string;
    results: string[];
    cumac: string;
    image: string;
    badge?: string;
    primeCee?: string;
    ceeSheet?: string;
  }
> = {
  '/realisations/carrefour-market-recuperation-de-chaleur/': {
    client: 'Carrefour Market',
    location: 'Île-de-France',
    sector: 'Grande distribution',
    solution: '535 kW de chaleur récupérée sur le froid commercial',
    summary: 'Île-de-France · Grande distribution',
    results: ['30,6 GWh cumac* · 5 opérations · objectif −40 %* sur 10 ans'],
    cumac: '30,6 GWh cumac',
    image: '/themes/ultra-s/images/pexen/carrefour-market-recuperation-de-chaleur-sur-le-froid-commercial.webp',
    badge: '',
    primeCee: '',
    ceeSheet: '',
  },
  '/realisations/intermarche-sortie-du-fioul/': {
    client: 'Intermarché',
    location: 'Bourgogne-Franche-Comté',
    sector: 'Grande distribution',
    solution: '1 650 m² chauffés et sortis du fioul',
    summary: 'Bourgogne-Franche-Comté · Grande distribution',
    results: ['240 kW récupérés · 14,8 GWh cumac* · 6 opérations'],
    cumac: '14,8 GWh cumac',
    image: '/themes/ultra-s/images/pexen/intermarche-sortie-du-fioul-par-pompes-a-chaleur-projet-de.webp',
    badge: '',
    primeCee: '',
    ceeSheet: '',
  },
  '/realisations/cedim-destratification/': {
    client: 'CEDIM',
    location: 'Centre-Val de Loire',
    sector: 'Négoce et entrepôt',
    solution: '9 m de hauteur traitée par déstratification',
    summary: 'Centre-Val de Loire · Négoce et entrepôt',
    results: ['1 213 m² · 2,1 GWh cumac*'],
    cumac: '2,1 GWh cumac',
    image: '/themes/ultra-s/images/pexen/destratificateurs-d-air-installes-par-pexen-chez-cedim.webp',
    badge: '',
    primeCee: '',
    ceeSheet: '',
  },
};

const snap = await updateSnapshot((s) => {
  const home = s.pages.find((p) => p.path === '/');
  if (home) {
    for (const b of home.blocks) {
      /* 1. Hero — vidéo Drive, plus d’image ∞ */
      if (b.type === 'hero') {
        b.data.media = 'video';
        b.data.video = '/themes/ultra-s/videos/video-couv.mp4';
        b.data.videoPoster = '/themes/ultra-s/images/pexen/drive-froid-commercial-industriel.webp';
        b.data.mainImage = '/themes/ultra-s/images/pexen/drive-froid-commercial-industriel.webp';
        if (b.style) {
          b.style.background = 'video';
          b.style.backgroundVideo = '/themes/ultra-s/videos/video-couv.mp4';
          b.style.backgroundImage = '/themes/ultra-s/images/pexen/drive-froid-commercial-industriel.webp';
        }
      }

      /* 2. Preuves */
      if (b.type === 'stats' && (b.data.style === 'strip' || b.data.style === 'inline')) {
        b.data.partners = PARTNERS as unknown as string[];
        b.data.eyebrow = 'Ils nous confient leurs sites';
        b.data.footnote = '';
      }

      /* 3. Enjeux — liens */
      if (b.type === 'stats' && (b.data as any).style === 'cards') {
        ((b.data as any).items || []).forEach((it: { link?: string }, i: number) => {
          it.link = ENJEUX_LINKS[i] || it.link;
        });
      }

      /* 5. Solutions +2 cartes */
      if (b.type === 'cards' && (b.data as any).style === 'numbered') {
        (b.data as any).intro = 'Toutes nos solutions';
        const items = ((b.data as any).items || []) as Array<{ link?: string; image?: string; title?: string }>;
        for (const it of items) {
          if (it.link && EXPERTISE_IMAGES[it.link]) it.image = EXPERTISE_IMAGES[it.link];
        }
        const hasReno = items.some((it) => it.link?.includes('renovation-globale'));
        const hasLed = items.some((it) => it.link?.includes('eclairage-led'));
        if (!hasReno) items.push(EXTRA_SOLUTIONS[0]);
        if (!hasLed) items.push(EXTRA_SOLUTIONS[1]);
        (b.data as any).items = items;
      }

      /* 6. Parcours */
      if (b.type === 'steps') {
        (b.data as any).intro =
          'Un seul interlocuteur du premier relevé jusqu’à la prise en charge complète du dossier. Vos équipes n’ont pas à coordonner les intervenants.';
        for (const it of ((b.data as any).items || []) as any[]) {
          if (it.num === '04' || it.title?.includes('Fin de travaux')) {
            it.text =
              'Documents de fin de travaux et procès-verbal de réception. Pour les opérations CEE : contrôle par un organisme accrédité COFRAC (dossier, visite sur site, enquête de satisfaction client).';
          }
        }
      }

      /* 7b Qualifications */
      if (b.type === 'checklist') {
        (b.data as any).intro = '';
        (b.data as any).eyebrow = '';
        for (const card of ((b.data as any).cards || []) as any[]) {
          card.tag = '';
          if (/Leo Energy/i.test(card.title || '')) {
            card.title = 'Audit énergétique, via notre bureau d’études partenaire';
          }
          if (/Assurances/i.test(card.title || '') || /Assurances/i.test(card.tag || '')) {
            card.title = 'Assurances et contrôle';
          }
          if (/Qualifications PEXEN/i.test(card.title || '')) {
            card.title = 'Qualifications PEXEN';
          }
        }
      }

      /* 8. Secteurs — photos Drive */
      if (b.type === 'panels') {
        for (const it of ((b.data as any).items || []) as any[]) {
          if (it.link && SECTOR_IMAGES[it.link]) it.image = SECTOR_IMAGES[it.link];
        }
      }

      /* 10. Contact */
      if (b.type === 'contactForm') {
        (b.data as any).phoneHint = '';
        (b.data as any).phoneLabel = '';
      }

      /* 11. FAQ — liens dans réponses */
      if (b.type === 'faq') {
        for (const it of ((b.data as any).items || []) as any[]) {
          if (/financés/i.test(it.question || '') && !/estimation-financement/.test(it.answer || '')) {
            it.answer = `${it.answer} Estimer le financement : /estimation-financement/.`;
          }
          if (/décret tertiaire/i.test(it.question || '') && !/operat\.ademe/.test(it.answer || '')) {
            it.answer = `${it.answer} Plateforme OPERAT : https://operat.ademe.fr/`;
          }
        }
      }
    }
  }

  /* Projets = contenu brief exact */
  for (const page of s.pages) {
    if (page.template !== 'project' || !page.project) continue;
    const patch = PROJECTS[page.path];
    if (!patch) continue;
    Object.assign(page.project, patch);
    page.title = `Réalisation : ${patch.client}`;
  }

  /* Menus : + Rénovation + LED */
  for (const menu of s.menus || []) {
    const sol = menu.items?.find((i) => i.label === 'Solutions' || i.path === '/solutions/');
    if (!sol?.children) continue;
    if (!sol.children.some((c) => c.path?.includes('renovation-globale'))) {
      sol.children.push({
        id: uid('s'),
        path: '/solutions/renovation-globale-tertiaire/',
        label: 'Rénovation globale',
      });
    }
    if (!sol.children.some((c) => c.path?.includes('eclairage-led'))) {
      sol.children.push({
        id: uid('s'),
        path: '/solutions/eclairage-led/',
        label: 'Éclairage LED',
      });
    }
  }
});

const home = snap.pages.find((p) => p.path === '/')!;
const hero = home.blocks.find((b) => b.type === 'hero');
const strip = home.blocks.find((b) => b.type === 'stats' && b.data.style === 'strip');
const sols = home.blocks.find((b) => b.type === 'cards' && b.data.style === 'numbered');
const steps = home.blocks.find((b) => b.type === 'steps');
console.log('hero video', hero?.data.video, hero?.style?.backgroundVideo);
console.log('partners', strip?.data.partners);
console.log(
  'solutions',
  ((sols?.data.items as { title?: string }[]) || []).map((i) => i.title)
);
console.log(
  'step04',
  (steps?.data.items as { num?: string; text?: string }[])?.find((i) => i.num === '04')?.text?.slice(0, 120)
);
console.log('steps intro', (steps?.data as any)?.intro?.slice(0, 80));
for (const p of snap.pages.filter((x) => x.template === 'project')) {
  console.log(p.path, p.project?.client, p.project?.solution, p.project?.results);
}
await pool.end();
