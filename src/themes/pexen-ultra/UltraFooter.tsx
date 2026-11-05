import React, { useState } from 'react';
import { usePexenInfo, useSiteConfig } from '../../context/SiteConfigContext';

const EXPERTISES = [
  { label: 'Études et ingénierie', path: '/expertises/bureau-etudes-fluides/' },
  { label: 'Accompagnement travaux et AMO', path: '/expertises/assistance-maitrise-ouvrage/' },
  { label: 'Réglementation et financement', path: '/expertises/financement-cee-reglementation/' },
];

const SOLUTIONS = [
  { label: 'Froid commercial et industriel', path: '/solutions/froid-commercial-industriel/' },
  { label: 'Récupération de chaleur', path: '/solutions/recuperation-de-chaleur/' },
  { label: 'Chauffage et traitement d’air', path: '/solutions/pompe-a-chaleur-tertiaire/' },
  { label: 'Pilotage GTB / GTC', path: '/solutions/gtb-tertiaire-gtc/' },
  { label: 'Isolation technique', path: '/solutions/isolation-technique/' },
];

const SECTEURS = [
  { label: 'Industrie', path: '/secteurs/efficacite-energetique-industrielle/' },
  { label: 'Tertiaire', path: '/secteurs/efficacite-energetique-tertiaire/' },
  { label: 'Bâtiments collectifs', path: '/secteurs/renovation-energetique-copropriete/' },
];

const PEXEN_LINKS = [
  { label: 'Réalisations', path: '/realisations/' },
  { label: 'Notre approche', path: '/notre-approche/' },
  { label: 'Blog', path: '/blog/' },
  { label: 'Contact', path: '/contact/' },
];

const FALLBACK_NOTES = [
  '* Volume d’économies d’énergie estimé selon les fiches d’opérations standardisées mobilisées : le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements. Il ne constitue pas une mesure des consommations réelles.',
  '* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique (10 ans), à conditions d’exploitation comparables.',
];

