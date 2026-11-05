import React from 'react';
import { Phone, ArrowUpRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { EXPERTISES, SECTEURS } from '../data/pexenData';
import { usePexenInfo, useSiteConfig } from '../context/SiteConfigContext';

interface FooterProps {
  onNavigate: (path: string) => void;
  onOpenCookies: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenCookies }) => {
  const PEXEN_INFO = usePexenInfo();
  const siteConfig = useSiteConfig();
  const [newsEmail, setNewsEmail] = React.useState('');
  const [newsMsg, setNewsMsg] = React.useState('');

  const navigateTo = (path: string) => {
    if (/^(https?:|mailto:|tel:)/.test(path)) {
      window.open(path, '_blank', 'noopener,noreferrer');
      return;
    }
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const primary = siteConfig?.menus.find((m) => m.id === 'primary')?.items;
  const childrenOf = (base: string, fallback: { label: string; path: string }[]) =>
    primary?.find((i) => i.path === base)?.children?.map((c) => ({ label: c.label, path: c.path })) ?? fallback;
  const expertiseLinks = childrenOf('/expertises/', EXPERTISES.map((e) => ({ label: e.title, path: `/expertises/${e.slug}/` })));
  const secteurLinks = childrenOf('/secteurs/', SECTEURS.map((e) => ({ label: e.title, path: `/secteurs/${e.slug}/` })));
  const LEGAL = ['/mentions-legales/', '/politique-de-confidentialite/', '/cookies/'];
  const footerMenu = siteConfig?.menus.find((m) => m.id === 'footer')?.items;
  const companyLinks = footerMenu
    ? footerMenu.filter((i) => !LEGAL.includes(i.path)).map((i) => ({ label: i.label, path: i.path, highlight: !!i.highlight }))
    : [
        { label: 'Réalisations & Chantiers', path: '/realisations/', highlight: false },
        { label: 'Notre approche (4 étapes)', path: '/notre-approche/', highlight: false },
        { label: 'Parler de votre projet', path: '/contact/', highlight: true },
      ];
  const legalLinks = footerMenu
    ? footerMenu.filter((i) => LEGAL.includes(i.path)).map((i) => ({ label: i.label, path: i.path }))
    : [
        { label: 'Mentions légales', path: '/mentions-legales/' },
        { label: 'Politique de confidentialité', path: '/politique-de-confidentialite/' },
        { label: 'Cookies', path: '/cookies/' },
      ];

  return (
    <footer className="bg-px-navy text-white pt-16 pb-24 lg:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main 4 columns grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-12 border-b border-slate-800/80">
          {/* Col 1: PEXEN Corporate */}
          <div className="lg:col-span-4 space-y-4">
            <div
              onClick={() => navigateTo('/')}
              className="flex items-center gap-3 cursor-pointer group inline-flex"
            >
              <img src={siteConfig?.branding.logoDarkUrl || '/brand/logo-principal-blanc.svg'} alt={PEXEN_INFO.name} className="h-14 w-auto max-w-[220px] object-contain" />
            </div>

            <div className="text-xs font-medium text-px-primary-light tracking-wide">
              {PEXEN_INFO.slogan}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Des économies calculées, réalisées, démontrées. Conseil, ingénierie et suivi opérationnel pour l'industrie, le tertiaire et le résidentiel collectif, partout en France.
            </p>

            <div className="pt-2">
              <a
                href={`tel:${PEXEN_INFO.phoneClean}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-px-primary-light transition-colors py-2 px-3 rounded-lg bg-slate-900/60 border border-slate-700/60"
              >
                <Phone className="w-4 h-4 text-px-primary" />
                <span className="px-phone">{PEXEN_INFO.phone}</span>
              </a>
            </div>
          </div>

          {/* Col 2: Expertises */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Expertises
            </div>
            <ul className="space-y-2 text-xs">
              {expertiseLinks.map((exp) => (
                <li key={exp.path}>
                  <button
                    onClick={() => navigateTo(exp.path)}
                    className="text-slate-400 hover:text-white transition-colors text-left flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{exp.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Secteurs */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Secteurs
            </div>
            <ul className="space-y-2 text-xs">
              {secteurLinks.map((sec) => (
                <li key={sec.path}>
                  <button
                    onClick={() => navigateTo(sec.path)}
                    className="text-slate-400 hover:text-white transition-colors text-left flex items-center gap-1 group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform">{sec.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: PEXEN */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Entreprise
            </div>
            <ul className="space-y-2 text-xs">
              {companyLinks.map((l) => (
                <li key={l.path}>
                  <button
                    onClick={() => navigateTo(l.path)}
                    className={l.highlight ? 'text-px-primary-light hover:underline transition-colors flex items-center gap-1 font-semibold' : 'text-slate-400 hover:text-white transition-colors text-left'}
                  >
                    <span>{l.label}</span>
                    {l.highlight ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
                  </button>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              <div className="font-semibold text-slate-300 mb-1">Bureau d'études partenaire</div>
              <div>Leo Energy · OPQIBI 1717 & 1905</div>
              <div className="mt-1">MIC Insurance · RC Pro & Décennale</div>
            </div>
          </div>
        </div>

        {siteConfig?.newsletterEnabled ? (
        <div className="py-8 border-b border-slate-800/80">
          <div className="max-w-md">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">Newsletter</p>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                setNewsMsg('');
                const r = await fetch('/api/public/newsletter/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: newsEmail }),
                });
                const j = await r.json().catch(() => ({}));
                if (r.ok) {
                  setNewsMsg(j.pending ? 'Vérifiez votre boîte mail pour confirmer.' : 'Inscription enregistrée.');
                  setNewsEmail('');
                } else setNewsMsg(j.error || 'Erreur');
              }}
            >
              <input
                type="email"
                required
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder="E-mail professionnel"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white"
              />
              <button type="submit" className="rounded-lg bg-px-primary px-4 py-2 text-xs font-semibold text-px-navy">
                S'inscrire
              </button>
            </form>
            {newsMsg ? <p className="mt-2 text-[11px] text-px-primary-light">{newsMsg}</p> : null}
          </div>
        </div>
        ) : null}

        {/* Bottom Bar with Qualifications & Legals */}
        <div className="pt-8 flex flex-col lg:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          {/* Left: 3 Qualifications PEXEN */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center lg:justify-start">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-px-primary" />
              <span>RGE Ventilation+</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-px-primary" />
              <span>RGE Qualisol CESI</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-slate-300">
              <CheckCircle className="w-3.5 h-3.5 text-px-primary" />
              <span>SOCOTEC Fluides Frigorigènes Cat. I</span>
            </div>
          </div>

          {/* Right: Legal links + cookie reopen */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px]">
            <span>© {new Date().getFullYear()} {PEXEN_INFO.name}</span>
            {legalLinks.map((l) => (
              <React.Fragment key={l.path}>
                <span aria-hidden="true">·</span>
                <button onClick={() => navigateTo(l.path)} className="hover:text-white transition-colors underline-offset-2 hover:underline">
                  {l.label}
                </button>
              </React.Fragment>
            ))}
            <span aria-hidden="true">·</span>
            <button
              onClick={onOpenCookies}
              className="hover:text-px-primary-light transition-colors underline-offset-2 underline font-medium"
            >
              Gérer mes cookies
            </button>
            <span aria-hidden="true">·</span>
            <span className="text-white/40" title="Visuels techniques fournis pour le site PEXEN">
              Crédits photos : PEXEN
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
