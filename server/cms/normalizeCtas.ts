import type { CtaData } from './blocks';
import type { CmsBlock } from './types';

export function isStudyCta(d: Partial<CtaData>): boolean {
  const title = (d.title || '').toLowerCase();
  const btn = (d.buttons?.[0]?.label || '').toLowerCase();
  const link = (d.buttons?.[0]?.link || '').toLowerCase();
  const eyebrow = (d.eyebrow || '').toLowerCase();
  return (
    /étude|etude|étude chiffrée|demande=etude/.test(`${title} ${btn} ${link}`) ||
    /étude|etude/.test(eyebrow)
  );
}

/** CTA léger « Parlons… » redondant avec le bandeau étude + finale. */
function isWeakMidCta(d: Partial<CtaData>): boolean {
  if (d.variant !== 'light' || d.layout !== 'centered') return false;
  const title = (d.title || '').trim().toLowerCase();
  return /^parlons|^parler de votre/.test(title);
}

/** Un seul bandeau étude par page (le dernier avant FAQ) ; pas de CTA « Parlons » au milieu. */
export function normalizePageCtas(blocks: CmsBlock[]): CmsBlock[] {
  const filtered = blocks.filter((b) => {
    if (b.type !== 'cta') return true;
    return !isWeakMidCta(b.data as Partial<CtaData>);
  });

  const studyIndexes: number[] = [];
  filtered.forEach((b, i) => {
    if (b.type === 'cta' && isStudyCta(b.data as Partial<CtaData>)) studyIndexes.push(i);
  });
  if (studyIndexes.length <= 1) return filtered;

  const keep = studyIndexes[studyIndexes.length - 1];
  return filtered.filter((b, i) => {
    if (b.type !== 'cta') return true;
    if (!isStudyCta(b.data as Partial<CtaData>)) return true;
    return i === keep;
  });
}
