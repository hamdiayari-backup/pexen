/**
 * Photos réalisations (Intermarché / Carrefour / CEDIM) + option Autres formulaire.
 */
import 'dotenv/config';
import { updateSnapshot } from '../server/cms/store';
import { pool } from '../server/db/client';

const IMAGES: Record<string, string> = {
  '/realisations/intermarche-sortie-du-fioul/': '/themes/ultra-s/images/pexen/realisation-intermarche-facade.webp',
  '/realisations/carrefour-market-recuperation-de-chaleur/':
    '/themes/ultra-s/images/pexen/realisation-carrefour-market-facade.webp',
  '/realisations/cedim-destratification/': '/themes/ultra-s/images/pexen/realisation-cedim-batiment.webp',
};

const snap = await updateSnapshot((s) => {
  for (const [path, image] of Object.entries(IMAGES)) {
    const page = s.pages.find((p) => p.path === path);
    if (page?.project) {
      page.project.image = image;
      console.log('image', path, image);
    }
  }

  for (const form of s.forms) {
    for (const field of form.fields || []) {
      if (field.name === 'vousEtes' || field.name === 'typeSite') {
        const opts = [...(field.options || [])];
        if (!opts.some((o) => /^autres?$/i.test(o))) {
          opts.push('Autres');
          field.options = opts;
          console.log('form', form.id, field.name, '+ Autres');
        }
      }
    }
  }
});

for (const [path, image] of Object.entries(IMAGES)) {
  const page = snap.pages.find((p) => p.path === path);
  console.log('ok', path, page?.project?.image === image);
}
await pool.end();
