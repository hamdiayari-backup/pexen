/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
/** Images envoyées en base64 (photos de profil…) : contrôle du format réel, enregistrement et suppression. */
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { getDataPaths } from '../cms/store';

const FORMATS = {
  'image/jpeg': { ext: 'jpg', magic: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/png': { ext: 'png', magic: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  'image/webp': { ext: 'webp', magic: (b: Buffer) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
} as const;

export type ImageMime = keyof typeof FORMATS;

export class ImageError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/** Décode et vérifie une image : le type annoncé doit correspondre à la signature du fichier. */
export function decodeImage(input: { dataBase64?: unknown; mimeType?: unknown }, maxBytes: number): { buf: Buffer; ext: string } {
  const mime = String(input.mimeType || '') as ImageMime;
  const format = FORMATS[mime];
  if (!format) throw new ImageError(415, 'Format non pris en charge : JPG, PNG ou WebP uniquement.');
  const raw = String(input.dataBase64 || '').replace(/^data:[^;]+;base64,/, '');
  if (!raw || !/^[A-Za-z0-9+/=\s]+$/.test(raw)) throw new ImageError(400, 'Image illisible.');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length > maxBytes) throw new ImageError(413, `Image trop lourde (${Math.round(maxBytes / 1024)} Ko max.).`);
  if (buf.length < 12 || !format.magic(buf)) throw new ImageError(415, 'Le fichier n’est pas une image valide.');
  return { buf, ext: format.ext };
}

const SUBDIR_PATTERN = /^[a-z0-9][a-z0-9._-]*(\/[a-z0-9][a-z0-9._-]*)*$/;

/** Enregistre l'image sous public/uploads/<subdir>/ avec un nom imprévisible ; renvoie son URL publique. */
export async function saveImage(subdir: string, prefix: string, buf: Buffer, ext: string): Promise<string> {
  if (!SUBDIR_PATTERN.test(subdir)) throw new Error(`Dossier d'images invalide : ${subdir}`);
  const { UPLOADS_DIR } = getDataPaths();
  const dir = path.join(UPLOADS_DIR, subdir);
  await fs.mkdir(dir, { recursive: true });
  const safePrefix = prefix.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40) || 'image';
  const name = `${safePrefix}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  await fs.writeFile(path.join(dir, name), buf, { mode: 0o644 });
  return `/uploads/${subdir}/${name}`;
}

/** Supprime une image précédemment enregistrée dans ce dossier ; ignore toute autre URL. */
export async function removeImage(subdir: string, url: string | undefined | null): Promise<void> {
  if (!url || !SUBDIR_PATTERN.test(subdir) || !url.startsWith(`/uploads/${subdir}/`)) return;
  const name = url.slice(`/uploads/${subdir}/`.length);
  if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(name)) return;
  await fs.rm(path.join(getDataPaths().UPLOADS_DIR, subdir, name), { force: true }).catch(() => undefined);
}
