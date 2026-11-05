import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Monitor, RotateCw, Smartphone, Tablet } from 'lucide-react';
import { cx, Segmented, Spinner } from '../ui/primitives';

export type Device = 'desktop' | 'tablet' | 'mobile';
const WIDTHS: Record<Device, number> = { desktop: 1440, tablet: 820, mobile: 390 };

export interface PreviewPayload {
  page?: unknown;
  site?: unknown;
  selectedBlockId?: string | null;
  scrollToBlockId?: string | null;
  scrollNonce?: number;
}

export function DeviceSwitch({ value, onChange }: { value: Device; onChange: (d: Device) => void }) {
  return (
    <Segmented
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: 'desktop', label: <span className="sr-only">Ordinateur</span>, icon: Monitor },
        { value: 'tablet', label: <span className="sr-only">Tablette</span>, icon: Tablet },
        { value: 'mobile', label: <span className="sr-only">Mobile</span>, icon: Smartphone },
      ]}
    />
  );
}

/**
 * Aperçu réel : le site public est chargé dans une iframe (`?cms-preview=1`) et reçoit
 * les données en cours d'édition par postMessage. Rien n'est enregistré.
 */
export function PreviewFrame({
  path,
  payload,
  device,
  onBlockClick,
  className,
}: {
  path: string;
  payload: PreviewPayload;
  device: Device;
  onBlockClick?: (id: string) => void;
  className?: string;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [reloadKey, setReloadKey] = useState(0);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const clickRef = useRef(onBlockClick);
  clickRef.current = onBlockClick;

  const send = useCallback((p: PreviewPayload) => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    try {
      /* Clone JSON : garantit un snapshot frais (blocs hero/vidéo inclus) pour l’iframe */
      const page = p.page == null ? p.page : JSON.parse(JSON.stringify(p.page));
      win.postMessage({ type: 'pexen:preview', ...p, page }, window.location.origin);
    } catch (err) {
      console.error('[preview] envoi aperçu impossible', err);
    }
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return;
      const msg = e.data as { type?: string; id?: string };
      if (msg?.type === 'pexen:preview-ready') {
        setReady(true);
        send(payloadRef.current);
      } else if (msg?.type === 'pexen:block-click' && msg.id) {
        clickRef.current?.(msg.id);
      }
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [send]);

  useEffect(() => {
    if (!ready) return;
    const id = requestAnimationFrame(() => send(payload));
    return () => cancelAnimationFrame(id);
  }, [payload, ready, send]);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const target = WIDTHS[device];
  const scale = size.w ? Math.min(1, (size.w - (device === 'desktop' ? 0 : 32)) / target) : 1;
  const frameW = target;
  const frameH = size.h ? (size.h - (device === 'desktop' ? 0 : 32)) / scale : 800;
  const src = `${path}${path.includes('?') ? '&' : '?'}cms-preview=1`;

  return (
    <div ref={box} className={cx('relative h-full w-full overflow-hidden', device !== 'desktop' && 'bg-slate-200/60', className)}>
      <div
        className={cx('absolute left-1/2 top-0 origin-top overflow-hidden bg-white', device !== 'desktop' && 'top-4 rounded-[22px] shadow-2xl ring-8 ring-navy-900')}
        style={{ width: frameW, height: frameH, transform: `translateX(-50%) scale(${scale})` }}
      >
        <iframe
          key={`${src}-${reloadKey}`}
          ref={frame}
          src={src}
          title="Aperçu du site"
          className="h-full w-full border-0"
          onLoad={() => {
            setReady(true);
            send(payloadRef.current);
          }}
        />
      </div>
      {!ready ? (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Spinner className="h-6 w-6" />
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setReady(false);
          setReloadKey((k) => k + 1);
        }}
        title="Recharger l’aperçu"
        className="absolute bottom-3 right-3 rounded-full bg-white/90 p-2 text-slate-500 shadow ring-1 ring-slate-200 transition hover:text-slate-900"
      >
        <RotateCw className="h-4 w-4" />
      </button>
    </div>
  );
}
