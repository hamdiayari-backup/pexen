import React, { useCallback } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, MousePointerClick, Plus, Trash2 } from 'lucide-react';
import type { FloatingButtonConfig, WhatsAppConfig } from '../../../server/cms/types';
import { api } from '../lib/api';
import { useEditable } from '../lib/hooks';
import { useSite, useSiteData } from '../context/SiteContext';
import { Alert, Button, EmptyState, Field, Input, PageHeader, Section, Segmented, Select, Switch, Textarea } from '../ui/primitives';
import { SaveBar } from '../ui/SaveBar';
import { LinkInput } from '../editor/fields';

interface State {
  whatsapp: WhatsAppConfig;
  buttons: FloatingButtonConfig[];
}

const DEFAULT_BAR: FloatingButtonConfig[] = [
  { id: 'call', label: 'Appeler', path: 'tel:', style: 'outline', enabled: true },
  { id: 'contact', label: 'Parler de votre projet', path: '/contact/', style: 'primary', enabled: true },
];

function PhonePreview({ state }: { state: State }) {
  const site = useSiteData();
  const wa = state.whatsapp;
  const buttons = state.buttons.filter((b) => b.enabled && b.label);
  const side = wa.position === 'bottom-left' ? 'left-3' : 'right-3';
  return (
    <div className="mx-auto w-[270px] overflow-hidden rounded-[30px] border-[7px] border-slate-900 bg-white shadow-2xl">
      <div className="relative h-[480px] bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <span className="text-sm font-bold" style={{ color: site.branding.colors.navy }}>
            {site.branding.siteName}
          </span>
          <span className="h-3 w-5 rounded-sm bg-slate-200" />
        </div>
        <div className="space-y-2 p-4">
          <div className="h-24 rounded-lg" style={{ background: site.branding.colors.navy }} />
          <div className="h-3 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
        <div className="absolute inset-x-3 bottom-3 flex gap-2">
          {(buttons.length ? buttons : DEFAULT_BAR).slice(0, 2).map((b) => (
              <span
                key={b.id}
                className="flex-1 truncate rounded-lg px-2 py-2 text-center text-xs font-semibold"
                style={
                  b.style === 'primary'
                    ? { background: site.branding.colors.primary, color: '#fff' }
                    : b.style === 'outline'
                      ? { border: `1.5px solid ${site.branding.colors.primary}`, color: site.branding.colors.primary, background: '#fff' }
                      : { color: site.branding.colors.navy, background: '#f1f5f9' }
                }
              >
                {b.label}
              </span>
          ))}
        </div>
        {wa.enabled && wa.showOnMobile ? (
          <span className={`absolute ${side} bottom-16 flex h-12 w-12 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg`}>
            <MessageCircle className="h-6 w-6" />
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function EngagementPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const initial = React.useMemo<State>(() => ({ whatsapp: site.whatsapp, buttons: site.floatingButtons }), [site.whatsapp, site.floatingButtons]);

  const save = useCallback(
    async (s: State) => {
      if (JSON.stringify(s.whatsapp) !== JSON.stringify(site.whatsapp)) await api.saveSection('whatsapp', s.whatsapp);
      if (JSON.stringify(s.buttons) !== JSON.stringify(site.floatingButtons)) await api.saveFloatingButtons(s.buttons);
      patchSite('whatsapp', s.whatsapp);
      patchSite('floatingButtons', s.buttons);
    },
    [site.whatsapp, site.floatingButtons, patchSite]
  );
  const ed = useEditable<State>(initial, save);
  if (!ed.value) return null;
  const { whatsapp: wa, buttons } = ed.value;
  const setWa = (p: Partial<WhatsAppConfig>) => ed.patch({ whatsapp: { ...wa, ...p } });
  const setButtons = (b: FloatingButtonConfig[]) => ed.patch({ buttons: b });
  const digits = wa.number.replace(/\D/g, '');
  const testUrl = `https://wa.me/${digits}?text=${encodeURIComponent(wa.defaultMessage)}`;

  return (
    <div className="space-y-6">
      <PageHeader title="WhatsApp & boutons" description="Les points de contact rapides affichés en permanence sur le site." />
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Section
            title={
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-[#25d366]" /> Bouton WhatsApp
              </span>
            }
            description="Permet aux visiteurs de vous écrire directement sur WhatsApp."
            actions={<Switch checked={wa.enabled} onChange={(enabled) => setWa({ enabled })} />}
          >
            <div className={wa.enabled ? 'space-y-4' : 'pointer-events-none space-y-4 opacity-50'}>
              <Field label="Numéro WhatsApp" hint="Au format international, ex. +33 6 12 34 56 78." error={wa.number && digits.length < 8 ? 'Numéro trop court' : undefined}>
                <Input value={wa.number} onChange={(e) => setWa({ number: e.target.value })} placeholder="+33 6 12 34 56 78" />
              </Field>
              <Field label="Message pré-rempli" hint="Texte proposé au visiteur à l’ouverture de la conversation.">
                <Textarea value={wa.defaultMessage} onChange={(e) => setWa({ defaultMessage: e.target.value })} rows={2} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Position">
                  <Segmented
                    value={wa.position}
                    onChange={(position) => setWa({ position })}
                    options={[
                      { value: 'bottom-left', label: 'En bas à gauche' },
                      { value: 'bottom-right', label: 'En bas à droite' },
                    ]}
                  />
                </Field>
                <div className="space-y-1">
                  <Switch checked={wa.showOnDesktop} onChange={(showOnDesktop) => setWa({ showOnDesktop })} label="Afficher sur ordinateur" />
                  <Switch checked={wa.showOnMobile} onChange={(showOnMobile) => setWa({ showOnMobile })} label="Afficher sur mobile" />
                </div>
              </div>
              {digits.length >= 8 ? (
                <a href={testUrl} target="_blank" rel="noreferrer" className="inline-block text-[13px] font-medium text-brand-700 hover:underline">
                  Tester le lien WhatsApp →
                </a>
              ) : null}
            </div>
          </Section>

          <Section
            title={
              <span className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-brand-600" /> Boutons d’action flottants
              </span>
            }
            description="Barre fixée en bas de l’écran sur mobile. Sans bouton configuré, le site affiche « Appeler » et « Parler de votre projet ». Deux boutons au maximum."
            actions={
              <Button size="sm" icon={Plus} disabled={buttons.length >= 4} onClick={() => setButtons([...buttons, { id: crypto.randomUUID(), label: '', path: '/contact/', style: 'primary', enabled: true }])}>
                Ajouter
              </Button>
            }
          >
            {buttons.length === 0 ? (
              <EmptyState icon={MousePointerClick} title="Aucun bouton" description="Ajoutez un bouton pour inciter vos visiteurs à passer à l’action." />
            ) : (
              buttons.map((b, i) => (
                <div key={b.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_150px]">
                    <Field label="Libellé">
                      <Input value={b.label} onChange={(e) => setButtons(buttons.map((x) => (x.id === b.id ? { ...x, label: e.target.value } : x)))} placeholder="Demander un audit" />
                    </Field>
                    <Field label="Destination">
                      <LinkInput value={b.path} onChange={(path) => setButtons(buttons.map((x) => (x.id === b.id ? { ...x, path } : x)))} />
                    </Field>
                    <Field label="Style">
                      <Select
                        value={b.style}
                        onChange={(style) => setButtons(buttons.map((x) => (x.id === b.id ? { ...x, style: style as FloatingButtonConfig['style'] } : x)))}
                        options={[
                          { value: 'primary', label: 'Plein' },
                          { value: 'outline', label: 'Contour' },
                          { value: 'ghost', label: 'Discret' },
                        ]}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <Switch checked={b.enabled} onChange={(enabled) => setButtons(buttons.map((x) => (x.id === b.id ? { ...x, enabled } : x)))} label="Actif" />
                    <div className="flex">
                      <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => setButtons(swap(buttons, i, i - 1))}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" disabled={i === buttons.length - 1} onClick={() => setButtons(swap(buttons, i, i + 1))}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={() => setButtons(buttons.filter((x) => x.id !== b.id))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
            {buttons.filter((b) => b.enabled).length > 2 ? <Alert tone="warning">Seuls les deux premiers boutons actifs sont affichés sur mobile.</Alert> : null}
          </Section>
        </div>

        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu mobile</p>
          <PhonePreview state={ed.value} />
        </div>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}

function swap<T>(arr: T[], a: number, b: number): T[] {
  const next = [...arr];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}
