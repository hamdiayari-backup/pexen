import React, { useCallback, useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type { ThemeBranding } from '../../../server/cms/types';
import { api } from '../lib/api';
import { useEditable } from '../lib/hooks';
import { useSite, useSiteData } from '../context/SiteContext';
import { Button, ColorField, Field, Input, PageHeader, Section, Select } from '../ui/primitives';
import { ImageField } from '../ui/media';
import { SaveBar } from '../ui/SaveBar';
import { DeviceSwitch, PreviewFrame, type Device } from '../editor/PreviewFrame';

const COLOR_LABELS: { key: keyof ThemeBranding['colors']; label: string; hint: string }[] = [
  { key: 'primary', label: 'Couleur principale (turquoise)', hint: 'Début du dégradé des boutons, mots en couleur, icônes' },
  { key: 'primaryHover', label: 'Principale foncée', hint: 'Liens, sur-titres, survols' },
  { key: 'accent', label: 'Couleur secondaire (bleu)', hint: 'Fin du dégradé des boutons et des bandeaux' },
  { key: 'navy', label: 'Bleu nuit', hint: 'Titres, sections sombres, pied de page' },
  { key: 'background', label: 'Fond des sections claires', hint: 'Sections « gris clair »' },
  { key: 'text', label: 'Texte principal', hint: '' },
  { key: 'muted', label: 'Texte secondaire', hint: 'Introductions, légendes' },
  { key: 'border', label: 'Bordures', hint: 'Cartes, séparateurs' },
];

const DEFAULT_COLORS: ThemeBranding['colors'] = {
  primary: '#009FCC',
  primaryHover: '#00769A',
  accent: '#01CDF3',
  navy: '#082D4A',
  background: '#F4F8F9',
  text: '#0B1B2B',
  muted: '#5A6B7B',
  border: '#D5E1E6',
};

const FONTS = [
  'Figtree',
  'Sora',
  'Inter',
  'Manrope',
  'Plus Jakarta Sans',
  'DM Sans',
  'Poppins',
  'Montserrat',
  'Roboto',
  'Open Sans',
  'Lato',
  'Source Sans 3',
  'Space Grotesk',
  'Outfit',
].map((f) => ({
  value: f,
  label: f,
}));

/** Aperçu réel : le vrai site, avec l'identité visuelle en cours d'édition (non enregistrée). */
function LivePreview({ b, pages }: { b: ThemeBranding; pages: { value: string; label: string }[] }) {
  const [path, setPath] = useState('/');
  const [device, setDevice] = useState<Device>('desktop');
  const payload = useMemo(() => ({ site: { branding: b } }), [b]);
  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          Aperçu en direct
        </span>
        <div className="ml-auto w-48">
          <Select value={path} onChange={setPath} options={pages} />
        </div>
        <DeviceSwitch value={device} onChange={setDevice} />
      </div>
      <div className="min-h-0 flex-1">
        <PreviewFrame path={path} payload={payload} device={device} />
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const save = useCallback(
    async (b: ThemeBranding) => {
      await api.saveSection('branding', b);
      patchSite('branding', b);
    },
    [patchSite]
  );
  const ed = useEditable<ThemeBranding>(site.branding, save, { successMessage: 'Identité visuelle enregistrée' });
  if (!ed.value) return null;
  const b = ed.value;
  const setColor = (k: keyof ThemeBranding['colors'], v: string) => ed.patch({ colors: { ...b.colors, [k]: v } });
  const pages = site.pages
    .filter((p) => p.status === 'published')
    .sort((x, y) => x.path.localeCompare(y.path))
    .map((p) => ({ value: p.path, label: p.path === '/' ? 'Accueil' : p.title }));

  return (
    <div className="space-y-6">
      <PageHeader title="Identité visuelle" description="Logo, couleurs et typographie du site." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="min-w-0 space-y-6">
          <Section title="Nom et logo">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nom du site">
                <Input value={b.siteName} onChange={(e) => ed.patch({ siteName: e.target.value })} />
              </Field>
              <Field label="Accroche">
                <Input value={b.tagline} onChange={(e) => ed.patch({ tagline: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Logo de l’en-tête" hint="SVG ou PNG transparent. Vide = logo animé PEXEN + nom et accroche.">
                <ImageField value={b.logoUrl} onChange={(logoUrl) => ed.patch({ logoUrl })} aspect="aspect-[3/2]" />
              </Field>
              <Field label="Logo du pied de page" hint="Version claire, sur fond sombre. Vide = logo PEXEN par défaut.">
                <div className="rounded-xl bg-navy-900 p-1">
                  <ImageField value={b.logoDarkUrl} onChange={(logoDarkUrl) => ed.patch({ logoDarkUrl })} aspect="aspect-[3/2]" />
                </div>
              </Field>
              <Field label="Favicon" hint="Carré, 512 × 512 px.">
                <ImageField value={b.faviconUrl} onChange={(faviconUrl) => ed.patch({ faviconUrl })} aspect="aspect-[3/2]" />
              </Field>
            </div>
          </Section>

          <Section
            title="Couleurs"
            actions={
              <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => ed.patch({ colors: DEFAULT_COLORS })}>
                Couleurs PEXEN
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {COLOR_LABELS.map((l) => (
                <ColorField key={l.key} label={l.label} hint={l.hint || undefined} value={b.colors[l.key]} onChange={(v) => setColor(l.key, v)} />
              ))}
            </div>
          </Section>

          <Section title="Typographie">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Police des titres">
                <Select value={b.fonts.heading} onChange={(heading) => ed.patch({ fonts: { ...b.fonts, heading } })} options={withCurrent(FONTS, b.fonts.heading)} />
              </Field>
              <Field label="Police du texte">
                <Select value={b.fonts.body} onChange={(body) => ed.patch({ fonts: { ...b.fonts, body } })} options={withCurrent(FONTS, b.fonts.body)} />
              </Field>
            </div>
          </Section>
        </div>
        <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
          <LivePreview b={b} pages={pages} />
        </div>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}

function withCurrent(opts: { value: string; label: string }[], current: string) {
  return opts.some((o) => o.value === current) || !current ? opts : [{ value: current, label: current }, ...opts];
}
