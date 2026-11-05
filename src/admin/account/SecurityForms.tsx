/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Check, Copy, Download, Eye, EyeOff, KeyRound, ShieldCheck, Smartphone, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, type MeUser, type PasswordPolicy } from '../lib/api';
import { errorMessage } from '../lib/hooks';
import { Alert, Button, cx, Field, Input } from '../ui/primitives';

export const PasswordInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function PasswordInput(props, ref) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input ref={ref} {...props} type={show ? 'text' : 'password'} className={cx('pr-10', props.className)} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700"
        aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
});

export function policyChecks(password: string, policy: PasswordPolicy) {
  return [
    { ok: password.length >= policy.passwordMinLength, label: `${policy.passwordMinLength} caractères minimum` },
    { ok: /[a-zA-Z]/.test(password), label: 'Au moins une lettre' },
    ...(policy.requireUppercase ? [{ ok: /[A-Z]/.test(password) && /[a-z]/.test(password), label: 'Majuscules et minuscules' }] : []),
    ...(policy.requireNumber ? [{ ok: /\d/.test(password), label: 'Au moins un chiffre' }] : []),
    ...(policy.requireSymbol ? [{ ok: /[^a-zA-Z0-9]/.test(password), label: 'Au moins un caractère spécial' }] : []),
  ];
}

export function PasswordChecklist({ password, policy }: { password: string; policy: PasswordPolicy }) {
  const checks = policyChecks(password, policy);
  const score = checks.filter((c) => c.ok).length / checks.length;
  return (
    <div className="space-y-2">
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cx('h-full rounded-full transition-all', score === 1 ? 'bg-emerald-500' : score >= 0.5 ? 'bg-amber-400' : 'bg-rose-400')}
          style={{ width: `${Math.max(password ? 8 : 0, score * 100)}%` }}
        />
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {checks.map((c) => (
          <li key={c.label} className={cx('flex items-center gap-1.5', c.ok ? 'text-emerald-700' : 'text-slate-500')}>
            {c.ok ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5 text-slate-300" />}
            {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PasswordChangeForm({ onDone, submitLabel = 'Mettre à jour le mot de passe' }: { onDone?: () => void; submitLabel?: string }) {
  const { user, setSession } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  if (!user) return null;
  const valid = policyChecks(next, user.policy).every((c) => c.ok);
  const mismatch = !!confirm && next !== confirm;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setError('');
        if (next !== confirm) return setError('Les deux mots de passe ne correspondent pas.');
        setSaving(true);
        try {
          const r = await api.changePassword(current, next);
          setSession(r.token, r.user);
          toast.success(r.closedSessions ? `Mot de passe mis à jour — ${r.closedSessions} autre(s) session(s) fermée(s)` : 'Mot de passe mis à jour');
          setCurrent('');
          setNext('');
          setConfirm('');
          onDone?.();
        } catch (err) {
          setError(errorMessage(err));
        } finally {
          setSaving(false);
        }
      }}
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="Mot de passe actuel">
        <PasswordInput autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="Nouveau mot de passe">
        <PasswordInput autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      {next ? <PasswordChecklist password={next} policy={user.policy} /> : null}
      <Field label="Confirmer le nouveau mot de passe" error={mismatch ? 'Les mots de passe ne correspondent pas' : undefined}>
        <PasswordInput autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} invalid={mismatch} />
      </Field>
      <p className="text-xs text-slate-500">Vos autres sessions ouvertes seront fermées par sécurité.</p>
      <Button type="submit" variant="primary" icon={KeyRound} loading={saving} disabled={!current || !valid || !confirm || mismatch}>
        {submitLabel}
      </Button>
    </form>
  );
}

export function RecoveryCodes({ codes, siteName }: { codes: string[]; siteName?: string }) {
  const text = `Codes de secours — ${siteName || 'Pexen'}\nChaque code ne fonctionne qu’une fois.\n\n${codes.join('\n')}\n`;
  return (
    <div className="space-y-3">
      <Alert tone="warning" title="Conservez ces codes en lieu sûr">
        Ils permettent de vous connecter si vous perdez votre téléphone. Chaque code ne sert qu’une fois et ils ne seront plus affichés.
      </Alert>
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-sm text-slate-800">
        {codes.map((c) => (
          <span key={c} className="tracking-wider">
            {c}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          icon={Copy}
          onClick={() => {
            void navigator.clipboard.writeText(codes.join('\n'));
            toast.success('Codes copiés');
          }}
        >
          Copier
        </Button>
        <Button
          size="sm"
          icon={Download}
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'codes-de-secours-pexen.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Télécharger
        </Button>
      </div>
    </div>
  );
}

/** Assistant d'activation : QR code → vérification d'un code → codes de secours. */
export function TwoFactorSetup({ onDone, siteName }: { onDone?: () => void; siteName?: string }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState<'intro' | 'scan' | 'codes'>('intro');
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  // Appliqué seulement après lecture des codes : sinon l'écran obligatoire disparaîtrait avant leur affichage.
  const [pendingUser, setPendingUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const start = async () => {
    setLoading(true);
    setError('');
    try {
      setSetup(await api.twoFactor.setup());
      setStep('scan');
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  if (step === 'intro') {
    return (
      <div className="space-y-4">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex items-start gap-3 text-sm text-slate-600">
          <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
          <p>
            Installez une application d’authentification (Google Authenticator, Microsoft Authenticator, Authy, 1Password…) sur votre téléphone. À chaque connexion,
            elle vous donnera un code à 6 chiffres en plus de votre mot de passe.
          </p>
        </div>
        <Button variant="primary" icon={ShieldCheck} loading={loading} onClick={start}>
          Configurer la double authentification
        </Button>
      </div>
    );
  }

  if (step === 'scan' && setup) {
    return (
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setError('');
          try {
            const r = await api.twoFactor.enable(code);
            setCodes(r.recoveryCodes);
            setPendingUser(r.user);
            setStep('codes');
            toast.success('Double authentification activée');
          } catch (err) {
            setError(errorMessage(err));
          } finally {
            setLoading(false);
          }
        }}
      >
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <img src={setup.qrDataUrl} alt="QR code à scanner" className="h-44 w-44 shrink-0 rounded-xl border border-slate-200 bg-white p-2" />
          <div className="min-w-0 space-y-3 text-sm text-slate-600">
            <p>1. Scannez ce QR code avec votre application.</p>
            <p>
              Impossible de scanner ? Saisissez cette clé manuellement :
              <code className="mt-1 block break-all rounded-lg bg-slate-100 px-2.5 py-1.5 font-mono text-xs tracking-wider text-slate-800">
                {setup.secret.replace(/(.{4})/g, '$1 ').trim()}
              </code>
            </p>
            <p>2. Saisissez le code à 6 chiffres affiché :</p>
            <Input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={7}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
              className="h-11 max-w-[180px] text-center font-mono text-lg tracking-[0.3em]"
              placeholder="000000"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" variant="primary" loading={loading} disabled={code.replace(/\s/g, '').length !== 6}>
            Vérifier et activer
          </Button>
          <Button onClick={() => setStep('intro')}>Annuler</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      <RecoveryCodes codes={codes} siteName={siteName} />
      <Button
        variant="primary"
        icon={Check}
        onClick={() => {
          if (pendingUser) setUser(pendingUser);
          onDone?.();
        }}
      >
        J’ai conservé mes codes
      </Button>
    </div>
  );
}
