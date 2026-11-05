import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

/** Ordre visuel de la capture : contact puis FAQ, le reste inchangé. */
const ORDER = [
  'hero',
  'stats:strip',
  'stats:enjeux',
  'cards:interlocuteur',
  'cards:expertises',
  'steps',
  'projects',
  'checklist',
  'panels',
  'contactForm',
  'faq',
  'simulator',
];

function keyOf(type: string, data: Record<string, unknown>): string {
  if (type === 'stats') return data.style === 'strip' || data.style === 'inline' ? 'stats:strip' : 'stats:enjeux';
  if (type === 'cards') {
    const style = String(data.style || '');
    if (style === 'minimal' || style === 'card') return 'cards:interlocuteur';
    return 'cards:expertises';
  }
  return type;
}

const snap = await updateSnapshot((s) => {
  const home = s.pages.find((p) => p.path === '/');
  if (!home) throw new Error('homepage missing');
  const byKey = new Map<string, typeof home.blocks>();
  for (const b of home.blocks) {
    const k = keyOf(b.type, b.data);
    const list = byKey.get(k) ?? [];
    list.push(b);
    byKey.set(k, list);
  }
  const next = [];
  for (const k of ORDER) {
    const list = byKey.get(k);
    if (!list?.length) continue;
    next.push(list.shift()!);
    if (!list.length) byKey.delete(k);
  }
  for (const rest of byKey.values()) next.push(...rest);
  home.blocks = next;
});

const home = snap.pages.find((p) => p.path === '/')!;
for (const [i, b] of home.blocks.entries()) {
  console.log(String(i).padStart(2, '0'), b.type, (b.data.title as string) || (b.data.eyebrow as string) || '');
}
await pool.end();
