/**
 * Recette Phase 2 — Priorité 1 : URLs + 301, /expertises/, fiches Expertises, menus, footer.
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock, CmsPage } from '../server/cms/types';
import { pool } from '../server/db/client';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;
const now = () => new Date().toISOString();

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (label = 'Parler de votre projet'): ButtonData => button(label, '/contact/');
const estimBtn = (): ButtonData => button('Estimer le financement', '/simulateur-prime-cee/', 'secondary', 'none');
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');
const phoneBtn = (): ButtonData => button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone');

const finalCta = () =>
  b(
    'cta',
    {
      variant: 'dark',
      layout: 'centered',
      title: 'Un projet ? Parlons-en.',
      text: 'Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.',
      buttons: [contactBtn(), phoneBtn()],
    },
    { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
  );

const PATH_MAP: [string, string][] = [
  ['/etudes-ingenierie-energetique/', '/expertises/bureau-etudes-fluides/'],
  ['/accompagnement-travaux/', '/expertises/assistance-maitrise-ouvrage/'],
  ['/contrat-de-performance-energetique/', '/expertises/contrat-performance-energetique/'],
  ['/decret-tertiaire-decret-bacs/', '/expertises/financement-cee-reglementation/'],
  ['/estimation-financement/', '/simulateur-prime-cee/'],
  ['/simulateur-cee/', '/simulateur-prime-cee/'],
  ['/solutions/pilotage-gtb-decret-bacs/', '/solutions/gtb-tertiaire-gtc/'],
  ['/secteurs/batiments-collectifs/', '/secteurs/renovation-energetique-copropriete/'],
  /* Anciennes pages « expertises = solutions » → solutions */
  ['/expertises/froid-commercial-industriel/', '/solutions/froid-commercial-industriel/'],
  ['/expertises/recuperation-de-chaleur/', '/solutions/recuperation-de-chaleur/'],
  ['/expertises/pompe-a-chaleur-tertiaire/', '/solutions/pompe-a-chaleur-tertiaire/'],
  ['/expertises/gtb-tertiaire-gtc/', '/solutions/gtb-tertiaire-gtc/'],
  ['/expertises/isolation-technique/', '/solutions/isolation-technique/'],
  ['/partenaires/', '/notre-approche/#partenaires'],
];

function rewriteLinks(obj: unknown): unknown {
  if (typeof obj === 'string') {
    let s = obj;
    for (const [from, to] of PATH_MAP) {
      if (s === from || s.startsWith(from + '?')) s = s.replace(from, to);
      s = s.split(from).join(to);
    }
    return s;
  }
  if (Array.isArray(obj)) return obj.map(rewriteLinks);
  if (obj && typeof obj === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) out[k] = rewriteLinks(v);
    return out;
  }
  return obj;
}

function ensureRedirects(list: { from: string; to: string; permanent: boolean }[], from: string, to: string) {
  if (from === to) return;
  const i = list.findIndex((r) => r.from === from);
  if (i >= 0) list[i] = { from, to, permanent: true };
  else list.push({ from, to, permanent: true });
}

function hero(
  eyebrow: string,
  title: string,
  intro: string,
  image: string,
  metrics: { value: string; label: string }[],
  parent?: { label: string; link: string }
) {
  return b(
    'pageHeader',
    {
      breadcrumb: true,
      parentLabel: parent?.label,
      parentLink: parent?.link,
      eyebrow,
      title,
      intro,
      buttons: [contactBtn(), estimBtn()],
      image,
      imageAlt: title,
      metrics: metrics.map((m) => ({ id: uid('m'), ...m })),
    },
    { background: 'surface', paddingBottom: 'md' }
  );
}

