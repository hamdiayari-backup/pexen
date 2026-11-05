/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useState } from 'react';
import { AlertTriangle, Database, HardDrive, RefreshCw, Server, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, type SystemView } from '../lib/api';
import { fmtBytes, fmtNumber } from '../lib/format';
import { errorMessage, useAsync } from '../lib/hooks';
import { useConfirm } from '../ui/overlays';
import { Alert, Button, ErrorState, Section, Skeleton, Switch } from '../ui/primitives';
import { NumberField, type TabProps } from './controls';

type WindowKey = 'formSubmissions' | 'newsletter' | 'passwordReset';

function RateWindowRow({ k, label, description, v, set }: { k: WindowKey; label: string; description: string } & Pick<TabProps, 'v' | 'set'>) {
  const w = v.limits[k];
  return (
    <div className="grid gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto_auto] sm:items-start">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500">{description}</p>
      </div>
      <NumberField path={`limits.${k}.max`} label="Maximum" suffix="envois" value={w.max} onChange={(max) => set('limits', { [k]: { ...w, max } })} />
      <NumberField
        path={`limits.${k}.windowMinutes`}
        label="Par période de"
        suffix="min"
        value={w.windowMinutes}
        onChange={(windowMinutes) => set('limits', { [k]: { ...w, windowMinutes } })}
      />
    </div>
  );
}

export function LimitsTab({ v, set }: TabProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Limites globales" description="Au-delà, le serveur répond « 429 – Trop de requêtes » avec le délai d’attente. 0 = illimité.">
        <NumberField
          path="limits.publicApiPerMinute"
          label="Site public, par visiteur"
          suffix="requêtes / minute"
          value={v.limits.publicApiPerMinute}
          onChange={(publicApiPerMinute) => set('limits', { publicApiPerMinute })}
          hint="Contenu, statistiques et modules appelés par le site. Protège contre les robots trop agressifs."
        />
        <NumberField
          path="limits.adminApiPerMinute"
          label="Administration, par utilisateur"
          suffix="requêtes / minute"
          value={v.limits.adminApiPerMinute}
          onChange={(adminApiPerMinute) => set('limits', { adminApiPerMinute })}
          hint="Limite un compte compromis ou un script qui s’emballe."
        />
      </Section>
      <Section title="Actions sensibles" description="Quotas appliqués par adresse IP sur une fenêtre glissante.">
        <RateWindowRow k="formSubmissions" label="Envoi de formulaires" description="Messages de contact et demandes de devis." v={v} set={set} />
        <RateWindowRow k="newsletter" label="Inscription à la newsletter" description="Limite les inscriptions en masse." v={v} set={set} />
        <RateWindowRow k="passwordReset" label="Mot de passe oublié" description="Demandes de lien de réinitialisation (par IP et par adresse)." v={v} set={set} />
      </Section>
    </div>
  );
}

export function MediaTab({ v, set }: TabProps) {
  const u = v.uploads;
  const none = !u.allowImages && !u.allowSvg && !u.allowVideo && !u.allowPdf;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Fichiers envoyés" description="Contrôlés par le serveur à chaque envoi dans la médiathèque.">
        <NumberField path="uploads.maxSizeMb" label="Taille maximale par fichier" suffix="Mo" value={u.maxSizeMb} onChange={(maxSizeMb) => set('uploads', { maxSizeMb })} />
        <Switch checked={u.allowImages} onChange={(allowImages) => set('uploads', { allowImages })} label="Images" description="JPEG, PNG, WebP, AVIF et GIF." />
        <Switch checked={u.allowVideo} onChange={(allowVideo) => set('uploads', { allowVideo })} label="Vidéos" description="MP4 et WebM." />
        <Switch checked={u.allowPdf} onChange={(allowPdf) => set('uploads', { allowPdf })} label="Documents PDF" />
        <Switch
          checked={u.allowSvg}
          onChange={(allowSvg) => set('uploads', { allowSvg })}
          label="Images vectorielles SVG"
          description="Un SVG peut contenir du code : n’autorisez que si les personnes qui envoient des fichiers sont de confiance."
        />
        {none ? (
          <Alert tone="warning" icon={AlertTriangle}>
            Aucun type n’est autorisé : plus aucun fichier ne pourra être ajouté à la médiathèque.
          </Alert>
        ) : null}
      </Section>
    </div>
  );
}

