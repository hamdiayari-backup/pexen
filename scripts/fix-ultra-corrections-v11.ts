/**
 * Corrections Ultra — document Amina v1.1 (oct. 2026)
 * AI « Conseiller PEXEN », drop COFRAC homepage, textes uniformes,
 * masque Rénovation/LED homepage + menu (pages restent publiées).
 */
import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const HIDE_SOLUTION_PATHS = [
  '/solutions/renovation-globale-tertiaire/',
  '/solutions/eclairage-led/',
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
    caption: 'Via notre partenaire',
  },
  {
    label: 'Assurance décennale',
    logo: '/themes/ultra-s/images/pexen/quali/assurance-decennale.webp',
    alt: 'Qualification Assurance décennale',
  },
];

/** Enjeux — cible ~130–160 car. (1er hint ~308 → raccourci) */
const ENJEUX_HINTS: Record<string, string> = {
  '/solutions/froid-commercial-industriel/':
    'Sur les sites alimentaires et logistiques, le froid concentre souvent l’essentiel des kWh. Régulation, HP flottante et récupération : le gisement se mesure sur site.',
  '/decret-tertiaire-decret-bacs/':
    '−40 % en 2030, −50 % en 2040, −60 % en 2050 pour les bâtiments tertiaires ≥ 1 000 m², avec déclaration annuelle sur OPERAT.',
  '/solutions/pilotage-gtb-decret-bacs/':
    'Automatisation et contrôle obligatoires au-delà de 290 kW (chauffage/clim) depuis 2025, puis 70 kW en 2030 — classe A ou B selon le décret BACS.',
  '/etudes-ingenierie-energetique/':
    'Chaudières fioul, réseaux non isolés, régulations figées : chaque équipement se dimensionne à partir d’un relevé sur site et d’une note de calcul.',
};

/** Interlocuteur — cible ~130–160 car. */
const INTERLOCUTEUR_TEXTS: Record<string, string> = {
  '/etudes-ingenierie-energetique/':
    'Audit, notes de dimensionnement et plans d’exécution : fluides HVAC et efficacité énergétique, pour un projet chiffré avant travaux.',
  '/accompagnement-travaux/':
    'Installation par nos équipes, suivi de chantier et mise en service, sans interrompre votre exploitation — magasin ouvert, ligne en marche.',
  '/contrat-de-performance-energetique/':
    'Contrôle de conformité, suivi des consommations après travaux et contrat de performance énergétique sur la durée convenue.',
  '/decret-tertiaire-decret-bacs/':
    'Éligibilité CEE vérifiée dès l’étude, dossier constitué avec les pièces du chantier jusqu’au contrôle — un levier intégré au projet.',
};

function isHiddenSolution(path?: string) {
  if (!path) return false;
  return HIDE_SOLUTION_PATHS.some((p) => path.includes(p.replace(/\/$/, '')) || path === p);
}

const snap = await updateSnapshot((s) => {
  s.ai.buttonLabel = 'Conseiller PEXEN';
  s.ai.panelTitle = 'Conseiller PEXEN';
  s.ai.statusLabel = 'En ligne';

  const home = s.pages.find((p) => p.path === '/');
  if (home) {
    for (const b of home.blocks) {
      const d = b.data as Record<string, unknown>;

      /* Stats strip — qualifications sans COFRAC */
      if (b.type === 'stats' && (d.style === 'strip' || d.style === 'inline')) {
        d.qualifications = QUALIFICATIONS;
      }

      /* Enjeux — raccourcir hints */
      if (b.type === 'stats' && d.style === 'cards') {
        const items = (d.items as { link?: string; hint?: string }[]) || [];
        for (const it of items) {
          const next = it.link ? ENJEUX_HINTS[it.link] : undefined;
          if (next) it.hint = next;
        }
      }

      /* Interlocuteur — longueurs homogènes */
      if (b.type === 'cards' && (d.style === 'minimal' || d.style === 'card')) {
        const items = (d.items as { link?: string; text?: string }[]) || [];
        for (const it of items) {
          const next = it.link ? INTERLOCUTEUR_TEXTS[it.link] : undefined;
          if (next) it.text = next;
        }
      }

      /* Solutions homepage — retirer LED + rénovation */
      if (b.type === 'cards' && d.style === 'numbered') {
        const items = (d.items as { link?: string; title?: string }[]) || [];
        d.items = items.filter((it) => !isHiddenSolution(it.link));
      }
    }
  }

  /* Menus primary + mobile — retirer LED / rénovation des enfants Solutions */
  for (const menu of s.menus) {
    if (menu.id !== 'primary' && menu.id !== 'mobile') continue;
    for (const it of menu.items || []) {
      if (!it.children?.length) continue;
      const isSolutions =
        it.path === '/solutions/' || /^solutions$/i.test(it.label || '') || it.label === 'Solutions';
      if (!isSolutions) continue;
      it.children = it.children.filter((c) => !isHiddenSolution(c.path));
    }
  }

  /* Pages LED / rénovation hors ligne (brief Amina : dépublier) */
  for (const path of HIDE_SOLUTION_PATHS) {
    const page = s.pages.find((p) => p.path === path);
    if (page) page.status = 'draft';
  }
});

const home = snap.pages.find((p) => p.path === '/')!;
const strip = home.blocks.find((b) => b.type === 'stats' && b.data.style === 'strip');
const enjeux = home.blocks.find((b) => b.type === 'stats' && b.data.style === 'cards');
const inter = home.blocks.find((b) => b.type === 'cards' && (b.data.style === 'minimal' || b.data.style === 'card'));
const sols = home.blocks.find((b) => b.type === 'cards' && b.data.style === 'numbered');

console.log('ai', snap.ai.buttonLabel, snap.ai.panelTitle);
console.log(
  'quali',
  ((strip?.data.qualifications as { label?: string }[]) || []).map((q) => q.label),
);
console.log(
  'enjeux lens',
  ((enjeux?.data.items as { hint?: string; label?: string }[]) || []).map((i) => [i.label, i.hint?.length]),
);
console.log(
  'interlocuteur lens',
  ((inter?.data.items as { title?: string; text?: string }[]) || []).map((i) => [i.title, i.text?.length]),
);
console.log(
  'solutions',
  ((sols?.data.items as { title?: string; link?: string }[]) || []).map((i) => [i.title, i.link]),
);
const primary = snap.menus.find((m) => m.id === 'primary');
const solMenu = primary?.items?.find((i) => i.path === '/solutions/' || i.label === 'Solutions');
console.log(
  'menu solutions',
  (solMenu?.children || []).map((c) => c.label),
);

/* Confirmer pages LED/rénov en draft */
for (const path of HIDE_SOLUTION_PATHS) {
  const page = snap.pages.find((p) => p.path === path);
  console.log('page offline', path, page?.status, !!page);
}

await pool.end();
