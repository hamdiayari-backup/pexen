/**
 * /realisations/ : grille 2×2 (projects + filtres) + fiches en case-list 2×2
 * (plus d’articles full-width empilés).
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock } from '../server/cms/types';
import { pool } from '../server/db/client';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;
const now = () => new Date().toISOString();

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (label = 'Parler de votre projet'): ButtonData => button(label, '/contact/');
const estimBtn = (): ButtonData => button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none');
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');
const phoneBtn = (): ButtonData => button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone');

const CUMAC =
  '* Estimation calculée selon les fiches d’opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
}

function checklist(title: string, items: string[]) {
  return b(
    'checklist',
    {
      title,
      intro: '',
      cards: [{ id: uid('ck'), title: '', icon: 'fa-check', entries: items.map((t) => ({ id: uid('e'), title: t })) }],
    },
    { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function caseCard(opts: {
  id: string;
  title: string;
  meta: string;
  enjeu: string;
  result: string;
  image: string;
  imageAlt: string;
}) {
  return `<a id="${opts.id}" class="px-ultra-case-card" href="/realisations/#${opts.id}">
    <div class="px-ultra-case-card__media"><img src="${opts.image}" alt="${opts.imageAlt}" loading="lazy" width="640" height="400" /></div>
    <div class="px-ultra-case-card__body">
      <p class="px-ultra-case-card__meta">${opts.meta}</p>
      <h3 class="px-ultra-case-card__title">${opts.title}</h3>
      <p class="px-ultra-case-card__enjeu">${opts.enjeu}</p>
      <p class="px-ultra-case-card__result">${opts.result}</p>
      <span class="px-ultra-case-card__cta">Voir le projet <span aria-hidden="true">→</span></span>
    </div>
  </a>`;
}

const CASES = [
  caseCard({
    id: 'intermarche',
    title: 'Intermarché : sortir du fioul et optimiser le froid',
    meta: 'Bourgogne-Franche-Comté · Grande distribution',
    enjeu:
      'Chaudières fioul vétustes, froid commercial énergivore, objectif décarbonation. PAC air/eau, récupération de chaleur, déstratification, GTB B, fermeture des meubles · BAT-TH-163, 139, 134, 116, 142 · BAT-EQ-124.',
    result: "14,8 GWh cumac d'économies d'énergie estimées* · sortie complète du fioul",
    image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
    imageAlt: 'Pompe à chaleur air/eau installée par PEXEN chez Intermarché',
  }),
  caseCard({
    id: 'carrefour-market',
    title: 'Carrefour Market : froid, chaleur et toiture sous contrat de performance',
    meta: 'Île-de-France · Grande distribution',
    enjeu:
      'Centrale froid 7 compresseurs, 1er poste électrique, objectif −40 % contractuel. Récupération de chaleur, HP flottante, isolation toiture, fermeture meubles · BAT-TH-139, 134 · BAT-EN-107 · BAT-EQ-124, 125.',
    result: "30,6 GWh cumac d'économies d'énergie estimées* · objectif contractuel −40 %",
    image: IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
    imageAlt: "Centrale de froid commercial chez Carrefour Market, projet d'efficacité énergétique PEXEN",
  }),
  caseCard({
    id: 'cedim',
    title: 'CEDIM : ramener la chaleur au sol',
    meta: 'Centre-Val de Loire · Négoce et entrepôt',
    enjeu:
      'Plus de 5 m sous plafond, aérothermes gaz : chaleur sous toiture, sol froid. Trois déstratificateurs d’air · BAT-TH-142.',
    result: "2,1 GWh cumac d'économies d'énergie estimées*",
    image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'),
    imageAlt: "Déstratificateurs d'air installés par PEXEN chez CEDIM",
  }),
  caseCard({
    id: 'colorcon',
    title: 'Colorcon : chaufferie vapeur et froid process',
    meta: 'Île-de-France · Industrie pharmaceutique',
    enjeu:
      'Utilités en continu : vapeur, froid, réseaux. Pistes : récupération de chaleur, PAC, régulation froid, brûleur micro-modulant, calorifugeage · IND-UT-137, 103, 116, 105, 131.',
    result: 'Étude d’efficacité énergétique industrielle · fiches IND-UT',
    image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp'),
    imageAlt: "Chaufferie vapeur du site Colorcon, projet d'efficacité énergétique industrielle",
  }),
];

function blocks(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Réalisations',
        title: 'Nos réalisations',
        highlight: '',
        intro:
          "Quatre projets d'efficacité énergétique, quatre configurations : un supermarché qui sort du fioul, une moyenne surface sous contrat de performance énergétique, un magasin de grande hauteur, un site pharmaceutique.",
        image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
        imageAlt: "Projets d'efficacité énergétique réalisés par PEXEN",
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: '4 projets', label: '4 configurations' },
          { id: uid('m'), value: '47,5 GWh cumac*', label: "estimés sur l'ensemble" },
          { id: uid('m'), value: '3 régions', label: '2 secteurs' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'projects',
      {
        eyebrow: 'Références',
        title: 'Quatre configurations, un même niveau d’exigence',
        intro: 'Filtrez par secteur.',
        layout: 'grid',
        filter: 'all',
        showFilters: true,
        limit: 0,
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    rich(
      `<div class="px-ultra-center-intro"><h2>Fiches projets</h2><p>Enjeu, solutions retenues, fiches CEE et économies d’énergie estimées — en un coup d’œil.</p></div><div class="px-ultra-case-list">${CASES.join('')}</div>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Comment lire nos chiffres</h2><p>Les volumes affichés sont exprimés en kWh cumac, l'unité officielle des certificats d'économies d'énergie. Ils sont calculés hors bonifications, à partir des fiches standardisées mobilisées sur chaque projet. Les économies mesurées sur les factures seront publiées au fil du suivi des consommations.</p>`,
      'soft'
    ),
    checklist('Ce que ces projets ont en commun', [
      'Un relevé sur site avant toute préconisation.',
      'Plusieurs actions combinées sur un même site, rarement une seule.',
      'Des travaux menés sans fermer le magasin ni arrêter la production.',
      'Un dossier CEE engagé avant la signature des devis.',
    ]),
    rich(`<p class="text-xs text-slate-500 px-ultra-legal-note">${CUMAC}</p>`),
    b(
      'cta',
      {
        variant: 'dark',
        layout: 'centered',
        title: 'Un projet ? Parlons-en.',
        text: 'Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.',
        buttons: [contactBtn(), phoneBtn()],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
  ];
}

const snap = await updateSnapshot((s) => {
  const page = s.pages.find((p) => p.path === '/realisations/');
  if (!page) throw new Error('/realisations/ introuvable');
  page.blocks = blocks();
  page.updatedAt = now();
  console.log('updated /realisations/ →', page.blocks.map((x) => x.type).join(' | '));
});

const page = snap.pages.find((p) => p.path === '/realisations/');
console.log('blocks', page?.blocks.length);
await pool.end();
