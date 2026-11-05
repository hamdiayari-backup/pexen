/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  MoreHorizontal,
  Search,
  Send,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';
import { ALL_PERMISSIONS, SUPERADMIN_ROLE } from '../../../server/cms/permissions';
import { PasswordChecklist, PasswordInput, policyChecks } from '../account/SecurityForms';
import { useAuth } from '../context/AuthContext';
import { api, type LinkDelivery, type Permission, type RoleRow, type SessionRow, type UserRow } from '../lib/api';
import { fmtDate, fmtDateTime, timeAgo } from '../lib/format';
import { errorMessage, useAsync, useDebounced } from '../lib/hooks';
import { Drawer, Dropdown, DropdownItem, Modal, useConfirm } from '../ui/overlays';
import { Alert, Badge, Button, Card, EmptyState, ErrorState, Field, Input, Segmented, Select, Skeleton, StatCard, Switch, Table, Tabs, Td, Th } from '../ui/primitives';
import { Pagination, usePaging, usePagination } from '../ui/Pagination';
import { ActivityFeed, Avatar, GeneratePasswordButton, LinkResultModal, RoleBadge, SessionList, UserStatusBadge } from './shared';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Règles de délégation identiques au serveur : on ne gère / n'attribue que ce que l'on possède déjà. */
export function useAccess(roles: RoleRow[] | null) {
  const { user, can, isSuper } = useAuth();
  return useMemo(() => {
    const mine = new Set<Permission>(user?.permissions ?? []);
    const permsOf = (roleId: string): Permission[] => (roleId === SUPERADMIN_ROLE ? ALL_PERMISSIONS : (roles?.find((r) => r.id === roleId)?.permissions ?? []));
    const covered = (roleId: string) => isSuper || (roleId !== SUPERADMIN_ROLE && permsOf(roleId).every((p) => mine.has(p)));
    return {
      me: user,
      canManageUsers: can('users.manage'),
      canManage: (u: { id: string; role: string }) => can('users.manage') && u.id !== user?.id && covered(u.role),
      assignable: (roles ?? []).filter((r) => covered(r.id)),
      roleName: (id: string) => roles?.find((r) => r.id === id)?.name ?? id,
    };
  }, [roles, user, can, isSuper]);
}

type Access = ReturnType<typeof useAccess>;

/* ------------------------------------------------------------------ Création */

