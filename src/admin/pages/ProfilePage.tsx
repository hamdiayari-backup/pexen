/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, History, ImagePlus, KeyRound, LogOut, MonitorSmartphone, RefreshCw, ShieldCheck, ShieldOff, Trash2, UserRound } from 'lucide-react';
import { AVATAR_ACCEPT, prepareAvatar } from '../lib/avatar';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PERMISSION_GROUPS } from '../../../server/cms/permissions';
import { PasswordChangeForm, PasswordInput, RecoveryCodes, TwoFactorSetup } from '../account/SecurityForms';
import { useAuth } from '../context/AuthContext';
import { useSiteData } from '../context/SiteContext';
import { api, type Permission, type SessionRow } from '../lib/api';
import { fmtDate, fmtDateTime } from '../lib/format';
import { errorMessage, useAsync } from '../lib/hooks';
import { Modal, useConfirm } from '../ui/overlays';
import { Alert, Badge, Button, Card, cx, Field, Input, PageHeader, Section, Spinner, Tabs } from '../ui/primitives';
import { ActivityFeed, Avatar, SessionList } from '../users/shared';
import { usePaging } from '../ui/Pagination';

type TabId = 'profile' | 'security' | 'sessions' | 'activity';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ProfileTab() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState({ name: user!.name, title: user!.title ?? '', phone: user!.phone ?? '', email: user!.email });
  const [currentPassword, setCurrentPassword] = useState('');
  const [saving, setSaving] = useState(false);
  if (!user) return null;
  const emailChanged = f.email.trim().toLowerCase() !== user.email;
  const dirty = emailChanged || f.name.trim() !== user.name || f.title.trim() !== (user.title ?? '') || f.phone.trim() !== (user.phone ?? '');
  const valid = !!f.name.trim() && EMAIL.test(f.email.trim()) && (!emailChanged || !!currentPassword);
  const granted = new Set<Permission>(user.permissions);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.updateMe({
        name: f.name,
        title: f.title,
        phone: f.phone,
        ...(emailChanged ? { email: f.email, currentPassword } : {}),
      });
      setUser(r.user);
      setF({ name: r.user.name, title: r.user.title ?? '', phone: r.user.phone ?? '', email: r.user.email });
      setCurrentPassword('');
      toast.success(emailChanged ? 'Profil mis à jour — une alerte a été envoyée à votre ancienne adresse' : 'Profil mis à jour');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Section title="Informations personnelles">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (dirty && valid) void save();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet">
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" />
            </Field>
            <Field label="Fonction">
              <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Responsable communication" />
            </Field>
          </div>
          <Field label="Téléphone">
            <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} autoComplete="tel" placeholder="+216 …" />
          </Field>
          <Field label="E-mail de connexion" error={f.email && !EMAIL.test(f.email.trim()) ? 'Adresse invalide' : undefined}>
            <Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" />
          </Field>
          {emailChanged ? (
            <Field label="Mot de passe actuel" hint="Requis pour changer l’adresse de connexion. Une alerte sera envoyée à l’ancienne adresse.">
              <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
          ) : null}
          <div className="flex gap-2">
            <Button type="submit" variant="primary" loading={saving} disabled={!dirty || !valid}>
              Enregistrer
            </Button>
            {dirty ? (
              <Button
                onClick={() => {
                  setF({ name: user.name, title: user.title ?? '', phone: user.phone ?? '', email: user.email });
                  setCurrentPassword('');
                }}
              >
                Annuler
              </Button>
            ) : null}
          </div>
        </form>
      </Section>

      <Section title="Votre rôle et vos droits" description="Attribués par un administrateur.">
        <div className="flex items-center gap-2">
          <Badge tone="brand">{user.roleName}</Badge>
          {user.isSuper ? <span className="text-xs text-slate-500">Tous les droits, y compris la gestion des rôles.</span> : null}
        </div>
        <div className="space-y-3">
          {PERMISSION_GROUPS.map((g) => {
            const items = g.permissions.filter((p) => granted.has(p.key as Permission));
            if (!items.length) return null;
            return (
              <div key={g.id}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.label}</p>
                <ul className="mt-1 space-y-0.5">
                  {items.map((p) => (
                    <li key={p.key} className="flex items-center gap-2 text-[13px] text-slate-700">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      {p.label}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {granted.size === 0 ? <p className="text-sm text-slate-500">Aucun droit particulier : accès au tableau de bord et à votre profil.</p> : null}
        </div>
      </Section>
    </div>
  );
}

function PasswordPrompt({
  open,
  title,
  description,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    setPassword('');
    setError('');
  }, [open]);
  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm(password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button onClick={onClose}>Annuler</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={busy} disabled={!password} onClick={() => void submit()}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (password) void submit();
        }}
      >
        <p className="text-sm text-slate-600">{description}</p>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <Field label="Mot de passe actuel">
          <PasswordInput autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </Field>
      </form>
    </Modal>
  );
}

function SecurityTab() {
  const { user, setUser } = useAuth();
  const site = useSiteData();
  const [prompt, setPrompt] = useState<'disable' | 'codes' | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  if (!user) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Section title="Mot de passe" description={user.passwordChangedAt ? `Dernière modification le ${fmtDate(user.passwordChangedAt)}.` : undefined}>
        <PasswordChangeForm />
      </Section>

      <Section
        title="Double authentification"
        description="Un code à 6 chiffres généré par votre téléphone est demandé à chaque connexion."
        actions={user.totpEnabled ? <Badge tone="success" dot>Activée</Badge> : <Badge tone="warning" dot>Désactivée</Badge>}
      >
        {codes ? (
          <div className="space-y-3">
            <RecoveryCodes codes={codes} siteName={site.branding.siteName} />
            <Button variant="primary" icon={Check} onClick={() => setCodes(null)}>
              J’ai conservé mes codes
            </Button>
          </div>
        ) : user.totpEnabled ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">Votre compte est protégé.</p>
                <p className="mt-0.5 text-emerald-700">
                  {user.recoveryCodesLeft} code(s) de secours restant(s).
                  {user.recoveryCodesLeft <= 3 ? ' Pensez à en générer de nouveaux.' : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button icon={RefreshCw} onClick={() => setPrompt('codes')}>
                Nouveaux codes de secours
              </Button>
              <Button variant="ghost" icon={ShieldOff} className="text-rose-600 hover:bg-rose-50" disabled={user.twoFactorRequired} onClick={() => setPrompt('disable')}>
                Désactiver
              </Button>
            </div>
            {user.twoFactorRequired ? <p className="text-xs text-slate-500">Obligatoire pour votre compte selon la politique de sécurité : elle ne peut pas être désactivée.</p> : null}
          </div>
        ) : (
          <TwoFactorSetup siteName={site.branding.siteName} />
        )}
      </Section>

      <PasswordPrompt
        open={prompt === 'disable'}
        title="Désactiver la double authentification ?"
        description="Votre compte ne sera plus protégé que par votre mot de passe. Vos codes de secours seront supprimés."
        confirmLabel="Désactiver"
        danger
        onClose={() => setPrompt(null)}
        onConfirm={async (password) => {
          const r = await api.twoFactor.disable(password);
          setUser(r.user);
          setPrompt(null);
          toast.success('Double authentification désactivée');
        }}
      />
      <PasswordPrompt
        open={prompt === 'codes'}
        title="Générer de nouveaux codes de secours ?"
        description="Les codes actuels cesseront immédiatement de fonctionner."
        confirmLabel="Générer"
        onClose={() => setPrompt(null)}
        onConfirm={async (password) => {
          const r = await api.twoFactor.recoveryCodes(password);
          setUser(r.user);
          setCodes(r.recoveryCodes);
          setPrompt(null);
        }}
      />
    </div>
  );
}

