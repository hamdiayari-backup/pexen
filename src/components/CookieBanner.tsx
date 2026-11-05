import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

interface CookieBannerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCookies: () => void;
}

export const CookieBanner: React.FC<CookieBannerProps> = ({
  isOpen,
  onClose,
  onNavigateToCookies
}) => {
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('pexen_cookie_consent');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAnalyticsConsent(parsed.analytics === true);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const persist = (analytics: boolean) => {
    localStorage.setItem(
      'pexen_cookie_consent',
      JSON.stringify({ necessary: true, analytics, timestamp: Date.now() })
    );
    window.dispatchEvent(new CustomEvent('pexen:cookie-consent', { detail: { analytics } }));
  };

  const handleRefuseAll = () => {
    persist(false);
    setShowPreferences(false);
    onClose();
  };

  const handleAcceptAll = () => {
    persist(true);
    setAnalyticsConsent(true);
    setShowPreferences(false);
    onClose();
  };

  const handleSaveCustom = () => {
    persist(analyticsConsent);
    setShowPreferences(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <aside aria-label="Gestion des cookies" className="fixed bottom-4 left-4 right-4 sm:right-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-white rounded-2xl p-5 shadow-2xl border border-px-border text-px-navy">
        {/* Top header row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-sm font-semibold text-px-navy tracking-tight">
            Mesurer, c'est notre métier.
          </h3>
          <button
            onClick={handleRefuseAll}
            className="text-[11px] text-slate-500 hover:text-px-navy underline underline-offset-2 shrink-0"
          >
            Continuer sans accepter
          </button>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed mb-4">
          Avec votre accord, nous utilisons Google Analytics pour comprendre comment ce site est consulté et l'améliorer. Aucun cookie de mesure n'est déposé sans votre choix.{' '}
          <button
            type="button"
            onClick={onNavigateToCookies}
            className="text-px-primary-dark underline font-medium hover:text-px-navy"
          >
            En savoir plus
          </button>
        </p>

        {showPreferences ? (
          <div className="space-y-3 pt-2 border-t border-slate-100 mb-4">
            {/* Category 1 */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 text-xs">
              <div>
                <div className="font-semibold text-slate-800">Cookies nécessaires</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Indispensables au fonctionnement du site et à la mémorisation de vos choix.
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Toujours actifs
              </span>
            </div>

            {/* Category 2 */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 text-xs">
              <div>
                <div className="font-semibold text-slate-800">Mesure d'audience (GA4)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Google Analytics nous indique les pages consultées de façon globale.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAnalyticsConsent(!analyticsConsent)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out border-2 border-transparent ${
                  analyticsConsent ? 'bg-px-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    analyticsConsent ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSaveCustom}
              className="w-full py-2 px-3 text-xs font-semibold bg-px-navy text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Enregistrer mes choix
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleRefuseAll}
              className="py-2 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors"
            >
              Tout refuser
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="py-2 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors"
            >
              Personnaliser
            </button>
            <button
              type="button"
              onClick={handleAcceptAll}
              className="py-2 px-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg text-center transition-colors border border-slate-300/80"
            >
              Tout accepter
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