function InviteModal({ open, onClose, access, onCreated }: { open: boolean; onClose: () => void; access: Access; onCreated: (u: UserRow['email'], invite?: LinkDelivery) => void }) {
  const policy = access.me!.policy;
  const defaultRole = access.assignable.find((r) => r.id === 'editor')?.id ?? access.assignable.find((r) => r.id !== SUPERADMIN_ROLE)?.id ?? access.assignable[0]?.id ?? '';
  const empty = { name: '', email: '', title: '', role: defaultRole, mode: 'invite' as 'invite' | 'password', password: '', mustChangePassword: true };
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setF({ ...empty, role: defaultRole });
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const role = access.assignable.find((r) => r.id === f.role);
  const emailOk = EMAIL.test(f.email.trim());
  const pwOk = f.mode === 'invite' || policyChecks(f.password, policy).every((c) => c.ok);
  const valid = f.name.trim() && emailOk && f.role && pwOk;

  const submit = async () => {
    setSaving(true);
    setError('');
    try {
      const r = await api.createUser({
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        title: f.title.trim() || undefined,
        role: f.role,
        mode: f.mode,
        ...(f.mode === 'password' ? { password: f.password, mustChangePassword: f.mustChangePassword } : {}),
      });
      onCreated(r.user.email, r.invite);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ajouter un utilisateur"
      description="La personne accède à l’administration avec les droits du rôle choisi."
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant="primary" icon={f.mode === 'invite' ? Send : UserPlus} loading={saving} disabled={!valid} onClick={() => void submit()}>
            {f.mode === 'invite' ? 'Envoyer l’invitation' : 'Créer le compte'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) void submit();
        }}
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom complet">
            <Input autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Leïla Ben Salah" />
          </Field>
          <Field label="E-mail" error={f.email && !emailOk ? 'Adresse invalide' : undefined}>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="leila@exemple.com" />
          </Field>
        </div>
        <Field label="Fonction (facultatif)">
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Responsable communication" />
        </Field>
        <Field label="Rôle" hint={role ? `${role.description} (${role.id === SUPERADMIN_ROLE ? 'tous les droits' : `${role.permissions.length} droit(s)`})` : undefined}>
          <Select value={f.role} onChange={(roleId) => setF({ ...f, role: roleId })} options={access.assignable.map((r) => ({ value: r.id, label: r.name }))} />
        </Field>
        <Field label="Accès">
          <Segmented
            value={f.mode}
            onChange={(mode) => setF({ ...f, mode })}
            options={[
              { value: 'invite', label: 'Invitation par e-mail', icon: Mail },
              { value: 'password', label: 'Mot de passe défini', icon: KeyRound },
            ]}
          />
        </Field>
        {f.mode === 'invite' ? (
          <p className="text-[13px] leading-relaxed text-slate-500">
            Un lien personnel, valable 7 jours, permet à la personne de choisir elle-même son mot de passe. Vous pourrez aussi le copier si l’e-mail n’arrive pas.
          </p>
        ) : (
          <div className="space-y-3">
            <Field label={<span className="flex w-full items-center justify-between">Mot de passe initial</span>}>
              <div className="flex gap-2">
                <div className="flex-1">
                  <PasswordInput value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
                </div>
                <GeneratePasswordButton policy={policy} onGenerate={(password) => setF({ ...f, password })} />
              </div>
            </Field>
            {f.password ? <PasswordChecklist password={f.password} policy={policy} /> : null}
            <Switch
              checked={f.mustChangePassword}
              onChange={(mustChangePassword) => setF({ ...f, mustChangePassword })}
              label="Changement obligatoire à la première connexion"
              description="Recommandé : vous ne connaîtrez plus le mot de passe utilisé."
            />
          </div>
        )}
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}

function SetPasswordModal({ user, onClose, policy }: { user: UserRow | null; onClose: () => void; policy: NonNullable<Access['me']>['policy'] }) {
  const [password, setPassword] = useState('');
  const [mustChange, setMustChange] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setPassword('');
    setMustChange(true);
  }, [user]);
  const ok = policyChecks(password, policy).every((c) => c.ok);
  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title="Définir un nouveau mot de passe"
      description={user ? `${user.name} · ${user.email}` : undefined}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button
            variant="primary"
            icon={KeyRound}
            loading={saving}
            disabled={!ok}
            onClick={async () => {
              if (!user) return;
              setSaving(true);
              try {
                const r = await api.setUserPassword(user.id, password, mustChange);
                toast.success(r.closedSessions ? `Mot de passe défini — ${r.closedSessions} session(s) fermée(s)` : 'Mot de passe défini');
                onClose();
              } catch (e) {
                toast.error(errorMessage(e));
              } finally {
                setSaving(false);
              }
            }}
          >
            Enregistrer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="info">Toutes les sessions ouvertes de ce compte seront fermées. Préférez le lien de réinitialisation pour ne jamais connaître le mot de passe.</Alert>
        <div className="flex gap-2">
          <div className="flex-1">
            <PasswordInput autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <GeneratePasswordButton policy={policy} onGenerate={setPassword} />
        </div>
        {password ? <PasswordChecklist password={password} policy={policy} /> : null}
        <Switch checked={mustChange} onChange={setMustChange} label="Changement obligatoire à la prochaine connexion" />
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ Fiche */

type Action = 'resend-invite' | 'reset-link' | 'copy-link' | 'set-password' | '2fa-reset' | 'sessions' | 'suspend' | 'reactivate' | 'delete';

