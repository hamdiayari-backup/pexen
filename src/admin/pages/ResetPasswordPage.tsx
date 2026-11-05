/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Lien reçu par e-mail : activation d'un compte invité ou réinitialisation du mot de passe. */
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, LinkIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { errorMessage, useAsync } from '../lib/hooks';
import { fmtDateTime } from '../lib/format';
import { Alert, Button, Field, Input, Spinner } from '../ui/primitives';
import { AuthLayout } from '../account/AuthLayout';
import { PasswordChecklist, PasswordInput, policyChecks } from '../account/SecurityForms';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { data, error, loading } = useAsync(() => (token ? api.passwordToken(token) : Promise.reject(new Error('Lien incomplet'))), [token]);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const invite = data?.kind === 'invite';
  const valid = data ? policyChecks(password, data.policy).every((c) => c.ok) : false;
  const mismatch = !!confirm && confirm !== password;

  return (
    <AuthLayout>
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : error || !data ? (
        <div>
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <LinkIcon className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Lien invalide</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien depuis l’écran de connexion (« Mot de passe oublié ? ») ou auprès d’un administrateur.
          </p>
          <Link to="/login" className="mt-8 inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" /> Aller à la connexion
          </Link>
        </div>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitError('');
            if (password !== confirm) return setSubmitError('Les deux mots de passe ne correspondent pas.');
            setSaving(true);
            try {
              const r = await api.resetPassword(token, password, invite ? name.trim() || undefined : undefined);
              if (user) await logout();
              navigate('/login', {
                replace: true,
                state: { email: r.email, notice: invite ? 'Votre compte est activé : connectez-vous.' : 'Mot de passe modifié : connectez-vous avec le nouveau.' },
              });
            } catch (err) {
              setSubmitError(errorMessage(err));
            } finally {
              setSaving(false);
            }
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{invite ? 'Activez votre compte' : 'Nouveau mot de passe'}</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {invite ? (
              <>
                Bienvenue ! Choisissez le mot de passe du compte <strong className="text-slate-700">{data.email}</strong>.
              </>
            ) : (
              <>
                Compte <strong className="text-slate-700">{data.email}</strong>. Lien valable jusqu’au {fmtDateTime(data.expiresAt)}.
              </>
            )}
          </p>
          <div className="mt-8 space-y-5">
            {submitError ? <Alert tone="danger">{submitError}</Alert> : null}
            {invite ? (
              <Field label="Votre nom" hint="Tel qu’il apparaîtra dans l’administration.">
                <Input value={name} placeholder={data.name} onChange={(e) => setName(e.target.value)} className="h-10" />
              </Field>
            ) : null}
            <input type="email" autoComplete="username" value={data.email} readOnly hidden />
            <Field label="Mot de passe">
              <PasswordInput autoFocus autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
            </Field>
            <PasswordChecklist password={password} policy={data.policy} />
            <Field label="Confirmer le mot de passe" error={mismatch ? 'Les mots de passe ne correspondent pas' : undefined}>
              <PasswordInput autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-10" invalid={mismatch} />
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={saving} disabled={!valid || !confirm || mismatch} className="w-full justify-center">
              {invite ? 'Activer mon compte' : 'Enregistrer le mot de passe'}
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
