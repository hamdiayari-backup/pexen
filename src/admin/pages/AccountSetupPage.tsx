/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Écran obligatoire avant l'accès à l'administration : changement de mot de passe et/ou activation de la 2FA. */
import React from 'react';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button, Card } from '../ui/primitives';
import { PasswordChangeForm, TwoFactorSetup } from '../account/SecurityForms';
import { PexenMark } from '../../components/PexenLogo';

export default function AccountSetupPage() {
  const { user, logout } = useAuth();
  if (!user) return null;
  const passwordStep = user.mustChangePassword;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
              <PexenMark className="h-7 w-7" accent="#FFFFFF" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" icon={LogOut} onClick={() => void logout()}>
            Se déconnecter
          </Button>
        </div>

        <Card className="p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              {passwordStep ? <KeyRound className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
            </span>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{passwordStep ? 'Choisissez un nouveau mot de passe' : 'Activez la double authentification'}</h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">
                {passwordStep
                  ? user.passwordChangedAt
                    ? 'Votre mot de passe doit être renouvelé (politique de sécurité ou demande d’un administrateur).'
                    : 'Votre compte a été créé avec un mot de passe provisoire : remplacez-le pour continuer.'
                  : 'La politique de sécurité du site impose la double authentification pour votre compte.'}
              </p>
            </div>
          </div>
          {passwordStep ? <PasswordChangeForm submitLabel="Enregistrer et continuer" /> : <TwoFactorSetup />}
        </Card>
        {passwordStep && user.mustSetup2fa ? (
          <p className="mt-4 text-center text-xs text-slate-500">Étape suivante : activation de la double authentification.</p>
        ) : null}
      </div>
    </div>
  );
}
