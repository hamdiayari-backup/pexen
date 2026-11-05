import React from 'react';

/**
 * Ambiance globale : schémas en fond (Amina ♥).
 * Favicon / ∞ réservé aux touches pertinentes (ex. photo dans les traits du logo) — pas en répétition.
 */
export function UltraAmbient() {
  return (
    <div className="px-ultra-ambient" aria-hidden="true">
      <div className="px-ultra-ambient__schema px-ultra-parallax" data-px-speed="0.12" />
      <div className="px-ultra-ambient__schema px-ultra-ambient__schema--b px-ultra-parallax" data-px-speed="-0.08" />
    </div>
  );
}
