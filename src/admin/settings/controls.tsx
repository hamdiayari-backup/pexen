/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import React from 'react';
import type { SystemMeta, SystemView } from '../lib/api';
import { Field, Input } from '../ui/primitives';

export type SystemForm = Omit<SystemView, 'smtp'> & { smtp: SystemView['smtp'] & { password: string; clearPassword: boolean } };

export interface TabProps {
  v: SystemForm;
  set: <K extends keyof SystemForm>(key: K, patch: Partial<SystemForm[K]>) => void;
  meta: SystemMeta;
}

/** Bornes identiques à la validation serveur : [min, max, libellé, minimum si non nul]. */
const BOUNDS: Record<string, [number, number, string, number?]> = {
  'smtp.port': [1, 65535, 'Port SMTP'],
  'smtp.timeoutSec': [3, 120, 'Délai SMTP'],
  'security.passwordMinLength': [8, 64, 'Longueur minimale du mot de passe'],
  'security.passwordExpiryDays': [0, 730, 'Expiration du mot de passe'],
  'security.sessionHours': [1, 168, 'Durée de session'],
  'security.rememberDays': [1, 90, 'Durée « Rester connecté »'],
  'security.idleMinutes': [0, 1440, 'Déconnexion après inactivité'],
  'security.maxLoginAttempts': [3, 50, 'Tentatives de connexion'],
  'security.lockoutMinutes': [1, 1440, 'Durée de blocage'],
  'limits.publicApiPerMinute': [0, 100_000, 'API publique', 30],
  'limits.adminApiPerMinute': [0, 100_000, 'API administration', 60],
  'limits.formSubmissions.max': [1, 10_000, 'Formulaires (nombre)'],
  'limits.formSubmissions.windowMinutes': [1, 1440, 'Formulaires (durée)'],
  'limits.newsletter.max': [1, 10_000, 'Newsletter (nombre)'],
  'limits.newsletter.windowMinutes': [1, 1440, 'Newsletter (durée)'],
  'limits.passwordReset.max': [1, 10_000, 'Mot de passe oublié (nombre)'],
  'limits.passwordReset.windowMinutes': [1, 1440, 'Mot de passe oublié (durée)'],
  'uploads.maxSizeMb': [1, 100, 'Taille maximale des fichiers'],
  'privacy.analyticsRetentionDays': [30, 3650, 'Conservation des statistiques'],
  'privacy.submissionsRetentionDays': [0, 3650, 'Conservation des messages'],
  'privacy.auditRetentionDays': [30, 3650, 'Conservation du journal d’activité'],
  'privacy.mailLogRetentionDays': [7, 3650, 'Conservation du journal des e-mails'],
  'performance.publicCacheSeconds': [0, 3600, 'Cache public'],
};

const at = (obj: unknown, path: string): unknown => path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);

export function boundError(path: string, value: number): string | undefined {
  const b = BOUNDS[path];
  if (!b) return undefined;
  const [min, max, , nonZeroMin] = b;
  if (!Number.isInteger(value) || value < min || value > max) return `Valeur entière entre ${min} et ${max} attendue`;
  if (nonZeroMin && value > 0 && value < nonZeroMin) return `${nonZeroMin} minimum (ou 0 pour illimité)`;
  return undefined;
}

/** Première erreur de saisie du formulaire, au format « Libellé : message ». */
export function firstFormError(v: SystemForm): string | null {
  for (const [path, [, , label]] of Object.entries(BOUNDS)) {
    const err = boundError(path, Number(at(v, path)));
    if (err) return `${label} : ${err.charAt(0).toLowerCase()}${err.slice(1)}`;
  }
  return null;
}

export function NumberField({
  path,
  label,
  hint,
  value,
  onChange,
  suffix,
  className,
}: {
  path: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  className?: string;
}) {
  const err = boundError(path, value);
  const [min, max] = BOUNDS[path] ?? [undefined, undefined];
  return (
    <Field label={label} hint={hint} error={err} className={className}>
      <div className="flex items-center gap-2">
        <div className="w-28 shrink-0">
          <Input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            value={Number.isFinite(value) ? value : ''}
            invalid={!!err}
            onChange={(e) => onChange(e.target.value === '' ? Number.NaN : Number(e.target.value))}
            className="tabular-nums"
          />
        </div>
        {suffix ? <span className="text-sm text-slate-500">{suffix}</span> : null}
      </div>
    </Field>
  );
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isIpRule(rule: string): boolean {
  const [ip, bits, extra] = rule.split('/');
  if (extra !== undefined) return false;
  const m = IPV4.exec(ip);
  if (m) return m.slice(1).every((x) => Number(x) <= 255) && (bits === undefined || (/^\d{1,2}$/.test(bits) && Number(bits) <= 32));
  return /^[0-9a-f:]+$/i.test(ip) && ip.includes(':') && (bits === undefined || (/^\d{1,3}$/.test(bits) && Number(bits) <= 128));
}

const v4 = (ip: string) => {
  const m = IPV4.exec(ip);
  return m ? m.slice(1).reduce((n, x) => n * 256 + Number(x), 0) : null;
};

/** Indique si l'adresse est couverte par la liste (adresse exacte ou plage IPv4). */
export function ipInList(ip: string, rules: string[]): boolean {
  return rules.some((r) => {
    if (r === ip) return true;
    const [base, bits] = r.split('/');
    const a = v4(ip);
    const b = v4(base);
    if (a === null || b === null || bits === undefined) return false;
    const size = 2 ** (32 - Number(bits));
    return Math.floor(a / size) === Math.floor(b / size);
  });
}
