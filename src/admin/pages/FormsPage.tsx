import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronDown,
  ChevronUp,
  Download,
  Inbox,
  Mail,
  MailOpen,
  Phone,
  Plus,
  Reply,
  Search,
  Settings2,
  Trash2,
} from 'lucide-react';
import type { ContactFormConfig, ContactFormField, ContactSubmission } from '../../../server/cms/types';
import { api } from '../lib/api';
import { errorMessage, useAsync, useEditable } from '../lib/hooks';
import { downloadCsv, fmtDateTime, submissionExcerpt, submissionTitle, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, cx, EmptyState, ErrorState, Field, Input, PageHeader, PageSkeleton, Section, Segmented, Select, Switch, Tabs } from '../ui/primitives';
import { Drawer, useConfirm } from '../ui/overlays';
import { SaveBar } from '../ui/SaveBar';
import { TagInput } from '../ui/TagInput';
import { LinkInput } from '../editor/fields';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FIELD_TYPES: { value: ContactFormField['type']; label: string }[] = [
  { value: 'text', label: 'Texte court' },
  { value: 'email', label: 'E-mail' },
  { value: 'tel', label: 'Téléphone' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'select', label: 'Liste de choix' },
  { value: 'checkbox', label: 'Case à cocher' },
];

function fieldNameFrom(label: string): string {
  const words = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const name = words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join('');
  return /^[a-zA-Z]/.test(name) ? name : `champ${name}`;
}

function displayValue(v: unknown): string {
  if (typeof v === 'boolean') return v ? 'Oui' : 'Non';
  if (v === 'on' || v === 'true') return 'Oui';
  return String(v ?? '');
}

/* ------------------------------------------------------------------ Boîte de réception */

