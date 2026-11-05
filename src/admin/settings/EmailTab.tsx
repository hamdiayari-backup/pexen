/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useState } from 'react';
import { CheckCircle2, Info, RefreshCw, Send, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PasswordInput } from '../account/SecurityForms';
import { useAuth } from '../context/AuthContext';
import { api, type SystemMeta } from '../lib/api';
import { fmtDateTime } from '../lib/format';
import { errorMessage, useAsync } from '../lib/hooks';
import { TagInput } from '../ui/TagInput';
import { Pagination, usePaging } from '../ui/Pagination';
import { Alert, Badge, Button, Field, Input, Section, Segmented, Switch, Table, Td, Th } from '../ui/primitives';
import { NumberField, type TabProps } from './controls';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PRESETS: { label: string; host: string; port: number; security: 'starttls' | 'ssl'; username?: string }[] = [
  { label: 'Gmail / Google Workspace', host: 'smtp.gmail.com', port: 587, security: 'starttls' },
  { label: 'Microsoft 365', host: 'smtp.office365.com', port: 587, security: 'starttls' },
  { label: 'OVHcloud', host: 'ssl0.ovh.net', port: 465, security: 'ssl' },
  { label: 'Brevo', host: 'smtp-relay.brevo.com', port: 587, security: 'starttls' },
  { label: 'Mailgun', host: 'smtp.eu.mailgun.org', port: 587, security: 'starttls' },
  { label: 'SendGrid', host: 'smtp.sendgrid.net', port: 587, security: 'starttls', username: 'apikey' },
  { label: 'Amazon SES', host: 'email-smtp.eu-west-3.amazonaws.com', port: 587, security: 'starttls' },
];

const DEFAULT_PORT = { starttls: 587, ssl: 465, none: 25 } as const;

const SOURCE: Record<SystemMeta['smtpSource'], [React.ComponentProps<typeof Badge>['tone'], string]> = {
  settings: ['success', 'Serveur configuré ici'],
  env: ['info', 'Serveur du fichier .env'],
  none: ['warning', 'Aucun serveur — e-mails non envoyés'],
};

const KIND_LABELS: Record<string, string> = {
  test: 'Test',
  security: 'Sécurité',
  invite: 'Invitation',
  reset: 'Mot de passe',
  notification: 'Notification',
  form: 'Formulaire',
  newsletter: 'Newsletter',
  system: 'Système',
};

