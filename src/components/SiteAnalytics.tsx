import { useEffect, useRef } from 'react';

const SESSION_KEY = 'pexen_analytics_session';

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice(): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  if (w >= 1024) return 'desktop';
  return 'unknown';
}

export function SiteAnalytics({ path }: { path: string }) {
  const startRef = useRef(Date.now());
  const sentRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    sentRef.current = false;

    const payload = {
      sessionId: getSessionId(),
      path,
      referrer: document.referrer || undefined,
      device: detectDevice(),
    };

    fetch('/api/public/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, kind: 'view' }),
      keepalive: true,
    }).catch(() => {});

    return () => {
      if (sentRef.current) return;
      sentRef.current = true;
      const durationSec = Math.round((Date.now() - startRef.current) / 1000);
      fetch('/api/public/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, kind: 'leave', durationSec }),
        keepalive: true,
      }).catch(() => {});
    };
  }, [path]);

  return null;
}
