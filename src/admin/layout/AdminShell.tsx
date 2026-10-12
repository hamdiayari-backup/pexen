import React, { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, CornerDownLeft, ExternalLink, FileText, KeyRound, LogOut, Menu as MenuIcon, Newspaper, Search, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { publicUrl, SiteProvider, useSite } from '../context/SiteContext';
import { ROLE_LABELS } from '../lib/format';
import { Button, cx, ErrorState, Kbd, PageSkeleton } from '../ui/primitives';
import { Dropdown, DropdownItem } from '../ui/overlays';
import { ALL_NAV, NAV, type NavItem } from './nav';

function useAllowed() {
  const { can } = useAuth();
  return (item: NavItem) => !item.roles || can(...item.roles);
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const allowed = useAllowed();
  const { site } = useSite();
  return (
    <div className="flex h-full flex-col bg-navy-950 text-slate-300">
      <div className="flex h-16 shrink-0 items-center gap-3 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">{(site?.branding.siteName || 'P').slice(0, 1)}</div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-white">{site?.branding.siteName || 'PEXEN'}</p>
          <p className="text-[11px] text-slate-500">Administration</p>
        </div>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 scrollbar-thin">
        {NAV.map((group, gi) => {
          const items = group.items.filter(allowed);
          if (!items.length) return null;
          return (
            <div key={gi}>
              {group.title ? <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.title}</p> : null}
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                        isActive ? 'bg-white/10 font-medium text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={cx('h-4 w-4', isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300')} />
                        {item.label}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-white/5 p-3">
        <a
          href={publicUrl(site)}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          Voir le site <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const allowed = useAllowed();
  const { site } = useSite();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const results = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const nq = norm(q.trim());
    const nav = ALL_NAV.filter(allowed).map((n) => ({ key: `nav-${n.to}`, label: n.label, hint: 'Section', icon: n.icon, to: n.to, text: `${n.label} ${n.keywords || ''}` }));
    const pages = (site?.pages || []).map((p) => ({ key: `p-${p.id}`, label: p.title, hint: p.path, icon: FileText, to: `/pages/${p.id}`, text: `${p.title} ${p.path}` }));
    const posts = (site?.posts || []).map((p) => ({ key: `a-${p.id}`, label: p.title, hint: 'Article', icon: Newspaper, to: `/posts/${p.id}`, text: p.title }));
    const all = [...nav, ...pages, ...posts];
    return (nq ? all.filter((r) => norm(r.text).includes(nq)) : nav).slice(0, 12);
  }, [q, site, allowed]);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
    }
  }, [open]);
  useEffect(() => setActive(0), [q]);

  if (!open) return null;
  const go = (to: string) => {
    navigate(to);
    onClose();
  };
  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh] backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/5" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, results.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === 'Enter' && results[active]) go(results[active].to);
            }}
            placeholder="Rechercher une section, une page, un article…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <Kbd>Échap</Kbd>
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2 scrollbar-thin">
          {results.length === 0 ? <li className="px-3 py-8 text-center text-sm text-slate-500">Aucun résultat</li> : null}
          {results.map((r, i) => (
            <li key={r.key}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.to)}
                className={cx('flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm', i === active ? 'bg-slate-100 text-slate-900' : 'text-slate-700')}
              >
                <r.icon className="h-4 w-4 text-slate-400" />
                <span className="flex-1 truncate">{r.label}</span>
                <span className="truncate text-xs text-slate-400">{r.hint}</span>
                {i === active ? <CornerDownLeft className="h-3.5 w-3.5 text-slate-400" /> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ShellBody() {
  const { user, logout } = useAuth();
  const { site, loading, error, reload } = useSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const current = ALL_NAV.filter((n) => (n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to))).sort((a, b) => b.to.length - a.to.length)[0];
  useEffect(() => {
    document.title = `${current?.label || 'Administration'} · ${site?.branding.siteName || 'PEXEN'}`;
  }, [current, site?.branding.siteName]);

  const links = useMemo(() => {
    const set = new Set<string>();
    site?.pages.forEach((p) => set.add(p.path));
    site?.posts.forEach((p) => set.add(`/blog/${p.slug}/`));
    return [...set].sort();
  }, [site]);

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <Sidebar />
      </aside>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 shadow-2xl">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
            <button type="button" onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/10" aria-label="Fermer le menu">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur sm:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
            <MenuIcon className="h-5 w-5" />
          </Button>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-400 transition hover:border-slate-300 hover:bg-white"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 text-left">Rechercher…</span>
            <span className="hidden sm:inline">
              <Kbd>Ctrl K</Kbd>
            </span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <a href={publicUrl(site)} target="_blank" rel="noreferrer" className="hidden sm:block">
              <Button size="sm" icon={ExternalLink}>
                Voir le site
              </Button>
            </a>
            <Dropdown
              trigger={
                <button type="button" className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                    {(user?.name || user?.email || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <span className="hidden text-left leading-tight md:block">
                    <span className="block text-[13px] font-medium text-slate-800">{user?.name || user?.email}</span>
                    <span className="block text-[11px] text-slate-500">{ROLE_LABELS[user?.role || '']}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
              }
            >
              <div className="border-b border-slate-100 px-2.5 pb-2 pt-1.5 text-xs text-slate-500">{user?.email}</div>
              <DropdownItem icon={KeyRound} onClick={() => navigate('/profile')}>
                Mon profil et mot de passe
              </DropdownItem>
              <DropdownItem icon={LogOut} danger onClick={logout}>
                Se déconnecter
              </DropdownItem>
            </Dropdown>
          </div>
        </header>

        {site?.settings.maintenance.enabled ? (
          <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-[13px] text-amber-800">
            <ShieldAlert className="h-4 w-4" />
            Le mode maintenance est actif : les visiteurs voient la page de maintenance.
            <Link to="/maintenance" className="font-medium underline underline-offset-2">
              Gérer
            </Link>
          </div>
        ) : null}

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:px-8">
          {loading && !site ? <PageSkeleton /> : error && !site ? <ErrorState message={error} onRetry={reload} /> : <Outlet />}
        </main>
      </div>

      <datalist id="admin-site-links">
        {links.map((l) => (
          <option key={l} value={l} />
        ))}
      </datalist>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

export function AdminShell() {
  return (
    <SiteProvider>
      <ShellBody />
    </SiteProvider>
  );
}
