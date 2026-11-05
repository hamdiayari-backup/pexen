/**
 * Import complet Brief webmaster Phase 2 Contenu SEO V5.1
 * — pages, redirections, formulaire contact, menu déjà via ultraPrimaryMenu
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uid } from '../cms/blocks';
import { BLOCK_CATALOG } from '../cms/blockCatalog';
import type { BlockDataMap, BlockKind, BlockStyle } from '../cms/blocks';
import type { CmsBlock, CmsPage, ContactFormField } from '../cms/types';
import { defaultSeoForPath } from '../cms/defaults';
import { updateSnapshot } from '../cms/store';
import { ultraPrimaryMenu, ultraThemePages } from './ultraContent';
import { installTheme } from './service';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_PATH = path.join(__dirname, 'briefV5Seed.json');

type SeedPage = {
  tab: string;
  path: string;
  title: string;
  seoTitle: string;
  metaDescription: string;
  h1: string;
  intro: string;
  image: string;
  bodyHtml: string;
  stats: { value: string; label: string }[];
  faqs: { q: string; a: string }[];
  noindex: boolean;
  status: 'published' | 'draft';
  disabled: boolean;
  template?: string;
};

type Seed = {
  pages: SeedPage[];
  redirects: [string, string][];
  formFields: { name: string; type: string; required: boolean; placeholder: string; error: string }[];
  llmsTxt: string;
};

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

function seedPageToCms(p: SeedPage): CmsPage {
  const now = new Date().toISOString();
  const blocks: CmsBlock[] = [];

  if (p.path === '/contact/') {
    blocks.push(
      b(
        'contactForm',
        {
          formId: 'contact-main',
          title: p.h1 || 'Parlons de votre projet',
          intro:
            p.intro ||
            'Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.',
          phoneLabel: 'Téléphone',
          phoneHint: '01 41 93 52 80',
          listItems: ['Étude sur site', 'Dimensionnement', 'Travaux & suivi'],
          submitLabel: 'Envoyer ma demande',
          variant: 'progressive',
          privacyPath: '/politique-de-confidentialite/',
        },
        { background: 'navy', paddingTop: 'xl', paddingBottom: 'xl' }
      )
    );
  } else if (p.path === '/contact/merci/') {
    blocks.push(
      b('cta', {
        variant: 'light',
        layout: 'centered',
        title: p.h1,
        text: p.intro || p.bodyHtml.replace(/<[^>]+>/g, ' ').trim(),
        buttons: [
          { id: uid('btn'), label: 'Voir nos réalisations', link: '/realisations/', variant: 'primary', icon: 'none' },
          { id: uid('btn'), label: 'Retour à l’accueil', link: '/', variant: 'secondary', icon: 'none' },
        ],
      })
    );
  } else {
    blocks.push(
      b('pageHeader', {
        breadcrumb: true,
        parentLabel: 'Accueil',
        parentLink: '/',
        title: p.h1,
        intro: p.intro || undefined,
        buttons: p.disabled
          ? []
          : [{ id: uid('btn'), label: 'Parler de votre projet', link: '/contact/', variant: 'primary', icon: 'none' }],
        image: p.image,
      })
    );

    if (p.stats?.length) {
      blocks.push(
        b(
          'stats',
          {
            title: 'Chiffres clés',
            style: 'strip',
            countUp: true,
            items: p.stats.map((s) => {
              const m = String(s.value).match(/^([^\d]*)([\d\s.,]+)(.*)$/);
              return {
                id: uid('k'),
                prefix: m?.[1]?.trim() || '',
                value: (m?.[2] || s.value).replace(/\s/g, ''),
                suffix: m?.[3]?.trim() || '',
                label: s.label,
              };
            }),
          },
          { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
        )
      );
    }

    if (p.bodyHtml?.trim()) {
      blocks.push(
        b(
          'richText',
          { html: p.bodyHtml, size: 'normal' },
          { background: 'white', paddingTop: 'lg', paddingBottom: 'lg', width: p.template === 'legal' ? 'narrow' : 'default' }
        )
      );
    }

    if (p.faqs?.length) {
      blocks.push(
        b('faq', {
          title: 'Questions fréquentes',
          layout: 'stacked',
          showContactCard: false,
          items: p.faqs.map((f) => ({ id: uid('f'), question: f.q, answer: f.a })),
        })
      );
    }

    if (!p.disabled && p.template !== 'legal' && p.path !== '/estimation-financement/') {
      blocks.push(
        b(
          'cta',
          {
            variant: 'dark',
            layout: 'centered',
            title: 'Un projet ? Parlons-en.',
            text: 'Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.',
            buttons: [{ id: uid('btn'), label: 'Parler de votre projet', link: '/contact/', variant: 'primary', icon: 'none' }],
          },
          { background: 'navy' }
        )
      );
    }
  }

  const seo = defaultSeoForPath(p.path, p.title);
  return {
    id: uid('p'),
    path: p.path,
    title: p.title,
    template: (p.template as CmsPage['template']) || 'default',
    status: p.status,
    publishedAt: p.status === 'published' ? now : undefined,
    createdAt: now,
    updatedAt: now,
    seo: {
      ...seo,
      seoTitle: p.seoTitle,
      metaDescription: p.metaDescription || seo.metaDescription,
      noindex: Boolean(p.noindex),
    },
    blocks,
    contentSource: 'cms',
  };
}

const FORM_NAME_BY_LABEL: Record<string, string> = {
  'Nom et prénom': 'nomPrenom',
  Société: 'societe',
  Fonction: 'fonction',
  'E-mail professionnel': 'email',
  Téléphone: 'telephone',
  'Vous êtes': 'vousEtes',
  'Type de site': 'typeSite',
  'Votre projet': 'projet',
  'Consentement RGPD': 'rgpdAccepted',
};

function mapFormFields(raw: Seed['formFields']): ContactFormField[] {
  const fields: ContactFormField[] = [];
  for (const f of raw) {
    const id = uid('fld');
    let type: ContactFormField['type'] = 'text';
    let options: string[] | undefined;
    if (/e-?mail/i.test(f.type) || /e-mail/i.test(f.name)) type = 'email';
    else if (/téléphone|telephone/i.test(f.type) || /téléphone|telephone/i.test(f.name)) type = 'tel';
    else if (/zone de texte|textarea/i.test(f.type) || /projet/i.test(f.name)) type = 'textarea';
    else if (/case à cocher|checkbox|consentement|rgpd/i.test(f.type) || /consentement|rgpd/i.test(f.name)) type = 'checkbox';
    else if (/liste/i.test(f.type)) {
      type = 'select';
      const m = f.type.match(/Liste\s*:\s*(.+)/i);
      options = (m?.[1] || '')
        .split('·')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    const name =
      FORM_NAME_BY_LABEL[f.name] ||
      f.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .replace(/^[A-Z]/, (c) => c.toLowerCase()) ||
      id;
    const full = type === 'textarea' || type === 'checkbox' || name === 'vousEtes';
    fields.push({
      id,
      name,
      label: type === 'checkbox' && f.placeholder ? f.placeholder : f.name,
      type,
      required: f.required,
      placeholder: type === 'checkbox' ? undefined : f.placeholder || undefined,
      options,
      width: full ? 'full' : 'half',
      error: f.error && f.error !== '—' ? f.error : undefined,
    });
  }
  return fields;
}

export async function installBriefV5() {
  const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf-8')) as Seed;

  // 1) Homepage + case studies Ultra (V5 home already in ultraContent)
  await installTheme('pexen-ultra', true);

  // 2) Merge all brief pages + redirects + form + menu
  const briefPages = seed.pages.map(seedPageToCms);
  const homeAndCore = ultraThemePages();
  const homePaths = new Set(homeAndCore.map((p) => p.path));

  await updateSnapshot((snap) => {
    const byPath = new Map(snap.pages.map((p) => [p.path, p]));

    // Keep Ultra homepage / simulateur as installed by theme; overwrite other brief paths
    for (const p of briefPages) {
      if (p.path === '/') continue; // homepage = ultra V5
      byPath.set(p.path, p);
    }
    // Ensure core ultra pages remain
    for (const p of homeAndCore) {
      if (p.path === '/') byPath.set(p.path, p);
      // realisations list & notre-approche from brief overwrite ultra stubs
    }

    snap.pages = [...byPath.values()];

    // Redirects
    const redirMap = new Map((snap.redirects || []).map((r) => [r.from, r]));
    for (const [from, to] of seed.redirects) {
      redirMap.set(from, { from, to, permanent: true });
    }
    snap.redirects = [...redirMap.values()];

    // Menu
    const items = ultraPrimaryMenu();
    const primary = snap.menus.find((m) => m.id === 'primary');
    const mobile = snap.menus.find((m) => m.id === 'mobile');
    if (primary) primary.items = items as typeof primary.items;
    if (mobile) mobile.items = JSON.parse(JSON.stringify(items));

    // Footer menu — expertises / solutions / pexen
    const footer = snap.menus.find((m) => m.id === 'footer');
    if (footer) {
      footer.items = [
        { id: 'f-exp', label: 'Expertises', path: '/etudes-ingenierie-energetique/' },
        { id: 'f-sol', label: 'Solutions', path: '/solutions/' },
        { id: 'f-sec', label: 'Secteurs', path: '/secteurs/' },
        { id: 'f-real', label: 'Réalisations', path: '/realisations/' },
        { id: 'f-app', label: 'Notre approche', path: '/notre-approche/' },
        { id: 'f-est', label: 'Estimer le financement', path: '/estimation-financement/' },
        { id: 'f-contact', label: 'Contact', path: '/contact/' },
        { id: 'f-ml', label: 'Mentions légales', path: '/mentions-legales/' },
        { id: 'f-pc', label: 'Politique de confidentialité', path: '/politique-de-confidentialite/' },
        { id: 'f-ck', label: 'Cookies', path: '/cookies/' },
      ];
    }

    // Formulaire contact V5
    const form = snap.forms.find((f) => f.id === 'contact-main');
    if (form) {
      form.fields = mapFormFields(seed.formFields);
      form.honeypotField = 'website_url';
      form.successPath = '/contact/merci/';
      form.recipientEmails = form.recipientEmails.length ? form.recipientEmails : ['contact@pexen.fr'];
      form.successMessage =
        'Merci, votre demande a bien été envoyée. Elle sera traitée dans les meilleurs délais par un ingénieur PEXEN.';
    }

    // Appearance version stamp
    const appearance = snap.appearance || { activeThemeId: 'pexen-ultra', installed: [] };
    const inst = appearance.installed.find((i) => i.id === 'pexen-ultra');
    if (inst) inst.contentVersion = 6;
    snap.appearance = appearance;
  });

  return {
    pages: briefPages.length,
    redirects: seed.redirects.length,
    homeKept: homePaths.has('/'),
  };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('installBriefV5.ts')) {
  installBriefV5()
    .then((r) => {
      console.log('Brief V5 installé', r);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
