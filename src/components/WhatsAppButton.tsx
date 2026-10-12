import React, { useState } from 'react';
import { MessageCircle, X, Send, ArrowRight } from 'lucide-react';
import { usePexenInfo, useSiteConfig } from '../context/SiteConfigContext';

export const WhatsAppButton: React.FC = () => {
  const PEXEN_INFO = usePexenInfo();
  const cfg = useSiteConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(
    cfg?.whatsapp.defaultMessage ||
      'Bonjour PEXEN, je vous contacte concernant un projet d\'efficacité énergétique pour mes installations.'
  );

  const whatsappPhone = (cfg?.whatsapp.number || PEXEN_INFO.phoneClean).replace(/\D/g, '');

  const side = cfg?.whatsapp.position === 'bottom-left' ? 'left-5' : 'right-5';
  const showMobile = cfg?.whatsapp.showOnMobile ?? true;
  const showDesktop = cfg?.whatsapp.showOnDesktop ?? true;
  if (!showMobile && !showDesktop) return null;
  const visibility = !showMobile ? 'hidden lg:flex' : !showDesktop ? 'flex lg:hidden' : 'flex';

  const handleSend = () => {
    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${whatsappPhone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <div className={`fixed bottom-20 lg:bottom-6 ${side} z-40 ${visibility} items-center gap-2`}>
        {/* Subtle tooltip on desktop */}
        <div className="hidden xl:block bg-white/95 backdrop-blur-xs text-px-navy text-xs font-semibold py-1.5 px-3 rounded-full shadow-lg border border-slate-200 pointer-events-none opacity-90 transition-opacity">
          WhatsApp Direct
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Contacter PEXEN sur WhatsApp"
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group"
        >
          {/* Pulsing halo */}
          <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 animate-ping pointer-events-none" />

          {/* WhatsApp SVG Icon */}
          <svg
            viewBox="0 0 24 24"
            className="w-7 h-7 fill-current"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </button>
      </div>

      {/* Interactive Quick WhatsApp Drawer / Card */}
      {isOpen && (
        <div className={`fixed bottom-24 lg:bottom-24 ${side} z-50 w-[90vw] max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200`}>
          {/* Header */}
          <div className="bg-px-navy text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center font-bold">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Permanence WhatsApp PEXEN</div>
                <div className="text-[11px] text-px-primary-light flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-px-primary-light animate-pulse" />
                  <span>Ingénieurs en ligne · {PEXEN_INFO.slaHours}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 bg-px-surface space-y-3">
            <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs text-xs text-slate-700 leading-relaxed border border-slate-200">
              👋 Bonjour ! Vous souhaitez échanger directement avec un ingénieur d'affaires PEXEN sur vos installations ou dossiers CEE ?
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Votre message initial :
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#25D366] bg-white text-slate-800 resize-none"
              />
            </div>

            <button
              onClick={handleSend}
              className="w-full py-2.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <span>Ouvrir dans WhatsApp</span>
              <Send className="w-3.5 h-3.5" />
            </button>

            <div className="text-center text-[10px] text-slate-400">
              Ligne directe : <span className="font-mono text-slate-600">{PEXEN_INFO.phone}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
