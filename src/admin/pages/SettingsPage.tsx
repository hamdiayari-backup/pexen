/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Database, Gauge, Globe2, Image as ImageIcon, Mail, Server, ShieldCheck, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api, type SystemMeta, type SystemView } from '../lib/api';
import { useAsync, useEditable } from '../lib/hooks';
import { useSite, useSiteData } from '../context/SiteContext';
import { ErrorState, Field, Input, PageHeader, PageSkeleton, Section, Switch, Tabs } from '../ui/primitives';
import { SaveBar } from '../ui/SaveBar';
import { firstFormError, type SystemForm, type TabProps } from '../settings/controls';
import { EmailTab } from '../settings/EmailTab';
import { SecurityTab } from '../settings/SecurityTab';
import { DataTab, LimitsTab, MediaTab, SystemTab } from '../settings/OtherTabs';

interface SiteState {
  publicUrl: string;
  cookieBannerEnabled: boolean;
  analyticsEnabled: boolean;
  footerLegalNotesText: string;
}
interface FormState {
  site: SiteState;
  system: SystemForm;
}

type TabId = 'general' | 'email' | 'security' | 'limits' | 'media' | 'data' | 'system';

const TABS: { value: TabId; label: string; icon: typeof Globe2; keys: (keyof SystemForm | 'site')[] }[] = [
  { value: 'general', label: 'Général', icon: Globe2, keys: ['site'] },
  { value: 'email', label: 'E-mails', icon: Mail, keys: ['smtp', 'notifications'] },
  { value: 'security', label: 'Sécurité', icon: ShieldCheck, keys: ['security'] },
  { value: 'limits', label: 'Limites', icon: Gauge, keys: ['limits'] },
  { value: 'media', label: 'Médias', icon: ImageIcon, keys: ['uploads'] },
  { value: 'data', label: 'Données', icon: Database, keys: ['privacy'] },
  { value: 'system', label: 'Système', icon: Server, keys: ['performance'] },
];

const toForm = (s: SystemView): SystemForm => ({ ...s, smtp: { ...s.smtp, password: '', clearPassword: false } });

function validUrl(url: string) {
  try {
    return /^https?:$/.test(new URL(url).protocol);
  } catch {
    return false;
  }
}

