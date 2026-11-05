/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import type { NextFunction, Request, Response } from 'express';
import { and, desc, eq, gte, ilike, like, lt, lte, or, sql, type SQL } from 'drizzle-orm';
import { db } from '../db/client';
import { auditLog } from '../db/schema';
import { clientIp } from './ip';
import type { AuthedRequest } from '../middleware/adminAuth';

export interface AuditEntry {
  action: string;
  target?: string;
  detail?: Record<string, unknown>;
  userId?: string;
  userEmail?: string;
}

/** Écrit une entrée du journal ; une erreur d'écriture ne fait jamais échouer la requête. */
export async function audit(req: Request | null, entry: AuditEntry): Promise<void> {
  const admin = (req as AuthedRequest | null)?.admin;
  try {
    await db.insert(auditLog).values({
      action: entry.action,
      target: entry.target?.slice(0, 300),
      detail: entry.detail,
      userId: entry.userId ?? admin?.sub,
      userEmail: entry.userEmail ?? admin?.email,
      ip: req ? clientIp(req) : null,
      userAgent: req ? String(req.headers['user-agent'] || '').slice(0, 300) : null,
    });
  } catch (e) {
    console.error('[audit] écriture impossible', e);
  }
}

/** Actions déduites des routes d'administration (méthode + chemin relatif à /api/admin). */
const RULES: [string, RegExp, string][] = [
  ['PUT', /^general$/, 'settings.general'],
  ['PUT', /^branding$/, 'appearance.branding'],
  ['PUT', /^settings$/, 'settings.site'],
  ['PUT', /^seo-settings$/, 'seo.settings'],
  ['PUT', /^floating-buttons$/, 'engagement.update'],
  ['PUT', /^newsletter$/, 'newsletter.settings'],
  ['PUT', /^google$/, 'seo.google'],
  ['POST', /^google\/disconnect$/, 'seo.google_disconnect'],
  ['PUT', /^menus\/([^/]+)$/, 'menu.update'],
  ['PUT', /^redirects$/, 'seo.redirects'],
  ['POST', /^pages$/, 'page.create'],
  ['PUT', /^pages\/([^/]+)$/, 'page.update'],
  ['DELETE', /^pages\/([^/]+)$/, 'page.delete'],
  ['POST', /^pages\/([^/]+)\/revisions\/[^/]+\/restore$/, 'page.restore'],
  ['POST', /^posts$/, 'post.create'],
  ['PUT', /^posts\/([^/]+)$/, 'post.update'],
  ['DELETE', /^posts\/([^/]+)$/, 'post.delete'],
  ['POST', /^posts\/([^/]+)\/revisions\/[^/]+\/restore$/, 'post.restore'],
  ['PUT', /^forms\/([^/]+)$/, 'form.update'],
  ['DELETE', /^submissions\/([^/]+)$/, 'submission.delete'],
  ['POST', /^performance\/run$/, 'performance.run'],
  ['POST', /^media\/upload$/, 'media.upload'],
  ['PATCH', /^media\/([^/]+)$/, 'media.update'],
  ['DELETE', /^media\/([^/]+)$/, 'media.delete'],
  ['PATCH', /^subscribers\/([^/]+)$/, 'subscriber.update'],
  ['DELETE', /^subscribers\/([^/]+)$/, 'subscriber.delete'],
  ['POST', /^modules\/upload$/, 'module.upload'],
  ['POST', /^modules\/install$/, 'module.install'],
  ['PUT', /^modules\/([^/]+)\/settings$/, 'module.settings'],
  ['POST', /^modules\/([^/]+)\/enabled$/, 'module.toggle'],
  ['POST', /^modules\/([^/]+)\/license$/, 'module.license'],
  ['DELETE', /^modules\/([^/]+)$/, 'module.delete'],
  ['POST', /^marketplace\/([^/]+)\/stage$/, 'marketplace.download'],
  ['POST', /^themes\/([^/]+)\/activate$/, 'theme.activate'],
  ['PUT', /^themes\/([^/]+)\/settings$/, 'theme.customize'],
  ['DELETE', /^themes\/([^/]+)$/, 'theme.delete'],
];

declare module 'express-serve-static-core' {
  interface Locals {
    /** `false` = ne pas journaliser ; objet = entrée explicite (prioritaire sur les règles). */
    audit?: false | Partial<AuditEntry>;
  }
}

/** Journalise automatiquement les modifications réussies faites depuis l'administration. */
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  res.on('finish', () => {
    const explicit = res.locals.audit;
    if (explicit === false || res.statusCode >= 400 || !(req as AuthedRequest).admin) return;
    const rel = req.originalUrl.split('?')[0].replace(/^\/api\/admin\/?/, '').replace(/\/$/, '');
    const rule = RULES.find(([m, re]) => m === req.method && re.test(rel));
    const action = explicit?.action ?? rule?.[2];
    if (!action) return;
    const target = explicit?.target ?? (rule ? rel.match(rule[1])?.[1] : undefined);
    void audit(req, { action, target: target ? decodeURIComponent(target) : undefined, detail: explicit?.detail });
  });
  next();
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  q?: string;
  from?: Date;
  to?: Date;
  page: number;
  pageSize: number;
}

export async function queryAudit(qry: AuditQuery) {
  const where: SQL[] = [];
  if (qry.userId) where.push(eq(auditLog.userId, qry.userId));
  if (qry.action) where.push(qry.action.endsWith('.') ? like(auditLog.action, `${qry.action}%`) : eq(auditLog.action, qry.action));
  if (qry.from) where.push(gte(auditLog.ts, qry.from));
  if (qry.to) where.push(lte(auditLog.ts, qry.to));
  if (qry.q) {
    const term = `%${qry.q.replace(/[%_]/g, '')}%`;
    where.push(or(ilike(auditLog.userEmail, term), ilike(auditLog.target, term), ilike(auditLog.ip, term), ilike(auditLog.action, term))!);
  }
  const cond = where.length ? and(...where) : undefined;
  const [items, [{ total }]] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(cond)
      .orderBy(desc(auditLog.ts), desc(auditLog.id))
      .limit(qry.pageSize)
      .offset((qry.page - 1) * qry.pageSize),
    db.select({ total: sql<number>`count(*)::int` }).from(auditLog).where(cond),
  ]);
  return { items, total };
}

export async function purgeAudit(days: number): Promise<number> {
  if (days <= 0) return 0;
  const rows = await db
    .delete(auditLog)
    .where(lt(auditLog.ts, new Date(Date.now() - days * 86400_000)))
    .returning({ id: auditLog.id });
  return rows.length;
}
