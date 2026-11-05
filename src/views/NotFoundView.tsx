import React from 'react';
import { ArrowRight, SearchX } from 'lucide-react';

interface NotFoundViewProps {
  onNavigate: (path: string) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center space-y-8">
      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto border border-slate-200">
        <SearchX className="w-8 h-8" />
      </div>

      <div className="space-y-3">
        <div className="text-xs font-semibold text-px-primary-dark uppercase tracking-wider font-mono">
          Erreur 404
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-px-navy">
          Cette page n'existe pas ou a été déplacée.
        </h1>
        <p className="text-base text-slate-600 leading-relaxed max-w-lg mx-auto">
          Le site PEXEN a été refondu : certaines adresses ont changé. Voici les pages les plus consultées.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <button
          onClick={() => onNavigate('/expertises/')}
          className="btn-secondary-pexen"
        >
          <span>Nos expertises</span>
        </button>

        <button
          onClick={() => onNavigate('/realisations/')}
          className="btn-secondary-pexen"
        >
          <span>Nos réalisations</span>
        </button>

        <button
          onClick={() => onNavigate('/contact/')}
          className="btn-primary-pexen"
        >
          <span>Parler de votre projet</span>
          <ArrowRight className="w-4 h-4 btn-arrow" />
        </button>
      </div>
    </div>
  );
};
