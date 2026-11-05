import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

/** ALT brief 00g — cartes Solutions homepage */
const EXPERTISE_ALTS: Record<string, string> = {
  '/solutions/froid-commercial-industriel/': 'Froid commercial et industriel, centrale froid optimisée par PEXEN',
  '/solutions/recuperation-de-chaleur/': 'Récupération de chaleur sur groupe froid installée par PEXEN',
  '/solutions/pompe-a-chaleur-tertiaire/': 'Chauffage et traitement d’air, pompe à chaleur tertiaire installée par PEXEN',
  '/solutions/pilotage-gtb-decret-bacs/': 'Pilotage GTB et décret BACS, supervision installée par PEXEN',
  '/solutions/isolation-technique/': 'Isolation technique, calorifugeage d’un réseau par PEXEN',
};

const SECTOR_ALTS: Record<string, string> = {
  '/secteurs/efficacite-energetique-industrielle/': 'Efficacité énergétique industrielle, site de production accompagné par PEXEN',
  '/secteurs/efficacite-energetique-tertiaire/': 'Efficacité énergétique tertiaire, supermarché accompagné par PEXEN',
  '/secteurs/batiments-collectifs/': 'Bâtiments collectifs, chaufferie rénovée par PEXEN',
  '/partenaires/': 'Partenaires professionnels, équipe PEXEN sur chantier',
};

const PARTNERS = ['Intermarché', 'Carrefour Market', 'CEDIM', 'Colorcon'];

const snap = await updateSnapshot((s) => {
  const home = s.pages.find((p) => p.path === '/');
  if (home) {
    for (const b of home.blocks) {
      if (b.type === 'stats' && (b.data.style === 'strip' || b.data.style === 'inline')) {
        b.data.partners = PARTNERS;
        if (!b.data.eyebrow) b.data.eyebrow = 'Ils nous confient leurs sites';
      }
      if (b.type === 'cards' && b.data.style === 'numbered') {
        for (const it of (b.data.items as { link?: string; imageAlt?: string; title?: string }[]) || []) {
          const alt = it.link ? EXPERTISE_ALTS[it.link] : undefined;
          if (alt) it.imageAlt = alt;
        }
      }
      if (b.type === 'panels') {
        for (const it of (b.data.items as { link?: string; imageAlt?: string }[]) || []) {
          const alt = it.link ? SECTOR_ALTS[it.link] : undefined;
          if (alt) (it as { imageAlt?: string }).imageAlt = alt;
        }
      }
    }
  }

  /* Nettoyer les puces réalisations : retirer montants € et codes fiches des results affichés */
  for (const page of s.pages) {
    if (page.template !== 'project' || !page.project) continue;
    page.project.results = (page.project.results || []).filter((line) => line && !/€/.test(line) && !/\b(BAT|IND|EQ|EN)-[A-Z0-9-]+/i.test(line));
    /* garder cumac, vider primeCee côté affichage public via UI ; on laisse la donnée BO mais on peut la garder */
  }
});

const home = snap.pages.find((p) => p.path === '/')!;
const strip = home.blocks.find((b) => b.type === 'stats' && b.data.style === 'strip');
console.log('partners', strip?.data.partners);
const cards = home.blocks.find((b) => b.type === 'cards' && b.data.style === 'numbered');
console.log(
  'alts',
  ((cards?.data.items as { title?: string; imageAlt?: string }[]) || []).map((i) => [i.title, i.imageAlt])
);
for (const p of snap.pages.filter((x) => x.template === 'project' && x.status === 'published')) {
  console.log(p.path, 'results', p.project?.results, 'prime kept in BO', p.project?.primeCee);
}
await pool.end();
