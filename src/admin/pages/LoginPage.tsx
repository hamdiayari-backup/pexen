import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, Eye, EyeOff, FileText, Lock, Mail, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../lib/hooks';
import { Alert, Button, Field, Input } from '../ui/primitives';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const from = (location.state as { from?: string } | null)?.from || '/';

  if (user) return <Navigate to={from} replace />;

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 font-bold">P</div>
          <span className="text-lg font-semibold tracking-tight">PEXEN</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">Pilotez votre site, votre contenu et votre visibilité depuis un seul espace.</h1>
          <ul className="mt-10 space-y-5 text-sm text-slate-300">
            {[
              { icon: FileText, t: 'Éditeur visuel de pages et d’articles' },
              { icon: Search, t: 'Référencement avancé et Google Search Console' },
              { icon: BarChart3, t: 'Statistiques de visite détaillées par pays' },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                  <Icon className="h-4 w-4 text-brand-400" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative mt-16 text-xs text-slate-500">© {new Date().getFullYear()} PEXEN — Espace d’administration</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <form
          className="w-full max-w-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setError('');
            setLoading(true);
            try {
              await login(email.trim(), password);
              navigate(from, { replace: true });
            } catch (err) {
              setError(errorMessage(err));
            } finally {
              setLoading(false);
            }
          }}
        >
          <div className="mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">P</div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Connexion</h2>
          <p className="mt-1.5 text-sm text-slate-500">Accédez à l’administration du site.</p>

          <div className="mt-8 space-y-5">
            {error ? <Alert tone="danger">{error}</Alert> : null}
            <Field label="Adresse e-mail" htmlFor="email">
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input id="email" type="email" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 pl-9" placeholder="vous@pexen.fr" />
              </div>
            </Field>
            <Field label="Mot de passe" htmlFor="password">
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 pl-9 pr-10"
                />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label={show ? 'Masquer' : 'Afficher'}>
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full justify-center">
              Se connecter
            </Button>
          </div>
          <p className="mt-8 text-center text-xs text-slate-400">Accès réservé aux personnes autorisées.</p>
        </form>
      </div>
    </div>
  );
}
