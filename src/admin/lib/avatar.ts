/**
 * Snapify
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Préparation des images dans le navigateur avant envoi (photos de profil). */

export const AVATAR_ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

export interface PreparedImage {
  dataBase64: string;
  mimeType: string;
  /** URL `data:` utilisable comme aperçu immédiat. */
  preview: string;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image illisible : choisissez un fichier JPG, PNG ou WebP.'));
    };
    img.src = url;
  });
}

/**
 * Recadre au centre en carré et réduit à `size` px : quelques dizaines de Ko,
 * quel que soit le poids de la photo d'origine (les métadonnées EXIF disparaissent au passage).
 */
export async function prepareAvatar(file: File, size = 320): Promise<PreparedImage> {
  if (!AVATAR_ACCEPT.split(',').includes(file.type)) throw new Error('Format non pris en charge : JPG, PNG ou WebP uniquement.');
  if (file.size > MAX_SOURCE_BYTES) throw new Error('Photo trop lourde (15 Mo max.).');
  const img = await loadImage(file);
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  if (side < 32) throw new Error('Photo trop petite.');
  const out = Math.min(size, side);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const g = canvas.getContext('2d');
  if (!g) throw new Error('Votre navigateur ne permet pas de préparer la photo.');
  g.imageSmoothingQuality = 'high';
  g.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, out, out);
  let preview = canvas.toDataURL('image/webp', 0.86);
  let mimeType = 'image/webp';
  if (!preview.startsWith('data:image/webp')) {
    preview = canvas.toDataURL('image/jpeg', 0.88);
    mimeType = 'image/jpeg';
  }
  return { dataBase64: preview.slice(preview.indexOf(',') + 1), mimeType, preview };
}
