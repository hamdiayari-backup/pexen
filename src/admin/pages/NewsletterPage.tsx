import React, { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Clock, Download, Mail, MoreHorizontal, Search, Trash2, UserCheck, UserX } from 'lucide-react';
import type { NewsletterConfig, NewsletterSubscriber } from '../../../server/cms/types';
import { api } from '../lib/api';
import { errorMessage, useAsync, useEditable } from '../lib/hooks';
import { downloadCsv, fmtDateTime, fmtNumber } from '../lib/format';
import { useSite, useSiteData } from '../context/SiteContext';
import { Alert, Button, Card, EmptyState, Field, Input, PageHeader, PageSkeleton, Section, Segmented, StatCard, StatusBadge, Switch, Table, Td, Th } from '../ui/primitives';
import { Dropdown, DropdownItem, useConfirm } from '../ui/overlays';
import { SaveBar } from '../ui/SaveBar';

type Sub = Omit<NewsletterSubscriber, 'confirmToken'>;

export default function NewsletterPage() {
  const site = useSiteData();
  const { patchSite } = useSite();
  const confirm = useConfirm();
  const { data, setData, loading } = useAsync(() => api.subscribers(), []);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | Sub['status']>('all');

  const save = useCallback(
    async (n: NewsletterConfig) => {
      await api.saveSection('newsletter', n);
      patchSite('newsletter', n);
    },
    [patchSite]
  );
  const ed = useEditable<NewsletterConfig>(site.newsletter, save, { successMessage: 'Réglages de la newsletter enregistrés' });

  const subs = data || [];
  const count = (s: Sub['status']) => subs.filter((x) => x.status === s).length;
  const rows = useMemo(
    () => subs.filter((s) => status === 'all' || s.status === status).filter((s) => !q || s.email.toLowerCase().includes(q.toLowerCase())),
    [subs, status, q]
  );

  const setSubStatus = async (s: Sub, next: Sub['status']) => {
    try {
      await api.setSubscriberStatus(s.id, next);
      setData((d) => (d || []).map((x) => (x.id === s.id ? { ...x, status: next } : x)));
      toast.success('Statut mis à jour');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  const remove = async (s: Sub) => {
    if (!(await confirm({ title: 'Supprimer cet abonné ?', message: `${s.email} sera définitivement effacé (droit à l’oubli RGPD).`, confirmLabel: 'Supprimer', danger: true }))) return;
    try {
      await api.deleteSubscriber(s.id);
      setData((d) => (d || []).filter((x) => x.id !== s.id));
      toast.success('Abonné supprimé');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (!ed.value) return null;
  const n = ed.value;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Newsletter"
        description="Inscriptions recueillies depuis le pied de page du site."
        actions={
          <Button
            icon={Download}
            disabled={!subs.length}
            onClick={() =>
              downloadCsv('abonnes-newsletter.csv', [
                ['E-mail', 'Statut', 'Source', 'Inscrit le', 'Confirmé le'],
                ...rows.map((s) => [s.email, s.status, s.source, fmtDateTime(s.createdAt), fmtDateTime(s.confirmedAt)]),
              ])
            }
          >
            Exporter (CSV)
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Abonnés actifs" value={fmtNumber(count('active'))} icon={UserCheck} />
        <StatCard label="En attente de confirmation" value={fmtNumber(count('pending'))} icon={Clock} tone="amber" />
        <StatCard label="Désinscrits" value={fmtNumber(count('unsubscribed'))} icon={UserX} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card padded={false}>
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'active', label: 'Actifs' },
                { value: 'pending', label: 'En attente' },
                { value: 'unsubscribed', label: 'Désinscrits' },
              ]}
            />
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un e-mail…" className="pl-9" />
            </div>
          </div>
          {loading && !data ? (
            <div className="p-5">
              <PageSkeleton />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={Mail} title="Aucun abonné" description={n.enabled ? 'Les inscriptions apparaîtront ici.' : 'Activez la newsletter pour afficher le formulaire d’inscription sur le site.'} />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>E-mail</Th>
                  <Th>Statut</Th>
                  <Th>Inscription</Th>
                  <Th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <Td className="font-medium text-slate-800">{s.email}</Td>
                    <Td>
                      <StatusBadge status={s.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-slate-500">{fmtDateTime(s.createdAt)}</Td>
                    <Td>
                      <Dropdown
                        trigger={
                          <Button size="icon" variant="ghost" aria-label="Actions">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      >
                        {s.status !== 'active' ? (
                          <DropdownItem icon={CheckCircle2} onClick={() => void setSubStatus(s, 'active')}>
                            Marquer comme actif
                          </DropdownItem>
                        ) : null}
                        {s.status !== 'unsubscribed' ? (
                          <DropdownItem icon={UserX} onClick={() => void setSubStatus(s, 'unsubscribed')}>
                            Désinscrire
                          </DropdownItem>
                        ) : null}
                        <DropdownItem icon={Trash2} danger onClick={() => void remove(s)}>
                          Supprimer définitivement
                        </DropdownItem>
                      </Dropdown>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <div className="space-y-6">
          <Section title="Réglages">
            <Switch checked={n.enabled} onChange={(enabled) => ed.patch({ enabled })} label="Formulaire d’inscription actif" description="Affiche le bloc newsletter dans le pied de page." />
            <Switch
              checked={n.doubleOptIn}
              onChange={(doubleOptIn) => ed.patch({ doubleOptIn })}
              label="Double confirmation (recommandé)"
              description="L’abonné confirme son adresse par un lien envoyé par e-mail. Conforme au RGPD."
            />
            {n.doubleOptIn ? (
              <Field label="Objet de l’e-mail de confirmation">
                <Input value={n.welcomeEmailSubject || ''} onChange={(e) => ed.patch({ welcomeEmailSubject: e.target.value })} placeholder="Confirmez votre inscription à la newsletter PEXEN" />
              </Field>
            ) : null}
          </Section>
          <Alert tone="info">
            Pour vos campagnes, exportez la liste des abonnés actifs au format CSV et importez-la dans votre outil d’e-mailing (Brevo, Mailchimp…).
          </Alert>
        </div>
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}
