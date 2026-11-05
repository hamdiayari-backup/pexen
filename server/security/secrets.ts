/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import crypto from 'crypto';

/** Clé maîtresse : PEXEN_SECRET_KEY, sinon ADMIN_JWT_SECRET. La changer rend illisibles les secrets déjà chiffrés. */
function masterKey(): Buffer {
  const raw = process.env.PEXEN_SECRET_KEY || process.env.ADMIN_JWT_SECRET;
  if (!raw && process.env.NODE_ENV === 'production') throw new Error('PEXEN_SECRET_KEY ou ADMIN_JWT_SECRET doit être défini en production');
  return crypto.createHash('sha256').update(`pexen-secrets:${raw || 'dev-only-secret-pexen-cms'}`).digest();
}

export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey(), iv);
  const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), data.toString('base64url')].join(':');
}

export function decryptSecret(value: string | undefined | null): string | null {
  if (!value) return null;
  const [v, iv, tag, data] = value.split(':');
  if (v !== 'v1' || !iv || !tag || !data) return null;
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

export function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}
