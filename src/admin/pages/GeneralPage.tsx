import React, { useCallback } from 'react';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteGeneralInfo } from '../../../server/cms/types';
import { api } from '../lib/api';
import { useEditable } from '../lib/hooks';
import { useSite, useSiteData } from '../context/SiteContext';
import { Card, Field, Input, PageHeader, Section, Select, Textarea } from '../ui/primitives';
import { SaveBar } from '../ui/SaveBar';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function GeneralPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const save = useCallback(
    async (g: SiteGeneralInfo) => {
      if (g.contactEmail && !EMAIL_RE.test(g.contactEmail)) throw new Error('L’adresse e-mail de contact est invalide.');
      const next = { ...g, phoneClean: '' };
      await api.saveSection('general', next);
      const fresh = await api.snapshot();
      patchSite('general', fresh.general);
      return fresh.general;
    },
    [patchSite]
  );
  const ed = useEditable<SiteGeneralInfo>(site.general, save, { successMessage: 'Informations enregistrées' });
  if (!ed.value) return null;
  const g = ed.value;

  return (
    <div className="space-y-6">
      <PageHeader title="Informations générales" description="Coordonnées et informations de l’entreprise, reprises automatiquement dans l’en-tête, le pied de page et les pages de contact." />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Section title="Entreprise">
            <Field label="Raison sociale">
              <Input value={g.legalName} onChange={(e) => ed.patch({ legalName: e.target.value })} />
            </Field>
            <Field label="Activité (baseline)">
              <Input value={g.baseline} onChange={(e) => ed.patch({ baseline: e.target.value })} />
            </Field>
            <Field label="Slogan">
              <Input value={g.slogan} onChange={(e) => ed.patch({ slogan: e.target.value })} />
            </Field>
          </Section>
          <Section title="Coordonnées">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone" hint="Le format international pour les liens d’appel est calculé automatiquement.">
                <Input value={g.phone} onChange={(e) => ed.patch({ phone: e.target.value })} />
              </Field>
              <Field label="E-mail de contact" error={g.contactEmail && !EMAIL_RE.test(g.contactEmail) ? 'Adresse invalide' : undefined}>
                <Input type="email" value={g.contactEmail} onChange={(e) => ed.patch({ contactEmail: e.target.value })} />
              </Field>
            </div>
            <Field label="Adresse postale">
              <Textarea value={g.address} onChange={(e) => ed.patch({ address: e.target.value })} rows={2} />
            </Field>
            <Field label="Délai de rappel" hint="Ex. : 48 h ouvrées">
              <Input value={g.slaHours} onChange={(e) => ed.patch({ slaHours: e.target.value })} />
            </Field>
          </Section>
          <Section title="Région">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fuseau horaire">
                <Select
                  value={g.timezone}
                  onChange={(timezone) => ed.patch({ timezone })}
                  options={['Europe/Paris', 'Europe/Brussels', 'Europe/Zurich', 'Europe/Luxembourg', 'America/Montreal', 'Africa/Casablanca', 'Africa/Tunis'].map((v) => ({ value: v, label: v }))}
                />
              </Field>
              <Field label="Langue du site">
                <Select
                  value={g.locale}
                  onChange={(locale) => ed.patch({ locale })}
                  options={[
                    { value: 'fr-FR', label: 'Français (France)' },
                    { value: 'fr-BE', label: 'Français (Belgique)' },
                    { value: 'fr-CH', label: 'Français (Suisse)' },
                    { value: 'fr-CA', label: 'Français (Canada)' },
                  ]}
                />
              </Field>
            </div>
          </Section>
        </div>
        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu de la carte de contact</p>
          <Card className="space-y-4" padded>
            <div>
              <p className="font-semibold text-slate-900">{g.legalName || site.branding.siteName}</p>
              <p className="text-xs text-slate-500">{g.baseline}</p>
            </div>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-brand-600" /> {g.phone || '—'}
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-brand-600" /> {g.contactEmail || '—'}
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-600" /> <span className="whitespace-pre-line">{g.address || '—'}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-brand-600" /> Rappel sous {g.slaHours || '—'}
              </li>
            </ul>
            <p className="border-t border-slate-100 pt-3 text-sm italic text-slate-500">« {g.slogan} »</p>
          </Card>
        </div>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}
