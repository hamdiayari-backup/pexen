/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import nodemailer, { type Transporter } from 'nodemailer';
import { desc, lt, sql } from 'drizzle-orm';
import { loadSnapshot } from './cms/store';
import type { CmsSnapshot, SmtpSettings } from './cms/types';
import { db } from './db/client';
import { mailLog } from './db/schema';
import { decryptSecret } from './security/secrets';

export type SmtpSource = 'settings' | 'env' | 'none';

interface ResolvedSmtp {
  source: Exclude<SmtpSource, 'none'>;
  transport: Parameters<typeof nodemailer.createTransport>[0];
  from: string;
  replyTo?: string;
}

const quoteName = (name: string) => `"${name.replace(/["\\]/g, '')}"`;

/** Paramètres SMTP effectifs : réglages de l'administration, sinon variables SMTP_* du fichier .env. */
export function resolveSmtp(smtp: SmtpSettings, siteName: string, passwordOverride?: string): ResolvedSmtp | null {
  if (smtp.enabled && smtp.host) {
    const pass = passwordOverride ?? decryptSecret(smtp.passwordEnc) ?? '';
    const fromEmail = smtp.fromEmail || smtp.username;
    return {
      source: 'settings',
      transport: {
        host: smtp.host,
        port: smtp.port,
        secure: smtp.security === 'ssl',
        requireTLS: smtp.security === 'starttls',
        ignoreTLS: smtp.security === 'none',
        auth: smtp.username ? { user: smtp.username, pass } : undefined,
        connectionTimeout: smtp.timeoutSec * 1000,
        greetingTimeout: smtp.timeoutSec * 1000,
        socketTimeout: smtp.timeoutSec * 1000 * 2,
        tls: { rejectUnauthorized: !smtp.allowSelfSigned },
      },
      from: `${quoteName(smtp.fromName || siteName)} <${fromEmail}>`,
      replyTo: smtp.replyTo || undefined,
    };
  }
  if (process.env.SMTP_HOST) {
    return {
      source: 'env',
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' } : undefined,
      },
      from: process.env.SMTP_FROM || `${quoteName(siteName)} <noreply@pexen.fr>`,
    };
  }
  return null;
}

export const smtpSource = (s: CmsSnapshot): SmtpSource => resolveSmtp(s.system.smtp, s.branding.siteName)?.source ?? 'none';

let cached: { key: string; transporter: Transporter } | null = null;

function transporterFor(cfg: ResolvedSmtp): Transporter {
  const key = JSON.stringify(cfg.transport);
  if (cached?.key !== key) {
    cached?.transporter.close();
    cached = { key, transporter: nodemailer.createTransport(cfg.transport) };
  }
  return cached.transporter;
}

async function logMail(kind: string, to: string | string[], subject: string, status: 'sent' | 'failed' | 'skipped', error?: string) {
  try {
    await db.insert(mailLog).values({
      kind,
      toAddr: (Array.isArray(to) ? to.join(', ') : to).slice(0, 500),
      subject: subject.slice(0, 300),
      status,
      error: error?.slice(0, 500),
    });
  } catch (e) {
    console.error('[mail] journal impossible', e);
  }
}

export type MailKind = 'form' | 'newsletter' | 'invite' | 'reset' | 'security' | 'notification' | 'test' | 'system';

