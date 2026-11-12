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
      'Un accompagnement adapté à votre projet',
      "Chaque site et chaque projet répondent à des enjeux différents. PEXEN intervient selon vos besoins — mission ciblée ou accompagnement global — de l'étude au financement CEE, jusqu'au suivi des performances.",
      IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
      [
        { value: '4 expertises', label: "de l'étude au financement" },
        { value: '1 équipe', label: "du premier relevé au bilan d'économies" },
        { value: 'COFRAC', label: 'contrôle par un organisme accrédité' },
      ]
    ),
    b(
      'richText',
      {
        html: `<div class="px-ultra-pillars">
  <header class="px-ultra-pillars__head">
    <span class="px-ultra-pillars__eyebrow">Accompagnement</span>
    <h2 class="px-ultra-pillars__title">Trois piliers, une seule équipe</h2>
    <p class="px-ultra-pillars__lead">Études, financement CEE et travaux : nous intervenons là où vous avez besoin de nous.</p>
  </header>
  <div class="px-ultra-pillars__grid">
    <a class="px-ultra-pillar" href="/expertises/bureau-etudes-fluides/">
      <span class="px-ultra-pillar__num">01</span>
      <h3 class="px-ultra-pillar__title">Études &amp; stratégie</h3>
      <p class="px-ultra-pillar__text">Audit, relevés, scénarios et feuille de route pour prioriser les investissements.</p>
      <span class="px-ultra-pillar__cta">Découvrir <span aria-hidden="true">→</span></span>
    </a>
    <a class="px-ultra-pillar" href="/expertises/financement-cee-reglementation/">
      <span class="px-ultra-pillar__num">02</span>
      <h3 class="px-ultra-pillar__title">CEE &amp; financement</h3>
      <p class="px-ultra-pillar__text">Éligibilité, note de calcul, montage du dossier jusqu’au contrôle COFRAC.</p>
      <span class="px-ultra-pillar__cta">Découvrir <span aria-hidden="true">→</span></span>
    </a>
    <a class="px-ultra-pillar" href="/expertises/assistance-maitrise-ouvrage/">
      <span class="px-ultra-pillar__num">03</span>
      <h3 class="px-ultra-pillar__title">Accompagnement travaux</h3>
      <p class="px-ultra-pillar__text">Planification, suivi de chantier, mise en service et documents de fin de travaux.</p>
      <span class="px-ultra-pillar__cta">Découvrir <span aria-hidden="true">→</span></span>
    </a>
  </div>
</div>`,
        size: 'normal',
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Engagement',
        title: 'Quand les économies doivent être garanties',
        intro: '',
        style: 'hoverDark',
        columns: 2,
        headerLinkLabel: '',
        headerLink: '',
        items: [
          {
            id: uid('c'),
            title: 'Contrat de performance énergétique',
            text: 'Un objectif d’économies fixé par contrat, puis mesuré. Périmètre, baseline et suivi.',
            tags: ['CPE'],
            link: '/expertises/contrat-performance-energetique/',
            linkLabel: "Découvrir l'expertise",
            image: IMG('contrat-de-performance-energetique-sur-une-centrale-de-froid-commercial.webp'),
          },
          {
            id: uid('c'),
            title: 'Voir nos réalisations',
            text: 'Intermarché, Carrefour Market, CEDIM, Colorcon : enjeux, solutions et kWh cumac estimés.',
            tags: [],
            link: '/realisations/',
            linkLabel: 'Voir les références →',
            image: IMG('projets-de-performance-energetique-realises-par-pexen.webp'),
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Méthode',
        title: 'Comment se déroule une étude',
        intro: 'Quatre étapes, un livrable daté à chaque étape.',
        items: [
          { id: uid('s'), num: '01', title: 'Prévisite et audit', text: 'Relevé sur site, inventaire des utilités, année de référence.' },
          { id: uid('s'), num: '02', title: 'Dimensionnement', text: 'Ingénierie technique et financière, fiches CEE identifiées.' },
          { id: uid('s'), num: '03', title: 'Travaux et mise en service', text: 'Installation par nos équipes, sans arrêter l’exploitation.' },
          { id: uid('s'), num: '04', title: 'Contrôle et suivi', text: 'Dossier COFRAC, bilans de consommations, ajustements.' },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Méthode',
        title: "De l'audit à la mesure des économies",
        html: "<p>Chaque étape produit un livrable exploitable par votre direction : notes de calcul, planning, dossier CEE, bilans avant/après.</p>",
        bullets: ['Relevé avant toute préconisation', 'CEE engagés avant signature des devis', 'Travaux sans fermeture du site', 'Suivi des consommations après mise en service'],
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
      'richText',
      {
        html: `<div class="px-ultra-zig-list"><article class="px-ultra-zig">
  <div class="px-ultra-zig__copy">
    <span class="px-ultra-zig__num">Preuve terrain</span>
    <h2 class="px-ultra-zig__title">−40 % visés sur 10 ans</h2>
    <p class="px-ultra-zig__lead">Chez Carrefour Market, récupération de chaleur, régulation du froid, isolation toiture et fermeture des meubles sont combinés sous contrat de performance.</p>
    <ul class="px-ultra-zig__list"><li>Objectif contractuel −40 %</li><li>Périmètre froid + chaleur + enveloppe</li><li>30,6 GWh cumac estimés*</li></ul>
    <a class="px-ultra-zig__more" href="/realisations/carrefour-market-recuperation-de-chaleur/">Voir la réalisation <span aria-hidden="true">→</span></a>
  </div>
  <a class="px-ultra-zig__card" href="/realisations/carrefour-market-recuperation-de-chaleur/">
    <div class="px-ultra-zig__card-media"><img src="${IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp')}" alt="Carrefour Market" loading="lazy" width="640" height="400" /></div>
    <div class="px-ultra-zig__card-body">
      <p class="px-ultra-zig__card-tag">CPE · Grande distribution</p>
      <h3 class="px-ultra-zig__card-title">Carrefour Market : contrat de performance</h3>
      <div class="px-ultra-zig__card-metrics"><span>−40 % CPE</span><span>30,6 GWh cumac*</span></div>
    </div>
  </a>
</article></div>`,
        size: 'normal',
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
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
        html: `<div class="px-ultra-reg">
  <header class="px-ultra-reg__head">
    <span class="px-ultra-reg__eyebrow">Décret tertiaire</span>
    <h2 class="px-ultra-reg__title">−40 % en 2030, une trajectoire jusqu’en 2050</h2>
    <p class="px-ultra-reg__lead">Tout bâtiment, partie de bâtiment ou ensemble accueillant des activités tertiaires sur 1 000 m² ou plus doit réduire sa consommation d’énergie finale — ou atteindre un seuil en valeur absolue — par rapport à une année de référence entre 2010 et 2019. Déclaration annuelle sur <a href="https://operat.ademe.fr/" target="_blank" rel="noopener noreferrer">OPERAT</a> (ADEME), avant le 30 septembre.</p>
  </header>
  <div class="px-ultra-reg__grid">
    <article class="px-ultra-reg__card px-ultra-reg__card--now">
      <span class="px-ultra-reg__year">2030</span>
      <strong class="px-ultra-reg__goal">−40 %</strong>
      <p>Premier jalon réglementaire. Plan d’actions, année de référence et suivi OPERAT.</p>
    </article>
    <article class="px-ultra-reg__card">
      <span class="px-ultra-reg__year">2040</span>
      <strong class="px-ultra-reg__goal">−50 %</strong>
      <p>Renforcement de la trajectoire. Les actions lourdes (froid, enveloppe, GTB) se dimensionnent dès maintenant.</p>
    </article>
    <article class="px-ultra-reg__card">
      <span class="px-ultra-reg__year">2050</span>
      <strong class="px-ultra-reg__goal">−60 %</strong>
      <p>Objectif final. Chaque chantier d’aujourd’hui compte dans le bilan de demain.</p>
    </article>
  </div>
</div>`,
        size: 'normal',
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'table',
      {
        eyebrow: 'Décret BACS',
        title: 'La GTB obligatoire : qui et quand',
        intro:
          'Les bâtiments tertiaires dont le système de chauffage ou de climatisation dépasse les seuils ci-dessous doivent être équipés d’un système d’automatisation et de contrôle (GTB).',
        searchable: false,
        columns: ['Situation', 'Échéance'],
        rows: [
          { id: uid('r'), cells: ['Chauffage ou climatisation > 290 kW', 'Depuis le 1er janvier 2025'] },
          { id: uid('r'), cells: ['Existant entre 70 et 290 kW', '1er janvier 2030'] },
          { id: uid('r'), cells: ['Bâtiment neuf > 70 kW', 'Dès la construction'] },
        ],
      },
      { background: 'soft', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Suite logique',
        title: 'Passer à l’action sur le pilotage',
        intro: 'Une fois le seuil BACS identifié, la GTB de classe A ou B devient le levier technique — et souvent le levier CEE.',
        columns: 2,
        style: 'hoverDark',
        headerLinkLabel: '',
        headerLink: '',
        items: [
          {
            id: uid('c'),
            title: 'Pilotage GTB / GTC',
            text: 'Classes A et B, conformité BACS, supervision et gains ADEME estimés entre 15 et 30 % sur les postes pilotés.',
            image: IMG('pilotage-gtb-decret-bacs-pexen.webp'),
            imageAlt: 'Pilotage GTB tertiaire',
            tags: ['BAT-TH-116'],
            link: '/solutions/gtb-tertiaire-gtc/',
            linkLabel: 'Voir la solution',
          },
          {
            id: uid('c'),
            title: 'Audit énergétique',
            text: 'Relevé, année de référence, gisement et plan d’actions aligné décret tertiaire / OPERAT.',
            image: IMG('audit-energetique-entreprise.webp'),
            imageAlt: 'Audit énergétique en entreprise',
            tags: [],
            link: '/contact/?demande=etude',
            linkLabel: 'Demander une étude',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Financement',
        title: 'Le financement CEE, un levier intégré au projet',
        html: "<p>Les fournisseurs d'énergie ont l'obligation de financer des économies d'énergie chez leurs clients. Chaque action conforme à une opération standardisée ouvre droit à une valorisation qui réduit le reste à charge. Le financement accompagne le projet : il ne remplace ni le relevé, ni le dimensionnement.</p><ul><li>Éligibilité vérifiée avant devis</li><li>Note de calcul et pièces pour le contrôle COFRAC</li><li>Engagement du dossier avant signature des travaux</li></ul>",
        bullets: [],
        buttons: [etudeBtn(), estimBtn()],
        mediaType: 'image',
        image: IMG('cee-tertiaire.webp'),
        imageAlt: 'Dossier de financement CEE',
        videoSource: 'file',
        mediaPosition: 'right',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        title: 'Ce que nous prenons en charge',
        intro: '',
        cards: [
          {
            id: uid('ck'),
            title: '',
            icon: 'fa-check',
            entries: [
              { id: uid('e'), title: 'Lecture de vos obligations (tertiaire, BACS, audit).' },
              { id: uid('e'), title: 'Plan d’actions chiffré, CEE déduits.' },
              { id: uid('e'), title: 'Montage du dossier CEE avant signature des devis.' },
              { id: uid('e'), title: 'Pièces prêtes pour le contrôle COFRAC.' },
            ],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    faq('Questions fréquentes sur le financement CEE', [
      ['Quel montant de prime CEE puis-je obtenir ?', "Il dépend du volume de kWh cumac et du prix du marché. Nous le chiffrons à l'étude, avant toute signature."],
      ['Les CEE sont-ils cumulables avec d’autres aides ?', 'Souvent, selon les règles propres à chaque aide. Nous vérifions les cumuls projet par projet.'],
      ['Que se passe-t-il lors du contrôle ?', "Un organisme accrédité COFRAC vérifie sur site la conformité de l'opération. Nos dossiers sont constitués pour ce contrôle dès l'engagement."],
      ['Mon site est-il soumis au décret tertiaire ?', 'Si la surface tertiaire atteint 1 000 m² (bâtiment, partie ou ensemble), oui. La déclaration OPERAT est annuelle.'],
      ['Faut-il une GTB pour mon bâtiment ?', 'Au-delà de 290 kW de chauffage ou climatisation, l’obligation s’applique depuis 2025 ; entre 70 et 290 kW (existant), en 2030.'],
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
