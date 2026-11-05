import 'dotenv/config';
import { pool } from '../server/db/client';
import { updateSnapshot } from '../server/cms/store';
import { ultraFooterMenu } from '../server/themes/ultraContent';

const HERO_IMG = '/themes/ultra-s/images/pexen/centrale-froid.webp';

const SECTEUR_TEXT: Record<string, string> = {
  Industrie: 'Froid process, vapeur et air comprimé : optimisez pendant que la production tourne.',
  Tertiaire: 'Des plans d’actions chiffrés pour le décret tertiaire et le décret BACS.',
  'Bâtiments collectifs': 'Chaufferies, sortie du fioul et équilibrage des réseaux, pour les bailleurs et les syndics.',
  'Partenaires professionnels':
    'Délégataires, mandataires, fabricants et bureaux d’études : nous confiant la réalisation et la documentation de vos opérations.',
};

const snap = await updateSnapshot((s) => {
  const page = s.pages.find((p) => p.path === '/');
  if (page) {
    const hero = page.blocks.find((b) => b.type === 'hero');
    if (hero) {
      hero.data = {
        ...hero.data,
        media: 'image',
        mainImage: (hero.data.mainImage as string) || HERO_IMG,
        chipText: (hero.data.chipText as string) || '~35 °C',
      };
      hero.style = {
        ...hero.style,
        background: 'image',
        backgroundImage: HERO_IMG,
        overlay: 68,
        overlayTone: 'dark',
        decor: 'rings',
        paddingTop: 'none',
        paddingBottom: 'none',
      };
    }
    const panels = page.blocks.find((b) => b.type === 'panels');
    const items = panels?.data?.items;
    if (Array.isArray(items)) {
      for (const it of items as { title?: string; text?: string }[]) {
        if (it.title && SECTEUR_TEXT[it.title]) it.text = SECTEUR_TEXT[it.title];
      }
    }
  }
  const footer = s.menus.find((m) => m.id === 'footer');
  if (footer) footer.items = ultraFooterMenu() as typeof footer.items;
});

const home = snap.pages.find((p) => p.path === '/');
const hero = home?.blocks.find((b) => b.type === 'hero');
const footer = snap.menus.find((m) => m.id === 'footer');
console.log('hero.style', hero?.style);
console.log('hero.chipText', hero?.data?.chipText);
console.log(
  'footer cols',
  footer?.items.filter((i) => i.children?.length).map((i) => `${i.label} (${i.children?.length})`)
);
await pool.end();
