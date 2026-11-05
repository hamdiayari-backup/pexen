/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useState } from 'react';
import { Check, Copy, Lock, Pencil, Plus, RotateCcw, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PERMISSION_GROUPS, SUPERADMIN_ROLE } from '../../../server/cms/permissions';
import { useAuth } from '../context/AuthContext';
import { api, type Permission, type RoleRow, type RoleTone } from '../lib/api';
import { errorMessage } from '../lib/hooks';
import { Modal, useConfirm } from '../ui/overlays';
import { Alert, Badge, Button, Card, cx, Field, Input, Select, Skeleton, Table, Td, Th } from '../ui/primitives';

const TONES: { value: RoleTone; label: string; dot: string }[] = [
  { value: 'brand', label: 'Marque', dot: 'bg-brand-500' },
  { value: 'info', label: 'Bleu', dot: 'bg-sky-500' },
  { value: 'success', label: 'Vert', dot: 'bg-emerald-500' },
  { value: 'warning', label: 'Ambre', dot: 'bg-amber-500' },
  { value: 'danger', label: 'Rouge', dot: 'bg-rose-500' },
  { value: 'neutral', label: 'Gris', dot: 'bg-slate-400' },
];

/** Droits qui n'ont de sens qu'accompagnés d'un autre. */
const REQUIRES: Partial<Record<Permission, Permission>> = {
  'pages.publish': 'pages.edit',
  'pages.delete': 'pages.edit',
  'posts.publish': 'posts.edit',
  'posts.delete': 'posts.edit',
  'media.delete': 'media.upload',
  'forms.manage': 'forms.view',
  'users.manage': 'users.view',
};

const ALL_COUNT = PERMISSION_GROUPS.reduce((n, g) => n + g.permissions.length, 0);
const LABEL = new Map<string, string>(PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => [p.key, p.label] as const)));

interface Draft {
  id?: string;
  name: string;
  description: string;
  tone: RoleTone;
  permissions: Permission[];
}

