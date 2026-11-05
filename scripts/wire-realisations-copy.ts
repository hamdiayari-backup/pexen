import 'dotenv/config';
import { pool } from '../server/db/client';
import { updateSnapshot } from '../server/cms/store';

const snap = await updateSnapshot((s) => {
  const page = s.pages.find((p) => p.path === '/realisations/');
  if (!page) return;
  const header = page.blocks.find((b) => b.type === 'pageHeader');
  if (header) {
    header.data = {
      ...header.data,
      title: 'Nos réalisations',
      intro:
        'Des projets de performance énergétique menés de l’étude à la mise en service : une installation, un enjeu d’exploitation, des solutions dimensionnées, des chiffres clés. Chaque réalisation montre l’état avant et après travaux.',
      buttons: [
        {
          id: 'btn-est-fin',
          label: 'Estimer le financement',
          link: '/estimation-financement/',
          variant: 'secondary',
          icon: 'none',
        },
      ],
    };
  }
});

const page = snap.pages.find((p) => p.path === '/realisations/');
const header = page?.blocks.find((b) => b.type === 'pageHeader');
console.log('title', header?.data?.title);
console.log('intro', String(header?.data?.intro || '').slice(0, 80));
console.log('btn', (header?.data?.buttons as { label?: string; link?: string }[] | undefined)?.[0]);
await pool.end();
