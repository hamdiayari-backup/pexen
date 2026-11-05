/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React from 'react';
import { BarChart3, FileText, Search, ShieldCheck } from 'lucide-react';
import { PexenMark } from '../../components/PexenLogo';

/** Mise en page des écrans hors session : connexion, réinitialisation, activation de compte. */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.1fr_1fr]">
      <div className="relative hidden overflow-hidden bg-navy-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full bg-brand-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <PexenMark className="h-7 w-7" accent="#FFFFFF" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Pexen</span>
        </div>
        <div className="relative mt-auto max-w-md">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">Pilotez votre site, votre contenu et votre visibilité depuis un seul espace.</h1>
          <ul className="mt-10 space-y-5 text-sm text-slate-300">
            {[
              { icon: FileText, t: 'Éditeur visuel de pages et d’articles' },
              { icon: Search, t: 'Référencement avancé et Google Search Console' },
              { icon: BarChart3, t: 'Statistiques de visite détaillées par pays' },
              { icon: ShieldCheck, t: 'Rôles, double authentification et journal d’activité' },
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
        <p className="relative mt-16 text-xs text-slate-500">© {new Date().getFullYear()} Pexen — Espace d’administration</p>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600">
              <PexenMark className="h-8 w-8" accent="#FFFFFF" />
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