function FooterCol({
  id,
  title,
  items,
  onNavigate,
  open,
  onToggle,
}: {
  id: string;
  title: string;
  items: { label: string; path: string }[];
  onNavigate: (p: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={`px-ultra-ft__col${open ? ' is-open' : ''}`}>
      <button type="button" className="px-ultra-ft__title px-ultra-ft__title--toggle" onClick={onToggle} aria-expanded={open} aria-controls={`ft-${id}`}>
        <span>{title}</span>
        <i className="fa fa-chevron-down px-ultra-ft__chev" aria-hidden="true" />
      </button>
      <ul className="px-ultra-ft__list" id={`ft-${id}`}>
        {items.map((i) => (
          <li key={i.path}>
            <a
              href={i.path}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(i.path);
              }}
            >
              <i className="fa fa-angle-right" aria-hidden="true" />
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UltraFooter({ onNavigate, onOpenCookies }: { onNavigate: (p: string) => void; onOpenCookies: () => void }) {
  const info = usePexenInfo();
  const cfg = useSiteConfig();
  const [newsEmail, setNewsEmail] = useState('');
  const [newsConsent, setNewsConsent] = useState(false);
  const [newsMsg, setNewsMsg] = useState('');
  const [openCol, setOpenCol] = useState<string | null>(null);

  const logoWhite = cfg?.branding.logoDarkUrl || '/brand/logo-principal-blanc.svg';
  const notes = ((cfg?.settings.footerLegalNotes || []).filter(Boolean).length
    ? cfg!.settings.footerLegalNotes!.filter(Boolean)
    : FALLBACK_NOTES) as string[];

  const toggle = (id: string) => setOpenCol((c) => (c === id ? null : id));

  return (
    <footer className="px-ultra-ft px-ultra-atm" data-px-atm="footer">
      <div
        className="px-ultra-atm__photo"
        style={{ backgroundImage: "url('/themes/ultra-s/images/pexen/sobriete-energetique.webp')" }}
        aria-hidden="true"
      />
      <div className="px-ultra-atm__veil" aria-hidden="true" />
      <p className="px-ultra-ft__watermark" aria-hidden="true">
        pexen
      </p>

      <div className="container">
        <div className="px-ultra-ft__nl">
          <div className="px-ultra-ft__nl-copy">
            <h3 className="px-ultra-ft__nl-title">La lettre PEXEN</h3>
            <p className="px-ultra-ft__nl-text">Réglementation, financement CEE et retours de chantier.</p>
          </div>
          <form
            className="px-ultra-ft__nl-form"
            onSubmit={async (e) => {
              e.preventDefault();
              setNewsMsg('');
              if (!newsConsent) {
                setNewsMsg('Veuillez accepter de recevoir la lettre PEXEN.');
                return;
              }
              const r = await fetch('/api/public/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newsEmail }),
              });
              const j = await r.json().catch(() => ({}));
              if (r.ok) {
                setNewsMsg(j.pending ? 'Vérifiez votre boîte mail pour confirmer.' : 'Inscription enregistrée.');
                setNewsEmail('');
                setNewsConsent(false);
              } else setNewsMsg(j.error || 'Erreur');
            }}
          >
            <div className="px-ultra-ft__nl-row">
              <label className="visually-hidden" htmlFor="px-ft-nl-email">
                Votre e-mail professionnel
              </label>
              <input
                id="px-ft-nl-email"
                type="email"
                required
                value={newsEmail}
                onChange={(e) => setNewsEmail(e.target.value)}
                placeholder="Votre e-mail professionnel"
                autoComplete="email"
              />
              <button type="submit" className="px-ultra-ft__form-btn px-ultra-ft__nl-submit">
                S’inscrire
              </button>
            </div>
            <div className="px-ultra-ft__nl-consent">
              <input
                id="px-ft-nl-consent"
                type="checkbox"
                checked={newsConsent}
                onChange={(e) => setNewsConsent(e.target.checked)}
                required
              />
              <label htmlFor="px-ft-nl-consent">
                J’accepte de recevoir la lettre PEXEN. Je peux me désinscrire à tout moment.
              </label>
            </div>
            <p className="px-ultra-ft__nl-legal">
              Vos données sont traitées par PEXEN pour l’envoi de la lettre. Vous pouvez exercer vos droits à tout moment :{' '}
              <a href="mailto:rgpd@pexen.fr">rgpd@pexen.fr</a>.
            </p>
            {newsMsg ? <p className="px-ultra-ft__nl-msg">{newsMsg}</p> : null}
          </form>
        </div>

        <div className="px-ultra-ft__main">
          <div className="px-ultra-ft__grid">
            <div className="px-ultra-ft__brand">
              <div className="px-ultra-ft__logo">
                <img src={logoWhite} alt="PEXEN" />
              </div>
              <p className="px-ultra-ft__baseline">Optimiser aujourd’hui. Performer demain.</p>
              <div className="px-ultra-ft__quali">
                <img src="/themes/ultra-s/images/pexen/quali/qualipac.webp" alt="RGE QualiPAC" height={48} />
                <img src="/themes/ultra-s/images/pexen/quali/qualisol.webp" alt="RGE Qualisol" height={48} />
              </div>
              <p className="px-ultra-ft__about">
                Des économies calculées, réalisées, démontrées. Conseil, ingénierie et suivi opérationnel pour l’industrie, le
                tertiaire et le résidentiel collectif, partout en France.
              </p>
              <ul className="px-ultra-ft__coords">
                <li>
                  <a href={`tel:${info.phoneClean}`}>{info.phone || '01 41 93 52 80'}</a>
                </li>
                <li>{info.address || '111 avenue Victor Hugo, 93300 Aubervilliers'}</li>
              </ul>
            </div>

            <FooterCol id="exp" title="Expertises" items={EXPERTISES} onNavigate={onNavigate} open={openCol === 'exp'} onToggle={() => toggle('exp')} />
            <FooterCol id="sol" title="Solutions" items={SOLUTIONS} onNavigate={onNavigate} open={openCol === 'sol'} onToggle={() => toggle('sol')} />
            <FooterCol id="sec" title="Secteurs" items={SECTEURS} onNavigate={onNavigate} open={openCol === 'sec'} onToggle={() => toggle('sec')} />
            <FooterCol id="px" title="PEXEN" items={PEXEN_LINKS} onNavigate={onNavigate} open={openCol === 'px'} onToggle={() => toggle('px')} />
          </div>
        </div>

        {notes.length ? (
          <div className="px-ultra-ft__legal-notes">
            {notes.map((n) => (
              <p key={n}>{n}</p>
            ))}
          </div>
        ) : null}

        <div className="px-ultra-ft__copy">
          <p className="px-ultra-ft__copy-inner">
            <span>
              © {new Date().getFullYear()} {cfg?.general.legalName || 'PEXEN SAS'}
            </span>
            <span className="px-ultra-ft__copy-links">
              <a
                href="/mentions-legales/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/mentions-legales/');
                }}
              >
                Mentions légales
              </a>
              <span aria-hidden="true"> · </span>
              <a
                href="/politique-de-confidentialite/"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/politique-de-confidentialite/');
                }}
              >
                Politique de confidentialité
              </a>
              <span aria-hidden="true"> · </span>
              <button type="button" className="px-ultra-ft__cookie-btn" onClick={onOpenCookies}>
                Gérer mes cookies
              </button>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
