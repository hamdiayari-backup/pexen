/**
 * Pexen
 * © 2026 NOVALABS WEB DESIGN — Tunisie
 * Contact : contact@novalabs.tn · +216 24 734 647
 * Tous droits réservés. Toute reproduction, modification ou diffusion sans autorisation écrite est interdite.
 */
import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';

export class HttpError extends Error {
  /** `code` : identifiant stable exploité par l'administration (ex. PASSWORD_CHANGE_REQUIRED). */
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

type Handler = (req: Request, res: Response, next: NextFunction) => unknown;

function wrap(handler: Handler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

/** Router dont les handlers async propagent leurs erreurs au middleware d'erreur (Express 4). */
export function asyncRouter(): Router {
  const router = Router();
  for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
    const original = router[method].bind(router) as (path: string, ...h: Handler[]) => Router;
    (router as unknown as Record<string, unknown>)[method] = (path: string, ...handlers: Handler[]) =>
      original(path, ...handlers.map(wrap));
  }
  return router;
}

/** Pagination des listes : `?page=` (≥ 1) et `?pageSize=` borné entre 10 et 100. */
export function paging(query: Record<string, unknown>, defaultSize = 25): { page: number; pageSize: number } {
  const size = Number(query.pageSize);
  return {
    page: Math.max(1, Math.floor(Number(query.page)) || 1),
    pageSize: Number.isFinite(size) && size > 0 ? Math.min(Math.max(Math.floor(size), 10), 100) : defaultSize,
  };
}

export function apiErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const bodyError = (err as { type?: string })?.type === 'entity.too.large';
  const status = err instanceof HttpError ? err.status : bodyError ? 413 : 500;
  const message = bodyError ? 'Requête trop volumineuse' : err instanceof Error ? err.message : 'Erreur serveur';
  if (status >= 500) console.error('[api]', err);
  res.status(status).json({
    error: err instanceof HttpError || status < 500 ? message : 'Erreur serveur',
    ...(err instanceof HttpError && err.code ? { code: err.code } : {}),
  });
}