function MailLog({ reloadKey }: { reloadKey: number }) {
  const { page, setPage, pageSize, setPageSize } = usePaging('mail-log');
  const log = useAsync(() => api.system.mailLog(page, pageSize), [page, pageSize, reloadKey]);
  return (
    <Section
      title="Journal des e-mails"
      description="Chaque envoi (réussi, échoué ou ignoré faute de serveur) est tracé ici."
      actions={<Button size="sm" variant="ghost" icon={RefreshCw} loading={log.loading} onClick={() => void log.reload()} aria-label="Actualiser" />}
    >
      {log.error ? <Alert tone="danger">{log.error}</Alert> : null}
      {log.data && log.data.items.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Aucun e-mail envoyé pour le moment.</p>
      ) : (
        <div className="-mx-5 -mb-5">
          <Table>
            <thead>
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Destinataire</Th>
                <Th>Sujet</Th>
                <Th>Statut</Th>
              </tr>
            </thead>
            <tbody>
              {(log.data?.items ?? []).map((m) => (
                <tr key={m.id}>
                  <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(m.ts)}</Td>
                  <Td>
                    <Badge>{KIND_LABELS[m.kind] ?? m.kind}</Badge>
                  </Td>
                  <Td className="max-w-[200px] truncate">{m.toAddr}</Td>
                  <Td className="max-w-[260px] truncate text-slate-600">{m.subject}</Td>
                  <Td>
                    {m.status === 'sent' ? (
                      <Badge tone="success" dot>
                        Envoyé
                      </Badge>
                    ) : (
                      <span title={m.error ?? undefined}>
                        <Badge tone={m.status === 'failed' ? 'danger' : 'warning'} dot>
                          {m.status === 'failed' ? 'Échec' : 'Ignoré'}
                        </Badge>
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {log.data ? <Pagination page={page} pageSize={log.data.pageSize} total={log.data.total} onPage={setPage} onPageSize={setPageSize} noun="e-mails" /> : null}
        </div>
      )}
    </Section>
  );
}

export function EmailTab({ v, set, meta }: TabProps) {
  const { user } = useAuth();
  const smtp = v.smtp;
  const [to, setTo] = useState(user?.email ?? '');
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [logKey, setLogKey] = useState(0);
  const [source, label] = SOURCE[meta.smtpSource];

  const changeSecurity = (security: typeof smtp.security) => {
    const isDefaultPort = Object.values(DEFAULT_PORT).includes(smtp.port as 587);
    set('smtp', { security, ...(isDefaultPort ? { port: DEFAULT_PORT[security] } : {}) });
  };

  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const { password, clearPassword, hasPassword: _h, ...draft } = smtp;
      const r = await api.system.testSmtp(to.trim(), { ...draft, password: password || undefined, clearPassword });
      setResult(r);
      if (r.ok) toast.success(`E-mail de test envoyé à ${to.trim()}`);
    } catch (e) {
      setResult({ ok: false, error: errorMessage(e) });
    } finally {
      setTesting(false);
      setLogKey((k) => k + 1);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="space-y-6">
        <Section title="Serveur d’envoi (SMTP)" description="Utilisé pour les invitations, la réinitialisation des mots de passe, les alertes de sécurité et les formulaires." actions={<Badge tone={source} dot>{label}</Badge>}>
          <Switch
            checked={smtp.enabled}
            onChange={(enabled) => set('smtp', { enabled })}
            label="Utiliser ce serveur SMTP"
            description={
              meta.envSmtp
                ? 'Désactivé, le serveur défini dans le fichier .env (SMTP_HOST…) est utilisé.'
                : 'Désactivé, aucun e-mail n’est envoyé : les liens d’invitation et de réinitialisation sont à copier manuellement.'
            }
          />
          <fieldset disabled={!smtp.enabled} className="space-y-4 disabled:opacity-60">
            <Field label="Préréglages" hint="Remplit le serveur, le port et le chiffrement. Vérifiez ensuite les identifiants.">
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => set('smtp', { host: p.host, port: p.port, security: p.security, ...(p.username ? { username: p.username } : {}) })}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field label="Serveur">
                <Input value={smtp.host} onChange={(e) => set('smtp', { host: e.target.value.trim() })} placeholder="smtp.exemple.com" autoComplete="off" />
              </Field>
              <NumberField path="smtp.port" label="Port" value={smtp.port} onChange={(port) => set('smtp', { port })} />
            </div>
            <Field label="Chiffrement" hint={smtp.security === 'none' ? 'Déconseillé : identifiants et contenus circulent en clair.' : undefined}>
              <Segmented
                value={smtp.security}
                onChange={changeSecurity}
                options={[
                  { value: 'starttls', label: 'STARTTLS (587)' },
                  { value: 'ssl', label: 'SSL / TLS (465)' },
                  { value: 'none', label: 'Aucun' },
                ]}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Identifiant">
                <Input value={smtp.username} onChange={(e) => set('smtp', { username: e.target.value.trim() })} autoComplete="off" placeholder="contact@exemple.com" />
              </Field>
              <Field
                label="Mot de passe"
                hint={
                  smtp.clearPassword ? (
                    <span className="text-amber-700">Le mot de passe sera supprimé à l’enregistrement.</span>
                  ) : smtp.hasPassword ? (
                    <span>
                      Enregistré et chiffré. Laissez vide pour le conserver ·{' '}
                      <button type="button" className="font-medium text-rose-600 hover:underline" onClick={() => set('smtp', { clearPassword: true, password: '' })}>
                        Supprimer
                      </button>
                    </span>
                  ) : (
                    'Stocké chiffré (AES-256), jamais réaffiché.'
                  )
                }
              >
                <PasswordInput
                  value={smtp.password}
                  onChange={(e) => set('smtp', { password: e.target.value, clearPassword: false })}
                  placeholder={smtp.hasPassword && !smtp.clearPassword ? '••••••••••' : ''}
                  autoComplete="new-password"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField path="smtp.timeoutSec" label="Délai de connexion" suffix="secondes" value={smtp.timeoutSec} onChange={(timeoutSec) => set('smtp', { timeoutSec })} />
            </div>
            <Switch
              checked={smtp.allowSelfSigned}
              onChange={(allowSelfSigned) => set('smtp', { allowSelfSigned })}
              label="Accepter les certificats auto-signés"
              description="À n’activer que pour un serveur interne de confiance."
            />
          </fieldset>
        </Section>

        <Section title="Expéditeur" description="Nom et adresse affichés dans la boîte de réception des destinataires.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom de l’expéditeur" hint="Par défaut : le nom du site.">
              <Input value={smtp.fromName} onChange={(e) => set('smtp', { fromName: e.target.value })} placeholder="Pexen" />
            </Field>
            <Field label="Adresse d’expédition" error={smtp.fromEmail && !EMAIL.test(smtp.fromEmail) ? 'Adresse invalide' : undefined} hint="Par défaut : l’identifiant SMTP.">
              <Input type="email" value={smtp.fromEmail} onChange={(e) => set('smtp', { fromEmail: e.target.value.trim() })} placeholder="no-reply@exemple.com" />
            </Field>
          </div>
          <Field label="Adresse de réponse (facultatif)" error={smtp.replyTo && !EMAIL.test(smtp.replyTo) ? 'Adresse invalide' : undefined} hint="Les réponses des destinataires arriveront à cette adresse.">
            <Input type="email" value={smtp.replyTo} onChange={(e) => set('smtp', { replyTo: e.target.value.trim() })} placeholder="contact@exemple.com" />
          </Field>
        </Section>
      </div>

      <div className="space-y-6">
        <Section title="Tester la configuration" description="Vérifie la connexion au serveur puis envoie un e-mail réel. Les valeurs du formulaire sont utilisées, même non enregistrées.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="vous@exemple.com" className="flex-1" />
            <Button variant="primary" icon={Send} loading={testing} disabled={!EMAIL.test(to.trim())} onClick={() => void test()}>
              Envoyer un test
            </Button>
          </div>
          {result ? (
            result.ok ? (
              <Alert tone="success" icon={CheckCircle2} title="Envoi réussi">
                Vérifiez la boîte de réception (et les indésirables) de {to.trim()}.
              </Alert>
            ) : (
              <Alert tone="danger" icon={XCircle} title="L’envoi a échoué">
                <span className="break-words font-mono text-xs">{result.error}</span>
              </Alert>
            )
          ) : null}
        </Section>

        <Section title="Notifications" description="E-mails envoyés automatiquement par l’administration.">
          <Switch
            checked={v.notifications.securityAlerts}
            onChange={(securityAlerts) => set('notifications', { securityAlerts })}
            label="Alertes de sécurité aux utilisateurs"
            description="Connexion depuis une nouvelle adresse IP, mot de passe modifié, double authentification activée ou retirée."
          />
          <Switch
            checked={v.notifications.accountChanges}
            onChange={(accountChanges) => set('notifications', { accountChanges })}
            label="Changements des accès"
            description="Prévient les adresses ci-dessous lors d’une création, suppression, suspension ou d’un changement de rôle."
          />
          <Field label="Adresses à prévenir" hint="Appuyez sur Entrée après chaque adresse (20 maximum).">
            <TagInput
              value={v.notifications.adminEmails}
              onChange={(adminEmails) => set('notifications', { adminEmails: adminEmails.map((e) => e.toLowerCase()) })}
              validate={(e) => EMAIL.test(e)}
              placeholder="securite@exemple.com"
            />
          </Field>
          {v.notifications.accountChanges && v.notifications.adminEmails.length === 0 ? (
            <Alert tone="warning" icon={Info}>
              Ajoutez au moins une adresse pour recevoir les notifications de changement des accès.
            </Alert>
          ) : null}
        </Section>

        <MailLog reloadKey={logKey} />
      </div>
    </div>
  );
}
