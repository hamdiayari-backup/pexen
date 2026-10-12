/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CookieBanner } from './components/CookieBanner';
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
    if (currentPath.startsWith('/blog/')) return;
    let alive = true;
    fetch(`/api/public/pages/by-path?path=${encodeURIComponent(currentPath)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((page: CmsPage | null) => alive && setLoaded({ path: currentPath, page }));
    return () => {
      alive = false;
    };
  }, [currentPath]);

  const previewPage = IS_PREVIEW ? preview?.page ?? null : null;
  const page = previewPage ?? (loaded?.path === currentPath ? loaded.page : undefined);

  useEffect(() => {
    if (page === undefined) return;
    document.title = page?.seo?.seoTitle || (page ? `${page.title} | PEXEN` : DEFAULT_TITLE);
    document.querySelector('meta[name="description"]')?.setAttribute('content', page?.seo?.metaDescription || DEFAULT_DESCRIPTION);
  }, [page]);

  const navigate = (newPath: string) => {
    // L'aperçu d'une page en cours d'édition reste figé sur cette page.
    if (previewPage) return;
    let clean = normalize(newPath);
    const rule = (siteConfig?.redirects || []).find((r) => r.from === clean || r.from === newPath);
    if (rule) clean = normalize(rule.to);
    try {
      window.history.pushState({}, '', IS_PREVIEW ? `${clean}?cms-preview=1` : clean);
    } catch {
      /* navigation bloquée par le navigateur */
    }
    setCurrentPath(clean);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderCurrentView = () => {
    if (!previewPage && currentPath.startsWith('/blog/')) {
      const slug = currentPath.split('/').filter(Boolean)[1];
      if (slug) return <BlogPostView slug={slug} onNavigate={navigate} />;
    }
    if (page === undefined) return <div className="min-h-[60vh]" aria-busy="true" />;
    if (!page) return <NotFoundView onNavigate={navigate} />;
    return <CmsPageView page={page} onNavigate={navigate} selectedBlockId={preview?.selectedBlockId} scrollToBlockId={preview?.scrollToBlockId} scrollNonce={preview?.scrollNonce} />;
  };

  const shell = (
    <div className="min-h-screen flex flex-col bg-px-surface text-px-navy selection:bg-px-primary/20 selection:text-px-navy">
      {!IS_PREVIEW && (siteConfig?.settings.analyticsEnabled ?? true) && <SiteAnalytics path={currentPath} />}
      <Header currentPath={previewPage?.path ?? currentPath} onNavigate={navigate} />
      <main className="flex-1">{renderCurrentView()}</main>
      <Footer onNavigate={navigate} onOpenCookies={() => setCookieBannerOpen(true)} />

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
    </div>
  );

  return IS_PREVIEW ? shell : <MaintenanceGate>{shell}</MaintenanceGate>;
}
