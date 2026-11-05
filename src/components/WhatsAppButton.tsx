import React, { useState } from 'react';
import { usePexenInfo, useSiteConfig } from '../context/SiteConfigContext';

export const WhatsAppButton: React.FC = () => {
  const PEXEN_INFO = usePexenInfo();
  const cfg = useSiteConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(
    cfg?.whatsapp.defaultMessage ||
      "Bonjour PEXEN, je vous contacte concernant un projet d'efficacité énergétique pour mes installations."
  );

  const whatsappPhone = (cfg?.whatsapp.number || PEXEN_INFO.phoneClean).replace(/\D/g, '');
  const showMobile = cfg?.whatsapp.showOnMobile ?? true;
  const showDesktop = cfg?.whatsapp.showOnDesktop ?? true;
  if (!showMobile && !showDesktop) return null;

  const sideClass = cfg?.whatsapp.position === 'bottom-left' ? 'px-fab--ai' : 'px-fab--wa';
  const hideClass = !showMobile ? 'd-none d-lg-flex' : !showDesktop ? 'd-flex d-lg-none' : '';

  const handleSend = () => {
    window.open(`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className={`px-fab ${sideClass} ${hideClass}`.trim()}>
      {isOpen ? (
        <div className="px-fab__panel" role="dialog" aria-label="WhatsApp PEXEN">
          <div className="px-fab__panel-head">
            <div>
              <strong>Permanence WhatsApp PEXEN</strong>
              <span>Ingénieurs en ligne · {PEXEN_INFO.slaHours}</span>
            </div>
            <button type="button" className="px-fab__close" onClick={() => setIsOpen(false)} aria-label="Fermer">
              ×
            </button>
          </div>
          <div className="px-fab__panel-body">
            <div className="px-fab__bubble">
              Bonjour ! Vous souhaitez échanger directement avec un ingénieur d&apos;affaires PEXEN sur vos installations ou dossiers CEE ?
            </div>
            <label htmlFor="px-wa-msg">Votre message initial</label>
            <textarea id="px-wa-msg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)} />
            <button type="button" className="px-fab__send px-fab__send--wa" onClick={handleSend}>
              Ouvrir dans WhatsApp
            </button>
            <p className="px-fab__hint">
              Ligne directe : <a href={`tel:${PEXEN_INFO.phoneClean}`}>{PEXEN_INFO.phone}</a>
            </p>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="px-fab__btn px-fab__btn--wa"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Contacter PEXEN sur WhatsApp"
        aria-expanded={isOpen}
      >
        <span className="px-fab__pulse" aria-hidden="true" />
        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
      </button>
    </div>
  );
};
