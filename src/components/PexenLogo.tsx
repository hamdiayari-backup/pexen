import React from 'react';

interface PexenMarkProps {
  className?: string;
  accent?: string;
  frame?: string;
}

/** Pictogramme PEXEN pour les écrans d’administration. */
export const PexenMark: React.FC<PexenMarkProps> = ({ className = 'w-6 h-6', accent = '#009FCC', frame = '#FFFFFF' }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <rect x="6" y="8" width="28" height="24" rx="5" fill="none" stroke={frame} strokeWidth="2.4" />
    <path d="M14 20h12M20 14v12" stroke={accent} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

export const PexenLogo: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <div className={`flex items-center justify-center rounded-xl bg-[#082D4A] ${className}`} title="PEXEN">
    <PexenMark className="w-[70%] h-[70%]" />
  </div>
);
