import React, { useEffect, useState } from 'react';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { usePexenInfo, useSiteConfig, type MenuItemDto } from '../../context/SiteConfigContext';

const FALLBACK: MenuItemDto[] = [
  {
    id: 'm-exp',
    label: 'Expertises',
    path: '/etudes-ingenierie-energetique/',
    children: [
      { id: 'e1', label: 'Études et ingénierie', path: '/etudes-ingenierie-energetique/' },
      { id: 'e2', label: 'Accompagnement travaux', path: '/accompagnement-travaux/' },
      { id: 'e3', label: 'Contrat de performance énergétique', path: '/contrat-de-performance-energetique/' },
      { id: 'e4', label: 'Réglementation et financement', path: '/decret-tertiaire-decret-bacs/' },
    ],
  },
  {
    id: 'm-sol',
    label: 'Solutions',
    path: '/solutions/',
    children: [
      { id: 's1', label: 'Froid commercial et industriel', path: '/solutions/froid-commercial-industriel/' },
      { id: 's2', label: 'Récupération de chaleur', path: '/solutions/recuperation-de-chaleur/' },
      { id: 's3', label: 'Chauffage et traitement d’air', path: '/solutions/pompe-a-chaleur-tertiaire/' },
      { id: 's4', label: 'Pilotage GTB / GTC', path: '/solutions/pilotage-gtb-decret-bacs/' },
      { id: 's5', label: 'Isolation technique', path: '/solutions/isolation-technique/' },
    ],
  },
  {
    id: 'm-sec',
    label: 'Secteurs',
    path: '/secteurs/',
    children: [
      { id: 'c1', label: 'Industrie', path: '/secteurs/efficacite-energetique-industrielle/' },
      { id: 'c2', label: 'Tertiaire', path: '/secteurs/efficacite-energetique-tertiaire/' },
      { id: 'c3', label: 'Bâtiments collectifs', path: '/secteurs/batiments-collectifs/' },
    ],
  },
  { id: 'm-real', label: 'Réalisations', path: '/realisations/' },
  { id: 'm-contact', label: 'Contactez-nous', path: '/contact/' },
];

export function MaquetteHeader({ currentPath, onNavigate }: { currentPath: string; onNavigate: (p: string) => void }) {
  const info = usePexenInfo();
  const cfg = useSiteConfig();
  const items = cfg?.menus.find((m) => m.id === 'primary')?.items?.length
    ? cfg.menus.find((m) => m.id === 'primary')!.items
    : FALLBACK;
  const navItems = items.filter((i) => !i.highlight && i.label !== 'Notre approche');
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const onHero = currentPath === '/';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (p: string) => {
    onNavigate(p);
    setOpen(false);
    setHoverId(null);
  };

  const solid = !onHero || scrolled || open;

  return (
    <header className={`px-maq-header ${solid ? 'is-solid' : 'is-transparent'}`}>
      <div className="px-maq-header__inner">
        <button type="button" className="px-maq-header__logo" onClick={() => go('/')} aria-label="PEXEN — Accueil">
          <img
            src={
              solid
                ? cfg?.branding.logoUrl || '/brand/logo-sans-baseline-couleur.svg'
                : cfg?.branding.logoDarkUrl || '/brand/logo-principal-blanc.svg'
            }
            alt="PEXEN"
          />
        </button>

        <nav className="px-maq-header__nav" onMouseLeave={() => setHoverId(null)}>
          {navItems.map((i) => {
            const hasChildren = Boolean(i.children?.length);
            const isOpen = hoverId === i.id;
            return (
              <div key={i.id} className="px-maq-header__item" onMouseEnter={() => setHoverId(hasChildren ? i.id : null)}>
                <button type="button" onClick={() => (hasChildren ? undefined : go(i.path))}>
                  {i.label}
                  {hasChildren ? <ChevronDown className={`h-3.5 w-3.5 ${isOpen ? 'rotate-180' : ''}`} /> : null}
                </button>
                {hasChildren && isOpen ? (
                  <div className="px-maq-header__drop">
                    {i.children!.map((c) => (
                      <button key={c.id} type="button" onClick={() => go(c.path)}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="px-maq-header__actions">
          <a href={`tel:${info.phoneClean}`} className="px-maq-header__phone">
            <Phone className="h-4 w-4" />
            {info.phone}
          </a>
          <button
            type="button"
            className={`px-maq-btn ${solid ? 'px-maq-btn--primary' : 'px-maq-btn--cyan'}`}
            onClick={() => go('/contact/')}
          >
            Parler de votre projet
          </button>
        </div>

        <button type="button" className="px-maq-header__burger" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open ? (
        <div className="px-maq-header__mobile">
          {navItems.map((i) => (
            <div key={i.id}>
              <button type="button" onClick={() => (i.children?.length ? setHoverId(hoverId === i.id ? null : i.id) : go(i.path))}>
                {i.label}
              </button>
              {i.children?.length && hoverId === i.id
                ? i.children.map((c) => (
                    <button key={c.id} type="button" className="is-child" onClick={() => go(c.path)}>
                      {c.label}
                    </button>
                  ))
                : null}
            </div>
          ))}
          <a href={`tel:${info.phoneClean}`}>{info.phone}</a>
          <button type="button" className="px-maq-btn px-maq-btn--primary" onClick={() => go('/contact/')}>
            Parler de votre projet
          </button>
        </div>
      ) : null}

      {/* Barre fixe mobile : « Appeler » + « Parler de votre projet » */}
      <div className="px-maq-mobile-bar">
        <a href={`tel:${info.phoneClean}`} className="px-maq-mobile-bar__call">
          <Phone className="h-4 w-4" />
          <span>Appeler</span>
        </a>
        <button type="button" className="px-maq-mobile-bar__cta" onClick={() => go('/contact/')}>
          <span>Parler de votre projet</span>
        </button>
      </div>
    </header>
  );
}
