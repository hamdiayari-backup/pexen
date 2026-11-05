import type { ThemeId } from '../cms/types';
import { asyncRouter, HttpError } from '../http';
import { requireAuth, requirePerm } from '../middleware/adminAuth';
import { activateTheme, installTheme, listThemesForAdmin } from '../themes/service';

const ALLOWED: ThemeId[] = ['default', 'pexen-ultra', 'pexen-maquette'];

function parseThemeId(raw: string): ThemeId {
  if ((ALLOWED as string[]).includes(raw)) return raw as ThemeId;
  throw new HttpError(400, 'Thème inconnu');
}

export function createAdminThemesRouter() {
  const router = asyncRouter();

  router.get('/', requireAuth(), async (_req, res) => {
    res.json({ themes: await listThemesForAdmin() });
  });

  router.post('/:id/install', requirePerm('appearance.themes', 'appearance.customize'), async (req, res) => {
    const id = parseThemeId(String(req.params.id));
    const withContent = req.body?.withContent !== false;
    const result = await installTheme(id, withContent);
    res.locals.audit = { action: 'theme.install', target: id, detail: { withContent } };
    res.json(result);
  });

  router.post('/:id/activate', requirePerm('appearance.themes'), async (req, res) => {
    const id = parseThemeId(String(req.params.id));
    const appearance = await activateTheme(id);
    res.locals.audit = { action: 'theme.activate', target: id };
    res.json({ appearance });
  });

  return router;
}
