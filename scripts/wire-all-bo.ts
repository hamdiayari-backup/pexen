/**
 * Persiste toutes les données homepage / site dans le BO (rien en dur côté contenu).
 */
import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';
import { uid } from '../server/cms/blocks';

const LEGAL_NOTES = [
  '* Volume d’économies d’énergie estimé selon les fiches d’opérations standardisées mobilisées : le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements. Il ne constitue pas une mesure des consommations réelles.',
  '* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique (10 ans), à conditions d’exploitation comparables.',
];

const PARTNERS = [
  { name: 'Intermarché', logo: '/themes/ultra-s/images/pexen/partners/intermarche.webp' },
  { name: 'Carrefour Market', logo: '/themes/ultra-s/images/pexen/partners/carrefour-market.webp' },
  { name: 'CEDIM', logo: '/themes/ultra-s/images/pexen/partners/cedim.webp' },
  { name: 'Colorcon', logo: '/themes/ultra-s/images/pexen/partners/colorcon.webp' },
];

const QUALIFICATIONS = [
  {
    label: 'RGE QualiPAC',
    logo: '/themes/ultra-s/images/pexen/quali/qualipac.webp',
    alt: 'Qualification RGE QualiPAC de PEXEN',
  },
  {
    label: 'RGE Qualisol',
    logo: '/themes/ultra-s/images/pexen/quali/qualisol.webp',
    alt: 'Qualification RGE Qualisol de PEXEN',
  },
  {
    label: 'OPQIBI',
    logo: '/themes/ultra-s/images/pexen/quali/opqibi.webp',
    alt: 'Qualifications OPQIBI de PEXEN',
  },
  { label: 'COFRAC', alt: 'Opérations contrôlées par un organisme accrédité COFRAC' },
  {
    label: 'MIC',
    logo: '/themes/ultra-s/images/pexen/quali/mic.webp',
    alt: 'Assurance décennale MIC Insurance',
    caption: 'Assurance décennale',
  },
];

const FAQ_HTML = [
  {
    q: 'Par quoi commencer pour réduire la consommation énergétique d’un site ?',
    a: '<p>Par une étude sur site : relevé des équipements, lecture des consommations, identification des postes les plus énergivores. Le froid, le chauffage des grands volumes et le pilotage concentrent souvent l’essentiel du gisement.</p>',
  },
  {
    q: 'PEXEN réalise-t-il les travaux ou seulement l’étude ?',
    a: '<p>Les deux. PEXEN étudie, dimensionne, réalise les travaux avec ses équipes, met en service et suit les consommations. Un seul interlocuteur porte la note de calcul et le chantier.</p>',
  },
  {
    q: 'Mes travaux peuvent-ils être financés ?',
    a: '<p>Une partie de nos solutions correspond à des opérations standardisées reconnues par l’État et peut bénéficier du financement CEE, à condition de l’engager avant la signature du devis. Nous réalisons aussi des travaux hors de ce dispositif. <a href="/estimation-financement/">Estimer le financement</a>.</p>',
  },
  {
    q: 'Mon bâtiment est-il concerné par le décret tertiaire ?',
    a: '<p>Oui s’il accueille des activités tertiaires sur 1&nbsp;000&nbsp;m² ou plus. Les consommations se déclarent chaque année sur la plateforme OPERAT de l’ADEME, avant le 30 septembre. <a href="https://operat.ademe.fr/" target="_blank" rel="noopener noreferrer">operat.ademe.fr</a>.</p>',
  },
  {
    q: 'Intervenez-vous sans arrêter l’exploitation ?',
    a: '<p>Oui. Les travaux sont phasés par circuit, par zone ou hors des heures d’ouverture : magasins ouverts, lignes de production en marche.</p>',
  },
];

const PROJECT_ORDER = [
  '/realisations/carrefour-market-recuperation-de-chaleur/',
  '/realisations/intermarche-sortie-du-fioul/',
  '/realisations/cedim-destratification/',
];

