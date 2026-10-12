import React from 'react';
import type { BlockStyle } from '../../../server/cms/blocks';
import { cx } from '../ui/primitives';
import { FieldsForm, type FieldDef } from './fields';

const o = (...pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

const BACKGROUNDS: { value: BlockStyle['background']; label: string; swatch: string }[] = [
  { value: 'white', label: 'Blanc', swatch: 'bg-white' },
  { value: 'surface', label: 'Gris clair', swatch: 'bg-slate-100' },
  { value: 'soft', label: 'Dégradé doux', swatch: 'bg-gradient-to-br from-teal-50 to-sky-50' },
  { value: 'navy', label: 'Sombre', swatch: 'bg-[#0B1528]' },
  { value: 'brand', label: 'Couleur de marque', swatch: 'bg-gradient-to-br from-[#00C6BA] to-[#0066EE]' },
  { value: 'image', label: 'Photo', swatch: 'bg-[linear-gradient(135deg,#94a3b8,#cbd5e1)]' },
  { value: 'video', label: 'Vidéo', swatch: 'bg-[linear-gradient(135deg,#334155,#64748b)]' },
  { value: 'none', label: 'Transparent', swatch: 'bg-[repeating-conic-gradient(#e2e8f0_0_25%,#fff_0_50%)] bg-[length:10px_10px]' },
];

const SPACING = o(['none', 'Aucun'], ['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']);

const MEDIA_FIELDS: FieldDef[] = [
  { t: 'image', key: 'backgroundImage', label: 'Photo de fond', show: (s) => s.background === 'image' },
  { t: 'video', key: 'backgroundVideo', label: 'Vidéo de fond (MP4, lue en boucle sans son)', show: (s) => s.background === 'video' },
  { t: 'image', key: 'backgroundImage', label: 'Image d’attente de la vidéo', show: (s) => s.background === 'video' },
  { t: 'segmented', key: 'overlayTone', label: 'Voile', options: o(['dark', 'Sombre (texte blanc)'], ['light', 'Clair (texte foncé)']) },
  { t: 'range', key: 'overlay', label: 'Opacité du voile', min: 0, max: 95, step: 5, suffix: ' %' },
];

const LAYOUT_FIELDS: FieldDef[] = [
  { t: 'segmented', key: 'paddingTop', label: 'Marge en haut', options: SPACING },
  { t: 'segmented', key: 'paddingBottom', label: 'Marge en bas', options: SPACING },
  { t: 'segmented', key: 'width', label: 'Largeur du contenu', options: o(['narrow', 'Étroite'], ['default', 'Normale'], ['wide', 'Large'], ['full', 'Pleine']) },
  { t: 'select', key: 'decor', label: 'Motif décoratif', options: o(['none', 'Aucun'], ['dots', 'Points'], ['grid', 'Grille'], ['rings', 'Cercles'], ['diagonal', 'Rayures diagonales'], ['glow', 'Halos lumineux']) },
  { t: 'switch', key: 'borderTop', label: 'Ligne de séparation en haut' },
];

const ANIMATIONS: { value: BlockStyle['animation']; label: string }[] = [
  { value: 'fade-up', label: 'Apparition vers le haut' },
  { value: 'fade', label: 'Fondu' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'slide-left', label: 'Glissement depuis la droite' },
  { value: 'slide-right', label: 'Glissement depuis la gauche' },
  { value: 'none', label: 'Aucune' },
];

const ADVANCED_FIELDS: FieldDef[] = [
  { t: 'text', key: 'anchor', label: 'Ancre', placeholder: 'ex. tarifs', hint: 'Permet un lien direct vers ce bloc : /page/#tarifs' },
  { t: 'switch', key: 'hideOnMobile', label: 'Masquer sur mobile' },
  { t: 'switch', key: 'hideOnDesktop', label: 'Masquer sur ordinateur' },
];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 border-b border-slate-100 px-4 py-4 last:border-0">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h4>
      {children}
    </section>
  );
}

export function StyleEditor({ style, onChange }: { style: BlockStyle; onChange: (p: Partial<BlockStyle>) => void }) {
  const value = style as unknown as Record<string, unknown>;
  const set = (p: Record<string, unknown>) => onChange(p as Partial<BlockStyle>);
  const withMedia = style.background === 'image' || style.background === 'video';
  return (
    <div>
      <Group title="Arrière-plan">
        <div className="grid grid-cols-4 gap-2">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => onChange({ background: b.value })}
              className={cx('group flex flex-col items-center gap-1 rounded-lg p-1 text-[11px] transition', style.background === b.value ? 'text-brand-700' : 'text-slate-500 hover:text-slate-800')}
            >
              <span className={cx('h-9 w-full rounded-md ring-1 ring-slate-200 transition', b.swatch, style.background === b.value ? 'ring-2 ring-brand-500 ring-offset-1' : 'group-hover:ring-slate-300')} />
              <span className="truncate">{b.label}</span>
            </button>
          ))}
        </div>
        {withMedia ? <FieldsForm fields={MEDIA_FIELDS} value={value} onChange={set} /> : null}
      </Group>
      <Group title="Animation à l’apparition">
        <div className="grid grid-cols-2 gap-1.5">
          {ANIMATIONS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => onChange({ animation: a.value })}
              className={cx(
                'rounded-lg border px-2.5 py-2 text-left text-[12px] font-medium transition',
                style.animation === a.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </Group>
      <Group title="Mise en page">
        <FieldsForm fields={LAYOUT_FIELDS} value={value} onChange={set} />
      </Group>
      <Group title="Avancé">
        <FieldsForm fields={ADVANCED_FIELDS} value={value} onChange={set} />
      </Group>
    </div>
  );
}