function RoleEditor({ draft, onClose, onSaved }: { draft: Draft | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft | null>(draft);
  const [saving, setSaving] = useState(false);
  useEffect(() => setD(draft), [draft]);
  if (!d) return null;
  const has = new Set(d.permissions);

  const toggle = (p: Permission, on: boolean) => {
    const next = new Set(d.permissions);
    if (on) {
      next.add(p);
      const req = REQUIRES[p];
      if (req) next.add(req);
    } else {
      next.delete(p);
      for (const [k, v] of Object.entries(REQUIRES)) if (v === p) next.delete(k as Permission);
    }
    setD({ ...d, permissions: [...next] });
  };
  const toggleGroup = (keys: Permission[], on: boolean) => {
    const next = new Set(d.permissions);
    for (const k of keys) on ? next.add(k) : next.delete(k);
    if (!on) for (const [k, v] of Object.entries(REQUIRES)) if (!next.has(v)) next.delete(k as Permission);
    setD({ ...d, permissions: [...next] });
  };

  const save = async () => {
    setSaving(true);
    try {
      const body = { name: d.name.trim(), description: d.description.trim(), tone: d.tone, permissions: d.permissions };
      if (d.id) await api.updateRole(d.id, body);
      else await api.createRole(body);
      toast.success(d.id ? 'Rôle mis à jour — droits appliqués immédiatement' : 'Rôle créé');
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={d.id ? `Modifier le rôle « ${draft?.name} »` : 'Nouveau rôle'}
      description="Les changements s’appliquent immédiatement à tous les comptes qui ont ce rôle."
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={saving} disabled={!d.name.trim()} onClick={() => void save()}>
            {d.id ? 'Enregistrer' : 'Créer le rôle'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <Field label="Nom">
            <Input autoFocus value={d.name} maxLength={60} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Ex. Community manager" />
          </Field>
          <Field label="Couleur">
            <Select value={d.tone} onChange={(tone) => setD({ ...d, tone: tone as RoleTone })} options={TONES.map((t) => ({ value: t.value, label: t.label }))} />
          </Field>
        </div>
        <Field label="Description">
          <Input value={d.description} maxLength={240} onChange={(e) => setD({ ...d, description: e.target.value })} placeholder="À quoi sert ce rôle ?" />
        </Field>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-slate-700">
              Droits <span className="font-normal text-slate-500">({d.permissions.length} / {ALL_COUNT})</span>
            </p>
          </div>
          {d.permissions.length === 0 ? <Alert tone="warning">Sans aucun droit, les comptes de ce rôle ne verront que le tableau de bord et leur profil.</Alert> : null}
          {PERMISSION_GROUPS.map((g) => {
            const keys = g.permissions.map((p) => p.key as Permission);
            const all = keys.every((k) => has.has(k));
            return (
              <div key={g.id} className="rounded-xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-4 py-2">
                  <p className="text-[13px] font-semibold text-slate-800">{g.label}</p>
                  <button type="button" className="text-xs font-medium text-brand-700 hover:underline" onClick={() => toggleGroup(keys, !all)}>
                    {all ? 'Tout décocher' : 'Tout cocher'}
                  </button>
                </div>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {g.permissions.map((p) => {
                    const key = p.key as Permission;
                    const req = REQUIRES[key];
                    return (
                      <label key={key} className="flex cursor-pointer items-start gap-2.5 px-4 py-2.5 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={has.has(key)}
                          onChange={(e) => toggle(key, e.target.checked)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm text-slate-800">{p.label}</span>
                          {'description' in p && p.description ? <span className="block text-xs leading-relaxed text-slate-500">{p.description}</span> : null}
                          {req ? <span className="block text-[11px] text-slate-400">Coche aussi « {LABEL.get(req)} ».</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

function DeleteRoleModal({ role, roles, onClose, onDeleted }: { role: RoleRow | null; roles: RoleRow[]; onClose: () => void; onDeleted: () => void }) {
  const [target, setTarget] = useState('');
  const [busy, setBusy] = useState(false);
  const others = roles.filter((r) => r.id !== role?.id);
  useEffect(() => setTarget(others.find((r) => r.id === 'viewer')?.id ?? others.find((r) => r.id !== SUPERADMIN_ROLE)?.id ?? ''), [role]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Modal
      open={!!role}
      onClose={onClose}
      size="sm"
      title={`Supprimer le rôle « ${role?.name ?? ''} » ?`}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            variant="danger"
            loading={busy}
            disabled={!!role?.userCount && !target}
            onClick={async () => {
              if (!role) return;
              setBusy(true);
              try {
                await api.deleteRole(role.id, role.userCount ? target : undefined);
                toast.success('Rôle supprimé');
                onDeleted();
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Supprimer
          </Button>
        </>
      }
    >
      {role?.userCount ? (
        <div className="space-y-3 text-sm text-slate-600">
          <p>{role.userCount} compte(s) utilisent ce rôle. Choisissez le rôle qu’ils recevront :</p>
          <Select value={target} onChange={setTarget} options={others.map((r) => ({ value: r.id, label: r.name }))} />
          {target === SUPERADMIN_ROLE ? <Alert tone="warning">Ces comptes obtiendront tous les droits.</Alert> : null}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Aucun compte n’utilise ce rôle. Cette action est définitive.</p>
      )}
    </Modal>
  );
}

export function RolesTab({ roles, loading, reload }: { roles: RoleRow[] | null; loading: boolean; reload: () => void }) {
  const { isSuper } = useAuth();
  const confirm = useConfirm();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);

  if (loading && !roles) return <Skeleton className="h-64" />;
  const list = roles ?? [];

  const reset = async (r: RoleRow) => {
    if (!(await confirm({ title: `Rétablir « ${r.name} » ?`, message: 'Le nom, la description et les droits d’origine seront restaurés.', confirmLabel: 'Rétablir' }))) return;
    try {
      await api.resetRole(r.id);
      toast.success('Rôle rétabli');
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      {!isSuper ? <Alert tone="info" icon={Lock}>Seul un super administrateur peut créer ou modifier les rôles.</Alert> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((r) => (
          <Card key={r.id} className="flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={r.tone}>{r.name}</Badge>
                  {r.locked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Lock className="h-3 w-3" /> Verrouillé
                    </span>
                  ) : r.builtin ? (
                    <span className="text-[11px] text-slate-400">Fourni par Pexen</span>
                  ) : null}
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{r.description || '—'}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {r.userCount} compte(s)
              </span>
              <span>{r.locked ? 'Tous les droits' : `${r.permissions.length} / ${ALL_COUNT} droits`}</span>
            </div>
            {isSuper ? (
              <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                {!r.locked ? (
                  <Button size="sm" variant="ghost" icon={Pencil} onClick={() => setDraft({ id: r.id, name: r.name, description: r.description, tone: r.tone, permissions: [...r.permissions] })}>
                    Modifier
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  icon={Copy}
                  onClick={() => setDraft({ name: `${r.name} (copie)`, description: r.description, tone: r.tone, permissions: r.locked ? PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key as Permission)) : [...r.permissions] })}
                >
                  Dupliquer
                </Button>
                {r.hasDefault ? (
                  <Button size="sm" variant="ghost" icon={RotateCcw} onClick={() => void reset(r)}>
                    Rétablir
                  </Button>
                ) : null}
                {!r.builtin && !r.locked ? (
                  <Button size="sm" variant="ghost" icon={Trash2} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => setDeleting(r)}>
                    Supprimer
                  </Button>
                ) : null}
              </div>
            ) : null}
          </Card>
        ))}
        {isSuper ? (
          <button
            type="button"
            onClick={() => setDraft({ name: '', description: '', tone: 'neutral', permissions: [] })}
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 text-sm font-medium text-slate-500 transition hover:border-brand-300 hover:text-brand-700"
          >
            <Plus className="h-5 w-5" />
            Nouveau rôle
          </button>
        ) : null}
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[15px] font-semibold text-slate-900">Matrice des droits</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">Vue d’ensemble de ce que chaque rôle peut faire.</p>
        </div>
        <Table>
          <thead>
            <tr>
              <Th className="sticky left-0 z-10 min-w-[260px] bg-slate-50">Droit</Th>
              {list.map((r) => (
                <Th key={r.id} className="text-center normal-case tracking-normal">
                  <Badge tone={r.tone}>{r.name}</Badge>
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_GROUPS.map((g) => (
              <React.Fragment key={g.id}>
                <tr>
                  <td colSpan={list.length + 1} className="sticky left-0 bg-white px-4 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {g.label}
                  </td>
                </tr>
                {g.permissions.map((p) => (
                  <tr key={p.key} className="hover:bg-slate-50/60">
                    <Td className="sticky left-0 bg-white py-2 text-[13px]">{p.label}</Td>
                    {list.map((r) => {
                      const on = r.locked || r.permissions.includes(p.key as Permission);
                      return (
                        <Td key={r.id} className="py-2 text-center">
                          {on ? <Check className={cx('mx-auto h-4 w-4', r.locked ? 'text-slate-400' : 'text-emerald-600')} /> : <span className="text-slate-200">—</span>}
                        </Td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </Table>
      </Card>

      <RoleEditor
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={() => {
          setDraft(null);
          reload();
        }}
      />
      <DeleteRoleModal
        role={deleting}
        roles={list}
        onClose={() => setDeleting(null)}
        onDeleted={() => {
          setDeleting(null);
          reload();
        }}
      />
    </div>
  );
}