/** Envoie un e-mail sans jamais lever d'exception : le résultat est journalisé. */
export async function sendMail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  kind?: MailKind;
  replyTo?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const kind = options.kind ?? 'system';
  const recipients = Array.isArray(options.to) ? options.to.filter(Boolean) : options.to;
  if (!recipients.length) return { sent: false, reason: 'Aucun destinataire' };
  const s = await loadSnapshot();
  const cfg = resolveSmtp(s.system.smtp, s.branding.siteName);
  if (!cfg) {
    console.warn('[mail] SMTP non configuré — e-mail non envoyé:', options.subject);
    await logMail(kind, recipients, options.subject, 'skipped', 'SMTP non configuré');
    return { sent: false, reason: 'SMTP non configuré' };
  }
  try {
    await transporterFor(cfg).sendMail({
      from: cfg.from,
      to: recipients,
      replyTo: options.replyTo ?? cfg.replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    await logMail(kind, recipients, options.subject, 'sent');
    return { sent: true };
  } catch (e) {
    const reason = e instanceof Error ? e.message : String(e);
    console.error('[mail] échec d’envoi', reason);
    await logMail(kind, recipients, options.subject, 'failed', reason);
    return { sent: false, reason };
  }
}

/** Vérifie une configuration (éventuellement non enregistrée) et envoie un message de test. */
export async function testSmtp(smtp: SmtpSettings, to: string, passwordOverride?: string): Promise<{ ok: boolean; error?: string; source: SmtpSource }> {
  const s = await loadSnapshot();
  const cfg = resolveSmtp(smtp, s.branding.siteName, passwordOverride);
  if (!cfg) return { ok: false, error: 'Aucun serveur SMTP configuré', source: 'none' };
  const transporter = nodemailer.createTransport(cfg.transport);
  const subject = `Test d’envoi — ${s.branding.siteName}`;
  try {
    await transporter.verify();
    const { html, text } = renderEmail(s, {
      title: 'Votre configuration e-mail fonctionne',
      intro: `Ce message de test a été envoyé depuis l’administration de ${s.branding.siteName}.`,
      lines: [`Serveur : ${smtp.enabled ? `${smtp.host}:${smtp.port}` : 'configuration du fichier .env'}`],
    });
    await transporter.sendMail({ from: cfg.from, to, replyTo: cfg.replyTo, subject, html, text });
    await logMail('test', to, subject, 'sent');
    return { ok: true, source: cfg.source };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await logMail('test', to, subject, 'failed', error);
    return { ok: false, error, source: cfg.source };
  } finally {
    transporter.close();
  }
}

export function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Gabarit e-mail aux couleurs du site (HTML compatible clients mail + version texte). */
export function renderEmail(
  s: CmsSnapshot,
  /** `html` : fragment déjà échappé (tableau récapitulatif…) inséré après les lignes. */
  content: { title: string; intro: string; lines?: string[]; button?: { label: string; url: string }; outro?: string; html?: string }
): { html: string; text: string } {
  const color = s.branding.colors?.primary || '#2563eb';
  const site = escapeHtml(s.branding.siteName);
  const p = (t: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#334155">${escapeHtml(t)}</p>`;
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e8f0">
<tr><td style="background:${color};padding:18px 28px;color:#ffffff;font-weight:700;font-size:17px">${site}</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px;color:#0f172a">${escapeHtml(content.title)}</h1>
${p(content.intro)}
${(content.lines ?? []).map(p).join('')}
${content.html ?? ''}
${content.button ? `<p style="margin:24px 0"><a href="${escapeHtml(content.button.url)}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:9px">${escapeHtml(content.button.label)}</a></p><p style="margin:0 0 14px;font-size:12px;color:#64748b;word-break:break-all">${escapeHtml(content.button.url)}</p>` : ''}
${content.outro ? p(content.outro) : ''}
</td></tr>
<tr><td style="padding:16px 28px;background:#f8fafc;font-size:12px;color:#94a3b8">Message automatique envoyé par ${site}.</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    content.title,
    '',
    content.intro,
    ...(content.lines ?? []),
    ...(content.button ? ['', `${content.button.label} : ${content.button.url}`] : []),
    ...(content.outro ? ['', content.outro] : []),
  ].join('\n');
  return { html, text };
}

export async function listMailLog(page: number, pageSize: number) {
  const [items, [{ total }]] = await Promise.all([
    db.select().from(mailLog).orderBy(desc(mailLog.ts), desc(mailLog.id)).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(mailLog),
  ]);
  return { items, total };
}

export async function purgeMailLog(days: number): Promise<number> {
  if (days <= 0) return 0;
  const rows = await db.delete(mailLog).where(lt(mailLog.ts, new Date(Date.now() - days * 86400_000))).returning({ id: mailLog.id });
  return rows.length;
}
