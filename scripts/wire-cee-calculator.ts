import 'dotenv/config';
import { pool } from '../server/db/client';
import { uid } from '../server/cms/blocks';
import { defaultSimulatorData } from '../server/cms/ceeDefaults';
import { updateSnapshot } from '../server/cms/store';

const tool = defaultSimulatorData('tool');
const teaser = defaultSimulatorData('teaser');

const snap = await updateSnapshot((s) => {
  const home = s.pages.find((p) => p.path === '/');
  if (home) {
    const sim = home.blocks.find((b) => b.type === 'simulator');
    if (sim) {
      sim.data = {
        ...sim.data,
        ...teaser,
        title: (sim.data.title as string) || teaser.title,
        intro: (sim.data.intro as string) || teaser.intro,
        eyebrow: (sim.data.eyebrow as string) || teaser.eyebrow,
        variant: 'teaser',
      };
      sim.style = { ...sim.style, background: 'white', paddingTop: 'none', paddingBottom: 'none' };
    }
  }

  const est = s.pages.find((p) => p.path === '/estimation-financement/');
  if (est) {
    const existing = est.blocks.find((b) => b.type === 'simulator');
    const data = {
      ...tool,
      variant: 'tool' as const,
      eyebrow: 'Financement',
      title: 'Décrivez votre site et les travaux envisagés',
      intro:
        'Vous obtenez un premier ordre de grandeur du financement des travaux énergétiques mobilisable. Il ne remplace ni la visite technique, ni les relevés, ni la note de calcul.',
    };
    if (existing) {
      existing.data = { ...existing.data, ...data };
      existing.style = { ...existing.style, background: 'white', paddingTop: 'lg', paddingBottom: 'lg' };
    } else {
      const headerIdx = est.blocks.findIndex((b) => b.type === 'pageHeader');
      est.blocks.splice(headerIdx >= 0 ? headerIdx + 1 : 0, 0, {
        id: uid('b'),
        type: 'simulator',
        data,
        style: { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' },
      });
    }
    // L’intro + « comment c’est estimé » sont portés par le bloc calculateur.
    est.blocks = est.blocks.filter((b) => b.type !== 'richText');
  }

  const simPage = s.pages.find((p) => p.path === '/simulateur-cee/');
  if (simPage) {
    const sim = simPage.blocks.find((b) => b.type === 'simulator');
    if (sim) {
      sim.data = {
        ...tool,
        variant: 'tool',
        eyebrow: 'Financement',
        title: 'Calculateur CEE',
        intro: 'Type de site, travaux envisagés, puissance : une première estimation du financement mobilisable.',
      };
    }
  }
});

const homeSim = snap.pages.find((p) => p.path === '/')?.blocks.find((b) => b.type === 'simulator');
const est = snap.pages.find((p) => p.path === '/estimation-financement/');
const simCee = snap.pages.find((p) => p.path === '/simulateur-cee/');
console.log('home simulator variant', homeSim?.data?.variant, homeSim?.data?.title);
console.log(
  'estimation blocks',
  est?.blocks.map((b) => `${b.type}:${String((b.data as { variant?: string; title?: string }).variant || '')}:${String((b.data as { title?: string }).title || '').slice(0, 40)}`)
);
console.log(
  'simulateur-cee blocks',
  simCee?.blocks.map((b) => b.type)
);
await pool.end();
