import { useEffect, useState } from 'react';
import type { CmsPage } from '../server/cms/types';
import type { SiteConfigPayload } from './context/SiteConfigContext';

/**
 * Mode aperçu : le site est chargé dans une iframe du backoffice (`?cms-preview=1`).
 * Le backoffice envoie la page et/ou la configuration en cours d'édition par postMessage ;
 * rien n'est enregistré, et seuls les messages de la même origine sont acceptés.
 */
export const IS_PREVIEW =
  typeof window !== 'undefined' && window.parent !== window && new URLSearchParams(window.location.search).has('cms-preview');

export interface PreviewMessage {
  type: 'pexen:preview';
  page?: CmsPage | null;
  site?: Partial<SiteConfigPayload>;
  selectedBlockId?: string | null;
  scrollToBlockId?: string | null;
  /** Incrémenté à chaque demande de défilement, même vers le même bloc. */
  scrollNonce?: number;
}

type Listener = (msg: PreviewMessage) => void;
const listeners = new Set<Listener>();
let last: PreviewMessage | null = null;

if (IS_PREVIEW) {
  window.addEventListener('message', (e: MessageEvent) => {
    if (e.origin !== window.location.origin) return;
    const msg = e.data as PreviewMessage;
    if (msg?.type !== 'pexen:preview') return;
    last = { ...last, ...msg };
    listeners.forEach((l) => l(last!));
  });
  window.parent.postMessage({ type: 'pexen:preview-ready' }, window.location.origin);
}

export function usePreviewState(): PreviewMessage | null {
  const [state, setState] = useState<PreviewMessage | null>(last);
  useEffect(() => {
    if (!IS_PREVIEW) return;
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);
  return state;
}

export function notifyEditor(message: { type: 'pexen:block-click'; id: string } | { type: 'pexen:height'; height: number }) {
  if (IS_PREVIEW) window.parent.postMessage(message, window.location.origin);
}
