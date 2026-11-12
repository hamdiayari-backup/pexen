/**
 * Remplace le richText « Notre mission » par un textMedia soigné sur /notre-approche/.
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock } from '../server/cms/types';
import { pool } from '../server/db/client';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const mission = b(
  'textMedia',
  {
    eyebrow: 'Mission',
    title: 'Notre mission',
    html: `<p>Faire de la performance énergétique un levier maîtrisé, mesurable et durable pour les sites industriels, tertiaires et résidentiels collectifs. Notre vision : un parc bâti et industriel où chaque kWh économisé est calculé, réalisé et démontré.</p><p><strong>La performance ne se promet plus, elle se prouve.</strong></p>`,
    image: IMG('performance-energetique.webp'),
    imageAlt: 'Performance énergétique mesurée sur site',
    mediaPosition: 'right',
    bullets: [
      'Maîtrisé, mesurable et durable',
      'Industrie, tertiaire et résidentiel collectif',
      'Chaque kWh calculé, réalisé et démontré',
    ],
    buttons: [button('Demander une étude', '/contact/?demande=etude') as ButtonData],
  },
  { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
);

const snap = await updateSnapshot((s) => {
  const page = s.pages.find((p) => p.path === '/notre-approche/');
  if (!page) throw new Error('page /notre-approche/ introuvable');

  const idx = page.blocks.findIndex((bl) => {
    if (bl.type === 'textMedia' && String((bl.data as { title?: string }).title || '') === 'Notre mission') return true;
    if (bl.type !== 'richText') return false;
    const html = String((bl.data as { html?: string }).html || '');
    return /Notre mission/i.test(html);
  });

  if (idx < 0) throw new Error('bloc Notre mission introuvable');

  page.blocks[idx] = mission;
  page.updatedAt = new Date().toISOString();
  console.log('replaced block', idx, '→ textMedia Notre mission');
});

const page = snap.pages.find((p) => p.path === '/notre-approche/');
console.log(
  '/notre-approche/',
  page?.blocks.map((bl, i) => `${i}:${bl.type}${bl.type === 'textMedia' ? `:${(bl.data as { title?: string }).title}` : ''}`).join(' | ')
);
await pool.end();
