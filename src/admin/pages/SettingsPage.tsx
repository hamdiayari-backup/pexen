import React, { useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useAsync, useEditable } from '../lib/hooks';
import { useSite, useSiteData } from '../context/SiteContext';
import { Field, Input, PageHeader, Section, Switch } from '../ui/primitives';
import { SaveBar } from '../ui/SaveBar';

interface State {
  publicUrl: string;
  cookieBannerEnabled: boolean;
  analyticsEnabled: boolean;
}

export default function SettingsPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const { data: dash } = useAsync(() => api.dashboard(), []);
  const initial = useMemo<State>(
    () => ({ publicUrl: site.settings.publicUrl, cookieBannerEnabled: site.settings.cookieBannerEnabled, analyticsEnabled: site.settings.analyticsEnabled }),
    [site.settings]
  );
  const save = useCallback(
    async (s: State) => {
      const publicUrl = s.publicUrl.trim().replace(/\/+$/, '');
      await api.saveSection('settings', { ...s, publicUrl });
      patchSite('settings', { ...site.settings, ...s, publicUrl });
      return { ...s, publicUrl };
    },
    [site.settings, patchSite]
  );
  const ed = useEditable<State>(initial, save, { successMessage: 'Paramètres enregistrés' });
  if (!ed.value) return null;
  const s = ed.value;
  const urlValid = (() => {
    try {
      return /^https?:$/.test(new URL(s.publicUrl).protocol);
    } catch {
      return false;
    }
  })();

  const services = dash
    ? [
        { ok: dash.health.smtp, label: 'Serveur d’e-mails (SMTP)', env: 'SMTP_HOST, SMTP_USER, SMTP_PASS' },
        { ok: dash.health.gemini, label: 'Assistant IA (Gemini)', env: 'GEMINI_API_KEY' },
        { ok: dash.health.googleOAuthConfigured, label: 'Connexion Google (OAuth)', env: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres du site" description="Réglages techniques globaux." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Adresse du site">
          <Field label="URL publique" hint="Utilisée pour le sitemap, les liens canoniques et les aperçus de partage." error={s.publicUrl && !urlValid ? 'URL invalide (ex. https://www.pexen.fr)' : undefined}>
            <Input value={s.publicUrl} onChange={(e) => ed.patch({ publicUrl: e.target.value })} placeholder="https://www.pexen.fr" />
          </Field>
        </Section>

        <Section title="Confidentialité et mesure d’audience">
          <Switch
            checked={s.analyticsEnabled}
            onChange={(analyticsEnabled) => ed.patch({ analyticsEnabled })}
            label="Statistiques de visite"
            description="Mesure d’audience interne, anonyme et hébergée sur votre serveur (aucun cookie tiers)."
          />
          <Switch
            checked={s.cookieBannerEnabled}
            onChange={(cookieBannerEnabled) => ed.patch({ cookieBannerEnabled })}
            label="Bandeau de consentement aux cookies"
            description="Affiche le bandeau d’information RGPD aux nouveaux visiteurs."
          />
        </Section>

        <Section title="Services connectés" description="Configurés par l’administrateur technique dans le fichier .env du serveur.">
          <ul className="divide-y divide-slate-100">
            {services.map((sv) => (
              <li key={sv.label} className="flex items-start gap-3 py-3">
                {sv.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <XCircle className="mt-0.5 h-4 w-4 text-slate-300" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{sv.label}</p>
                  <p className="font-mono text-[11px] text-slate-400">{sv.env}</p>
                </div>
                <span className={sv.ok ? 'text-xs font-medium text-emerald-600' : 'text-xs text-slate-400'}>{sv.ok ? 'Configuré' : 'Non configuré'}</span>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}
