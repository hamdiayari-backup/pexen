import React, { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, MoreHorizontal, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import type { AdminUser } from '../../../server/cms/types';
import { api, type PublicUser } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { ROLE_LABELS, timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { Badge, Button, Card, EmptyState, ErrorState, Field, Input, PageHeader, PageSkeleton, Select, Table, Td, Th } from '../ui/primitives';
import { Dropdown, DropdownItem, Modal, useConfirm } from '../ui/overlays';

type Role = AdminUser['role'];
const ROLE_DESC: Record<Role, string> = {
  superadmin: 'Accès complet, y compris utilisateurs, paramètres, IA et maintenance.',
  editor: 'Gère le contenu, les menus, les médias, les formulaires et l’apparence.',
  seo: 'Modifie uniquement le référencement des pages et articles.',
  viewer: 'Consultation seule du tableau de bord et des statistiques.',
};
const ROLE_OPTIONS = (Object.keys(ROLE_DESC) as Role[]).map((r) => ({ value: r, label: ROLE_LABELS[r] }));
const ROLE_TONE: Record<Role, 'brand' | 'info' | 'warning' | 'neutral'> = { superadmin: 'brand', editor: 'info', seo: 'warning', viewer: 'neutral' };

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const arr = crypto.getRandomValues(new Uint32Array(14));
  const pwd = Array.from(arr, (n) => chars[n % chars.length]).join('');
  return /\d/.test(pwd) ? pwd : `${pwd.slice(0, -1)}7`;
};

function PasswordInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" autoComplete="new-password" />
      <Button onClick={() => onChange(generatePassword())}>Générer</Button>
    </div>
  );
}

function UserModal({ user, open, onClose, onSaved }: { user: PublicUser | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!open) return;
    setName(user?.name || '');
    setEmail(user?.email || '');
    setRole(user?.role || 'editor');
    setPassword(user ? '' : generatePassword());
  }, [open, user]);

  const submit = async () => {
    setSaving(true);
    try {
      if (user) await api.updateUser(user.id, { name, role, ...(password ? { password } : {}) });
      else await api.createUser({ name, email, role, password });
      toast.success(user ? 'Utilisateur mis à jour' : 'Utilisateur créé — transmettez-lui son mot de passe de façon sécurisée.');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" loading={saving} disabled={!name.trim() || (!user && (!email.trim() || !password))} onClick={submit}>
            {user ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={email} disabled={!!user} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <Field label="Rôle" hint={ROLE_DESC[role]}>
          <Select value={role} onChange={(v) => setRole(v as Role)} options={ROLE_OPTIONS} />
        </Field>
        <Field label={user ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'} hint="10 caractères minimum, avec lettres et chiffres.">
          <PasswordInput value={password} onChange={setPassword} />
        </Field>
      </div>
    </Modal>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const confirm = useConfirm();
  const { data, error, loading, reload } = useAsync(() => api.users(), []);
  const [modal, setModal] = useState<{ open: boolean; user: PublicUser | null }>({ open: false, user: null });

  const remove = async (u: PublicUser) => {
    if (!(await confirm({ title: 'Supprimer cet utilisateur ?', message: `${u.name || u.email} n’aura plus accès à l’administration.`, confirmLabel: 'Supprimer', danger: true }))) return;
    try {
      await api.deleteUser(u.id);
      toast.success('Utilisateur supprimé');
      void reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Utilisateurs"
        description="Gérez les personnes ayant accès à l’administration et leurs droits."
        actions={
          <Button variant="primary" icon={UserPlus} onClick={() => setModal({ open: true, user: null })}>
            Ajouter un utilisateur
          </Button>
        }
      />
      <Card padded={false}>
        {loading && !data ? (
          <div className="p-5">
            <PageSkeleton />
          </div>
        ) : error || !data ? (
          <div className="p-5">
            <ErrorState message={error || ''} onRetry={reload} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState icon={Users} title="Aucun utilisateur" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Utilisateur</Th>
                <Th>Rôle</Th>
                <Th>Dernière connexion</Th>
                <Th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{(u.name || u.email).slice(0, 2).toUpperCase()}</span>
                      <div>
                        <p className="font-medium text-slate-900">
                          {u.name || '—'} {u.id === me?.id ? <span className="text-xs font-normal text-slate-400">(vous)</span> : null}
                        </p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                  </Td>
                  <Td className="text-slate-500">{timeAgo(u.lastLoginAt)}</Td>
                  <Td>
                    <Dropdown
                      trigger={
                        <Button size="icon" variant="ghost" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    >
                      <DropdownItem icon={Pencil} onClick={() => setModal({ open: true, user: u })}>
                        Modifier
                      </DropdownItem>
                      <DropdownItem icon={KeyRound} onClick={() => setModal({ open: true, user: u })}>
                        Réinitialiser le mot de passe
                      </DropdownItem>
                      {u.id !== me?.id ? (
                        <DropdownItem icon={Trash2} danger onClick={() => void remove(u)}>
                          Supprimer
                        </DropdownItem>
                      ) : null}
                    </Dropdown>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-[15px] font-semibold text-slate-900">Rôles et permissions</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(Object.keys(ROLE_DESC) as Role[]).map((r) => (
            <div key={r} className="rounded-xl border border-slate-200 p-4">
              <Badge tone={ROLE_TONE[r]}>{ROLE_LABELS[r]}</Badge>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{ROLE_DESC[r]}</p>
            </div>
          ))}
        </div>
      </Card>

      <UserModal open={modal.open} user={modal.user} onClose={() => setModal({ open: false, user: null })} onSaved={() => void reload()} />
    </div>
  );
}
