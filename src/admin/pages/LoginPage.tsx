/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, MailCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { errorMessage } from '../lib/hooks';
import { Alert, Button, Field, Input } from '../ui/primitives';
import { AuthLayout } from '../account/AuthLayout';
import { PasswordInput } from '../account/SecurityForms';

type Step = 'credentials' | 'twoFactor' | 'forgot' | 'forgotSent';

export default function LoginPage() {
  const { login, verify2fa, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: string; email?: string; notice?: string } | null;
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState<{ email: string; password: string } | null>(null);
  const from = state?.from && state.from !== '/login' ? state.from : '/';

  useEffect(() => {
    fetch('/api/platform/landing')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email?: string; password?: string } | null) => {
        if (d?.email && d?.password) {
          setDemo({ email: d.email, password: d.password });
          if (!state?.email) setEmail(d.email);
          setPassword(d.password);
        }
      })
      .catch(() => undefined);
  }, [state?.email]);

  if (user) return <Navigate to={from} replace />;

  const run = async (fn: () => Promise<void>) => {
    setError('');
    setLoading(true);
    try {
      await fn();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    setStep('credentials');
    setError('');
    setCode('');
    setPassword('');
  };

  return (
    <AuthLayout>
      {step === 'credentials' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const r = await login(email.trim(), password, remember);
              if (r.twoFactor) {
                setChallenge(r.challenge);
                setStep('twoFactor');
              } else navigate(from, { replace: true });
            });
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Connexion</h2>
          <p className="mt-1.5 text-sm text-slate-500">Accédez à l’administration du site.</p>
          {demo && (
            <div className="mt-4 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm text-teal-950">
              <strong className="block">Démo Pexen — identifiants prêts</strong>
              <span className="font-mono text-xs">
                {demo.email} · {demo.password}
              </span>
              <p className="mt-1 text-xs text-teal-800/80">Base CMS restaurée toutes les 24 h.</p>
            </div>
          )}
          <div className="mt-8 space-y-5">
            {state?.notice && !error ? <Alert tone="success">{state.notice}</Alert> : null}
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Field label="Adresse e-mail" htmlFor="email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input id="email" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 pl-9" placeholder="vous@pexen.fr" />
              </div>
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 z-10 h-4 w-4 text-slate-400" />
                <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 pl-9" />
              </div>
            </Field>
            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-brand-600" />
                Rester connecté
              </label>
              <button
                type="button"
                className="text-sm font-medium text-brand-700 hover:underline"
                onClick={() => {
                  setError('');
                  setStep('forgot');
                }}
              >
                Mot de passe oublié ?
              </button>
            </div>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full justify-center">
              Se connecter
            </Button>
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">Accès réservé aux personnes autorisées. Les connexions sont journalisées.</p>
        </form>
      ) : null}

      {step === 'twoFactor' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await verify2fa(challenge, code.trim());
              navigate(from, { replace: true });
            });
          }}
        >
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Vérification en deux étapes</h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {useRecovery ? 'Saisissez l’un de vos codes de secours (format xxxxx-xxxxx).' : 'Saisissez le code à 6 chiffres affiché par votre application d’authentification.'}
          </p>
          <div className="mt-8 space-y-5">
            {error ? (
              <Alert tone="danger">
                {error}
                {/expir/i.test(error) ? (
                  <button type="button" className="ml-1 font-medium underline" onClick={back}>
                    Recommencer
                  </button>
                ) : null}
              </Alert>
            ) : null}
            <Input
              autoFocus
              key={String(useRecovery)}
              inputMode={useRecovery ? 'text' : 'numeric'}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(useRecovery ? e.target.value : e.target.value.replace(/[^\d ]/g, ''))}
              maxLength={useRecovery ? 14 : 7}
              className="h-12 text-center font-mono text-xl tracking-[0.3em]"
              placeholder={useRecovery ? 'xxxxx-xxxxx' : '000000'}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={useRecovery ? code.trim().length < 10 : code.replace(/\s/g, '').length !== 6}
              className="w-full justify-center"
            >
              Valider
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={back} className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800">
                <ArrowLeft className="h-3.5 w-3.5" /> Retour
              </button>
              <button
                type="button"
                className="font-medium text-brand-700 hover:underline"
                onClick={() => {
                  setUseRecovery((v) => !v);
                  setCode('');
                  setError('');
                }}
              >
                {useRecovery ? 'Utiliser l’application' : 'Utiliser un code de secours'}
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {step === 'forgot' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              await api.forgotPassword(email.trim());
              setStep('forgotSent');
            });
          }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Mot de passe oublié</h2>
          <p className="mt-1.5 text-sm text-slate-500">Indiquez l’adresse de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
          <div className="mt-8 space-y-5">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Field label="Adresse e-mail" htmlFor="forgot-email">
              <Input id="forgot-email" type="email" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full justify-center">
              Envoyer le lien
            </Button>
            <button type="button" onClick={back} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
            </button>
          </div>
        </form>
      ) : null}

      {step === 'forgotSent' ? (
        <div>
          <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <MailCheck className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Vérifiez votre boîte mail</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Si un compte actif correspond à <strong className="text-slate-700">{email}</strong>, un lien de réinitialisation valable 1 heure vient d’être envoyé. Pensez à
            regarder dans les courriers indésirables.
          </p>
          <p className="mt-4 text-sm text-slate-500">Pas d’e-mail ? Un administrateur peut aussi vous générer un lien depuis la page Utilisateurs.</p>
          <Button className="mt-8" icon={ArrowLeft} onClick={back}>
            Retour à la connexion
          </Button>
        </div>
      ) : null}
    </AuthLayout>
  );
}
