import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const snap = await updateSnapshot((s) => {
  for (const page of s.pages) {
    for (const b of page.blocks) {
      if (b.type !== 'faq') continue;
      (b.data as { showContactCard?: boolean }).showContactCard = true;
      if (!(b.data as { eyebrow?: string }).eyebrow) (b.data as { eyebrow?: string }).eyebrow = 'FAQ';
    }

    const h = page.blocks.find((x) => x.type === 'pageHeader');
    if (!h) continue;
    const data = h.data as {
      eyebrow?: string;
      buttons?: { id?: string; label: string; link?: string; variant?: string; icon?: string }[];
    };
    if (Array.isArray(data.buttons) && data.buttons.length === 1 && !page.path.startsWith('/contact')) {
      data.buttons.push({
        id: 'btn-estim',
        label: 'Estimer le financement',
        link: '/estimation-financement/',
        variant: 'secondary',
        icon: 'none',
      });
    }
    if (!data.eyebrow) {
      const path = page.path;
      data.eyebrow = path.startsWith('/solutions')
        ? 'Solutions'
        : path.startsWith('/secteurs') || path === '/partenaires/'
          ? 'Secteurs'
          : path.startsWith('/realisations')
            ? 'Réalisations'
            : path.includes('etudes') ||
                path.includes('accompagnement') ||
                path.includes('contrat') ||
                path.includes('decret')
              ? 'Expertises'
              : 'PEXEN';
    }
  }
});

const et = snap.pages.find((p) => p.path === '/etudes-ingenierie-energetique/')!;
const h = et.blocks.find((b) => b.type === 'pageHeader')!;
console.log('eyebrow', h.data.eyebrow, 'btns', (h.data.buttons as { label: string }[]).map((b) => b.label));
console.log('faq aside', et.blocks.find((b) => b.type === 'faq')?.data.showContactCard);
await pool.end();
