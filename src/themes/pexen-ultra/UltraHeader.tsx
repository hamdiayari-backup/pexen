import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown, Menu, Phone, X } from 'lucide-react';
import { usePexenInfo, useSiteConfig, type MenuItemDto } from '../../context/SiteConfigContext';

/** Descriptions menu (wireframe Amina) — utilisées si pas de sous-libellé CMS */
const MENU_DESC: Record<string, string> = {
  '/expertises/bureau-etudes-fluides/': 'Audit, relevés, dimensionnement et solutions techniques.',
  '/expertises/assistance-maitrise-ouvrage/': 'Planification, suivi de chantier et mise en service.',
  '/expertises/contrat-performance-energetique/': 'Objectifs, mesure et suivi des consommations.',
  '/expertises/financement-cee-reglementation/': 'Décret tertiaire, décret BACS et aides financières.',
  '/solutions/froid-commercial-industriel/': 'Groupes froids, meubles, régulation',
  '/solutions/recuperation-de-chaleur/': 'Chaleur des groupes froids et des process',
  '/solutions/pompe-a-chaleur-tertiaire/': 'Pompes à chaleur, déstratification',
  '/solutions/gtb-tertiaire-gtc/': 'Décret BACS, classes A et B',
  '/solutions/isolation-technique/': 'Réseaux, toitures-terrasses',
  '/secteurs/efficacite-energetique-industrielle/': 'Sites industriels et process.',
  '/secteurs/efficacite-energetique-tertiaire/': 'Bureaux, établissements publics.',
  '/secteurs/renovation-energetique-copropriete/': 'Logements, résidences.',
};