function GeneralTab({ s, patch, meta }: { s: SiteState; patch: (p: Partial<SiteState>) => void; meta: SystemMeta }) {
  const { data: dash } = useAsync(() => api.dashboard(), []);
  const services = [
    { ok: meta.smtpSource !== 'none', label: 'Envoi d’e-mails (SMTP)', detail: meta.smtpSource === 'settings' ? 'Onglet E-mails' : meta.smtpSource === 'env' ? 'Fichier .env' : 'Non configuré' },
    { ok: !!dash?.health?.googleOAuthConfigured, label: 'Connexion Google (Search Console)', detail: 'SEO › Google Search Console' },
    { ok: !!dash?.health?.gemini, label: 'Assistant IA (Gemini)', detail: 'GEMINI_API_KEY' },
    { ok: !!meta.dedicatedSecretKey, label: 'Clé de chiffrement dédiée', detail: 'PEXEN_SECRET_KEY' },
  ];
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Section title="Adresse du site">
          <Field
            label="URL publique"
            hint="Utilisée pour le sitemap, les liens canoniques, les aperçus de partage et les liens des e-mails."
            error={s.publicUrl && !validUrl(s.publicUrl) ? 'URL invalide (ex. https://www.pexen.fr)' : undefined}
          >
            <Input value={s.publicUrl} onChange={(e) => patch({ publicUrl: e.target.value })} placeholder="https://www.pexen.fr" />
          </Field>
        </Section>
        <Section title="Confidentialité et mesure d’audience">
          <Switch
            checked={s.analyticsEnabled}
            onChange={(analyticsEnabled) => patch({ analyticsEnabled })}
            label="Statistiques de visite"
            description="Mesure d’audience interne, anonyme et hébergée sur votre serveur (aucun cookie tiers)."
          />
          <Switch
            checked={s.cookieBannerEnabled}
            onChange={(cookieBannerEnabled) => patch({ cookieBannerEnabled })}
            label="Bandeau de consentement aux cookies"
            description="Affiche le bandeau d’information RGPD aux nouveaux visiteurs."
          />
        </Section>
        <Section title="Mentions bas de page" description="Astérisques des chiffres Preuves (une mention par ligne).">
          <Field label="Mentions légales footer">
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              rows={5}
              value={s.footerLegalNotesText}
              onChange={(e) => patch({ footerLegalNotesText: e.target.value })}
            />
          </Field>
        </Section>
      </div>
      <Section title="Services connectés" description="État des intégrations. Les clés techniques se règlent dans le fichier .env du serveur.">
        <ul className="divide-y divide-slate-100">
          {services.map((sv) => (
            <li key={sv.label} className="flex items-start gap-3 py-3">
              {sv.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> : <XCircle className="mt-0.5 h-4 w-4 text-slate-300" />}
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">{sv.label}</p>
                <p className="font-mono text-[11px] text-slate-400">{sv.detail}</p>
              </div>
              <span className={sv.ok ? 'text-xs font-medium text-emerald-600' : 'text-xs text-slate-400'}>{sv.ok ? 'Actif' : 'Inactif'}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

export default function SettingsPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'general') as TabId;
  const setTab = (t: TabId) => setParams(t === 'general' ? {} : { tab: t }, { replace: true });

  const sys = useAsync(() => api.system.get(), []);
  const [meta, setMeta] = useState<SystemMeta | null>(null);
  useEffect(() => {
    if (sys.data) setMeta((m) => ({ ...m, ...sys.data!.meta }));
  }, [sys.data]);

  const initial = useMemo<FormState | null>(
    () =>
      sys.data
        ? {
            site: {
              publicUrl: site.settings.publicUrl,
              cookieBannerEnabled: site.settings.cookieBannerEnabled,
              analyticsEnabled: site.settings.analyticsEnabled,
              footerLegalNotesText: (site.settings.footerLegalNotes || []).join('\n'),
            },
            system: toForm(sys.data.system),
          }
        : null,
    [sys.data, site.settings]
  );

  const save = useCallback(
    async (f: FormState) => {
      const err = firstFormError(f.system);
      if (err) throw new Error(err);
      const publicUrl = f.site.publicUrl.trim().replace(/\/+$/, '');
      if (publicUrl && !validUrl(publicUrl)) throw new Error('URL publique invalide (ex. https://www.pexen.fr)');
      if (!initial) return f;

      let system = f.system;
      if (JSON.stringify(f.system) !== JSON.stringify(initial.system)) {
        const { password, clearPassword, hasPassword: _h, ...smtp } = f.system.smtp;
        const r = await api.system.save({ ...f.system, smtp: { ...smtp, password: password || undefined, clearPassword } });
        system = toForm(r.system);
        sys.setData({ system: r.system, meta: { ...(meta ?? r.meta), ...r.meta } });
      }
      const footerLegalNotes = f.site.footerLegalNotesText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const nextSite = { ...f.site, publicUrl };
      const settingsPayload = {
        publicUrl,
        cookieBannerEnabled: f.site.cookieBannerEnabled,
        analyticsEnabled: f.site.analyticsEnabled,
        footerLegalNotes,
      };
      if (JSON.stringify(nextSite) !== JSON.stringify(initial.site)) {
        await api.saveSection('settings', settingsPayload);
        patchSite('settings', { ...site.settings, ...settingsPayload });
      }
      return { site: nextSite, system };
    },
    [initial, meta, sys, patchSite, site.settings]
  );
  const ed = useEditable<FormState>(initial, save, { successMessage: 'Paramètres enregistrés' });

  if (sys.error && !sys.data) return <ErrorState message={sys.error} onRetry={() => void sys.reload()} />;
  if (!ed.value || !meta || !initial) return <PageSkeleton />;
  const f = ed.value;

  const set: TabProps['set'] = (key, p) => ed.setValue((cur) => (cur ? { ...cur, system: { ...cur.system, [key]: { ...cur.system[key], ...p } } } : cur));
  const patchSiteState = (p: Partial<SiteState>) => ed.setValue((cur) => (cur ? { ...cur, site: { ...cur.site, ...p } } : cur));
  const changed = (k: keyof SystemForm | 'site') =>
    k === 'site' ? JSON.stringify(f.site) !== JSON.stringify(initial.site) : JSON.stringify(f.system[k]) !== JSON.stringify(initial.system[k]);

  const props: TabProps = { v: f.system, set, meta };

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" description="Réglages techniques du site et de l’administration : e-mails, sécurité, limites, médias et données." />
      <Tabs<TabId>
        value={tab}
        onChange={setTab}
        tabs={TABS.map((t) => ({
          value: t.value,
          label: t.label,
          icon: t.icon,
          badge: t.keys.some(changed) ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Modifications non enregistrées" /> : undefined,
        }))}
      />
      {tab === 'general' ? <GeneralTab s={f.site} patch={patchSiteState} meta={meta} /> : null}
      {tab === 'email' ? <EmailTab {...props} /> : null}
      {tab === 'security' ? <SecurityTab {...props} /> : null}
      {tab === 'limits' ? <LimitsTab {...props} /> : null}
      {tab === 'media' ? <MediaTab {...props} /> : null}
      {tab === 'data' ? <DataTab {...props} dirty={ed.dirty} /> : null}
      {tab === 'system' ? <SystemTab v={f.system} set={set} /> : null}
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}
