import React from 'react';

const DEFAULT_PHOTO = '/themes/ultra-s/images/pexen/centrale-froid.webp';
/** Symbole ∞ officiel PEXEN (forme logo, pas des cercles génériques). */
const MASK = '/brand/pexen-symbole-mask.svg';

/**
 * ∞ PEXEN réel : photo industrielle révélée dans le masque du symbole de marque.
 */
export function MaquetteInfinity({ photo }: { photo?: string }) {
  const src = photo || DEFAULT_PHOTO;

  return (
    <div className="px-maq-inf" aria-hidden="true">
      <div className="px-maq-inf__glow" />
      <div
        className="px-maq-inf__photo"
        style={{
          backgroundImage: `url('${src}')`,
          WebkitMaskImage: `url('${MASK}')`,
          maskImage: `url('${MASK}')`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      {/* Contour cyan léger via le même symbole en stroke approximation */}
      <img className="px-maq-inf__outline" src="/themes/ultra-s/images/pexen/infinity-mark.svg" alt="" />
    </div>
  );
}
