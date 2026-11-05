/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import net from 'net';
import type { Request } from 'express';

export function normalizeIp(ip: string): string {
  const v = ip.trim();
  return v.startsWith('::ffff:') && net.isIPv4(v.slice(7)) ? v.slice(7) : v.toLowerCase();
}

export const clientIp = (req: Request) => normalizeIp(req.ip || req.socket.remoteAddress || '');

const ipv4ToInt = (ip: string) => ip.split('.').reduce((acc, n) => (acc << 8) + Number(n), 0) >>> 0;

/** Entrée valide : IPv4, IPv6 ou plage CIDR IPv4 (`10.0.0.0/8`). */
export function isValidIpRule(rule: string): boolean {
  const [addr, bits, extra] = rule.trim().split('/');
  if (extra !== undefined) return false;
  if (bits === undefined) return net.isIP(addr) !== 0;
  const n = Number(bits);
  return net.isIPv4(addr) && Number.isInteger(n) && n >= 0 && n <= 32;
}

export function ipMatches(ip: string, rule: string): boolean {
  const target = normalizeIp(ip);
  const [addr, bits] = rule.trim().split('/');
  if (bits === undefined) return normalizeIp(addr) === target;
  if (!net.isIPv4(addr) || !net.isIPv4(target)) return false;
  const n = Number(bits);
  const mask = n === 0 ? 0 : (~0 << (32 - n)) >>> 0;
  return (ipv4ToInt(addr) & mask) === (ipv4ToInt(target) & mask);
}

export const ipAllowed = (ip: string, rules: string[]) => !rules.length || rules.some((r) => ipMatches(ip, r));

/** Libellé lisible d'un user-agent : « Chrome · macOS ». */
export function describeUserAgent(ua: string | undefined | null): string {
  if (!ua) return 'Appareil inconnu';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : /curl\//i.test(ua)
              ? 'curl'
              : 'Navigateur';
  const os = /iPhone|iPad/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Mac OS X/.test(ua)
        ? 'macOS'
        : /Windows/.test(ua)
          ? 'Windows'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} · ${os}` : browser;
}