export function DataTab({ v, set, dirty }: TabProps & { dirty: boolean }) {
  const confirm = useConfirm();
  const [running, setRunning] = useState(false);
  const p = v.privacy;

  const purge = async () => {
    const ok = await confirm({
      title: 'Purger les données anciennes ?',
      message: 'Les statistiques, messages, journaux et sessions plus anciens que les durées enregistrées seront supprimés définitivement.',
      confirmLabel: 'Purger maintenant',
      danger: true,
    });
    if (!ok) return;
    setRunning(true);
    try {
      const r = await api.system.runRetention();
      const total = Object.values(r).reduce((a, b) => a + b, 0);
      toast.success(total ? `${fmtNumber(total)} élément(s) supprimé(s)` : 'Rien à supprimer');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Durées de conservation" description="Une purge automatique a lieu chaque jour. Pensez au RGPD : ne conservez pas les données plus que nécessaire.">
        <NumberField
          path="privacy.analyticsRetentionDays"
          label="Statistiques de visite"
          suffix="jours"
          value={p.analyticsRetentionDays}
          onChange={(analyticsRetentionDays) => set('privacy', { analyticsRetentionDays })}
        />
        <NumberField
          path="privacy.submissionsRetentionDays"
          label="Messages des formulaires"
          suffix="jours"
          value={p.submissionsRetentionDays}
          onChange={(submissionsRetentionDays) => set('privacy', { submissionsRetentionDays })}
          hint="0 = conservés jusqu’à suppression manuelle."
        />
        <NumberField
          path="privacy.auditRetentionDays"
          label="Journal d’activité"
          suffix="jours"
          value={p.auditRetentionDays}
          onChange={(auditRetentionDays) => set('privacy', { auditRetentionDays })}
        />
        <NumberField
          path="privacy.mailLogRetentionDays"
          label="Journal des e-mails"
          suffix="jours"
          value={p.mailLogRetentionDays}
          onChange={(mailLogRetentionDays) => set('privacy', { mailLogRetentionDays })}
        />
      </Section>
      <div className="space-y-6">
        <Section title="Données personnelles">
          <Switch
            checked={p.storeSubmitterIp}
            onChange={(storeSubmitterIp) => set('privacy', { storeSubmitterIp })}
            label="Enregistrer l’adresse IP des expéditeurs"
            description="Utile contre les abus, mais c’est une donnée personnelle. Désactivé, les nouveaux messages sont enregistrés sans IP."
          />
        </Section>
        <Section title="Purge manuelle" description="Applique immédiatement les durées enregistrées, sans attendre la purge quotidienne.">
          {dirty ? (
            <Alert tone="warning" icon={AlertTriangle}>
              Enregistrez d’abord vos modifications : la purge utilise les durées enregistrées.
            </Alert>
          ) : null}
          <Button variant="danger" icon={Trash2} loading={running} disabled={dirty} onClick={() => void purge()}>
            Purger maintenant
          </Button>
        </Section>
      </div>
    </div>
  );
}

function fmtUptime(sec: number): string {
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (d) return `${d} j ${h} h`;
  if (h) return `${h} h ${m} min`;
  return `${m} min`;
}

function Rows({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="divide-y divide-slate-100 text-sm">
      {rows.map(([k, val]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-slate-500">{k}</dt>
          <dd className="text-right font-medium tabular-nums text-slate-800">{val}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SystemTab({ v, set }: Pick<TabProps, 'v' | 'set'>) {
  const info = useAsync(() => api.system.info(), []);
  const d = info.data;
  if (info.error) return <ErrorState message={info.error} onRetry={() => void info.reload()} />;
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Section title={<span className="flex items-center gap-2"><Server className="h-4 w-4 text-slate-400" /> Application</span>} actions={<Button size="sm" variant="ghost" icon={RefreshCw} loading={info.loading} onClick={() => void info.reload()} aria-label="Actualiser" />}>
          {d ? (
            <Rows
              rows={[
                ['Version', `${d.app.name} ${d.app.version}`],
                ['Environnement', d.app.environment === 'production' ? 'Production' : d.app.environment],
                ['Node.js', d.runtime.node],
                ['Système', d.runtime.platform],
                ['Processeurs', d.runtime.cpus],
                ['Mémoire utilisée', `${fmtNumber(d.runtime.memoryMb)} Mo`],
                ['Démarré depuis', fmtUptime(d.runtime.uptimeSec)],
              ]}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </Section>
        <Section title={<span className="flex items-center gap-2"><Database className="h-4 w-4 text-slate-400" /> Base de données</span>}>
          {d ? (
            <Rows
              rows={[
                ['PostgreSQL', d.database.version],
                ['Taille', fmtBytes(d.database.sizeBytes)],
                ['Événements de visite', fmtNumber(d.database.analyticsEvents)],
                ['Révisions de contenu', fmtNumber(d.database.revisions)],
                ['Journal d’activité', fmtNumber(d.database.auditEntries)],
                ['Journal des e-mails', fmtNumber(d.database.mailLog)],
                ['Sessions actives', fmtNumber(d.database.activeSessions)],
              ]}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </Section>
        <Section title={<span className="flex items-center gap-2"><HardDrive className="h-4 w-4 text-slate-400" /> Contenu et fichiers</span>}>
          {d ? (
            <Rows
              rows={[
                ['Pages', fmtNumber(d.content.pages)],
                ['Articles', fmtNumber(d.content.posts)],
                ['Médias', fmtNumber(d.content.media)],
                ['Fichiers envoyés', `${fmtNumber(d.uploads.files)} · ${fmtBytes(d.uploads.bytes)}`],
                ['Messages reçus', fmtNumber(d.content.submissions)],
                ['Abonnés newsletter', fmtNumber(d.content.subscribers)],
                ['Utilisateurs', fmtNumber(d.content.users)],
              ]}
            />
          ) : (
            <Skeleton className="h-56" />
          )}
        </Section>
      </div>
      <Section title="Performance" description="Durée pendant laquelle les navigateurs et le CDN peuvent réutiliser les réponses publiques (contenu des pages).">
        <NumberField
          path="performance.publicCacheSeconds"
          label="Cache des réponses publiques"
          suffix="secondes"
          value={v.performance.publicCacheSeconds}
          onChange={(publicCacheSeconds) => set('performance', { publicCacheSeconds } as Partial<SystemView['performance']>)}
          hint="0 = pas de cache. Une valeur élevée allège le serveur mais retarde l’affichage des modifications publiées."
        />
      </Section>
    </div>
  );
}
