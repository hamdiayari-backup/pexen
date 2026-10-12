import { Router, type Request, type Response, type NextFunction, type RequestHandler } from 'express';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
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

export function apiErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Erreur serveur';
  if (status >= 500) console.error('[api]', err);
  res.status(status).json({ error: status >= 500 ? 'Erreur serveur' : message });
}