function actionsFor(u: UserRow): { a: Action; label: string; icon: React.ElementType; danger?: boolean; separator?: boolean }[] {
  return [
    ...(u.status === 'invited' ? [{ a: 'resend-invite' as const, label: 'Renvoyer l’invitation', icon: Send }] : []),
    ...(u.status === 'active'
      ? [
          { a: 'reset-link' as const, label: 'Envoyer un lien de réinitialisation', icon: Mail },
          { a: 'copy-link' as const, label: 'Obtenir un lien de réinitialisation', icon: Link2 },
          { a: 'set-password' as const, label: 'Définir le mot de passe', icon: KeyRound },
        ]
      : []),
    ...(u.totpEnabled ? [{ a: '2fa-reset' as const, label: 'Réinitialiser la double authentification', icon: ShieldOff }] : []),
    ...(u.activeSessions > 0 ? [{ a: 'sessions' as const, label: `Fermer les sessions (${u.activeSessions})`, icon: LogOut }] : []),
    ...(u.status === 'suspended'
      ? [{ a: 'reactivate' as const, label: 'Réactiver le compte', icon: UserCheck, separator: true }]
      : u.status === 'active'
        ? [{ a: 'suspend' as const, label: 'Suspendre le compte', icon: Ban, danger: true, separator: true }]
        : []),
    { a: 'delete', label: u.status === 'invited' ? 'Annuler l’invitation' : 'Supprimer le compte', icon: Trash2, danger: true, separator: u.status === 'invited' },
  ];
}

function UserActions({ u, access, onAction, trigger }: { u: UserRow; access: Access; onAction: (a: Action, u: UserRow) => void; trigger: React.ReactNode }) {
  if (u.id === access.me?.id) {
    return (
      <Link to="/profile" onClick={(e) => e.stopPropagation()}>
        <Button size="sm" variant="ghost">
          Mon profil
        </Button>
      </Link>
    );
  }
  if (!access.canManage(u)) return null;
  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dropdown trigger={trigger}>
        {actionsFor(u).map((x) => (
          <React.Fragment key={x.a}>
            {x.separator ? <div className="my-1 border-t border-slate-100" /> : null}
            <DropdownItem icon={x.icon} danger={x.danger} onClick={() => onAction(x.a, u)}>
              {x.label}
            </DropdownItem>
          </React.Fragment>
        ))}
      </Dropdown>
    </div>
  );
}