function Inbox_({ forms, submissions, setSubmissions }: { forms: ContactFormConfig[]; submissions: ContactSubmission[]; setSubmissions: (fn: (s: ContactSubmission[]) => ContactSubmission[]) => void }) {
  const { can } = useAuth();
  const confirm = useConfirm();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [q, setQ] = useState('');
  const openId = params.get('open');
  const open = submissions.find((s) => s.id === openId) || null;

  const fieldLabel = useCallback(
    (formId: string, name: string) => forms.find((f) => f.id === formId)?.fields.find((f) => f.name === name)?.label || name,
    [forms]
  );

  const rows = useMemo(() => {
    const nq = q.trim().toLowerCase();
    return submissions
      .filter((s) => filter === 'all' || !s.read)
      .filter((s) => !nq || JSON.stringify(s.payload).toLowerCase().includes(nq))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [submissions, filter, q]);
  const unread = submissions.filter((s) => !s.read).length;

  const setRead = async (s: ContactSubmission, read: boolean) => {
    setSubmissions((list) => list.map((x) => (x.id === s.id ? { ...x, read } : x)));
    try {
      await api.markSubmission(s.id, read);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  useEffect(() => {
    if (open && !open.read && can('editor')) void setRead(open, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openId]);

  const remove = async (s: ContactSubmission) => {
    if (!(await confirm({ title: 'Supprimer ce message ?', message: 'Cette action est définitive.', confirmLabel: 'Supprimer', danger: true }))) return;
    try {
      await api.deleteSubmission(s.id);
      setSubmissions((list) => list.filter((x) => x.id !== s.id));
      setParams({});
      toast.success('Message supprimé');
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const exportCsv = () => {
    const keys = [...new Set(submissions.flatMap((s) => Object.keys(s.payload)))];
    downloadCsv('demandes-contact.csv', [
      ['Date', 'Formulaire', 'Lu', ...keys.map((k) => fieldLabel(submissions[0]?.formId || '', k))],
      ...rows.map((s) => [fmtDateTime(s.createdAt), forms.find((f) => f.id === s.formId)?.name || s.formId, s.read ? 'Oui' : 'Non', ...keys.map((k) => displayValue(s.payload[k]))]),
    ]);
  };

  const p = (open?.payload || {}) as Record<string, string>;

  return (
    <Card padded={false}>
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: `Tous (${submissions.length})` },
            { value: 'unread', label: `Non lus (${unread})` },
          ]}
        />
        <div className="flex gap-2">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" className="pl-9" />
          </div>
          <Button icon={Download} onClick={exportCsv} disabled={!submissions.length}>
            CSV
          </Button>
        </div>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={Inbox} title={submissions.length ? 'Aucun message correspondant' : 'Aucun message reçu'} description="Les demandes envoyées depuis le site apparaîtront ici." />
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => setParams({ open: s.id })} className={cx('flex w-full items-start gap-4 px-5 py-3.5 text-left transition hover:bg-slate-50', !s.read && 'bg-brand-50/30')}>
                <span className={cx('mt-2 h-2 w-2 shrink-0 rounded-full', s.read ? 'bg-transparent' : 'bg-brand-500')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cx('truncate text-sm', s.read ? 'text-slate-700' : 'font-semibold text-slate-900')}>{submissionTitle(s.payload)}</p>
                    {(s.payload as Record<string, string>).vousEtes ? <Badge>{(s.payload as Record<string, string>).vousEtes}</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate text-[13px] text-slate-500">{submissionExcerpt(s.payload)}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400" title={fmtDateTime(s.createdAt)}>
                  {timeAgo(s.createdAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={!!open}
        onClose={() => setParams({})}
        title={open ? submissionTitle(open.payload) : ''}
        footer={
          open && can('editor') ? (
            <>
              <Button variant="ghost" className="mr-auto text-rose-600 hover:bg-rose-50" icon={Trash2} onClick={() => void remove(open)}>
                Supprimer
              </Button>
              <Button icon={open.read ? Mail : MailOpen} onClick={() => void setRead(open, !open.read)}>
                {open.read ? 'Marquer non lu' : 'Marquer lu'}
              </Button>
              {p.email ? (
                <a href={`mailto:${p.email}?subject=${encodeURIComponent('Votre demande auprès de PEXEN')}`}>
                  <Button variant="primary" icon={Reply}>
                    Répondre
                  </Button>
                </a>
              ) : null}
            </>
          ) : undefined
        }
      >
        {open ? (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <Badge tone="neutral">{forms.find((f) => f.id === open.formId)?.name || open.formId}</Badge>
              <span>Reçu le {fmtDateTime(open.createdAt)}</span>
            </div>
            {p.email || p.telephone ? (
              <div className="flex flex-wrap gap-2">
                {p.email ? (
                  <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    <Mail className="h-3.5 w-3.5" /> {p.email}
                  </a>
                ) : null}
                {p.telephone ? (
                  <a href={`tel:${p.telephone}`} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200">
                    <Phone className="h-3.5 w-3.5" /> {p.telephone}
                  </a>
                ) : null}
              </div>
            ) : null}
            <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {Object.entries(open.payload).map(([k, v]) => (
                <div key={k} className="px-4 py-3">
                  <dt className="text-xs font-medium text-slate-500">{fieldLabel(open.formId, k)}</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-800">{displayValue(v) || '—'}</dd>
                </div>
              ))}
            </dl>
            {open.userAgent ? <p className="text-[11px] leading-relaxed text-slate-400">Navigateur : {open.userAgent}</p> : null}
          </div>
        ) : null}
      </Drawer>
    </Card>
  );
}

/* ------------------------------------------------------------------ Constructeur */

function FieldRow({ field, index, count, onChange, onMove, onDelete }: { field: ContactFormField; index: number; count: number; onChange: (f: ContactFormField) => void; onMove: (d: -1 | 1) => void; onDelete: () => void }) {
  const [nameTouched, setNameTouched] = useState(true);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-[1fr_170px_auto]">
        <Field label="Libellé">
          <Input
            value={field.label}
            onChange={(e) => onChange({ ...field, label: e.target.value, name: nameTouched ? field.name : fieldNameFrom(e.target.value) })}
            onFocus={() => !field.name && setNameTouched(false)}
          />
        </Field>
        <Field label="Type">
          <Select value={field.type} onChange={(v) => onChange({ ...field, type: v as ContactFormField['type'], options: v === 'select' ? field.options || [] : undefined })} options={FIELD_TYPES} />
        </Field>
        <div className="flex items-end gap-1 pb-0.5">
          <Button size="icon" variant="ghost" disabled={index === 0} onClick={() => onMove(-1)} title="Monter">
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" disabled={index === count - 1} onClick={() => onMove(1)} title="Descendre">
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="text-rose-600 hover:bg-rose-50" onClick={onDelete} title="Supprimer le champ">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {field.type !== 'checkbox' ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_200px]">
          <Field label="Texte d’exemple (placeholder)">
            <Input value={field.placeholder || ''} onChange={(e) => onChange({ ...field, placeholder: e.target.value || undefined })} placeholder="Ex. Jean Dupont" />
          </Field>
          <Field label="Largeur">
            <Segmented
              size="sm"
              value={field.width === 'half' ? 'half' : 'full'}
              onChange={(width) => onChange({ ...field, width })}
              options={[
                { value: 'full', label: 'Pleine' },
                { value: 'half', label: 'Moitié' },
              ]}
            />
          </Field>
        </div>
      ) : null}
      {field.type === 'select' ? (
        <Field label="Choix proposés" className="mt-3">
          <TagInput value={field.options || []} onChange={(options) => onChange({ ...field, options })} placeholder="Ajouter un choix puis Entrée" />
        </Field>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <Switch checked={field.required} onChange={(required) => onChange({ ...field, required })} label="Champ obligatoire" />
        <span className="text-xs text-slate-400">
          Identifiant technique :{' '}
          <input
            value={field.name}
            onChange={(e) => {
              setNameTouched(true);
              onChange({ ...field, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') });
            }}
            className="w-32 rounded border border-transparent bg-transparent px-1 font-mono text-slate-600 hover:border-slate-200 focus:border-brand-500 focus:outline-none"
          />
        </span>
      </div>
    </div>
  );
}

function FormPreview({ form }: { form: ContactFormConfig }) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-white p-5">
      {form.fields.map((f) =>
        f.type === 'checkbox' ? (
          <label key={f.id} className="col-span-2 flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" disabled className="mt-1" /> {f.label}
            {f.required ? <span className="text-rose-500">*</span> : null}
          </label>
        ) : (
          <div key={f.id} className={f.width === 'half' ? 'col-span-1' : 'col-span-2'}>
            <p className="mb-1 text-xs font-medium text-slate-600">
              {f.label} {f.required ? <span className="text-rose-500">*</span> : null}
            </p>
            {f.type === 'textarea' ? (
              <div className="h-16 rounded-md border border-slate-200 bg-slate-50" />
            ) : f.type === 'select' ? (
              <div className="flex h-8 items-center rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-400">{f.options?.[0] || 'Choisir…'}</div>
            ) : (
              <div className="h-8 rounded-md border border-slate-200 bg-slate-50" />
            )}
          </div>
        )
      )}
      <div className="col-span-2 rounded-md bg-navy-900 py-2 text-center text-sm font-medium text-white">Envoyer</div>
    </div>
  );
}

function Builder({ form, onSaved }: { form: ContactFormConfig; onSaved: (f: ContactFormConfig) => void }) {
  const save = useCallback(
    async (f: ContactFormConfig) => {
      const empty = f.fields.find((x) => !x.label.trim() || !x.name);
      if (empty) throw new Error('Chaque champ doit avoir un libellé et un identifiant.');
      await api.saveForm(f.id, f);
      onSaved(f);
    },
    [onSaved]
  );
  const ed = useEditable<ContactFormConfig>(form, save, { successMessage: 'Formulaire enregistré' });
  if (!ed.value) return null;
  const f = ed.value;
  const setFields = (fields: ContactFormField[]) => ed.patch({ fields });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Section title="Réglages du formulaire">
          <Switch checked={f.enabled} onChange={(enabled) => ed.patch({ enabled })} label="Formulaire actif" description="Désactivé, le formulaire refuse les nouvelles demandes." />
          <Field label="Nom interne">
            <Input value={f.name} onChange={(e) => ed.patch({ name: e.target.value })} />
          </Field>
          <Field label="Destinataires des notifications" hint="Chaque nouvelle demande est envoyée par e-mail à ces adresses (nécessite la configuration SMTP).">
            <TagInput value={f.recipientEmails} onChange={(recipientEmails) => ed.patch({ recipientEmails })} validate={(v) => EMAIL_RE.test(v)} placeholder="email@exemple.fr puis Entrée" />
          </Field>
          <Field label="Page de remerciement" hint="Page affichée après l’envoi.">
            <LinkInput value={f.successPath} onChange={(successPath) => ed.patch({ successPath })} />
          </Field>
        </Section>

        <Section
          title="Champs"
          description="Ajoutez, modifiez et réordonnez les champs du formulaire."
          actions={
            <Button size="sm" variant="primary" icon={Plus} onClick={() => setFields([...f.fields, { id: `f-${crypto.randomUUID().slice(0, 6)}`, name: '', label: '', type: 'text', required: false }])}>
              Ajouter un champ
            </Button>
          }
        >
          {f.fields.map((field, i) => (
            <FieldRow
              key={field.id}
              field={field}
              index={i}
              count={f.fields.length}
              onChange={(nf) => setFields(f.fields.map((x) => (x.id === field.id ? nf : x)))}
              onMove={(d) => {
                const next = [...f.fields];
                [next[i], next[i + d]] = [next[i + d], next[i]];
                setFields(next);
              }}
              onDelete={() => setFields(f.fields.filter((x) => x.id !== field.id))}
            />
          ))}
        </Section>
      </div>
      <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu</p>
        <FormPreview form={f} />
      </div>
      <SaveBar dirty={ed.dirty} saving={ed.saving} onSave={ed.commit} onReset={ed.reset} blocker={ed.blocker} />
    </div>
  );
}

export default function FormsPage() {
  const { can } = useAuth();
  const { data, setData, error, loading, reload } = useAsync(() => api.forms(), []);
  const [tab, setTab] = useState<'inbox' | 'builder'>('inbox');
  const [formId, setFormId] = useState<string>('');

  if (loading && !data) return <PageSkeleton />;
  if (error || !data) return <ErrorState message={error || ''} onRetry={reload} />;
  const unread = data.submissions.filter((s) => !s.read).length;
  const current = data.forms.find((f) => f.id === formId) || data.forms[0];

  return (
    <div className="space-y-6">
      <PageHeader title="Formulaires" description="Consultez les demandes reçues et configurez les formulaires du site." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'inbox', label: 'Messages reçus', icon: Inbox, badge: unread ? <Badge tone="brand">{unread}</Badge> : undefined },
          ...(can('editor') ? [{ value: 'builder' as const, label: 'Configuration', icon: Settings2 }] : []),
        ]}
      />
      {tab === 'inbox' ? (
        <Inbox_
          forms={data.forms}
          submissions={data.submissions}
          setSubmissions={(fn) => setData((d) => (d ? { ...d, submissions: fn(d.submissions) } : d))}
        />
      ) : current ? (
        <>
          {data.forms.length > 1 ? (
            <Select value={current.id} onChange={setFormId} options={data.forms.map((f) => ({ value: f.id, label: f.name }))} className="max-w-xs" />
          ) : null}
          <Builder key={current.id} form={current} onSaved={(nf) => setData((d) => (d ? { ...d, forms: d.forms.map((x) => (x.id === nf.id ? nf : x)) } : d))} />
        </>
      ) : null}
    </div>
  );
}
