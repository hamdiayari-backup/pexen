/**
 * Recette Phase 2 — /realisations/ (page unique + ancres) + /notre-approche/
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

const CUMAC =
  '* Estimation calculée selon les fiches d’opérations standardisées CEE mobilisées (arrêté du 22 décembre 2014 modifié). Le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements ; il ne mesure pas les consommations réelles.';

function rich(html: string, bg: BlockStyle['background'] = 'white') {
  return b('richText', { html, size: 'normal' }, { background: bg, paddingTop: 'lg', paddingBottom: 'lg' });
}

function checklist(title: string, items: string[], bg: BlockStyle['background'] = 'white') {
  return b(
    'checklist',
    {
      title,
      intro: '',
      cards: [{ id: uid('ck'), title: '', icon: 'fa-check', entries: items.map((t) => ({ id: uid('e'), title: t })) }],
    },
    { background: bg, paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function faq(title: string, items: [string, string][]) {
  return b(
    'faq',
    {
      eyebrow: 'FAQ',
      title,
      layout: 'stacked',
      showContactCard: false,
      items: items.map(([q, a]) => ({ id: uid('f'), question: q, answer: `<p>${a}</p>` })),
    },
    { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function table(title: string, columns: string[], rows: string[][]) {
  return b(
    'table',
    {
      title,
      intro: '',
      searchable: false,
      columns,
      rows: rows.map((cells) => ({ id: uid('r'), cells })),
    },
    { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function steps(title: string, items: { title: string; text: string }[]) {
  return b(
    'steps',
    {
      eyebrow: 'Méthode',
      title,
      intro: '',
      items: items.map((it, i) => ({
        id: uid('s'),
        num: String(i + 1).padStart(2, '0'),
        title: it.title,
        text: it.text,
      })),
    },
    { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
  );
}

function refCard(opts: {
  id: string;
  title: string;
  meta: string;
  image: string;
  imageAlt: string;
  blocks: string; // inner html after h2
  result?: string;
}) {
  const result = opts.result
    ? `<p class="px-ultra-ref__result"><strong>${opts.result}</strong></p>`
    : '';
  return rich(
    `<article id="${opts.id}" class="px-ultra-ref">
      <h2 id="${opts.id}">${opts.title}</h2>
      <p class="px-ultra-ref__meta">${opts.meta}</p>
      <p><img src="${opts.image}" alt="${opts.imageAlt}" loading="lazy" /></p>
      ${opts.blocks}
      ${result}
    </article>`,
    'white'
  );
}

function upsert(pages: CmsPage[], path: string, title: string, blocks: CmsBlock[], seo: Partial<CmsPage['seo']>) {
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
}

function ensureRedirect(list: { from: string; to: string; permanent: boolean }[], from: string, to: string) {
  const i = list.findIndex((r) => r.from === from);
  if (i >= 0) list[i] = { from, to, permanent: true };
  else list.push({ from, to, permanent: true });
}

function realisations(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Réalisations',
        title: 'Nos réalisations',
        highlight: '',
        intro:
          'Quatre projets d’efficacité énergétique, quatre configurations : un supermarché qui sort du fioul, une moyenne surface sous contrat de performance énergétique, un magasin de grande hauteur, un site pharmaceutique. Pour chacun : l’enjeu de départ, les solutions retenues, les fiches CEE mobilisées et l’économie d’énergie estimée.',
        image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
        imageAlt: 'Projets d’efficacité énergétique réalisés par PEXEN',
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: '4 projets', label: '4 configurations' },
          { id: uid('m'), value: '47,5 GWh cumac*', label: 'estimés sur l’ensemble' },
          { id: uid('m'), value: '3 régions', label: '2 secteurs' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    refCard({
      id: 'intermarche',
      title: 'Intermarché : sortir du fioul et optimiser le froid',
      meta: 'Bourgogne-Franche-Comté · Grande distribution',
      image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'),
      imageAlt: 'Pompe à chaleur air/eau installée par PEXEN chez Intermarché',
      blocks: `<h3>L'enjeu</h3><p>Un supermarché chauffé par deux chaudières fioul vétustes, une production de froid commercial énergivore et un objectif de décarbonation.</p>
<h3>Les solutions</h3><ul><li>Pompe à chaleur air/eau en remplacement du fioul.</li><li>Récupération de chaleur sur le groupe froid.</li><li>Déstratification d'air de la surface de vente.</li><li>GTB de classe B.</li><li>Fermeture des meubles frigorifiques et haute pression flottante.</li></ul>
<h3>Fiches CEE mobilisées</h3><p>BAT-TH-163 (Coup de pouce) · BAT-TH-139 · BAT-TH-134 · BAT-TH-116 · BAT-TH-142 · BAT-EQ-124</p>`,
      result: '14,8 GWh cumac d’économies d’énergie estimées* · sortie complète du fioul',
    }),
    refCard({
      id: 'carrefour-market',
      title: 'Carrefour Market : froid, chaleur et toiture sous contrat de performance',
      meta: 'Île-de-France · Grande distribution',
      image: IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
      imageAlt: 'Centrale de froid commercial chez Carrefour Market, projet d’efficacité énergétique PEXEN',
      blocks: `<h3>L'enjeu</h3><p>Une centrale de froid commercial de sept compresseurs, le premier poste électrique du magasin, et un objectif de réduction garanti par contrat.</p>
<h3>Les solutions</h3><ul><li>Récupération de chaleur sur la centrale froid.</li><li>Régulation haute pression flottante.</li><li>Isolation de la toiture-terrasse.</li><li>Fermeture des meubles à température positive et négative.</li></ul>
<h3>Fiches CEE mobilisées</h3><p>BAT-TH-139 · BAT-TH-134 · BAT-EN-107 · BAT-EQ-124 · BAT-EQ-125, avec bonification contrat de performance énergétique</p>`,
      result: '30,6 GWh cumac d’économies d’énergie estimées* · objectif contractuel −40 % sur le périmètre traité',
    }),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    refCard({
      id: 'cedim',
      title: 'CEDIM : ramener la chaleur au sol',
      meta: 'Centre-Val de Loire · Négoce et entrepôt',
      image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'),
      imageAlt: 'Déstratificateurs d’air installés par PEXEN chez CEDIM',
      blocks: `<h3>L'enjeu</h3><p>Un magasin de plus de 5 mètres sous plafond, chauffé par aérothermes gaz : l'air chaud stagne sous la toiture, le sol reste froid.</p>
<h3>La solution</h3><p>Trois déstratificateurs d'air qui renvoient la chaleur vers la zone occupée.</p>
<h3>Fiche CEE mobilisée</h3><p>BAT-TH-142</p>`,
      result: '2,1 GWh cumac d’économies d’énergie estimées*',
    }),
    refCard({
      id: 'colorcon',
      title: 'Colorcon : chaufferie vapeur et froid process',
      meta: 'Île-de-France · Industrie pharmaceutique',
      image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp'),
      imageAlt: 'Chaufferie vapeur du site Colorcon, projet d’efficacité énergétique industrielle',
      blocks: `<h3>L'enjeu</h3><p>Un site de production pharmaceutique dont les utilités tournent en continu : chaufferie vapeur, production de froid, réseaux de distribution.</p>
<h3>Les pistes étudiées</h3><p>Récupération de chaleur, pompe à chaleur en rehausse de chaleur fatale, régulation du groupe froid, brûleur micro-modulant, calorifugeage des réseaux.</p>
<h3>Fiches CEE étudiées</h3><p>IND-UT-137 · IND-UT-103 · IND-UT-116 · IND-UT-105 · IND-UT-131</p>`,
    }),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Comment lire nos chiffres</h2><p>Les volumes affichés sont exprimés en kWh cumac, l'unité officielle des certificats d'économies d'énergie. Ils sont calculés hors bonifications, à partir des fiches standardisées mobilisées sur chaque projet. Les économies mesurées sur les factures seront publiées au fil du suivi des consommations.</p>`,
      'soft'
    ),
    rich(
      `<h2>Grande distribution, négoce, industrie</h2><p>Trois des quatre projets concernent la grande distribution et le négoce, où le froid commercial et le chauffage des grands volumes concentrent l'essentiel des consommations. Le quatrième porte sur un site pharmaceutique, dont les utilités fonctionnent en continu. Chaque projet associe au moins deux expertises PEXEN : froid, chaleur, pilotage ou isolation.</p><p><a href="/expertises/">Nos expertises</a></p>`
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    checklist('Ce que ces projets ont en commun', [
      'Un relevé sur site avant toute préconisation.',
      'Plusieurs actions combinées sur un même site, rarement une seule.',
      'Des travaux menés sans fermer le magasin ni arrêter la production.',
      'Un dossier CEE engagé avant la signature des devis.',
    ]),
    rich(
      `<h2>Votre site ressemble à l'un de ces projets ?</h2><p>Supermarché équipé d'une centrale froid, bâtiment chauffé au fioul, entrepôt de grande hauteur, site industriel à vapeur : décrivez-nous votre configuration, un ingénieur vous indique sous 48 h ouvrées les actions à étudier en priorité.</p>`
    ),
    rich(`<p class="text-xs text-slate-500">${CUMAC}</p>`),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),
    rich(
      `<h2>Nos projets d'efficacité énergétique en chiffres</h2><p>47,5 GWh cumac d'économies d'énergie estimées sur l'ensemble de ces projets*, trois régions, deux secteurs, huit fiches CEE mobilisées sur les projets engagés.</p>`,
      'soft'
    ),
    finalCta(),
  ];
}

/** Fiche PDF Recette Phase 2 · Notre approche (p.102–108) — textes collés tels quels. */
function notreApproche(): CmsBlock[] {
  return [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        eyebrow: 'Notre approche',
        title: 'Notre approche',
        highlight: 'Optimiser aujourd’hui. Performer demain.',
        intro:
          "Derrière chaque site, des installations qui ne s’arrêtent jamais, et des équipes qui en portent la responsabilité face à des coûts qui augmentent et à des obligations qui se durcissent. PEXEN est né d’une conviction : la performance énergétique ne se décrète pas, elle s’ingénie. Elle commence par un audit énergétique sur le terrain, se calcule, se construit sur le chantier, puis se prouve dans le temps.",
        image: IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
        imageAlt: 'Ingénieur PEXEN lors d’un audit énergétique sur site',
        buttons: [contactBtn(), estimBtn()],
        metrics: [
          { id: uid('m'), value: '4 étapes', label: 'de l’audit à la mesure' },
          { id: uid('m'), value: '1 livrable', label: 'daté à chaque étape' },
          { id: uid('m'), value: 'COFRAC', label: 'contrôle par un organisme accrédité' },
        ],
        heroVariant: 'solution',
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'md' }
    ),

    /* §1 Notre mission */
    b(
      'textMedia',
      {
        eyebrow: 'Mission',
        title: 'Notre mission',
        html: `<p>Faire de la performance énergétique un levier maîtrisé, mesurable et durable pour les sites industriels, tertiaires et résidentiels collectifs. Notre vision : un parc bâti et industriel où chaque kWh économisé est calculé, réalisé et démontré.</p><p><strong>La performance ne se promet plus, elle se prouve.</strong></p>`,
        image: IMG('performance-energetique.webp'),
        imageAlt: 'Performance énergétique mesurée sur site',
        mediaPosition: 'right',
        bullets: [
          'Maîtrisé, mesurable et durable',
          'Industrie, tertiaire et résidentiel collectif',
          'Chaque kWh calculé, réalisé et démontré',
        ],
        buttons: [button('Demander une étude', '/contact/?demande=etude')],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),

    /* §2 Méthode 4 étapes */
    steps('Une méthode en 4 étapes, de l’audit énergétique à la mesure', [
      {
        title: 'Prévisite et audit',
        text: "Relevé des équipements, lecture des factures et des courbes de charge, mesures ponctuelles. Les audits réglementaires sont conduits avec notre partenaire Leo Energy, qualifié OPQIBI 1905 et 1717. Remis : pré-étude d’ingénierie avec le gisement par poste.",
      },
      {
        title: 'Dimensionnement et ingénierie technico-financière',
        text: "Notes de calcul, choix des équipements, chiffrage des travaux, calcul des kWh cumac et engagement du dossier CEE avant toute signature. Remis : dossier technique, devis, plan de financement.",
      },
      {
        title: 'Installation et mise en service',
        text: "Travaux réalisés par nos équipes et nos partenaires qualifiés, phasés pour maintenir l’exploitation, réglages et essais. Remis : procès-verbal de réception.",
      },
      {
        title: 'Contrôle COFRAC, suivi et performance',
        text: "Contrôle de l’opération par un organisme accrédité COFRAC, suivi des consommations, ajustement des réglages. Remis : bilan d’économies d’énergie.",
      },
    ]),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),

    /* §3 Nos valeurs */
    b(
      'cards',
      {
        eyebrow: '',
        title: 'Nos valeurs',
        intro: '',
        columns: 3,
        style: 'hoverDark',
        headerLinkLabel: '',
        items: [
          {
            id: uid('c'),
            title: 'Exigence',
            text: "La précision de l’ingénieur, à chaque étape : aucune préconisation sans relevé, une note de calcul signée pour chaque solution.",
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Engagement',
            text: "Jusqu’au résultat, pas jusqu’à la facture : un livrable à chaque étape, le suivi des consommations après travaux, une réponse sous 48 h ouvrées.",
            tags: [],
            link: '',
            linkLabel: '',
          },
          {
            id: uid('c'),
            title: 'Intégrité',
            text: "Des chiffres justes, des engagements tenus : une estimation n’est jamais présentée comme une mesure, les règles CEE et les limites d’une solution sont dites d’emblée.",
            tags: [],
            link: '',
            linkLabel: '',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),

    /* §4 Ingénierie, travaux et financement */
    b(
      'textMedia',
      {
        eyebrow: 'PEXEN',
        title: 'Ingénierie, travaux et financement réunis',
        html: `<p>Un bureau d’études s’arrête au rapport. Un installateur dimensionne au catalogue. Un intermédiaire CEE ne voit que la prime. PEXEN porte la note de calcul, le chantier et le dossier : le froid, la chaleur, le pilotage et l’isolation traités dans un même projet, par la même équipe.</p>`,
        image: IMG('equipe-pexen-ingenierie-travaux-financement.webp'),
        imageAlt: 'Équipe PEXEN sur site : ingénierie, travaux et financement',
        mediaPosition: 'left',
        bullets: [
          'Note de calcul portée en interne',
          'Chantier mené par la même équipe',
          'Dossier CEE monté jusqu’au contrôle',
          'Froid, chaleur, pilotage et isolation dans un même projet',
        ],
        buttons: [button('Parler de votre projet', '/contact/')],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),

    /* §5 Qualifiés */
    checklist('Qualifiés, assurés, contrôlés', [
      'RGE QualiPAC (chauffage et eau chaude sanitaire) et RGE Qualisol CESI.',
      'Audits énergétiques via notre partenaire Leo Energy : OPQIBI 1905 et 1717.',
      'Responsabilité civile professionnelle et garantie décennale : MIC Insurance.',
      'Opérations contrôlées par des organismes accrédités COFRAC.',
    ]),

    /* §6 Partenaires */
    rich(
      `<article id="partenaires"><h2>Un réseau de partenaires</h2><p>Obligés, délégataires et mandataires CEE, fabricants d'équipements frigorifiques et de pompes à chaleur, bureaux d'études : PEXEN travaille avec des partenaires choisis pour la conformité de leurs dossiers et la disponibilité de leurs équipements.</p></article>`,
      'soft'
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Demander une étude', text: '', buttons: [etudeBtn()] },
      { background: 'soft', paddingTop: 'none', paddingBottom: 'lg' }
    ),

    /* §7 Tableau livrables */
    table('Les livrables, étape par étape', ['Étape', 'Document remis', 'Ce qu’il contient'], [
      ['01 Prévisite et audit', 'Pré-étude d’ingénierie', 'État initial, gisement par poste, premières recommandations'],
      [
        '02 Ingénierie technico-financière',
        'Dossier technique, devis, plan de financement',
        'Notes de calcul, équipements, coût, CEE estimés, temps de retour',
      ],
      ['03 Installation', 'Procès-verbal de réception', 'Travaux réalisés, réglages, essais, réserves levées'],
      ['04 Suivi et performance', 'Bilan d’économies d’énergie', 'Consommations avant et après, écarts, ajustements'],
    ]),

    /* §8 Pourquoi un livrable */
    b(
      'textMedia',
      {
        eyebrow: 'Gouvernance',
        title: 'Pourquoi un livrable à chaque étape',
        html: `<p>Un projet d’efficacité énergétique engage plusieurs décideurs : direction technique, direction financière, exploitant, parfois conseil syndical. Un document daté à chaque étape permet à chacun de valider en connaissance de cause, et sert de pièce justificative au dossier CEE et au contrôle COFRAC.</p>`,
        image: IMG('tableau-gantt-pexen-sur-ordinateur-portable.webp'),
        imageAlt: 'Tableau de suivi de projet PEXEN sur ordinateur portable',
        mediaPosition: 'right',
        bullets: [
          'Direction technique, financière, exploitant, conseil syndical',
          'Document daté pour valider chaque étape',
          'Pièce justificative du dossier CEE',
          'Contrôle par un organisme accrédité COFRAC',
        ],
        buttons: [button('Demander une étude', '/contact/?demande=etude')],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      { variant: 'light', layout: 'centered', title: 'Parlons de votre projet', text: '', buttons: [contactBtn()] },
      { background: 'white', paddingTop: 'md', paddingBottom: 'md' }
    ),

    /* §9 FAQ */
    faq('Questions fréquentes sur notre approche', [
      [
        'L’audit énergétique est-il payant ?',
        'La prévisite et la pré-étude sont définies avec vous lors du premier échange, selon la taille du site et le niveau de détail attendu.',
      ],
      [
        'Combien de temps dure un projet ?',
        'De quelques semaines pour une déstratification à plusieurs mois pour une rénovation de chaufferie ou de centrale froid. Le planning figure dans le dossier de l’étape 2.',
      ],
      [
        'Comment mesurez-vous les économies ?',
        'Par comparaison des consommations avant et après travaux, corrigées du climat et de l’activité, à partir de vos compteurs ou de comptages posés pour le projet.',
      ],
      [
        'Travaillez-vous avec notre bureau d’études ou notre mainteneur ?',
        'Oui. Nous partageons nos relevés et nos notes de calcul, et nous coordonnons les interventions avec vos prestataires en place.',
      ],
      [
        'Que se passe-t-il si les économies sont inférieures aux prévisions ?',
        'Le suivi de l’étape 4 compare les consommations aux estimations. En cas d’écart, nous en recherchons la cause et ajustons les réglages.',
      ],
    ]),

    finalCta(),
  ];
}

const CHANTER_REDIRECTS: [string, string][] = [
  ['/realisations/intermarche-trevenans/', '/realisations/intermarche-sortie-du-fioul/'],
  ['/realisations/carrefour-market/', '/realisations/carrefour-market-recuperation-de-chaleur/'],
  ['/realisations/cedim/', '/realisations/cedim-destratification/'],
  ['/realisations/colorcon-bazainville/', '/realisations/colorcon-efficacite-energetique-industrielle/'],
  ['/partenaires/', '/notre-approche/#partenaires'],
];

const snap = await updateSnapshot((s) => {
  upsert(s.pages, '/realisations/', 'Réalisations', realisations(), {
    focusKeyphrase: "projets d'efficacité énergétique",
    seoTitle: "Projets d'efficacité énergétique : 4 références | PEXEN",
    metaDescription:
      "Projets d'efficacité énergétique PEXEN : Intermarché, Carrefour Market, CEDIM, Colorcon. Solutions installées, fiches CEE et économies d'énergie estimées.",
  });

  upsert(s.pages, '/notre-approche/', 'Notre approche', notreApproche(), {
    focusKeyphrase: 'audit énergétique',
    seoTitle: 'Audit énergétique, travaux et suivi : notre méthode | PEXEN',
    metaDescription:
      "De l'audit énergétique au bilan d'économies : prévisite, ingénierie technico-financière, installation, contrôle COFRAC et suivi. Un livrable à chaque étape.",
  });

  for (const [from, to] of CHANTER_REDIRECTS) {
    ensureRedirect(s.redirects, from, to);
  }

  /* Les 4 fiches canoniques restent publiées (pages dédiées). Autres démos → draft. */
  const keepPublished = new Set([
    '/realisations/intermarche-sortie-du-fioul/',
    '/realisations/carrefour-market-recuperation-de-chaleur/',
    '/realisations/cedim-destratification/',
    '/realisations/colorcon-efficacite-energetique-industrielle/',
  ]);
  for (const p of s.pages) {
    if (p.path.startsWith('/realisations/') && p.path !== '/realisations/' && p.template === 'project') {
      if (!keepPublished.has(p.path)) {
        p.status = 'draft';
        p.updatedAt = now();
      }
    }
  }

  const part = s.pages.find((p) => p.path === '/partenaires/');
  if (part) {
    part.status = 'draft';
    part.updatedAt = now();
  }
});

for (const path of ['/realisations/', '/notre-approche/']) {
  const p = snap.pages.find((x) => x.path === path);
  console.log(path, p ? `${p.status} · ${p.blocks.length} blocs · ${p.seo.seoTitle}` : 'MISSING');
}
console.log(
  'redirects',
  snap.redirects.filter((r) => CHANTER_REDIRECTS.some(([f]) => f === r.from)).map((r) => `${r.from} → ${r.to}`).join('\n')
);
await pool.end();
