import React, { useCallback } from 'react';
import { toast } from 'sonner';
import { Copy, KeyRound, ShieldAlert, ShieldCheck, Wrench } from 'lucide-react';
import type { MaintenanceConfig } from '../../../server/cms/types';
import { api } from '../lib/api';
import { useEditable } from '../lib/hooks';
import { publicUrl, useSite, useSiteData } from '../context/SiteContext';
import { Alert, Button, Card, cx, Field, Input, PageHeader, Section, Textarea } from '../ui/primitives';
import { useConfirm } from '../ui/overlays';
import { SaveBar } from '../ui/SaveBar';
import { TagInput } from '../ui/TagInput';

const IP_RE = /^(\d{1,3}\.){3}\d{1,3}$|^[0-9a-f:]+$/i;
const randomSecret = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, '0')).join('');

export default function MaintenancePage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const confirm = useConfirm();
  const save = useCallback(
    async (m: MaintenanceConfig) => {
      await api.saveSection('settings', { maintenance: m });
      patchSite('settings', { ...site.settings, maintenance: m });
    },
    [site.settings, patchSite]
  );
  const ed = useEditable<MaintenanceConfig>(site.settings.maintenance, save, { successMessage: 'Mode maintenance mis à jour' });
  if (!ed.value) return null;
  const m = ed.value;
  const previewLink = m.bypassSecret ? publicUrl(site, `/api/public/maintenance-preview?key=${m.bypassSecret}`) : '';

  return (
    <div className="space-y-6">
      <PageHeader title="Mode maintenance" description="Masquez temporairement le site aux visiteurs pendant des travaux, tout en continuant à y accéder vous-même." />

      <Card className={cx('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', m.enabled && 'border-amber-300 bg-amber-50/50')}>
        <div className="flex items-center gap-4">
          <span className={cx('flex h-12 w-12 items-center justify-center rounded-xl', m.enabled ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600')}>
            {m.enabled ? <ShieldAlert className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </span>
          <div>
            <p className="text-base font-semibold text-slate-900">{m.enabled ? 'Le site est en maintenance' : 'Le site est en ligne'}</p>
            <p className="text-sm text-slate-500">
              {m.enabled ? 'Les visiteurs voient la page de maintenance et Google n’indexe pas le site.' : 'Tous les visiteurs ont accès au site.'}
            </p>
          </div>
        </div>
        <Button
          variant={m.enabled ? 'secondary' : 'danger'}
          icon={Wrench}
          onClick={async () => {
            if (!m.enabled && !(await confirm({ title: 'Activer la maintenance ?', message: 'Le site sera inaccessible aux visiteurs dès l’enregistrement.', confirmLabel: 'Activer', danger: true }))) return;
            ed.patch({ enabled: !m.enabled });
          }}
        >
          {m.enabled ? 'Remettre en ligne' : 'Activer la maintenance'}
        </Button>
      </Card>
      {m.enabled !== site.settings.maintenance.enabled ? <Alert tone="warning">Enregistrez pour appliquer le changement.</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Section title="Message affiché">
            <Field label="Titre">
              <Input value={m.title} onChange={(e) => ed.patch({ title: e.target.value })} />
            </Field>
            <Field label="Message">
              <Textarea value={m.message} onChange={(e) => ed.patch({ message: e.target.value })} rows={3} />
            </Field>
          </Section>

          <Section title="Accès pendant la maintenance" description="Permet à votre équipe de consulter le site pendant les travaux.">
            <Field label="Adresses IP autorisées" hint="Ces adresses voient le site normalement.">
              <TagInput value={m.allowedIps} onChange={(allowedIps) => ed.patch({ allowedIps })} validate={(v) => IP_RE.test(v)} placeholder="Ex. 203.0.113.10 puis Entrée" />
            </Field>
            <Field label="Lien de prévisualisation secret" hint="Toute personne ouvrant ce lien accède au site pendant 7 jours sur son navigateur.">
              {m.bypassSecret ? (
                <div className="flex gap-2">
                  <Input readOnly value={previewLink} className="font-mono text-xs" onFocus={(e) => e.target.select()} />
                  <Button
                    icon={Copy}
                    onClick={async () => {
                      await navigator.clipboard.writeText(previewLink);
                      toast.success('Lien copié');
                    }}
                  >
                    Copier
                  </Button>
                </div>
              ) : null}
              <div className="mt-2 flex gap-2">
                <Button size="sm" icon={KeyRound} onClick={() => ed.patch({ bypassSecret: randomSecret() })}>
                  {m.bypassSecret ? 'Générer un nouveau lien' : 'Créer un lien'}
                </Button>
                {m.bypassSecret ? (
                  <Button size="sm" variant="ghost" onClick={() => ed.patch({ bypassSecret: '' })}>
                    Désactiver le lien
                  </Button>
                ) : null}
              </div>
            </Field>
          </Section>
        </div>

        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu</p>
          <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl px-8 text-center shadow-lg" style={{ background: site.branding.colors.navy }}>
            {site.branding.logoDarkUrl ? <img src={site.branding.logoDarkUrl} alt="" className="mb-6 h-8 object-contain" /> : null}
            <Wrench className="mb-4 h-8 w-8" style={{ color: site.branding.colors.primary }} />
            <p className="text-xl font-bold text-white">{m.title || 'Site en maintenance'}</p>
            <p className="mt-2 text-sm text-slate-300">{m.message}</p>
            <p className="mt-6 text-xs text-slate-400">{site.general.phone}</p>
          </div>
          <p className="text-xs text-slate-500">Pendant la maintenance, les moteurs de recherche reçoivent une consigne de non-indexation : votre référencement est préservé.</p>
        </div>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}