const FALLBACK: MenuItemDto[] = [
  {
    id: 'u-exp',
    label: 'Expertises',
    path: '/expertises/',
    children: [
      { id: 'e1', label: 'Études et ingénierie', path: '/expertises/bureau-etudes-fluides/' },
      { id: 'e2', label: 'Accompagnement travaux et AMO', path: '/expertises/assistance-maitrise-ouvrage/' },
      { id: 'e4', label: 'Réglementation et financement', path: '/expertises/financement-cee-reglementation/' },
    ],
  },
  {
    id: 'u-sol',
    label: 'Solutions',
    path: '/solutions/',
    children: [
      { id: 's1', label: 'Froid commercial et industriel', path: '/solutions/froid-commercial-industriel/' },
      { id: 's2', label: 'Récupération de chaleur', path: '/solutions/recuperation-de-chaleur/' },
      { id: 's3', label: 'Chauffage et traitement d’air', path: '/solutions/pompe-a-chaleur-tertiaire/' },
      { id: 's4', label: 'Pilotage GTB / GTC', path: '/solutions/gtb-tertiaire-gtc/' },
      { id: 's5', label: 'Isolation technique', path: '/solutions/isolation-technique/' },
    ],
  },
  {
    id: 'u-sec',
    label: 'Secteurs',
    path: '/secteurs/',
    children: [
      { id: 'c1', label: 'Industrie', path: '/secteurs/efficacite-energetique-industrielle/' },
      { id: 'c2', label: 'Tertiaire', path: '/secteurs/efficacite-energetique-tertiaire/' },
      { id: 'c3', label: 'Bâtiments collectifs', path: '/secteurs/renovation-energetique-copropriete/' },
    ],
  },
  /* Recette : sous-menu Réalisations masqué — lien direct */
  { id: 'u-real', label: 'Réalisations', path: '/realisations/' },
  { id: 'u-meth', label: 'Notre approche', path: '/notre-approche/' },
  { id: 'u-contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
];

const LABEL_DESC: Record<string, string> = {
  'Études et ingénierie': 'Audit, relevés, dimensionnement et solutions techniques.',
  'Accompagnement travaux et AMO': 'Planification, suivi de chantier et mise en service.',
  'Contrat de performance énergétique': 'Objectifs, mesure et suivi des consommations.',
  'Réglementation et Financement': 'Décret tertiaire, décret BACS et aides financières.',
  'Réglementation et financement': 'Décret tertiaire, décret BACS et aides financières.',
  'Froid commercial et industriel': 'Groupes froids, meubles, régulation',
  'Récupération de chaleur': 'Chaleur des groupes froids et des process',
  'Chauffage et traitement d’air': 'Pompes à chaleur, déstratification',
  'Pilotage GTB / GTC': 'Décret BACS, classes A et B',
  'Pilotage GTB / GTC et décret BACS': 'Décret BACS, classes A et B',
  'Isolation technique': 'Réseaux, toitures-terrasses',
  Industrie: 'Sites industriels et process.',
  Tertiaire: 'Bureaux, établissements publics.',
  'Bâtiments collectifs': 'Logements, résidences.',
};

function resolveDesc(item: MenuItemDto): string | undefined {
  const nested = item.children?.[0];
  if (nested && nested.path === item.path && nested.label !== item.label) return nested.label;
  if (item.id === 'r1') return 'Intermarché, Carrefour Market…';
  if (item.id === 'r2') return 'CEDIM, sites industriels…';
  if (item.id === 'r3') return 'Bureaux, établissements publics…';
  if (item.id === 'r4') return 'Logements, résidences…';
  return LABEL_DESC[item.label] || MENU_DESC[item.path];
}

function menuKind(item: MenuItemDto): 'grid' | 'solutions' | 'secteurs' {
  const lab = item.label.toLowerCase();
  if (lab.includes('solution') || item.id === 'u-sol') return 'solutions';
  if (lab.includes('secteur') || item.id === 'u-sec') return 'secteurs';
  return 'grid';
}

function MegaPanel({
  item,
  onGo,
}: {
  item: MenuItemDto;
  onGo: (p: string) => void;
}) {
  const kind = menuKind(item);
  /* Recette : Partenaires hors sous-menu Secteurs */
  const children = (item.children || []).filter(
    (c) => !(kind === 'secteurs' && (/partenaires/i.test(c.path) || /partenaires/i.test(c.label)))
  );
  const footer =
    kind === 'solutions'
      ? { label: 'Voir toutes nos solutions', path: '/solutions/' }
      : kind === 'secteurs'
        ? { label: 'Voir tous nos secteurs', path: '/secteurs/' }
        : { label: 'Voir toutes nos expertises', path: '/expertises/' };

  return (
    <div className={`px-ultra-mega px-ultra-mega--${kind}`} role="menu">
      <div className="px-ultra-mega__panel">
        <span className="px-ultra-mega__caret" aria-hidden="true" />
        <div
          className={`px-ultra-mega__grid px-ultra-mega__grid--cards ${
            kind === 'solutions' ? 'px-ultra-mega__grid--solutions' : kind === 'secteurs' ? 'px-ultra-mega__grid--secteurs' : ''
          }`}
        >
          {children.map((child) => {
            const desc = resolveDesc(child);
            return (
              <button
                key={child.id}
                type="button"
                role="menuitem"
                onClick={() => onGo(child.path)}
                className="px-ultra-mega__item"
              >
                <span className="px-ultra-mega__item-text">
                  <span className="px-ultra-mega__item-title">{child.label}</span>
                  {desc ? <span className="px-ultra-mega__item-desc">{desc}</span> : null}
                </span>
                <ArrowRight className="px-ultra-mega__item-arrow" aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <button type="button" className="px-ultra-mega__footer px-ultra-mega__footer--bar" onClick={() => onGo(footer.path)}>
          {footer.label} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function UltraHeader({ currentPath, onNavigate }: { currentPath: string; onNavigate: (p: string) => void }) {
  const info = usePexenInfo();
  const cfg = useSiteConfig();
  const rawItems = cfg?.menus.find((m) => m.id === 'primary')?.items?.length
    ? cfg.menus.find((m) => m.id === 'primary')!.items
    : FALLBACK;

  /* Recette : masquer sous-menu Réalisations ; retirer Partenaires de Secteurs */
  const items = rawItems.map((it) => {
    if (it.id === 'u-real' || /^réalisations$/i.test(it.label)) {
      return { ...it, children: undefined };
    }
    if (it.id === 'u-sec' || /^secteurs$/i.test(it.label)) {
      return {
        ...it,
        children: (it.children || []).filter((c) => !/partenaires/i.test(c.path) && !/partenaires/i.test(c.label)),
      };
    }
    return it;
  });

  const navItems = items.filter((i) => !i.highlight);
  const cta = items.find((i) => i.highlight);

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [mobileOpenId, setMobileOpenId] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHero = currentPath === '/';

  const openMega = (id: string | null) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHoverId(id);
  };
  const scheduleCloseMega = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => {
      setHoverId(null);
      leaveTimer.current = null;
    }, 180);
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => {
      window.removeEventListener('scroll', fn);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const go = (p: string) => {
    onNavigate(p);
    setOpen(false);
    setHoverId(null);
    setMobileOpenId(null);
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  };

  const transparent = onHero && !scrolled && !open;

  return (
    <>
      <header
        className={`px-ultra-header sticky top-0 z-50 transition-colors duration-300 ${
          transparent ? 'bg-transparent' : 'bg-white/95 shadow-sm backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <button type="button" onClick={() => go('/')} className="shrink-0" aria-label="PEXEN — Accueil">
            <img
              src={
                transparent
                  ? cfg?.branding.logoDarkUrl || '/brand/logo-principal-blanc.svg'
                  : cfg?.branding.logoUrl || '/brand/logo-sans-baseline-couleur.svg'
              }
              alt="PEXEN"
              className="h-9 w-auto"
            />
          </button>

          <nav className="hidden items-center gap-0.5 xl:flex" onMouseLeave={scheduleCloseMega}>
            {navItems.map((i) => {
              const hasChildren = Boolean(i.children?.length);
              const isOpen = hoverId === i.id;
              return (
                <div
                  key={i.id}
                  className="relative"
                  onMouseEnter={() => openMega(hasChildren ? i.id : null)}
                  onMouseLeave={hasChildren ? scheduleCloseMega : undefined}
                >
                  <button
                    type="button"
                    onClick={() => (hasChildren ? openMega(isOpen ? null : i.id) : go(i.path))}
                    onFocus={() => (hasChildren ? openMega(i.id) : undefined)}
                    className={`px-ultra-nav-link inline-flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                      isOpen ? 'px-ultra-nav-link--open' : ''
                    } ${transparent ? 'text-white/90 hover:text-white' : 'text-px-navy hover:text-px-primary'}`}
                    aria-expanded={hasChildren ? isOpen : undefined}
                    aria-haspopup={hasChildren ? 'menu' : undefined}
                  >
                    {i.label}
                    {hasChildren ? <ChevronDown className={`h-3.5 w-3.5 transition ${isOpen ? 'rotate-180' : ''}`} /> : null}
                  </button>
                  {hasChildren && isOpen ? <MegaPanel item={i} onGo={go} /> : null}
                </div>
              );
            })}
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <a
              href={`tel:${info.phoneClean}`}
              className={`inline-flex items-center gap-1.5 text-sm font-semibold ${transparent ? 'text-white' : 'text-px-navy'}`}
            >
              <Phone className="h-4 w-4" />
              {info.phone}
            </a>
            {cta ? (
              <button
                type="button"
                onClick={() => go(cta.path)}
                className="btn btn-primary px-cta px-cta--l1 inline-flex items-center gap-2"
              >
                Parler de votre projet <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            className={`xl:hidden ${transparent ? 'text-white' : 'text-px-navy'}`}
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>

        {open ? (
          <div className="max-h-[75vh] overflow-y-auto border-t border-px-border bg-white px-4 py-4 xl:hidden">
            {navItems.map((i) => {
              const hasChildren = Boolean(i.children?.length);
              const expanded = mobileOpenId === i.id;
              return (
                <div key={i.id} className="border-b border-slate-100 py-1">
                  <button
                    type="button"
                    onClick={() => (hasChildren ? setMobileOpenId(expanded ? null : i.id) : go(i.path))}
                    className="flex w-full items-center justify-between py-2.5 text-left text-sm font-semibold text-px-navy"
                  >
                    {i.label}
                    {hasChildren ? <ChevronDown className={`h-4 w-4 ${expanded ? 'rotate-180' : ''}`} /> : null}
                  </button>
                  {hasChildren && expanded ? (
                    <div className="space-y-1 pb-2 pl-2">
                      {i.children!.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => go(child.path)}
                          className="block w-full py-1.5 text-left text-sm text-slate-600"
                        >
                          {child.label}
                          {resolveDesc(child) ? (
                            <span className="mt-0.5 block text-xs text-slate-400">{resolveDesc(child)}</span>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
            <a href={`tel:${info.phoneClean}`} className="mt-3 flex items-center gap-2 py-2 text-sm font-semibold text-px-navy">
              <Phone className="h-4 w-4" /> {info.phone}
            </a>
            {cta ? (
              <button type="button" onClick={() => go(cta.path)} className="btn btn-primary px-cta px-cta--l1 mt-2 w-full">
                Parler de votre projet <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className="px-ultra-mobile-bar fixed inset-x-0 bottom-0 z-[1045] flex gap-2 border-t border-slate-200 bg-white p-3 xl:hidden" style={{ borderRadius: 0 }}>
        <a href={`tel:${info.phoneClean}`} className="btn btn-outline px-cta px-cta--l2 flex flex-1 items-center justify-center gap-2">
          <Phone className="h-4 w-4" /> Appeler
        </a>
        <button
          type="button"
          onClick={() => go(cta?.path || '/contact/')}
          className="btn btn-primary px-cta px-cta--l1 flex flex-1 items-center justify-center gap-2"
        >
          Parler de votre projet
        </button>
      </div>
    </>
  );
}
