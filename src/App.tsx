/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from './themes/ThemeProvider';
import { CookieBanner } from './components/CookieBanner';
import { Ga4Loader } from './components/Ga4Loader';
import { NotFoundView } from './views/NotFoundView';
import { WhatsAppButton } from './components/WhatsAppButton';
import { AiAssistantButton } from './components/AiAssistantButton';
import { SiteAnalytics } from './components/SiteAnalytics';
import { MaintenanceGate } from './components/MaintenanceGate';
import { pathMatches, useSiteConfig } from './context/SiteConfigContext';
import { CmsPageView } from './views/CmsPageView';
import { BlogPostView } from './views/BlogPostView';
import { IS_PREVIEW, usePreviewState } from './preview';
import type { CmsPage } from '../server/cms/types';

const normalize = (p: string) => (p ? (p.endsWith('/') ? p : `${p}/`) : '/');

const DEFAULT_TITLE = 'PEXEN | Ingénierie & Performance Énergétique';
const DEFAULT_DESCRIPTION =
  'Réduisez la facture énergétique de vos sites industriels, tertiaires et résidentiels collectifs : audit, travaux, financement CEE et suivi des économies. Partout en France.';

export default function App() {
  const theme = useTheme();
  const siteConfig = useSiteConfig();
  const preview = usePreviewState();
  const [currentPath, setCurrentPath] = useState(() => normalize(window.location.pathname));
  const [cookieBannerOpen, setCookieBannerOpen] = useState(false);
  const [loaded, setLoaded] = useState<{ path: string; page: CmsPage | null } | null>(null);

  useEffect(() => {
    if (IS_PREVIEW || localStorage.getItem('pexen_cookie_consent')) return;
    const timer = setTimeout(() => setCookieBannerOpen(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const open = () => setCookieBannerOpen(true);
    const pop = () => setCurrentPath(normalize(window.location.pathname));
    window.addEventListener('pexen:open-cookies', open);
    window.addEventListener('popstate', pop);
    return () => {
      window.removeEventListener('pexen:open-cookies', open);
      window.removeEventListener('popstate', pop);
    };
  }, []);

  useEffect(() => {
    const rule = siteConfig?.redirects?.find((r) => r.from === currentPath);
    if (!rule) return;
    const next = normalize(rule.to.split('#')[0]);
    const hash = rule.to.includes('#') ? rule.to.slice(rule.to.indexOf('#')) : '';
    if (next === currentPath) return;
    try {
      window.history.replaceState({}, '', `${next}${hash}`);
    } catch {
      /* navigation bloquée */
    }
    setCurrentPath(next);
  }, [siteConfig, currentPath]);

  useEffect(() => {
    if (currentPath.startsWith('/blog/')) return;
    let alive = true;
    const isHome = currentPath === '/' || currentPath === '';
    /* Invalide tout de suite l’ancienne page → skeleton visible (sauf home). */
    if (!isHome && !IS_PREVIEW) setLoaded(null);
    const started = performance.now();
    const MIN_SK_MS = isHome || IS_PREVIEW ? 0 : 550;
    fetch(`/api/public/pages/by-path?path=${encodeURIComponent(currentPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(async (page: CmsPage | null) => {
        if (!alive) return;
        const wait = Math.max(0, MIN_SK_MS - (performance.now() - started));
        if (wait) await new Promise((r) => setTimeout(r, wait));
        if (alive) setLoaded({ path: currentPath, page });
      });
    return () => {
      alive = false;
    };
  }, [currentPath]);

  /* En aperçu éditeur : toujours la page postMessage (non enregistrée), jamais le cache API */
  const page = IS_PREVIEW
    ? preview?.page !== undefined && preview?.page !== null
      ? preview.page
      : loaded?.path === currentPath
        ? loaded.page
        : undefined
    : loaded?.path === currentPath
      ? loaded.page
      : undefined;

  useEffect(() => {
    if (page === undefined) return;
    document.title = page?.seo?.seoTitle || (page ? `${page.title} | PEXEN` : DEFAULT_TITLE);
    document.querySelector('meta[name="description"]')?.setAttribute('content', page?.seo?.metaDescription || DEFAULT_DESCRIPTION);
  }, [page]);

  /* Après chargement CMS : scroll vers #ancre (301 / entrée directe / redirect client). */
  useEffect(() => {
    if (!page) return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    const tryScroll = () => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const t1 = window.setTimeout(tryScroll, 120);
    const t2 = window.setTimeout(tryScroll, 450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [page, currentPath]);

  const navigate = (newPath: string) => {
    // L'aperçu d'une page en cours d'édition reste figé sur cette page.
    if (IS_PREVIEW && preview?.page) return;
    const hashIndex = newPath.indexOf('#');
    const hash = hashIndex >= 0 ? newPath.slice(hashIndex) : '';
    const withoutHash = hashIndex >= 0 ? newPath.slice(0, hashIndex) : newPath;
    let clean = normalize(withoutHash || '/');
    const rule = (siteConfig?.redirects || []).find((r) => r.from === clean || r.from === withoutHash);
    if (rule) {
      const targetHash = rule.to.includes('#') ? rule.to.slice(rule.to.indexOf('#')) : '';
      clean = normalize(rule.to.split('#')[0]);
      if (!hash && targetHash) {
        try {
          window.history.pushState({}, '', `${clean}${targetHash}`);
        } catch {
          /* navigation bloquée */
        }
        setCurrentPath(clean);
        window.setTimeout(() => document.querySelector(targetHash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
        return;
      }
    }
    try {
      window.history.pushState({}, '', `${IS_PREVIEW ? `${clean}?cms-preview=1` : clean}${hash}`);
    } catch {
      /* navigation bloquée par le navigateur */
    }
    setCurrentPath(clean);
    if (hash) {
      window.setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderCurrentView = () => {
    if (!(IS_PREVIEW && preview?.page) && currentPath.startsWith('/blog/')) {
      const slug = currentPath.split('/').filter(Boolean)[1];
      if (slug) return <BlogPostView slug={slug} onNavigate={navigate} />;
    }
    if (page === undefined) {
      /* Accueil : pas de skeleton (demande métier). Pages internes : skeleton Ultra adapté. */
      const isHome = currentPath === '/' || currentPath === '';
      if (isHome || IS_PREVIEW) return <div className="min-h-[60vh]" aria-busy="true" />;
      const Sk = theme.PageSkeleton;
      return Sk ? <Sk path={currentPath} /> : <div className="min-h-[60vh]" aria-busy="true" />;
    }
    if (!page) return <NotFoundView onNavigate={navigate} />;
    return <CmsPageView page={page} onNavigate={navigate} selectedBlockId={preview?.selectedBlockId} scrollToBlockId={preview?.scrollToBlockId} scrollNonce={preview?.scrollNonce} />;
  };

  const Shell = theme.Shell;
  const shell = (
    <>
      {!IS_PREVIEW && (siteConfig?.settings.analyticsEnabled ?? true) && <SiteAnalytics path={currentPath} />}
      {!IS_PREVIEW && <Ga4Loader />}
      <Shell currentPath={preview?.page?.path ?? currentPath} onNavigate={navigate} onOpenCookies={() => setCookieBannerOpen(true)}>
        {renderCurrentView()}
      </Shell>

      {!IS_PREVIEW && (siteConfig?.settings.cookieBannerEnabled ?? true) && (
        <CookieBanner
          isOpen={cookieBannerOpen}
          onClose={() => setCookieBannerOpen(false)}
          onNavigateToCookies={() => {
            setCookieBannerOpen(false);
            navigate('/cookies/');
          }}
        />
      )}

      {!IS_PREVIEW && (siteConfig?.ai.enabled ?? true) && pathMatches(siteConfig?.ai.showOnPages ?? '*', currentPath) && (
        <AiAssistantButton onNavigateToContact={() => navigate('/contact/')} />
      )}

      {(siteConfig?.whatsapp.enabled ?? true) && <WhatsAppButton />}
    </>
  );

  return IS_PREVIEW ? shell : <MaintenanceGate>{shell}</MaintenanceGate>;
}
