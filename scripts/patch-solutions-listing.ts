import 'dotenv/config';
import { uid } from '../server/cms/blocks.ts';
import { updateSnapshot } from '../server/cms/store.ts';
import { pool } from '../server/db/client.ts';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;

await updateSnapshot((s) => {
  const page = s.pages.find((p) => p.path === '/solutions/');
  if (!page) throw new Error('solutions missing');
  const cards = page.blocks.find((b) => b.type === 'cards');
  if (!cards) throw new Error('cards missing');
  const d = cards.data as {
    title?: string;
    intro?: string;
    items: {
      id: string;
      title: string;
      text?: string;
      image?: string;
      link?: string;
      linkLabel?: string;
      tags?: string[];
    }[];
  };
  const links = new Set(d.items.map((i) => i.link));
  if (!links.has('/solutions/renovation-globale-tertiaire/')) {
    d.items.push({
      id: uid('c'),
      title: 'Rénovation globale',
      text: 'Audit, bouquet de travaux et trajectoire 2030–2050 : enveloppe, chaleur, froid et pilotage traités ensemble.',
      image: IMG('chantier-de-renovation-globale-tertiaire.webp'),
      link: '/solutions/renovation-globale-tertiaire/',
      linkLabel: 'Découvrir →',
      tags: [],
    });
  }
  if (!links.has('/solutions/eclairage-led/')) {
    d.items.push({
      id: uid('c'),
      title: 'Éclairage LED',
      text: 'Luminaires LED, détection de présence et gradation : souvent plus de 50 % d’économies sur le poste éclairage.',
      image: IMG('eclairage-led-d-un-entrepot-pexen.webp'),
      link: '/solutions/eclairage-led/',
      linkLabel: 'Découvrir →',
      tags: [],
    });
  }
  d.title = 'Nos solutions d’efficacité énergétique';
  d.intro =
    d.intro ||
    'Froid, chaleur, pilotage, isolation, rénovation globale et éclairage : une même équipe du relevé au suivi.';
  page.updatedAt = new Date().toISOString();
  console.log(
    'solutions cards',
    d.items.length,
    d.items.map((i) => i.title).join(' · '),
  );
});
await pool.end();