function faq(title: string, items: [string, string][], eyebrow = 'FAQ') {
  return b(
    'faq',
    {
      eyebrow,
      title,
      layout: 'stacked',
      showContactCard: false,
      items: items.map(([q, a]) => ({ id: uid('f'), question: q, answer: a.startsWith('<') ? a : `<p>${a}</p>` })),
    },
    { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function expertisesLanding(): CmsBlock[] {
  return [
    hero(
      'Expertises',
      "Nos expertises, de l'étude au suivi",
      "PEXEN accompagne les sites industriels, tertiaires et résidentiels collectifs à chaque étape d'un projet de performance énergétique : l'étude, les travaux, l'engagement de résultat et le financement. Une seule équipe, du premier relevé au bilan d'économies.",
      IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
      [
        { value: '4 expertises', label: "de l'étude au financement" },
        { value: '1 équipe', label: "du premier relevé au bilan d'économies" },
        { value: 'COFRAC', label: 'contrôle par un organisme accrédité' },
      ]
    ),
    b(
      'cards',
      {
        eyebrow: 'Expertises',
        title: 'Quatre expertises, une seule équipe',
        style: 'hoverDark',
        columns: 2,
        headerLinkLabel: '',
        headerLink: '',
        items: [
          {
            id: uid('c'),
            title: 'Études et ingénierie',
            text: 'Audit, relevés, dimensionnement et solutions techniques.',
            tags: [],
            link: '/expertises/bureau-etudes-fluides/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('audit-batiment.webp'),
          },
          {
            id: uid('c'),
            title: 'Accompagnement travaux et AMO',
            text: 'Planification, suivi de chantier et mise en service.',
            tags: [],
            link: '/expertises/assistance-maitrise-ouvrage/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('pexen-partenaire-installateur-livraison-d-equipements-sur-chantier.webp'),
          },
          {
            id: uid('c'),
            title: 'Contrat de performance énergétique',
            text: 'Objectifs, mesure et suivi des consommations.',
            tags: [],
            link: '/expertises/contrat-performance-energetique/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('contrat-de-performance-energetique-sur-une-centrale-de-froid-commercial.webp'),
          },
          {
            id: uid('c'),
            title: 'Réglementation et financement',
            text: 'Décret tertiaire, décret BACS et aides financières.',
            tags: [],
            link: '/expertises/financement-cee-reglementation/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('cee-tertiaire.webp'),
          },
        ],
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Méthode',
        title: "De l'audit à la mesure des économies",
        html: "<p>Prévisite et audit, dimensionnement et ingénierie technico-financière, installation et mise en service, puis contrôle COFRAC et suivi des performances : quatre étapes, un livrable daté à chaque étape.</p>",
        bullets: [],
        buttons: [etudeBtn()],
        mediaType: 'image',
        image: IMG('performance-energetique.webp'),
        imageAlt: 'Méthode PEXEN',
        videoSource: 'file',
        mediaPosition: 'right',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq('Questions fréquentes', [
      ["Où intervenez-vous ?", "Partout en France métropolitaine, depuis notre siège d'Aubervilliers (Seine-Saint-Denis)."],
      ['Réalisez-vous les travaux vous-mêmes ?', 'Oui. PEXEN dimensionne, installe et met en service, avec ses équipes et des partenaires qualifiés, puis suit les consommations.'],
    ]),
    finalCta(),
  ];
}

function amoBlocks(): CmsBlock[] {
  return [
    hero(
      'Expertises',
      'Accompagnement travaux, de la faisabilité au contrôle',
      "Un projet énergétique se gagne aussi sur le chantier. Notre assistance à maîtrise d'ouvrage décharge vos équipes : nous vérifions la faisabilité, planifions les travaux, suivons le chantier et constituons le dossier jusqu'au contrôle.",
      IMG('pexen-partenaire-installateur-livraison-d-equipements-sur-chantier.webp'),
      [
        { value: '5 étapes', label: 'du relevé au dossier soldé' },
        { value: 'Site ouvert', label: 'travaux phasés, de nuit ou par zone' },
        { value: 'COFRAC', label: 'contrôle par un organisme accrédité' },
      ],
      { label: 'Expertises', link: '/expertises/' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Parcours',
        title: 'Le parcours en 5 étapes',
        intro: "Un seul interlocuteur du premier relevé jusqu'à la prise en charge complète du dossier.",
        style: 'timeline',
        deliverableLabel: '',
        phaseBanner: 'Avant travaux (01, 02) · Pendant les travaux (03) · Après travaux (04, 05)',
        items: [
          { id: uid('s'), num: '01', title: 'Étude et éligibilité', text: "Audit énergétique, relevés sur site et calcul du gisement. Étude de faisabilité technique et vérification de l'éligibilité aux dispositifs de financement." },
          { id: uid('s'), num: '02', title: 'Ingénierie et planification', text: "Notes de dimensionnement, choix des équipements, devis et plan de financement. Planning des travaux et organisation de l'assistance à maîtrise d'ouvrage." },
          { id: uid('s'), num: '03', title: 'Travaux et suivi de chantier', text: "Installation par nos équipes, suivi de chantier et AMO, mise en service et réglages, sans interrompre l'exploitation." },
          { id: uid('s'), num: '04', title: 'Fin de travaux et contrôle', text: 'Documents de fin de travaux et procès-verbal de réception. Pour les opérations CEE : contrôle par un organisme accrédité COFRAC.' },
          { id: uid('s'), num: '05', title: 'Prise en charge et suivi', text: "Rapport final et suivi du dossier de financement jusqu'à la prise en charge complète. Suivi des consommations après travaux." },
        ],
        buttons: [],
      } as Partial<BlockDataMap['steps']> & { phaseBanner: string },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Exploitation',
        title: 'Travailler en site occupé',
        html: "<p>Un supermarché ne ferme pas, une ligne de production ne s'arrête qu'à date fixe, un bâtiment collectif reste habité. Chaque planning est construit avec l'exploitant : interventions de nuit ou hors heures d'ouverture, phasage par circuit frigorifique, solutions de chauffage provisoires, consignation et plans de prévention.</p>",
        bullets: ['Site occupé'],
        buttons: [etudeBtn()],
        mediaType: 'image',
        image: IMG('drive-equipe-pexen.webp'),
        imageAlt: 'Équipe PEXEN sur site occupé',
        videoSource: 'file',
        mediaPosition: 'right',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Suivi',
        title: 'Ce que nous suivons sur chaque chantier',
        style: 'minimal',
        columns: 2,
        headerLinkLabel: '',
        headerLink: '',
        items: [
          { id: uid('c'), title: 'Planning', text: "Respect du planning et des fenêtres d'intervention.", tags: [] },
          { id: uid('c'), title: 'Conformité', text: 'Équipements posés conformes aux exigences techniques retenues.', tags: [] },
          { id: uid('c'), title: 'Dossier', text: 'Complétude du dossier de fin de travaux.', tags: [] },
          { id: uid('c'), title: 'Contrôle', text: 'Résultat du contrôle et corrections éventuelles.', tags: [] },
        ],
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq("Questions fréquentes sur l'accompagnement travaux", [
      ['Que vérifie le contrôle COFRAC ?', "Un organisme accrédité vérifie sur site que les travaux réalisés correspondent aux études et aux exigences techniques de l'opération."],
      ['Pouvez-vous intervenir sans fermer le site ?', 'Oui. Les travaux sont phasés par zone, par circuit ou pendant vos arrêts programmés.'],
      ['Travaillez-vous avec nos prestataires en place ?', "Oui. Nous coordonnons votre mainteneur, votre bureau d'études ou votre maître d'œuvre lorsqu'ils interviennent sur le projet."],
      ['Qui assure la mise en service ?', "Nos équipes, avec le fabricant lorsque l'équipement l'exige. Les réglages et essais figurent au procès-verbal de réception."],
      ["Combien de temps dure un chantier ?", 'De quelques jours pour une déstratification à plusieurs semaines pour une chaufferie ou une centrale froid.'],
    ]),
    finalCta(),
  ];
}

function cpeBlocks(): CmsBlock[] {
  return [
    hero(
      'Expertises',
      'Contrat de performance énergétique',
      "Avec un contrat de performance énergétique, l'économie n'est plus une promesse : c'est un objectif fixé par contrat, sur une durée et un périmètre définis. PEXEN conçoit le programme de travaux, le réalise et suit les consommations.",
      IMG('contrat-de-performance-energetique-sur-une-centrale-de-froid-commercial.webp'),
      [
        { value: '−40 %', label: 'objectif contractuel sur 10 ans*' },
        { value: 'Chaque année', label: 'mesure face à la référence' },
        { value: '2030', label: 'trajectoire alignée sur le décret tertiaire' },
      ],
      { label: 'Expertises', link: '/expertises/' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Parcours',
        title: "Le principe d'un CPE",
        intro: 'Un objectif chiffré, mesuré chaque année.',
        style: 'timeline',
        deliverableLabel: '',
        phaseBanner: 'Avant le contrat (01, 02) · Travaux (03) · Pendant le contrat (04)',
        items: [
          { id: uid('s'), num: '01', title: 'Situation de référence', text: "Consommations du périmètre avant travaux, corrigées du climat et de l'activité." },
          { id: uid('s'), num: '02', title: 'Objectif', text: 'Pourcentage de réduction des consommations, sur une durée de plusieurs années.' },
          { id: uid('s'), num: '03', title: 'Programme de travaux', text: 'Dimensionné pour atteindre cet objectif.' },
          { id: uid('s'), num: '04', title: 'Mesure et vérification', text: 'Comparaison chaque année des consommations à la référence.' },
        ],
        buttons: [],
      } as Partial<BlockDataMap['steps']> & { phaseBanner: string },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Exemple',
        title: '−40 % visés sur 10 ans',
        html: "<p>Dans un supermarché d'Île-de-France, PEXEN a combiné récupération de chaleur sur le froid commercial, régulation du froid, isolation de la toiture-terrasse et fermeture des meubles, dans un contrat qui vise −40 % de consommation sur le périmètre traité pendant 10 ans*.</p><p class=\"text-sm text-slate-500\">* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique, à conditions d'exploitation comparables.</p>",
        bullets: ['Grande distribution'],
        buttons: [etudeBtn()],
        mediaType: 'image',
        image: IMG('carrefour-market-recuperation-de-chaleur-sur-le-froid-commercial.webp'),
        imageAlt: 'Carrefour Market, récupération de chaleur',
        videoSource: 'file',
        mediaPosition: 'left',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq('Questions fréquentes sur le contrat de performance énergétique', [
      ["Que se passe-t-il si l'objectif n'est pas atteint ?", "Le contrat prévoit les modalités d'ajustement."],
      ["Sur quelle durée s'engage-t-on ?", 'Généralement plusieurs années, souvent 10 ans pour un programme qui associe froid, chaleur et enveloppe.'],
      ['Un CPE est-il possible dans l’industrie ?', 'Oui, sur un périmètre défini : utilités, froid process, chaufferie.'],
      ['Un CPE est-il compatible avec le décret tertiaire ?', "Oui. L'objectif contractuel peut être aligné sur la trajectoire du décret tertiaire."],
    ]),
    finalCta(),
  ];
}

function ceeBlocks(): CmsBlock[] {
  return [
    hero(
      'Expertises',
      'Réglementation et financement CEE',
      "Trois textes encadrent la performance énergétique des sites professionnels : le décret tertiaire, le décret BACS et l'obligation d'audit énergétique. Un dispositif les finance en partie : les certificats d'économies d'énergie. Le financement CEE n'est pas une fin en soi ; il réduit le reste à charge de travaux utiles. Notre rôle : transformer une obligation en plan d'actions financé, chiffré et défendable devant votre direction.",
      IMG('echeances-du-decret-tertiaire-et-du-decret-bacs.webp'),
      [
        { value: '−40 %', label: 'en 2030, tertiaire dès 1 000 m²' },
        { value: '290 kW', label: 'GTB obligatoire depuis 2025' },
        { value: '2,75 GWh/an', label: "seuil de l'audit obligatoire" },
      ],
      { label: 'Expertises', link: '/expertises/' }
    ),
    b(
      'richText',
      {
        html: `<h2>Décret tertiaire : −40 % en 2030</h2><p>Tout bâtiment, partie de bâtiment ou ensemble de bâtiments accueillant des activités tertiaires sur 1 000 m² ou plus doit réduire sa consommation d'énergie finale de 40 % en 2030, 50 % en 2040 et 60 % en 2050, par rapport à une année de référence comprise entre 2010 et 2019, ou atteindre un seuil en valeur absolue. Les consommations se déclarent chaque année sur la plateforme <a href="https://operat.ademe.fr/" target="_blank" rel="noopener noreferrer">OPERAT</a> de l'ADEME, avant le 30 septembre.</p><h2>Décret BACS : la GTB obligatoire</h2><p>Les bâtiments tertiaires dont le système de chauffage ou de climatisation dépasse 290 kW doivent être équipés d'un système d'automatisation et de contrôle (GTB) depuis le 1er janvier 2025. Pour les bâtiments existants entre 70 et 290 kW, l'échéance est fixée au 1er janvier 2030.</p><p><a href="/solutions/gtb-tertiaire-gtc/">Pilotage GTB / GTC</a></p>`,
        size: 'normal',
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Financement',
        title: 'Le financement CEE, un levier intégré au projet',
        html: "<p>Les fournisseurs d'énergie ont l'obligation de financer des économies d'énergie chez leurs clients. Chaque action conforme à une opération standardisée ouvre droit à une valorisation qui réduit le reste à charge. Le financement accompagne le projet : il ne remplace ni le relevé, ni le dimensionnement.</p>",
        bullets: ['Avant devis', 'Note de calcul'],
        buttons: [etudeBtn()],
        mediaType: 'image',
        image: IMG('cee-tertiaire.webp'),
        imageAlt: 'Financement CEE',
        videoSource: 'file',
        mediaPosition: 'right',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq('Questions fréquentes sur le financement CEE', [
      ['Quel montant de prime CEE puis-je obtenir ?', "Il dépend du volume de kWh cumac et du prix du marché. Nous le chiffrons à l'étude, avant toute signature."],
      ['Les CEE sont-ils cumulables avec d’autres aides ?', 'Souvent, selon les règles propres à chaque aide. Nous vérifions les cumuls projet par projet.'],
      ['Que se passe-t-il lors du contrôle ?', "Un organisme accrédité COFRAC vérifie sur site la conformité de l'opération. Nos dossiers sont constitués pour ce contrôle dès l'engagement."],
    ]),
    finalCta(),
  ];
}

function upsertPage(pages: CmsPage[], path: string, title: string, blocks: CmsBlock[], seo: Partial<CmsPage['seo']>) {
  let page = pages.find((p) => p.path === path);
  if (!page) {
    page = {
      id: uid('p'),
      path,
      title,
      status: 'published',
      publishedAt: now(),
      createdAt: now(),
      updatedAt: now(),
      template: 'default',
      contentSource: 'cms',
      blocks: [],
      seo: {
        focusKeyphrase: '',
        seoTitle: title,
        metaDescription: '',
        slug: path.replace(/\//g, ''),
        noindex: false,
        nofollow: false,
        twitterCard: 'summary_large_image',
        schemaType: 'WebPage',
      },
    };
    pages.push(page);
  }
  page.title = title;
  page.status = 'published';
  page.publishedAt = page.publishedAt || now();
  page.blocks = blocks;
  page.seo = { ...page.seo, ...seo, seoTitle: seo.seoTitle || page.seo.seoTitle };
  page.updatedAt = now();
  return page;
}

const snap = await updateSnapshot((s) => {
  /* --- Renommages de pages --- */
  for (const [from, to] of PATH_MAP) {
    if (to.includes('#')) continue; /* ancre : pas de rename de page */
    const src = s.pages.find((p) => p.path === from);
    const dst = s.pages.find((p) => p.path === to);
    if (src && !dst) {
      src.path = to;
      src.updatedAt = now();
    } else if (src && dst && src.id !== dst.id) {
      /* destination existe : on écrase le contenu utile plus bas, on garde redirect depuis from */
      src.status = 'draft';
      src.updatedAt = now();
    }
    ensureRedirects(s.redirects, from, to);
  }
  ensureRedirects(s.redirects, '/partenaires/', '/notre-approche/#partenaires');

  /* --- Contenu Expertises --- */
  upsertPage(s.pages, '/expertises/', 'Expertises', expertisesLanding(), {
    focusKeyphrase: 'expertise énergétique',
    seoTitle: 'Expertise énergétique : étude, travaux, CPE, financement | PEXEN',
    metaDescription:
      "Les expertises PEXEN : bureau d'études fluides, accompagnement travaux, contrat de performance énergétique, réglementation et financement CEE. Une seule équipe.",
  });

  const bureau = s.pages.find((p) => p.path === '/expertises/bureau-etudes-fluides/');
  if (bureau) {
    /* déjà enrichi ; juste SEO + parent */
    const h = bureau.blocks.find((x) => x.type === 'pageHeader');
    if (h) {
      (h.data as { parentLabel?: string; parentLink?: string }).parentLabel = 'Expertises';
      (h.data as { parentLink?: string }).parentLink = '/expertises/';
    }
    bureau.seo.focusKeyphrase = "bureau d'études fluides";
    bureau.seo.seoTitle = "Bureau d'études fluides CVC et ingénierie énergétique | PEXEN";
  }

  upsertPage(s.pages, '/expertises/assistance-maitrise-ouvrage/', "Accompagnement travaux", amoBlocks(), {
    focusKeyphrase: "assistance à maîtrise d'ouvrage",
    seoTitle: "Assistance à maîtrise d'ouvrage et suivi de chantier | PEXEN",
    metaDescription:
      "Assistance à maîtrise d'ouvrage pour vos travaux énergétiques : faisabilité, planification, suivi de chantier, documents de fin de travaux et contrôle COFRAC.",
  });

  upsertPage(s.pages, '/expertises/contrat-performance-energetique/', 'Contrat de performance énergétique', cpeBlocks(), {
    focusKeyphrase: 'contrat de performance énergétique',
    seoTitle: 'Contrat de performance énergétique (CPE) tertiaire | PEXEN',
    metaDescription:
      "Contrat de performance énergétique : un objectif d'économies fixé par contrat, puis mesuré. PEXEN conçoit, réalise et suit des CPE tertiaires et industriels.",
  });

  upsertPage(s.pages, '/expertises/financement-cee-reglementation/', 'Réglementation et financement CEE', ceeBlocks(), {
    focusKeyphrase: 'financement CEE',
    seoTitle: 'Financement CEE, décret tertiaire et décret BACS | PEXEN',
    metaDescription:
      'Financement CEE de vos travaux, décret tertiaire (−40 % en 2030), décret BACS : obligations, échéances et plan d’actions financé.',
  });

  /* Blog stub */
  if (!s.pages.find((p) => p.path === '/blog/')) {
    upsertPage(
      s.pages,
      '/blog/',
      'Blog',
      [
        hero('PEXEN', 'Blog', 'Articles et retours de chantier à venir.', IMG('performance-energetique.webp'), []),
        b('richText', { html: '<p>Le blog PEXEN sera bientôt disponible.</p>', size: 'normal' }, { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }),
        finalCta(),
      ],
      { focusKeyphrase: 'blog PEXEN', seoTitle: 'Blog | PEXEN', metaDescription: 'Actualités et retours de chantier PEXEN.', noindex: true }
    );
  }

  /* Partenaires : draft + redirect déjà posé */
  const part = s.pages.find((p) => p.path === '/partenaires/');
  if (part) {
    part.status = 'draft';
    part.updatedAt = now();
  }

  /* Réécrire tous les liens internes */
  for (const page of s.pages) {
    page.blocks = rewriteLinks(page.blocks) as CmsBlock[];
  }

  /* Menus */
  const primaryItems = [
    {
      id: 'u-exp',
      label: 'Expertises',
      path: '/expertises/',
      children: [
        { id: 'e1', label: 'Études et ingénierie', path: '/expertises/bureau-etudes-fluides/' },
        { id: 'e2', label: 'Accompagnement travaux et AMO', path: '/expertises/assistance-maitrise-ouvrage/' },
        { id: 'e3', label: 'Contrat de performance énergétique', path: '/expertises/contrat-performance-energetique/' },
        { id: 'e4', label: 'Réglementation et financement', path: '/expertises/financement-cee-reglementation/' },
      ],
    },
    {
      id: 'u-sol',
      label: 'Solutions',
      path: '/solutions/',
      children: [
        { id: 's1', label: 'Froid commercial et industriel', path: '/solutions/froid-commercial-industriel/' },
        { id: 's2', label: 'Récupération de chaleur', path: '/solutions/recuperation-de-chaleur/' },
        { id: 's3', label: 'Chauffage et traitement d’air', path: '/solutions/pompe-a-chaleur-tertiaire/' },
        { id: 's4', label: 'Pilotage GTB / GTC', path: '/solutions/gtb-tertiaire-gtc/' },
        { id: 's5', label: 'Isolation technique', path: '/solutions/isolation-technique/' },
      ],
    },
    {
      id: 'u-sec',
      label: 'Secteurs',
      path: '/secteurs/',
      children: [
        { id: 'c1', label: 'Industrie', path: '/secteurs/efficacite-energetique-industrielle/' },
        { id: 'c2', label: 'Tertiaire', path: '/secteurs/efficacite-energetique-tertiaire/' },
        { id: 'c3', label: 'Bâtiments collectifs', path: '/secteurs/renovation-energetique-copropriete/' },
      ],
    },
    { id: 'u-real', label: 'Réalisations', path: '/realisations/' },
    { id: 'u-meth', label: 'Notre approche', path: '/notre-approche/' },
    { id: 'u-contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
  ];
  for (const mid of ['primary', 'mobile'] as const) {
    const m = s.menus.find((x) => x.id === mid);
    if (m) m.items = primaryItems as typeof m.items;
  }

  const footer = s.menus.find((m) => m.id === 'footer');
  if (footer) {
    footer.items = [
      { id: 'ft-exp', label: 'Expertises', path: '/expertises/' },
      { id: 'ft-sol', label: 'Solutions', path: '/solutions/' },
      { id: 'ft-sec', label: 'Secteurs', path: '/secteurs/' },
      { id: 'ft-real', label: 'Réalisations', path: '/realisations/' },
      { id: 'ft-app', label: 'Notre approche', path: '/notre-approche/' },
      { id: 'ft-blog', label: 'Blog', path: '/blog/' },
      { id: 'ft-ctc', label: 'Contact', path: '/contact/' },
      { id: 'ft-leg', label: 'Mentions légales', path: '/mentions-legales/' },
      { id: 'ft-conf', label: 'Politique de confidentialité', path: '/politique-de-confidentialite/' },
    ];
  }
});

const paths = [
  '/expertises/',
  '/expertises/bureau-etudes-fluides/',
  '/expertises/assistance-maitrise-ouvrage/',
  '/expertises/contrat-performance-energetique/',
  '/expertises/financement-cee-reglementation/',
  '/simulateur-prime-cee/',
  '/solutions/gtb-tertiaire-gtc/',
  '/secteurs/renovation-energetique-copropriete/',
  '/blog/',
];
for (const path of paths) {
  const p = snap.pages.find((x) => x.path === path);
  console.log(path, p ? `${p.status} · ${p.blocks.length} blocs` : 'MISSING');
}
console.log(
  'redirects',
  snap.redirects.filter((r) => PATH_MAP.some(([f]) => f === r.from) || r.from === '/partenaires/').map((r) => `${r.from} → ${r.to}`).join('\n')
);
await pool.end();
