import React from 'react';
import { usePexenInfo, useSiteConfig } from '../../context/SiteConfigContext';
import type { ThemeDefinition } from '../types';
import { MaquetteHeader } from './MaquetteHeader';
import { useMaquetteEffects } from './useMaquetteEffects';
import './maquette.css';

const FALLBACK_NOTES = [
  '* Volume d’économies d’énergie estimé selon les fiches d’opérations standardisées mobilisées : le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements. Il ne constitue pas une mesure des consommations réelles.',
  '* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique (10 ans), à conditions d’exploitation comparables.',
];

const FALLBACK_EXPERTISES = [
  { label: 'Études et ingénierie', path: '/etudes-ingenierie-energetique/' },
  { label: 'Accompagnement travaux', path: '/accompagnement-travaux/' },
  { label: 'CPE', path: '/contrat-de-performance-energetique/' },
  { label: 'Réglementation et financement', path: '/decret-tertiaire-decret-bacs/' },
];

const FALLBACK_SOLUTIONS = [
  { label: 'Froid commercial et industriel', path: '/solutions/froid-commercial-industriel/' },
  { label: 'Récupération de chaleur', path: '/solutions/recuperation-de-chaleur/' },
  { label: 'Chauffage et traitement d’air', path: '/solutions/pompe-a-chaleur-tertiaire/' },
  { label: 'Pilotage GTB / GTC', path: '/solutions/pilotage-gtb-decret-bacs/' },
  { label: 'Isolation technique', path: '/solutions/isolation-technique/' },
];

function MaquetteFooter({ onNavigate, onOpenCookies }: { onNavigate: (p: string) => void; onOpenCookies: () => void }) {
  const info = usePexenInfo();
  const cfg = useSiteConfig();
  const logoWhite = cfg?.branding.logoDarkUrl || '/themes/ultra-s/images/logo-white.svg';

  const go = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    onNavigate(path);
  };

  const primary = cfg?.menus.find((m) => m.id === 'primary')?.items ?? [];
  const footerMenu = cfg?.menus.find((m) => m.id === 'footer')?.items ?? [];
  const expertises =
    primary.find((i) => i.label === 'Expertises')?.children?.map((i) => ({ label: i.label, path: i.path })) ?? FALLBACK_EXPERTISES;
  const solutions =
    primary.find((i) => i.label === 'Solutions')?.children?.map((i) => ({ label: i.label, path: i.path })) ?? FALLBACK_SOLUTIONS;
  const pexenCol =
    footerMenu.length > 0
      ? footerMenu.map((i) => ({ label: i.label, path: i.path }))
      : [
          { label: 'Secteurs', path: '/secteurs/' },
          { label: 'Réalisations', path: '/realisations/' },
          { label: 'Notre approche', path: '/notre-approche/' },
          { label: 'Contact', path: '/contact/' },
          { label: 'Mentions légales', path: '/mentions-legales/' },
        ];
  const legalNotes = (cfg?.settings.footerLegalNotes || []).filter(Boolean);
  const notes = legalNotes.length ? legalNotes : FALLBACK_NOTES;

  return (
    <footer className="px-maq-ft">
      <div className="px-maq-ft__wm" aria-hidden="true">
        PEXEN
      </div>
      <div className="px-maq-container">
        <div className="px-maq-ft__grid">
          <div>
            <a href="/" onClick={go('/')} className="px-maq-ft__logo">
              <img src={logoWhite} alt={cfg?.branding.siteName || 'PEXEN'} />
            </a>
            <p className="px-maq-ft__about">
              {cfg?.general.slogan || 'Optimiser aujourd’hui. Performer demain.'}
              <br />
              {info.phone} · Île-de-France
            </p>
            <a
              href="https://www.linkedin.com/company/pexen/"
              className="px-maq-ft__linkedin"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="PEXEN sur LinkedIn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
          <div>
            <h4>Expertises</h4>
            <ul>
              {expertises.map((l) => (
                <li key={l.path}>
                  <a href={l.path} onClick={go(l.path)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Solutions</h4>
            <ul>
              {solutions.map((l) => (
                <li key={l.path}>
                  <a href={l.path} onClick={go(l.path)}>
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4>PEXEN</h4>
            <ul>
              {pexenCol.map((l) => (
                <li key={l.path + l.label}>
                  <a href={l.path} onClick={go(l.path)}>
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#cookies"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenCookies();
                  }}
                >
                  Cookies
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="px-maq-ft__notes">
          {notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </div>

        <div className="px-maq-ft__copy">
          <div className="px-maq-ft__rge">
            <img src="/themes/ultra-s/images/pexen/quali/qualipac.webp" alt="RGE QualiPAC" />
            <img src="/themes/ultra-s/images/pexen/quali/qualisol.webp" alt="RGE Qualisol" />
          </div>
          <p className="mb-0">
            © {new Date().getFullYear()} {cfg?.general.legalName || 'PEXEN SAS'}
          </p>
          <p className="mb-0">
            <a href="/mentions-legales/" onClick={go('/mentions-legales/')}>
              Mentions légales
            </a>
            {' · '}
            <a href="/politique-de-confidentialite/" onClick={go('/politique-de-confidentialite/')}>
              Confidentialité
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export const pexenMaquetteTheme: ThemeDefinition = {
  id: 'pexen-maquette',
  Shell: ({ currentPath, onNavigate, onOpenCookies, children }) => {
    useMaquetteEffects(currentPath);
    return (
      <div className="px-maq-root min-h-screen d-flex flex-column">
        <MaquetteHeader currentPath={currentPath} onNavigate={onNavigate} />
        <main className="flex-grow-1">{children}</main>
        <MaquetteFooter onNavigate={onNavigate} onOpenCookies={onOpenCookies} />
      </div>
    );
  },
};