function UserDrawer({
  user,
  roles,
  access,
  onClose,
  onSaved,
  onAction,
}: {
  user: UserRow | null;
  roles: RoleRow[] | null;
  access: Access;
  onClose: () => void;
  onSaved: () => void;
  onAction: (a: Action, u: UserRow) => void;
}) {
  const [tab, setTab] = useState<'profile' | 'sessions' | 'activity'>('profile');
  const [f, setF] = useState({ name: '', email: '', title: '', phone: '', role: '' });
  const [saving, setSaving] = useState(false);
  const { page, setPage, pageSize, setPageSize } = usePaging('activity', { resetKey: user?.id });
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const activity = useAsync(() => (user && tab === 'activity' ? api.userActivity(user.id, page, pageSize) : Promise.resolve(null)), [user?.id, tab, page, pageSize]);

  useEffect(() => {
    if (!user) return;
    setF({ name: user.name, email: user.email, title: user.title ?? '', phone: user.phone ?? '', role: user.role });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);
  useEffect(() => {
    setTab('profile');
  }, [user?.id]);
  useEffect(() => {
    if (!user || tab !== 'sessions') return;
    setSessions(null);
    api.userSessions(user.id).then(setSessions, (e) => toast.error(errorMessage(e)));
  }, [user, tab]);

  if (!user) return <Drawer open={false} onClose={onClose} title="">{null}</Drawer>;
  const self = user.id === access.me?.id;
  const editable = access.canManage(user);
  const roleOptions = access.assignable.some((r) => r.id === user.role) ? access.assignable : [...(roles ?? []).filter((r) => r.id === user.role), ...access.assignable];
  const changes = {
    ...(f.name.trim() !== user.name ? { name: f.name } : {}),
    ...(f.email.trim().toLowerCase() !== user.email ? { email: f.email } : {}),
    ...(f.title.trim() !== (user.title ?? '') ? { title: f.title } : {}),
    ...(f.phone.trim() !== (user.phone ?? '') ? { phone: f.phone } : {}),
    ...(f.role !== user.role ? { role: f.role } : {}),
  };
  const dirty = Object.keys(changes).length > 0;

  const save = async () => {
    setSaving(true);
    try {
      await api.updateUser(user.id, changes);
      toast.success('Compte mis à jour');
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const facts: [string, React.ReactNode][] = [
    ['Rôle', <RoleBadge key="r" roleId={user.role} roles={roles} fallback={user.roleName} />],
    ['Statut', <UserStatusBadge key="s" user={user} inviteExpiresAt={user.inviteExpiresAt} />],
    ['Double authentification', user.totpEnabled ? <Badge tone="success">Activée</Badge> : <Badge>Non activée</Badge>],
    ['Dernière connexion', user.lastLoginAt ? `${fmtDateTime(user.lastLoginAt)}${user.lastLoginIp ? ` · ${user.lastLoginIp}` : ''}` : 'Jamais'],
    ['Connexions', user.loginCount],
    ['Mot de passe changé', user.passwordChangedAt ? fmtDate(user.passwordChangedAt) : '—'],
    ['Créé', `${user.createdAt ? fmtDate(user.createdAt) : '—'}${user.invitedBy ? ` par ${user.invitedBy}` : ''}`],
  ];

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <Avatar name={user.name} email={user.email} src={user.avatarUrl} />
          <span className="min-w-0">
            <span className="block truncate">{user.name}</span>
            <span className="block truncate text-xs font-normal text-slate-500">{user.email}</span>
          </span>
        </span>
      }
      footer={
        tab === 'profile' && editable ? (
          <>
            <Button variant="primary" loading={saving} disabled={!dirty || !f.name.trim() || !EMAIL.test(f.email.trim())} onClick={() => void save()}>
              Enregistrer
            </Button>
          </>
        ) : undefined
      }
    >
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'profile', label: 'Profil' },
          { value: 'sessions', label: 'Sessions', badge: user.activeSessions ? <Badge>{user.activeSessions}</Badge> : undefined },
          { value: 'activity', label: 'Activité' },
        ]}
      />
      {tab === 'profile' ? (
        <div className="space-y-5">
          {user.mustChangePassword ? <Alert tone="warning">Devra choisir un nouveau mot de passe à sa prochaine connexion.</Alert> : null}
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
            {facts.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
          {self ? (
            <Alert tone="info" action={<Link to="/profile"><Button size="sm">Mon profil</Button></Link>}>
              C’est votre compte : modifiez-le depuis votre profil.
            </Alert>
          ) : !editable ? (
            <Alert tone="neutral">Ce compte dispose de droits que vous n’avez pas : il est en lecture seule pour vous.</Alert>
          ) : (
            <fieldset className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom complet">
                  <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
                </Field>
                <Field label="E-mail" error={!EMAIL.test(f.email.trim()) ? 'Adresse invalide' : undefined}>
                  <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
                </Field>
                <Field label="Fonction">
                  <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
                </Field>
                <Field label="Téléphone">
                  <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Rôle" hint={roles?.find((r) => r.id === f.role)?.description}>
                <Select value={f.role} onChange={(role) => setF({ ...f, role })} options={roleOptions.map((r) => ({ value: r.id, label: r.name }))} />
              </Field>
              {f.role !== user.role ? <p className="text-xs text-slate-500">Les nouveaux droits s’appliquent immédiatement, sans reconnexion.</p> : null}
            </fieldset>
          )}
          {editable ? (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Actions</p>
              <div className="grid gap-1">
                {actionsFor(user).map((x) => (
                  <button
                    key={x.a}
                    type="button"
                    onClick={() => onAction(x.a, user)}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${x.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <x.icon className="h-4 w-4 opacity-70" />
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      {tab === 'sessions' ? (
        <div className="space-y-3">
          <SessionList
            sessions={sessions}
            revoking={revoking}
            onRevoke={
              editable
                ? async (s) => {
                    setRevoking(s.id);
                    try {
                      await api.revokeUserSessions(user.id, s.id);
                      setSessions((list) => list?.filter((x) => x.id !== s.id) ?? null);
                      onSaved();
                    } catch (e) {
                      toast.error(errorMessage(e));
                    } finally {
                      setRevoking(null);
                    }
                  }
                : undefined
            }
          />
          {editable && sessions && sessions.length > 1 ? (
            <Button icon={LogOut} onClick={() => onAction('sessions', user)}>
              Fermer toutes les sessions
            </Button>
          ) : null}
        </div>
      ) : null}
      {tab === 'activity' ? <ActivityFeed data={activity.data} page={page} onPage={setPage} onPageSize={setPageSize} roleName={access.roleName} /> : null}
    </Drawer>
  );
}

/* ------------------------------------------------------------------ Liste */

export function UsersTab({ roles, inviteOpen, setInviteOpen }: { roles: RoleRow[] | null; inviteOpen: boolean; setInviteOpen: (v: boolean) => void }) {
  const access = useAccess(roles);
  const confirm = useConfirm();
  const { data, error, loading, reload } = useAsync(() => api.users(), []);
  const [q, setQ] = useState('');
  const query = useDebounced(q, 150).trim().toLowerCase();
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [pwUser, setPwUser] = useState<UserRow | null>(null);
  const [link, setLink] = useState<React.ComponentProps<typeof LinkResultModal>['result']>(null);

  const users = data ?? [];
  const filtered = users.filter(
    (u) =>
      (!query || `${u.name} ${u.email} ${u.title ?? ''}`.toLowerCase().includes(query)) &&
      (!roleFilter || u.role === roleFilter) &&
      (!statusFilter || (statusFilter === 'no2fa' ? u.status === 'active' && !u.totpEnabled : u.status === statusFilter))
  );
  const openUser = users.find((u) => u.id === openId) ?? null;

  const run = async (a: Action, u: UserRow) => {
    try {
      switch (a) {
        case 'resend-invite':
          setLink({ title: 'Invitation renvoyée', email: u.email, delivery: await api.userResetLink(u.id, true) });
          break;
        case 'reset-link':
          setLink({ title: 'Lien de réinitialisation', email: u.email, delivery: await api.userResetLink(u.id, true) });
          break;
        case 'copy-link':
          setLink({ title: 'Lien de réinitialisation', email: u.email, delivery: await api.userResetLink(u.id, false), manual: true });
          break;
        case 'set-password':
          setPwUser(u);
          return;
        case '2fa-reset':
          if (!(await confirm({ title: 'Réinitialiser la double authentification ?', message: `${u.name} devra la reconfigurer. Ses sessions seront fermées.`, confirmLabel: 'Réinitialiser', danger: true }))) return;
          await api.resetUser2fa(u.id);
          toast.success('Double authentification réinitialisée');
          break;
        case 'sessions': {
          if (!(await confirm({ title: 'Fermer toutes les sessions ?', message: `${u.name} sera déconnecté(e) de tous ses appareils.`, confirmLabel: 'Fermer les sessions' }))) return;
          const r = await api.revokeUserSessions(u.id);
          toast.success(`${r.closed} session(s) fermée(s)`);
          break;
        }
        case 'suspend':
          if (
            !(await confirm({
              title: `Suspendre ${u.name} ?`,
              message: 'La personne est déconnectée immédiatement et ne peut plus se connecter. Ses liens d’invitation ou de réinitialisation sont annulés. Le compte peut être réactivé.',
              confirmLabel: 'Suspendre',
              danger: true,
            }))
          )
            return;
          await api.setUserStatus(u.id, 'suspended');
          toast.success('Compte suspendu');
          break;
        case 'reactivate':
          await api.setUserStatus(u.id, 'active');
          toast.success('Compte réactivé');
          break;
        case 'delete':
          if (
            !(await confirm({
              title: `Supprimer le compte de ${u.name} ?`,
              message: 'Suppression définitive. Le journal d’activité conserve la trace de ses actions. Pour un départ temporaire, préférez la suspension.',
              confirmLabel: 'Supprimer',
              danger: true,
            }))
          )
            return;
          await api.deleteUser(u.id);
          toast.success('Compte supprimé');
          setOpenId(null);
          break;
      }
      void reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const pg = usePagination(filtered, 'users', { resetKey: [query, roleFilter, statusFilter] });

  if (error && !data) return <ErrorState message={error} onRetry={() => void reload()} />;

  const stats = {
    active: users.filter((u) => u.status === 'active').length,
    invited: users.filter((u) => u.status === 'invited').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    twoFa: users.filter((u) => u.status === 'active' && u.totpEnabled).length,
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Comptes actifs" value={loading && !data ? '—' : stats.active} icon={Users} hint={`${users.length} au total`} />
        <StatCard label="Invitations en attente" value={loading && !data ? '—' : stats.invited} icon={Send} tone="sky" />
        <StatCard
          label="Double authentification"
          value={loading && !data ? '—' : stats.active ? `${Math.round((stats.twoFa / stats.active) * 100)} %` : '—'}
          icon={ShieldCheck}
          tone="violet"
          hint={`${stats.twoFa} compte(s) protégé(s)`}
        />
        <StatCard label="Comptes suspendus" value={loading && !data ? '—' : stats.suspended} icon={UserX} tone="rose" />
      </div>

      <Card padded={false}>
        <div className="flex flex-col gap-2 border-b border-slate-100 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un nom, un e-mail, une fonction…" className="pl-9" />
          </div>
          <Select value={roleFilter} onChange={setRoleFilter} className="sm:w-48" options={[{ value: '', label: 'Tous les rôles' }, ...(roles ?? []).map((r) => ({ value: r.id, label: r.name }))]} />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="sm:w-48"
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: 'active', label: 'Actifs' },
              { value: 'invited', label: 'Invités' },
              { value: 'suspended', label: 'Suspendus' },
              { value: 'no2fa', label: 'Actifs sans 2FA' },
            ]}
          />
        </div>
        {loading && !data ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState icon={Users} title="Aucun utilisateur" description={users.length ? 'Aucun compte ne correspond à ces filtres.' : 'Invitez votre équipe pour collaborer.'} />
          </div>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Utilisateur</Th>
                <Th>Rôle</Th>
                <Th>Statut</Th>
                <Th>2FA</Th>
                <Th>Dernière connexion</Th>
                <Th className="text-right">
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {pg.pageItems.map((u) => (
                <tr key={u.id} className="cursor-pointer transition hover:bg-slate-50/70" onClick={() => setOpenId(u.id)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} email={u.email} src={u.avatarUrl} />
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-medium text-slate-900">
                          {u.name}
                          {u.id === access.me?.id ? <Badge tone="brand">Vous</Badge> : null}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {u.email}
                          {u.title ? ` · ${u.title}` : ''}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <RoleBadge roleId={u.role} roles={roles} fallback={u.roleName} />
                  </Td>
                  <Td>
                    <div className="flex flex-col items-start gap-1">
                      <UserStatusBadge user={u} inviteExpiresAt={u.inviteExpiresAt} />
                      {u.status === 'active' && u.mustChangePassword ? <span className="text-[11px] text-amber-700">Mot de passe à changer</span> : null}
                    </div>
                  </Td>
                  <Td>{u.totpEnabled ? <ShieldCheck className="h-4 w-4 text-emerald-600" aria-label="Activée" /> : <span className="text-slate-300">—</span>}</Td>
                  <Td className="whitespace-nowrap text-[13px]">
                    {u.lastLoginAt ? (
                      <span title={fmtDateTime(u.lastLoginAt)}>
                        {timeAgo(u.lastLoginAt)}
                        {u.activeSessions ? (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {u.activeSessions} session(s)
                          </span>
                        ) : null}
                      </span>
                    ) : (
                      <span className="text-slate-400">Jamais</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <UserActions
                      u={u}
                      access={access}
                      onAction={(a, x) => void run(a, x)}
                      trigger={
                        <Button size="icon" variant="ghost" aria-label="Actions">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      }
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Pagination {...pg.props} noun="utilisateurs" />
      </Card>

      {access.me ? (
        <InviteModal
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          access={access}
          onCreated={(email, invite) => {
            setInviteOpen(false);
            void reload();
            if (invite) setLink({ title: 'Invitation créée', email, delivery: invite });
            else toast.success('Compte créé');
          }}
        />
      ) : null}
      {access.me ? <SetPasswordModal user={pwUser} onClose={() => setPwUser(null)} policy={access.me.policy} /> : null}
      <LinkResultModal result={link} onClose={() => setLink(null)} />
      <UserDrawer user={openUser} roles={roles} access={access} onClose={() => setOpenId(null)} onSaved={() => void reload()} onAction={(a, u) => void run(a, u)} />
    </div>
  );
}
