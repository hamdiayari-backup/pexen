import { useEffect } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';

type Consent = { analytics?: boolean };

function readConsent(): boolean {
  try {
    const saved = localStorage.getItem('pexen_cookie_consent');
    if (!saved) return false;
    return (JSON.parse(saved) as Consent).analytics === true;
  } catch {
    return false;
  }
}

function loadGa(id: string) {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void; __pexenGa?: string };
  if (w.__pexenGa === id) return;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtagFn() {
    w.dataLayer!.push(arguments);
  };
  w.gtag('js', new Date());
  w.gtag('config', id, { anonymize_ip: true });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  w.__pexenGa = id;
}

function track(name: string, params?: Record<string, string>) {
  try {
    if (!readConsent()) return;
    const w = window as Window & { gtag?: (...a: unknown[]) => void };
    w.gtag?.('event', name, params);
  } catch {
    /* ignore */
  }
}

/** GA4 brief 00i — aucune balise avant consentement (Consent Mode v2 basic). */
export function Ga4Loader() {
  const cfg = useSiteConfig();
  const id = cfg?.settings.seo?.gaMeasurementId?.trim() || '';
  const enabled = (cfg?.settings.analyticsEnabled ?? true) && /^G-[A-Z0-9]+$/i.test(id);

  useEffect(() => {
    if (!enabled) return;
    const boot = () => {
      if (readConsent()) loadGa(id);
    };
    boot();
    const onConsent = (e: Event) => {
      const analytics = (e as CustomEvent<Consent>).detail?.analytics;
      if (analytics) loadGa(id);
    };
    window.addEventListener('pexen:cookie-consent', onConsent);
    return () => window.removeEventListener('pexen:cookie-consent', onConsent);
  }, [enabled, id]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('a');
      if (!el) return;
      const href = el.getAttribute('href') || '';
      if (href.startsWith('tel:')) track('click_tel', { page: window.location.pathname });
      if (/wa\.me|whatsapp/i.test(href)) track('click_whatsapp', { page: window.location.pathname });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