const FOOTER_ITEMS = [
  { id: 'ft-sec', label: 'Secteurs', path: '/secteurs/' },
  { id: 'ft-real', label: 'Réalisations', path: '/realisations/' },
  { id: 'ft-app', label: 'Notre approche', path: '/notre-approche/' },
  { id: 'ft-part', label: 'Partenaires', path: '/partenaires/' },
  { id: 'ft-contact', label: 'Contact', path: '/contact/' },
  { id: 'ft-ml', label: 'Mentions légales', path: '/mentions-legales/' },
  { id: 'ft-priv', label: 'Politique de confidentialité', path: '/politique-de-confidentialite/' },
];

const snap = await updateSnapshot((s) => {
  /* —— Site : AI labels + mentions footer —— */
  s.ai.buttonLabel = s.ai.buttonLabel || 'Conseil PXN';
  s.ai.statusLabel = s.ai.statusLabel || 'En ligne — réponse rapide';
  s.ai.panelTitle = s.ai.panelTitle || 'Conseil PXN';
  s.settings.footerLegalNotes = LEGAL_NOTES;

  /* —— Menus footer + solutions 7 —— */
  for (const menu of s.menus) {
    if (menu.id === 'footer') {
      menu.items = FOOTER_ITEMS.map((it) => ({ ...it }));
    }
    const sol = menu.items?.find((i) => i.label === 'Solutions' || i.path === '/solutions/');
    if (sol?.children) {
      if (!sol.children.some((c) => c.path?.includes('renovation-globale'))) {
        sol.children.push({ id: uid('s'), path: '/solutions/renovation-globale-tertiaire/', label: 'Rénovation globale' });
      }
      if (!sol.children.some((c) => c.path?.includes('eclairage-led'))) {
        sol.children.push({ id: uid('s'), path: '/solutions/eclairage-led/', label: 'Éclairage LED' });
      }
    }
  }

  /* —— Homepage blocks —— */
  const home = s.pages.find((p) => p.path === '/');
  if (home) {
    for (const b of home.blocks) {
      if (b.type === 'stats' && (b.data.style === 'strip' || b.data.style === 'inline')) {
        b.data.partners = PARTNERS;
        b.data.qualifications = QUALIFICATIONS;
        b.data.footnote = LEGAL_NOTES.join('\n');
        b.data.eyebrow = b.data.eyebrow || 'Ils nous confient leurs sites';
      }
      if (b.type === 'faq') {
        b.data.items = FAQ_HTML.map((it, i) => ({
          id: (b.data.items as { id?: string }[])?.[i]?.id || uid('f'),
          question: it.q,
          answer: it.a,
        }));
        b.data.showContactCard = false;
      }
      if (b.type === 'contactForm') {
        b.data.phoneHint = '';
        b.data.phoneLabel = '';
        b.data.formId = b.data.formId || 'contact-main';
      }
      if (b.type === 'hero') {
        b.data.media = 'video';
        b.data.video = '/themes/ultra-s/videos/video-couv.mp4';
        if (b.style) {
          b.style.background = 'video';
          b.style.backgroundVideo = '/themes/ultra-s/videos/video-couv.mp4';
        }
      }
    }
  }

  /* —— Projets ordre —— */
  for (const page of s.pages) {
    if (page.template !== 'project' || !page.project) continue;
    const idx = PROJECT_ORDER.indexOf(page.path);
    if (idx >= 0) {
      page.project.sortOrder = idx;
      page.project.featured = true;
    }
  }
});

const home = snap.pages.find((p) => p.path === '/')!;
const strip = home.blocks.find((b) => b.type === 'stats' && b.data.style === 'strip');
const faq = home.blocks.find((b) => b.type === 'faq');
console.log('partners', (strip?.data.partners as unknown[])?.length);
console.log('quali', (strip?.data.qualifications as unknown[])?.length);
console.log('faq html?', String((faq?.data.items as { answer?: string }[])?.[2]?.answer || '').includes('<a '));
console.log('ai', snap.ai.buttonLabel, snap.ai.statusLabel);
console.log('footer notes', snap.settings.footerLegalNotes?.length);
console.log(
  'footer menu',
  snap.menus.find((m) => m.id === 'footer')?.items.map((i) => i.label)
);
console.log(
  'projects sort',
  snap.pages
    .filter((p) => PROJECT_ORDER.includes(p.path))
    .map((p) => [p.project?.sortOrder, p.project?.client])
);
await pool.end();
