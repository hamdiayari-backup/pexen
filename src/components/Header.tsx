import React, { useState, useEffect } from 'react';
import { Phone, ArrowRight, Menu, X, ChevronDown, Snowflake, Flame, Wind, Cpu, ShieldCheck, FileCheck, Factory, Building2, Home } from 'lucide-react';
import { EXPERTISES, SECTEURS } from '../data/pexenData';
import { usePexenInfo, useSiteConfig, type MenuItemDto } from '../context/SiteConfigContext';
const FALLBACK_MENU: MenuItemDto[] = [
  { id: 'exp', label: 'Expertises', path: '/expertises/', children: EXPERTISES.map((e) => ({ id: e.slug, label: e.title, path: `/expertises/${e.slug}/` })) },
  { id: 'sec', label: 'Secteurs', path: '/secteurs/', children: SECTEURS.map((e) => ({ id: e.slug, label: e.title, path: `/secteurs/${e.slug}/` })) },
  { id: 'real', label: 'Réalisations', path: '/realisations/' },
  { id: 'app', label: 'Notre approche', path: '/notre-approche/' },
  { id: 'contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
];

interface HeaderProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPath, onNavigate }) => {
  const PEXEN_INFO = usePexenInfo();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const cfg = useSiteConfig();
  const primaryItems = cfg?.menus.find((m) => m.id === 'primary')?.items ?? FALLBACK_MENU;
  const mobileMenu = cfg?.menus.find((m) => m.id === 'mobile')?.items;
  const mobileItems = mobileMenu?.length ? mobileMenu : primaryItems;
  const primaryCta: MenuItemDto = primaryItems.find((i) => i.highlight) ?? { id: 'cta', label: 'Parler de votre projet', path: '/contact/' };
  const floating = (cfg?.floatingButtons ?? []).filter((b) => b.enabled && b.label).slice(0, 2);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigateTo = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
    setOpenDropdown(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const follow = (item: MenuItemDto) => {
    const external = /^(https?:|mailto:|tel:)/.test(item.path);
    if (item.openInNewTab) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else if (external) {
      window.location.href = item.path;
    } else if (item.path.startsWith('#')) {
      document.querySelector(item.path)?.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    } else {
      navigateTo(item.path);
    }
  };

  const isActive = (path: string) => (path === '/' ? currentPath === '/' : currentPath.startsWith(path.replace(/\/$/, '')));

  const iconFor = (path: string) => {
    const exp = path.match(/^\/expertises\/([^/]+)/)?.[1];
    if (exp) return getExpertiseIcon(exp);
    const sec = path.match(/^\/secteurs\/([^/]+)/)?.[1];
    if (sec) return getSecteurIcon(sec);
    return <ArrowRight className="w-4 h-4 text-px-primary-dark" />;
  };

  const descFor = (path: string) =>
    EXPERTISES.find((e) => path === `/expertises/${e.slug}/`)?.shortDesc ?? SECTEURS.find((e) => path === `/secteurs/${e.slug}/`)?.shortDesc;

  const getExpertiseIcon = (slug: string) => {
    switch (slug) {
      case 'froid':
      case 'froid-commercial-industriel': return <Snowflake className="w-4 h-4 text-px-primary-dark" />;
      case 'recuperation-de-chaleur': return <Flame className="w-4 h-4 text-px-primary-dark" />;
      case 'chauffage-traitement-air':
      case 'pompe-a-chaleur-tertiaire': return <Wind className="w-4 h-4 text-px-primary-dark" />;
      case 'gtb-gtc':
      case 'gtb-tertiaire-gtc': return <Cpu className="w-4 h-4 text-px-primary-dark" />;
      case 'isolation-technique': return <ShieldCheck className="w-4 h-4 text-px-primary-dark" />;
      case 'reglementation-cee':
      case 'financement-cee-reglementation': return <FileCheck className="w-4 h-4 text-px-primary-dark" />;
      default: return <FileCheck className="w-4 h-4 text-px-primary-dark" />;
    }
  };

  const getSecteurIcon = (slug: string) => {
    switch (slug) {
      case 'industrie':
      case 'efficacite-energetique-industrielle': return <Factory className="w-4 h-4 text-px-navy" />;
      case 'tertiaire':
      case 'efficacite-energetique-tertiaire': return <Building2 className="w-4 h-4 text-px-navy" />;
      case 'residentiel-collectif':
      case 'renovation-energetique-copropriete': return <Home className="w-4 h-4 text-px-navy" />;
      default: return <Building2 className="w-4 h-4 text-slate-700" />;
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-200 bg-white ${
          isScrolled
            ? 'shadow-sm border-b border-px-border'
            : 'border-b border-px-border/70'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Brand Logo & Baseline */}
            <div
              onClick={() => navigateTo('/')}
              className="flex items-center gap-3 cursor-pointer group select-none"
            >
              <img src={cfg?.branding.logoUrl || '/brand/logo-sans-baseline-couleur.svg'} alt={cfg?.branding.siteName || 'PEXEN'} className="h-12 w-auto max-w-[220px] object-contain" />
            </div>

            {/* Desktop Navigation (menu principal géré dans l'administration) */}
            <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
              {primaryItems.filter((i) => !i.highlight).map((item) =>
                item.children?.length ? (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(item.id)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      type="button"
                      onClick={() => follow(item)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive(item.path) ? 'text-px-primary-dark font-semibold' : 'text-slate-700 hover:text-px-navy'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdown === item.id ? 'rotate-180' : ''}`} />
                    </button>
                    {openDropdown === item.id && (
                      <div className="absolute top-full left-0 w-80 pt-2 z-50">
                        <div className="bg-white rounded-2xl shadow-xl border border-px-border p-2.5 space-y-1">
                          <div
                            onClick={() => follow(item)}
                            className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-px-navy cursor-pointer"
                          >
                            Voir tout : {item.label} →
                          </div>
                          {item.children.map((child) => (
                            <div
                              key={child.id}
                              onClick={() => follow(child)}
                              className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-px-surface cursor-pointer transition-colors"
                            >
                              <div className="p-1.5 rounded-lg bg-slate-100 shrink-0 mt-0.5">{iconFor(child.path)}</div>
                              <div>
                                <div className="text-xs font-semibold text-px-navy leading-tight">{child.label}</div>
                                {descFor(child.path) ? (
                                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{descFor(child.path)}</div>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => follow(item)}
                    className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.path) ? 'text-px-primary-dark font-semibold' : 'text-slate-700 hover:text-px-navy'
                    }`}
                  >
                    {item.label}
                  </button>
                )
              )}
            </nav>

            {/* Right Action zone */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href={`tel:${PEXEN_INFO.phoneClean}`}
                className="flex items-center gap-2 text-xs xl:text-sm font-semibold text-px-navy hover:text-px-primary-dark transition-colors py-2 px-3 rounded-lg hover:bg-slate-50"
              >
                <Phone className="w-4 h-4 text-px-primary-dark" />
                <span className="px-phone tracking-tight">{PEXEN_INFO.phone}</span>
              </a>

              <button
                type="button"
                onClick={() => follow(primaryCta)}
                className="btn-primary-pexen text-xs xl:text-sm !py-2.5 !px-5"
              >
                <span>{primaryCta.label}</span>
                <ArrowRight className="w-4 h-4 btn-arrow" />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              <a
                href={`tel:${PEXEN_INFO.phoneClean}`}
                className="p-2 text-slate-700 hover:text-px-navy"
                aria-label="Appeler PEXEN"
              >
                <Phone className="w-5 h-5 text-px-primary-dark" />
              </a>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-800 hover:text-px-primary-dark rounded-lg focus:outline-none"
                aria-label="Menu de navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Fullscreen Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-20 z-40 bg-white/98 backdrop-blur-md overflow-y-auto px-6 py-6 flex flex-col justify-between">
            <div className="space-y-6">
              {mobileItems.filter((i) => i.children?.length).map((item) => (
                <div key={item.id}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">{item.label}</div>
                  <div className="space-y-1">
                    <div
                      onClick={() => follow(item)}
                      className="py-2 text-sm font-medium text-slate-900 border-b border-slate-100 flex items-center justify-between"
                    >
                      <span>Voir tout</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    {item.children!.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => follow(child)}
                        className="py-2 text-sm text-slate-600 hover:text-px-navy flex items-center gap-2.5"
                      >
                        {iconFor(child.path)}
                        <span>{child.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {mobileItems.filter((i) => !i.children?.length).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => follow(item)}
                    className={`py-2 text-base font-semibold ${item.highlight ? 'text-px-primary-dark' : 'text-slate-900'}`}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 mt-6 pb-20">
              <a
                href={`tel:${PEXEN_INFO.phoneClean}`}
                className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 rounded-xl text-slate-900 font-semibold text-sm mb-3"
              >
                <Phone className="w-4 h-4 text-px-primary-dark" />
                <span>{PEXEN_INFO.phone}</span>
              </a>
              <button
                onClick={() => follow(primaryCta)}
                className="w-full btn-primary-pexen !w-full justify-center"
              >
                <span>{primaryCta.label}</span>
                <ArrowRight className="w-4 h-4 btn-arrow" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Barre fixe mobile : boutons configurables dans l'administration, sinon « Appeler » + « Parler de votre projet » */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-px-border px-4 py-2.5 shadow-lg flex items-center gap-3">
        {floating.length ? (
          floating.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => follow({ id: b.id, label: b.label, path: b.path })}
              className={
                b.style === 'primary'
                  ? 'flex-1 btn-primary-pexen !py-2.5 !px-3 text-xs justify-center'
                  : b.style === 'outline'
                    ? 'flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border border-slate-300 bg-white text-px-navy text-xs font-semibold active:bg-slate-100'
                    : 'flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-full bg-slate-100 text-px-navy text-xs font-semibold'
              }
            >
              <span>{b.label}</span>
            </button>
          ))
        ) : (
          <>
            <a
              href={`tel:${PEXEN_INFO.phoneClean}`}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-full border border-slate-300 bg-white text-px-navy text-xs font-semibold active:bg-slate-100"
            >
              <Phone className="w-3.5 h-3.5 text-px-primary-dark" />
              <span>Appeler</span>
            </a>

            <button
              onClick={() => navigateTo('/contact/')}
              className="flex-1 btn-primary-pexen !py-2.5 !px-3 text-xs justify-center"
            >
              <span>Parler de votre projet</span>
              <ArrowRight className="w-3.5 h-3.5 btn-arrow" />
            </button>
          </>
        )}
      </div>
    </>
  );
};