function SessionsTab() {
  const confirm = useConfirm();
  const { logout } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const load = () => api.mySessions().then(setSessions, (e) => toast.error(errorMessage(e)));
  useEffect(() => {
    void load();
  }, []);
  const others = (sessions ?? []).filter((s) => !s.current).length;

  return (
    <Section
      title="Sessions ouvertes"
      description="Appareils actuellement connectés à votre compte. Fermez celles que vous ne reconnaissez pas, puis changez votre mot de passe."
      actions={
        <div className="flex gap-2">
          {others > 0 ? (
            <Button
              size="sm"
              icon={LogOut}
              onClick={async () => {
                if (!(await confirm({ title: 'Fermer les autres sessions ?', message: `${others} appareil(s) seront déconnectés.`, confirmLabel: 'Fermer' }))) return;
                try {
                  const r = await api.revokeOtherSessions();
                  toast.success(`${r.closed} session(s) fermée(s)`);
                  void load();
                } catch (e) {
                  toast.error(errorMessage(e));
                }
              }}
            >
              Fermer les autres
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" icon={LogOut} onClick={() => void logout()}>
            Me déconnecter
          </Button>
        </div>
      }
    >
      <SessionList
        sessions={sessions}
        revoking={revoking}
        onRevoke={async (s) => {
          setRevoking(s.id);
          try {
            await api.revokeMySession(s.id);
            setSessions((list) => list?.filter((x) => x.id !== s.id) ?? null);
            toast.success('Session fermée');
          } catch (e) {
            toast.error(errorMessage(e));
          } finally {
            setRevoking(null);
          }
        }}
      />
    </Section>
  );
}

function ActivityTab() {
  const { page, setPage, pageSize, setPageSize } = usePaging('activity');
  const { data } = useAsync(() => api.myActivity(page, pageSize), [page, pageSize]);
  return (
    <Section title="Mon activité" description="Connexions et actions effectuées avec votre compte. Signalez toute activité que vous ne reconnaissez pas.">
      <ActivityFeed data={data} page={page} onPage={setPage} onPageSize={setPageSize} />
    </Section>
  );
}

/** Photo de profil : clic sur l'avatar ou dépôt d'une image ; recadrage carré fait dans le navigateur. */
function AvatarEditor() {
  const { user, setUser } = useAuth();
  const confirm = useConfirm();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  if (!user) return null;

  const upload = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const image = await prepareAvatar(file);
      setPreview(image.preview);
      const r = await api.uploadAvatar({ dataBase64: image.dataBase64, mimeType: image.mimeType });
      setUser(r.user);
      toast.success('Photo de profil mise à jour');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setPreview(null);
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    if (!(await confirm({ title: 'Supprimer la photo ?', message: 'Vos initiales seront affichées à la place.', confirmLabel: 'Supprimer', danger: true }))) return;
    setBusy(true);
    try {
      setUser((await api.removeAvatar()).user);
      toast.success('Photo supprimée');
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void upload(e.dataTransfer.files[0]);
        }}
        disabled={busy}
        className={cx('group relative shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2', dragging && 'ring-2 ring-brand-500 ring-offset-2')}
        aria-label="Changer la photo de profil"
        title="Changer la photo (JPG, PNG ou WebP)"
      >
        <Avatar name={user.name} email={user.email} src={preview ?? user.avatarUrl} size="xl" />
        <span className={cx('absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/45 text-white transition', busy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100')}>
          {busy ? <Spinner className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm">
          <Camera className="h-3.5 w-3.5" />
        </span>
      </button>
      <input ref={input} type="file" accept={AVATAR_ACCEPT} className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
        <p className="truncate text-sm text-slate-500">
          {user.email}
          {user.title ? ` · ${user.title}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" icon={ImagePlus} onClick={() => input.current?.click()} disabled={busy}>
            {user.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
          </Button>
          {user.avatarUrl ? (
            <Button size="sm" variant="ghost" icon={Trash2} onClick={remove} disabled={busy}>
              Supprimer
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab') as TabId | null;
  const tab: TabId = requested && ['profile', 'security', 'sessions', 'activity'].includes(requested) ? requested : 'profile';
  if (!user) return null;

  return (
    <div>
      <PageHeader title="Mon profil" description="Vos informations, la sécurité de votre compte et vos sessions." />
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <AvatarEditor />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{user.roleName}</Badge>
            {user.totpEnabled ? (
              <Badge tone="success">
                <ShieldCheck className="h-3 w-3" /> 2FA
              </Badge>
            ) : null}
            {user.lastLoginAt ? <span className="text-xs text-slate-500">Dernière connexion : {fmtDateTime(user.lastLoginAt)}</span> : null}
          </div>
        </div>
      </Card>
      <Tabs<TabId>
        value={tab}
        onChange={(t) => setParams(t === 'profile' ? {} : { tab: t }, { replace: true })}
        tabs={[
          { value: 'profile', label: 'Profil', icon: UserRound },
          { value: 'security', label: 'Mot de passe et 2FA', icon: KeyRound, badge: !user.totpEnabled ? <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> : undefined },
          { value: 'sessions', label: 'Sessions', icon: MonitorSmartphone },
          { value: 'activity', label: 'Activité', icon: History },
        ]}
      />
      {tab === 'profile' ? <ProfileTab key={user.id} /> : null}
      {tab === 'security' ? <SecurityTab /> : null}
      {tab === 'sessions' ? <SessionsTab /> : null}
      {tab === 'activity' ? <ActivityTab /> : null}
    </div>
  );
}
