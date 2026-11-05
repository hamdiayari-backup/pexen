/**
 * Remplace les pages internes « pageHeader + richText vide + cta » par des stacks Ultra
 * riches (textMedia, cards images, steps, faq, projects) — contenu brief Amina / briefPages.
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock } from '../server/cms/types';
import { pool } from '../server/db/client';
import seedJson from '../server/themes/briefV5Seed.json' with { type: 'json' };

const seedByPath = new Map(
  ((seedJson as { pages?: { path: string; bodyHtml?: string }[] }).pages || []).map((p) => [p.path, p])
);

const IMG = (file: string) => `/themes/ultra-s/images/pexen/${file}`;

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (label = 'Parler de votre projet'): ButtonData => button(label, '/contact/');

const cta = () =>
  b(
    'cta',
    {
      variant: 'dark',
      layout: 'centered',
      title: 'Un projet ? Parlons-en.',
      text: 'Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.',
      buttons: [contactBtn()],
    },
    { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
  );

const faq = (title: string, items: [string, string][], eyebrow = 'FAQ') =>
  b(
    'faq',
    {
      eyebrow,
      title,
      layout: 'stacked',
      showContactCard: false,
      items: items.map(([question, answer]) => ({
        id: uid('f'),
        question,
        answer: answer.startsWith('<') ? answer : `<p>${answer}</p>`,
      })),
    },
    { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
  );

const cards = (
  title: string,
  items: { title: string; text: string; link?: string; linkLabel?: string; image?: string; imageAlt?: string; icon?: string }[],
  opts: { intro?: string; eyebrow?: string; style?: 'hoverDark' | 'image' | 'numbered' | 'minimal' | 'card'; columns?: 2 | 3 | 4; bg?: BlockStyle['background'] } = {}
) =>
  b(
    'cards',
    {
      eyebrow: opts.eyebrow,
      title,
      intro: opts.intro,
      style: opts.style || (items.some((i) => i.image) ? 'hoverDark' : 'minimal'),
      columns: opts.columns || 3,
      headerLinkLabel: '',
      headerLink: '',
      items: items.map((it) => ({
        id: uid('c'),
        title: it.title,
        text: it.text,
        tags: [],
        link: it.link,
        linkLabel: it.linkLabel || (it.link ? 'Découvrir' : undefined),
        image: it.image,
        imageAlt: it.imageAlt || it.title,
        icon: it.icon,
      })),
    },
    { background: opts.bg || 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
  );

const steps = (title: string, items: { title: string; text: string }[], intro?: string, eyebrow = 'Parcours') =>
  b(
    'steps',
    {
      eyebrow,
      title,
      intro,
      style: 'timeline',
      deliverableLabel: '',
      items: items.map((it, i) => ({
        id: uid('s'),
        num: String(i + 1).padStart(2, '0'),
        title: it.title,
        text: it.text,
        deliverable: '',
      })),
      buttons: [{ id: uid('btn'), label: 'Parler de votre projet', link: '/contact/', variant: 'primary', icon: 'none' }],
    },
    { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
  );

const textMedia = (title: string, html: string, image: string, opts: { eyebrow?: string; bullets?: string[]; position?: 'left' | 'right' } = {}) =>
  b(
    'textMedia',
    {
      eyebrow: opts.eyebrow || 'PEXEN',
      title,
      html,
      bullets: opts.bullets || [],
      buttons: [],
      mediaType: 'image',
      image,
      imageAlt: title,
      videoSource: 'file',
      mediaPosition: opts.position || 'right',
      mediaStyle: 'logoMask',
      ratio: 'landscape',
      autoplay: false,
    },
    { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
  );

const projects = (title: string, intro?: string) =>
  b(
    'projects',
    {
      eyebrow: 'Réalisations',
      title,
      intro,
      layout: 'grid',
      filter: 'all',
      limit: 3,
      showFilters: false,
      headerLink: '/realisations/',
      headerLinkLabel: 'Voir toutes les réalisations',
    },
    { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
  );

function keepHeader(existing: CmsBlock | undefined, fallbackTitle: string, intro: string, image: string, parent?: { label: string; link: string }): CmsBlock {
  const d = (existing?.data || {}) as Record<string, unknown>;
  return b(
    'pageHeader',
    {
      breadcrumb: true,
      parentLabel: parent?.label || (d.parentLabel as string) || undefined,
      parentLink: parent?.link || (d.parentLink as string) || undefined,
      title: (d.title as string) || fallbackTitle,
      intro: intro || (d.intro as string) || '',
      buttons: (d.buttons as ButtonData[])?.length
        ? (d.buttons as ButtonData[])
        : [contactBtn()],
      image: (d.image as string) || image,
      imageAlt: (d.imageAlt as string) || fallbackTitle,
    },
    { background: 'surface', paddingBottom: 'md' }
  );
}

type Builder = (header: CmsBlock | undefined) => CmsBlock[];

const SKIP = new Set([
  '/',
  '/contact/',
  '/contact/merci/',
  '/estimation-financement/',
  '/notre-approche/',
  '/realisations/',
  '/mentions-legales/',
  '/politique-de-confidentialite/',
  '/cookies/',
  '/404/',
]);

const builders: Record<string, Builder> = {
  '/etudes-ingenierie-energetique/': (h) => [
    keepHeader(
      h,
      'Études et ingénierie énergétique',
      "Toute économie d'énergie commence par une étude. L'ingénierie énergétique de PEXEN réunit deux métiers complémentaires, réalisés en interne : l'ingénierie fluides, qui dimensionne les installations, et l'ingénierie efficacité énergétique, qui mesure le gisement et justifie chaque action.",
      IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp')
    ),
    textMedia(
      'Ingénierie fluides : dimensionner les installations',
      "<p>Remplacer une chaufferie, installer une pompe à chaleur, reprendre un réseau de ventilation : chaque équipement se dimensionne à partir des besoins réels du bâtiment. Nos ingénieurs fluides calculent les puissances, les débits, les températures de départ et les réseaux associés.</p>",
      IMG('installation-technique.webp'),
      {
        eyebrow: 'Fluides',
        bullets: ['CVC & plomberie', 'Désenfumage & réseaux'],
        position: 'right',
      }
    ),
    textMedia(
      'Ingénierie efficacité énergétique : mesurer et justifier',
      "<p>Le thermicien évalue ce que le site consomme, ce qu'il peut économiser et par quelles actions. Ses calculs fondent la décision d'investir et la valorisation des travaux.</p><p>Les audits réglementaires sont conduits avec notre bureau d'études partenaire Leo Energy, qualifié OPQIBI 1905 pour les bâtiments tertiaires et collectifs et OPQIBI 1717 pour l'industrie.</p>",
      IMG('audit-energetique-entreprise.webp'),
      {
        eyebrow: 'Efficacité',
        bullets: ['Audit & gisement', 'Notes de dimensionnement'],
        position: 'left',
      }
    ),
    cards(
      "Deux métiers d'ingénierie énergétique, une seule équipe",
      [
        {
          title: 'Bureau d’études + chantier',
          text: "Un bureau d'études qui ne réalise pas les travaux sous-estime parfois les contraintes de chantier. Un installateur sans ingénierie dimensionne au catalogue.",
          icon: 'drafting',
          image: IMG('audit-batiment.webp'),
        },
        {
          title: 'Une seule logique',
          text: 'Chez PEXEN, la note de calcul, le chantier et le suivi répondent à la même logique, portée par la même équipe.',
          icon: 'wrench',
          link: '/accompagnement-travaux/',
          linkLabel: 'Accompagnement travaux',
          image: IMG('assistance-a-maitrise-d-ouvrage-pexen-livraison-de-materiel-sur.webp'),
        },
        {
          title: 'Nos livrables',
          text: 'Audit énergétique, DPE tertiaire, notes de dimensionnement datées et signées, calcul du gisement action par action.',
          icon: 'fileCheck',
          image: IMG('performance-energetique.webp'),
        },
      ],
      { eyebrow: 'Complémentarité', style: 'hoverDark', columns: 3 }
    ),
    cards(
      'Les repères qui orientent nos études',
      [
        { title: '45 à 75 %', text: "Part du froid alimentaire dans les dépenses d'énergie d'un supermarché (Perifem).", image: IMG('drive-froid-commercial-industriel.webp') },
        { title: 'Jusqu’à 30 %', text: "Économie sur la consommation d'un groupe froid ancien avec une haute pression flottante.", image: IMG('regulation-haute-pression-flottante-sur-groupe-de-froid-commercial.webp') },
        { title: '15 à 30 %', text: 'Économie sur les consommations pilotées par une GTB (ADEME).', image: IMG('drive-pilotage-gtb-gtc.webp') },
        { title: '3 à 4 kWh', text: "Chaleur produits par une pompe à chaleur pour 1 kWh d'électricité.", image: IMG('drive-chauffage-traitement-dair.webp') },
      ],
      { eyebrow: 'Repères', style: 'hoverDark', columns: 4, bg: 'white' }
    ),
    steps(
      'Comment se déroule une étude',
      [
        { title: 'Visite technique', text: 'Relevé des équipements, des plaques signalétiques, des températures et des temps de fonctionnement.' },
        { title: 'Collecte des consommations', text: 'Consommations sur trois ans et courbes de charge.' },
        { title: 'Modélisation', text: 'Besoins et calcul du gisement par action.' },
        { title: 'Dimensionnement', text: 'Solutions retenues et note de calcul signée.' },
        { title: 'Restitution', text: 'Scénarios chiffrés, planning, plan de financement.' },
      ],
      'Un interlocuteur unique du relevé à la restitution chiffrée.'
    ),
    faq('Questions fréquentes sur nos études', [
      ["Quelle différence entre ingénierie fluides et efficacité énergétique ?", "L'ingénierie fluides dimensionne les installations (chauffage, ventilation, climatisation, plomberie, désenfumage). L'ingénierie efficacité énergétique mesure les consommations, calcule le gisement d'économies et justifie chaque action."],
      ['Mon entreprise doit-elle réaliser un audit énergétique ?', "Oui si sa consommation annuelle moyenne atteint 2,75 GWh et qu'elle ne dispose pas d'un système de management de l'énergie certifié ISO 50001. L'audit se renouvelle tous les quatre ans."],
      ['Les études sont-elles réalisées en interne ?', 'Oui. Seuls les audits réglementaires sont conduits avec notre partenaire qualifié Leo Energy.'],
      ["Combien de temps dure une étude ?", "De quelques jours pour une action ciblée à plusieurs semaines pour un audit de site complet. Le délai est fixé après la visite technique."],
    ]),
    cta(),
  ],

  '/accompagnement-travaux/': (h) => [
    keepHeader(
      h,
      'Accompagnement travaux, de la faisabilité au contrôle',
      "Un projet énergétique se gagne aussi sur le chantier. Notre assistance à maîtrise d'ouvrage décharge vos équipes : nous vérifions la faisabilité, planifions les travaux, suivons le chantier et constituons le dossier jusqu'au contrôle.",
      IMG('pexen-partenaire-installateur-livraison-d-equipements-sur-chantier.webp'),
      { label: 'Expertises', link: '/etudes-ingenierie-energetique/' }
    ),
    steps(
      'Le parcours en 5 étapes',
      [
        { title: 'Étude et éligibilité', text: "Audit énergétique, relevés sur site et calcul du gisement. Étude de faisabilité technique et vérification de l'éligibilité aux dispositifs de financement." },
        { title: 'Ingénierie et planification', text: "Notes de dimensionnement, choix des équipements, devis et plan de financement. Planning des travaux et organisation de l'assistance à maîtrise d'ouvrage." },
        { title: 'Travaux et suivi de chantier', text: "Installation par nos équipes, suivi de chantier et AMO, mise en service et réglages, sans interrompre l'exploitation." },
        { title: 'Fin de travaux et contrôle', text: 'Documents de fin de travaux et procès-verbal de réception. Pour les opérations CEE : contrôle par un organisme accrédité COFRAC.' },
        { title: 'Prise en charge et suivi', text: 'Rapport final et suivi du dossier de financement jusqu’à la prise en charge complète. Suivi des consommations après travaux.' },
      ],
      "Un seul interlocuteur du premier relevé jusqu'à la prise en charge complète du dossier."
    ),
    cards(
      'Avant, pendant, après les travaux',
      [
        {
          title: 'Avant : faisabilité et éligibilité',
          text: "Faisabilité technique, éligibilité CEE, coût des travaux et plan de financement, proposition d'un planning calé sur votre exploitation.",
          image: IMG('audit-batiment.webp'),
        },
        {
          title: 'Pendant : planification et suivi',
          text: "Planning calé sur votre exploitation (magasin ouvert, ligne en production), coordination des intervenants, points d'avancement.",
          image: IMG('chantier-de-renovation-globale-tertiaire.webp'),
        },
        {
          title: 'Après : documents et valorisation',
          text: 'PV de réception, attestation de fin de travaux, contrôle COFRAC, suivi des consommations et bilan d’économies.',
          image: IMG('cee-tertiaire.webp'),
        },
      ],
      { eyebrow: 'AMO', style: 'hoverDark', columns: 3 }
    ),
    textMedia(
      'Travailler en site occupé',
      "<p>Un supermarché ne ferme pas, une ligne de production ne s'arrête qu'à date fixe, un bâtiment collectif reste habité. Chaque planning est construit avec l'exploitant : interventions de nuit ou hors heures d'ouverture, phasage par circuit frigorifique, solutions de chauffage provisoires, consignation et plans de prévention.</p>",
      IMG('drive-equipe-pexen.webp'),
      { eyebrow: 'Exploitation', bullets: ['Site occupé', 'Phasage maîtrisé'], position: 'right' }
    ),
    cards(
      'Ce que nous suivons sur chaque chantier',
      [
        { title: 'Planning', text: "Respect du planning et des fenêtres d'intervention.", image: IMG('installation-technique.webp') },
        { title: 'Conformité', text: 'Équipements posés conformes aux exigences techniques retenues.', image: IMG('performance-energetique-centrale-froid-pexen.webp') },
        { title: 'Dossier', text: 'Complétude du dossier de fin de travaux.', image: IMG('cee-tertiaire.webp') },
        { title: 'Contrôle', text: 'Résultat du contrôle et corrections éventuelles.', image: IMG('opqibi.webp') },
      ],
      { eyebrow: 'Suivi', style: 'hoverDark', columns: 4, bg: 'white' }
    ),
    faq("Questions fréquentes sur l'assistance à maîtrise d'ouvrage", [
      ["Que vérifie le contrôle COFRAC ?", "Un organisme accrédité vérifie sur site que les travaux réalisés correspondent aux études et aux exigences techniques de l'opération."],
      ['Pouvez-vous intervenir sans fermer le site ?', 'Oui. Les travaux sont phasés par zone, par circuit ou pendant vos arrêts programmés.'],
      ['Travaillez-vous avec nos prestataires en place ?', "Oui. Nous coordonnons votre mainteneur, votre bureau d'études ou votre maître d'œuvre lorsqu'ils interviennent sur le projet."],
      ['Qui assure la mise en service ?', "Nos équipes, avec le fabricant lorsque l'équipement l'exige. Les réglages et essais figurent au procès-verbal de réception."],
      ["Combien de temps dure un chantier ?", "De quelques jours pour une déstratification à plusieurs semaines pour une chaufferie ou une centrale froid."],
    ]),
    cta(),
  ],

  '/contrat-de-performance-energetique/': (h) => [
    keepHeader(
      h,
      'Contrat de performance énergétique',
      "Avec un contrat de performance énergétique, l'économie n'est plus une promesse : c'est un objectif fixé par contrat, sur une durée et un périmètre définis. PEXEN conçoit le programme de travaux, le réalise et suit les consommations.",
      IMG('contrat-de-performance-energetique-sur-une-centrale-de-froid-commercial.webp'),
      { label: 'Expertises', link: '/etudes-ingenierie-energetique/' }
    ),
    steps(
      "Le principe d'un contrat de performance énergétique",
      [
        { title: 'Situation de référence', text: "Consommations du périmètre avant travaux, corrigées du climat et de l'activité." },
        { title: 'Objectif', text: 'Pourcentage de réduction des consommations, sur une durée de plusieurs années.' },
        { title: 'Programme de travaux', text: 'Dimensionné pour atteindre cet objectif.' },
        { title: 'Mesure et vérification', text: 'Comparaison chaque année des consommations à la référence.' },
      ],
      'Un objectif chiffré, mesuré chaque année.'
    ),
    textMedia(
      'Un exemple : −40 % sur 10 ans en grande distribution',
      "<p>Dans un supermarché d'Île-de-France, PEXEN a combiné récupération de chaleur sur le froid commercial, régulation du froid, isolation de la toiture-terrasse et fermeture des meubles, dans un contrat qui vise −40 % de consommation sur le périmètre traité pendant 10 ans*.</p><p class=\"text-sm text-slate-500\">* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique, à conditions d'exploitation comparables.</p>",
      IMG('carrefour-market-recuperation-de-chaleur-sur-le-froid-commercial.webp'),
      { eyebrow: 'Référence', bullets: ['Grande distribution', 'Objectif −40 %'], position: 'left' }
    ),
    cards(
      'Ce que change un CPE pour vos équipes',
      [
        { title: 'Objectif chiffré', text: 'Une trajectoire que la direction peut suivre année après année.', image: IMG('performance-energetique.webp') },
        { title: 'Décret tertiaire', text: 'Une trajectoire alignée sur −40 % en 2030.', image: IMG('echeances-du-decret-tertiaire-et-du-decret-bacs.webp') },
        { title: 'Valorisation renforcée', text: "Lorsque l'économie est contractualisée, la valorisation des travaux est renforcée.", image: IMG('cee-tertiaire.webp') },
        { title: 'Périmètre clair', text: 'Compteurs fiables, année de référence documentée, règles d’ajustement écrites.', image: IMG('pilotage-gtb-decret-bacs-pexen.webp') },
      ],
      { eyebrow: 'Avantages', style: 'hoverDark', columns: 4 }
    ),
    cards(
      'Quels travaux intégrer à un CPE',
      [
        { title: 'Froid & chaleur', text: 'Récupération de chaleur et régulation du froid commercial.', link: '/solutions/froid-commercial-industriel/', image: IMG('drive-froid-commercial-industriel.webp') },
        { title: 'Pompe à chaleur', text: 'Remplacement de la production de chaleur.', link: '/solutions/pompe-a-chaleur-tertiaire/', image: IMG('drive-chauffage-traitement-dair.webp') },
        { title: 'Isolation', text: 'Isolation des toitures-terrasses.', link: '/solutions/isolation-technique/', image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp') },
        { title: 'GTB / BACS', text: 'Gestion technique du bâtiment.', link: '/solutions/pilotage-gtb-decret-bacs/', image: IMG('drive-pilotage-gtb-gtc.webp') },
      ],
      { eyebrow: 'Périmètre', style: 'hoverDark', columns: 4, bg: 'white' }
    ),
    faq('Questions fréquentes sur le contrat de performance énergétique', [
      ["Que se passe-t-il si l'objectif n'est pas atteint ?", "Le contrat prévoit les modalités d'ajustement."],
      ["Sur quelle durée s'engage-t-on ?", 'Généralement plusieurs années, souvent 10 ans pour un programme qui associe froid, chaleur et enveloppe.'],
      ['Un CPE est-il possible dans l’industrie ?', 'Oui, sur un périmètre défini : utilités, froid process, chaufferie. Les indicateurs sont alors rapportés à la production.'],
      ['Qui mesure les consommations ?', 'Les compteurs du site ou des sous-comptages posés pour le projet.'],
      ['Un CPE est-il compatible avec le décret tertiaire ?', "Oui. L'objectif contractuel peut être aligné sur la trajectoire du décret tertiaire."],
    ]),
    cta(),
  ],

  '/decret-tertiaire-decret-bacs/': (h) => [
    keepHeader(
      h,
      'Réglementation et financement des travaux énergétiques',
      'Décret tertiaire (−40 % en 2030), décret BACS, audit énergétique obligatoire : vos obligations, leurs échéances et le financement de vos travaux.',
      IMG('echeances-du-decret-tertiaire-et-du-decret-bacs.webp'),
      { label: 'Expertises', link: '/etudes-ingenierie-energetique/' }
    ),
    cards(
      'Vos obligations et leviers',
      [
        {
          title: 'Décret tertiaire : −40 % en 2030',
          text: "Bâtiments tertiaires ≥ 1 000 m² : −40 % en 2030, −50 % en 2040, −60 % en 2050. Déclaration annuelle sur OPERAT avant le 30 septembre.",
          image: IMG('cee-tertiaire.webp'),
        },
        {
          title: 'Décret BACS',
          text: 'Automatisation obligatoire au-delà de 290 kW depuis 2025 ; entre 70 et 290 kW, échéance 2030. Classe A ou B selon la norme.',
          image: IMG('drive-pilotage-gtb-gtc.webp'),
          link: '/solutions/pilotage-gtb-decret-bacs/',
        },
        {
          title: 'Audit énergétique obligatoire',
          text: 'Entreprises à 2,75 GWh/an sans SME certifié : audit tous les quatre ans, avec Leo Energy (OPQIBI 1905 / 1717).',
          image: IMG('audit-energetique-entreprise.webp'),
          link: '/etudes-ingenierie-energetique/',
        },
        {
          title: 'Financement CEE',
          text: "Opérations standardisées, bonifications sortie fossiles et CPE. Le financement accompagne le projet : il ne remplace ni le relevé ni le dimensionnement.",
          image: IMG('efficacite-energetique-tertiaire-pexen.webp'),
          link: '/estimation-financement/',
          linkLabel: 'Estimer',
        },
      ],
      { eyebrow: 'Cadre', style: 'hoverDark', columns: 2 }
    ),
    textMedia(
      'Trois règles pour sécuriser le financement',
      "<ul><li>L'engager avant la signature du devis : un devis signé trop tôt le fait perdre.</li><li>Respecter les exigences techniques de l'opération, justifiées par une note de dimensionnement.</li><li>Conserver les pièces vérifiées lors du contrôle COFRAC.</li></ul>",
      IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
      { eyebrow: 'CEE', bullets: ['Avant devis', 'Note de calcul'], position: 'right' }
    ),
    faq('Questions fréquentes sur le décret tertiaire et le financement', [
      ['Mon bâtiment est-il concerné par le décret tertiaire ?', "Oui s'il accueille des activités tertiaires sur 1 000 m² ou plus. Les consommations se déclarent chaque année sur OPERAT."],
      ['Quel montant de prime CEE puis-je obtenir ?', "Il dépend du volume de kWh cumac et du prix du marché. Nous le chiffrons à l'étude, avant toute signature."],
      ['Les CEE sont-ils cumulables avec d’autres aides ?', 'Souvent, selon les règles propres à chaque aide. Nous vérifions les cumuls projet par projet.'],
    ]),
    cta(),
  ],

  '/solutions/': (h) => [
    keepHeader(
      h,
      'Nos solutions',
      "Pour l'efficacité énergétique de vos sites, PEXEN intervient sur cinq domaines techniques : le froid commercial et industriel, la récupération de chaleur, le chauffage et le traitement d'air, le pilotage GTB / GTC et l'isolation technique.",
      IMG('projets-de-performance-energetique-realises-par-pexen.webp')
    ),
    cards(
      'Cinq expertises, un seul interlocuteur',
      [
        { title: 'Froid commercial et industriel', text: 'Régulation HP et BP flottantes, condenseurs haute efficacité, variation électronique de vitesse, fermeture des meubles frigorifiques.', link: '/solutions/froid-commercial-industriel/', image: IMG('drive-froid-commercial-industriel.webp'), icon: 'snowflake' },
        { title: 'Récupération de chaleur', text: 'La chaleur des groupes froids, des compresseurs d’air et des process chauffe les locaux et l’eau.', link: '/solutions/recuperation-de-chaleur/', image: IMG('drive-recuperateur-de-chaleur.webp'), icon: 'flame' },
        { title: 'Chauffage et traitement d’air', text: 'Pompes à chaleur en remplacement du fioul ou du gaz, déstratification des grands volumes.', link: '/solutions/pompe-a-chaleur-tertiaire/', image: IMG('drive-chauffage-traitement-dair.webp'), icon: 'wind' },
        { title: 'Pilotage GTB / GTC', text: 'Gestion technique du bâtiment de classe A ou B, conformité au décret BACS.', link: '/solutions/pilotage-gtb-decret-bacs/', image: IMG('drive-pilotage-gtb-gtc.webp'), icon: 'cpu' },
        { title: 'Isolation technique', text: 'Toitures-terrasses, calorifugeage des réseaux, matelas isolants.', link: '/solutions/isolation-technique/', image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp'), icon: 'shieldCheck' },
      ],
      { eyebrow: 'Solutions', style: 'hoverDark', columns: 3, intro: 'Les gains se cumulent quand les actions sont conçues ensemble.' }
    ),
    textMedia(
      'Des travaux valorisés dès l’étude',
      "<p>La plupart de ces solutions correspondent à des opérations standardisées publiées par arrêté ministériel. Nous calculons le volume dès l'étude, engageons le dossier avant la signature du devis et préparons les pièces exigées au contrôle.</p>",
      IMG('cee-tertiaire.webp'),
      { eyebrow: 'Financement', bullets: ['CEE intégrés', 'Contrôle préparé'], position: 'left' }
    ),
    faq('Questions fréquentes', [
      ['Quelle solution rapporte le plus vite ?', "Sur un supermarché, la régulation du froid et la fermeture des meubles. Sur un entrepôt chauffé au gaz, la déstratification. Sur un réseau chaud, le calorifugeage."],
      ['Intervenez-vous sur des installations récentes ?', "Oui. Une installation récente peut fonctionner avec une régulation figée ou des réglages d'usine : le relevé indique le potentiel avant tout engagement."],
      ['Proposez-vous la maintenance après travaux ?', 'Nous assurons le suivi des consommations et les réglages de saison ; la maintenance réglementaire reste confiée à votre mainteneur.'],
      ["Pouvez-vous intervenir sur plusieurs sites d'un même groupe ?", 'Oui. Nous priorisons les sites par gisement et par échéance réglementaire, puis déployons les solutions par vagues.'],
    ]),
    cta(),
  ],

  '/solutions/froid-commercial-industriel/': (h) => [
    keepHeader(
      h,
      'Froid commercial et industriel : régulation et modernisation des centrales',
      "Le froid commercial est souvent le premier poste électrique d'un supermarché ; dans l'agroalimentaire ou la pharmacie, le froid process pèse autant. PEXEN optimise les centrales existantes sans rompre la chaîne du froid.",
      IMG('centrale-de-froid-commercial-optimisee-par-pexen.webp'),
      { label: 'Solutions', link: '/solutions/' }
    ),
    cards(
      'Pourquoi vos groupes froids consomment trop',
      [
        { title: 'Pression de condensation fixe', text: "Réglée pour les journées les plus chaudes, alors que l'air extérieur reste sous 20 °C la majeure partie de l'année.", image: IMG('regulation-haute-pression-flottante-sur-groupe-de-froid-commercial.webp') },
        { title: 'Meubles ouverts', text: 'Un rayon froid consomme environ 979 kWh/m²/an, contre 45 à 72 kWh/m²/an pour un rayon sans froid (OPERAT).', image: IMG('fermeture-de-meubles-frigorifiques-en-froid-commercial.webp') },
        { title: 'Vitesses fixes', text: 'Compresseurs et ventilateurs en tout ou rien, sans adaptation à la charge réelle.', image: IMG('froid-commercial-industriel-centrale-pexen.webp') },
        { title: 'Condenseurs limités', text: 'Sous-dimensionnés ou encrassés, ils obligent les compresseurs à travailler à haute pression.', image: IMG('centrale-froid.webp') },
      ],
      { eyebrow: 'Diagnostic', style: 'hoverDark', columns: 2 }
    ),
    cards(
      'Nos solutions pour le froid commercial et industriel',
      [
        { title: 'Haute pression flottante', text: "La pression de condensation suit la température extérieure. Sur une installation ancienne, le gain atteint jusqu'à 30 %.", image: IMG('regulation-haute-pression-flottante-sur-groupe-de-froid-commercial.webp') },
        { title: 'Basse pression flottante', text: "La pression d'évaporation s'ajuste à la demande réelle des meubles et des chambres froides.", image: IMG('drive-froid-commercial-industriel.webp') },
        { title: 'Condenseurs haute efficacité', text: 'Écart de température réduit et ventilateurs à commutation électronique.', image: IMG('performance-energetique-centrale-froid-pexen.webp') },
        { title: 'Variation électronique de vitesse', text: 'Compresseurs, ventilateurs et pompes adaptent leur vitesse à la charge.', image: IMG('centrale-de-froid-commercial-optimisee-par-pexen.webp') },
        { title: 'Fermeture des meubles', text: 'Portes vitrées (positif) et couvercles (négatif) pour stabiliser les denrées et couper les apports de chaleur.', image: IMG('fermeture-de-meubles-frigorifiques-en-froid-commercial.webp') },
      ],
      { eyebrow: 'Solutions', style: 'hoverDark', columns: 3, bg: 'white' }
    ),
    textMedia(
      'Froid et chaleur : un même projet',
      "<p>La chaleur rejetée au condenseur peut chauffer la surface de vente ou l'eau chaude sanitaire. Régulation du froid et récupération de chaleur s'étudient ensemble : les réglages de l'une conditionnent le rendement de l'autre.</p>",
      IMG('recuperation-de-chaleur-sur-groupe-froid-installee-par-pexen.webp'),
      { eyebrow: 'Couplage', bullets: ['Froid prioritaire', 'Chaleur valorisée'], position: 'right' }
    ),
    projects('Réalisations liées', 'Preuves terrain sur centrales froid et récupération de chaleur.'),
    faq('Questions fréquentes sur le froid commercial', [
      ['La haute pression flottante est-elle compatible avec mon installation ?', "Elle s'adapte à la plupart des centrales à condensation par air. Le relevé vérifie le détendeur, la plage des compresseurs et le condenseur."],
      ['Faut-il fermer le magasin pendant les travaux ?', 'Non. Les interventions sont phasées par meuble et par circuit.'],
      ['La fermeture des meubles réduit-elle les ventes ?', "Les portes vitrées maintiennent la visibilité des produits, suppriment l'inconfort des allées froides et stabilisent la température des denrées."],
      ['Faut-il changer de fluide frigorigène ?', "Pas nécessairement. Le relevé identifie le fluide en place, sa réglementation et l'intérêt d'une conversion."],
    ]),
    cta(),
  ],

  '/solutions/recuperation-de-chaleur/': (h) => [
    keepHeader(
      h,
      'Récupérer la chaleur disponible',
      "Chaque groupe froid, chaque compresseur d'air, chaque process chaud rejette de la chaleur. La récupération capte cette énergie et la redirige vers le chauffage, l'ECS ou un process.",
      IMG('recuperation-de-chaleur-groupe-froid-pexen.webp'),
      { label: 'Solutions', link: '/solutions/' }
    ),
    cards(
      "D'où vient la chaleur récupérable",
      [
        { title: 'Groupe de production de froid', text: 'Chaleur extraite des meubles et chambres froides, augmentée de l’énergie des compresseurs, rejetée au condenseur.', image: IMG('recuperation-de-chaleur-sur-groupe-froid-installee-par-pexen.webp') },
        { title: "Compresseur d'air", text: "Chaleur du circuit d'huile ou de l'air de refroidissement.", image: IMG('efficacite-energetique-industrielle-pexen.webp') },
        { title: 'Process chaud', text: 'Chaleur fatale industrielle à valoriser ou à rehausser.', image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp') },
      ],
      { eyebrow: 'Sources', style: 'hoverDark', columns: 3 }
    ),
    cards(
      'Nos solutions de valorisation de la chaleur',
      [
        { title: 'Sur groupe de production de froid', text: "Échangeur en sortie de compresseur vers réseau d'eau chaude ou batterie de traitement d'air.", image: IMG('recuperation-de-chaleur-sur-groupe-froid-installee-par-pexen.webp') },
        { title: "Sur compresseur d'air", text: "Préchauffage de l'eau ou chauffage d'un atelier voisin.", image: IMG('drive-recuperateur-de-chaleur.webp') },
        { title: 'PAC en rehausse de chaleur fatale', text: 'Quand la chaleur est trop basse (25–40 °C), une pompe à chaleur la relève.', image: IMG('pompe-a-chaleur-tertiaire-pexen.webp') },
        { title: 'Eaux grises', text: "Échangeur sur l'évacuation des douches : santé, sport, hôtels.", image: IMG('installation-technique.webp') },
      ],
      { eyebrow: 'Solutions', style: 'hoverDark', columns: 2, bg: 'white' }
    ),
    textMedia(
      "Dimensionner l'échangeur et le stockage",
      "<p>La puissance valorisable dépend de la température de condensation et du mode de captage. La désurchauffe capte une fraction à haute température (ECS) ; la condensation totale capte l'essentiel des rejets à plus basse température (chauffage). Un ballon tampon lisse l'écart. La régulation donne toujours la priorité à la production de froid.</p>",
      IMG('recuperation-de-chaleur-sur-la-centrale-froid-de-carrefour-market.webp'),
      { eyebrow: 'Ingénierie', bullets: ['Courbes heure par heure', 'Froid prioritaire'], position: 'left' }
    ),
    projects('Réalisations liées'),
    faq('Questions fréquentes sur la récupération de chaleur', [
      ['Quelle part du chauffage la chaleur récupérée peut-elle couvrir ?', "Cela dépend de la puissance du groupe froid et des besoins. Dans un supermarché, la chaleur rejetée dépasse souvent le besoin de chauffage hors grands froids."],
      ['Mon chauffage actuel doit-il être remplacé ?', "Non. L'échangeur s'installe en amont du générateur existant, qui assure l'appoint."],
      ['La récupération perturbe-t-elle la production de froid ?', 'Non : la régulation donne la priorité au froid.'],
      ['Peut-on récupérer la chaleur d’un groupe froid ancien ?', 'Souvent oui, si le circuit de refoulement est accessible. Le relevé vérifie la puissance disponible.'],
    ]),
    cta(),
  ],

  '/solutions/pompe-a-chaleur-tertiaire/': (h) => [
    keepHeader(
      h,
      'Chauffage et traitement d’air',
      "Une pompe à chaleur tertiaire remplace une chaudière fioul ou gaz et produit 3 à 4 kWh de chaleur pour 1 kWh d'électricité. Dans les bâtiments de grande hauteur, la déstratification ramène au sol l'air chaud sous la toiture.",
      IMG('pompe-a-chaleur-tertiaire-air-eau-installee-par-pexen.webp'),
      { label: 'Solutions', link: '/solutions/' }
    ),
    cards(
      'Nos solutions chauffage & air',
      [
        { title: 'Pompe à chaleur air/eau', text: 'Remplacement chaudière fossile, bonification Coup de pouce selon le cas.', image: IMG('pompes-a-chaleur-air-eau-sortie-du-fioul-chez-intermarche.webp'), link: '/realisations/intermarche-sortie-du-fioul/' },
        { title: 'Déstratification', text: "Jusqu'à 30 % d'économies sur le chauffage d'un local de grande hauteur (EDF).", image: IMG('destratificateur-d-air-installe-dans-un-magasin-de-grande-hauteur.webp'), link: '/realisations/cedim-destratification/' },
        { title: 'Brûleur micro-modulant', text: 'Sur chaudière vapeur ou eau chaude industrielle : puissance ajustée à la demande.', image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp') },
      ],
      { eyebrow: 'Solutions', style: 'hoverDark', columns: 3 }
    ),
    projects('Réalisations liées'),
    faq('Questions fréquentes sur la pompe à chaleur tertiaire', [
      ['Une pompe à chaleur suffit-elle par grand froid ?', 'Le dimensionnement intègre la température de base de votre zone climatique. Un appoint est prévu quand il est économiquement justifié.'],
      ['Puis-je garder mes radiateurs ?', 'Oui si la température de départ reste compatible. Le relevé le vérifie émetteur par émetteur.'],
      ['Quelle bonification CEE pour remplacer une chaudière fioul ?', 'Le Coup de pouce Chauffage multiplie les kWh cumac selon la technologie, à condition de déposer l’équipement fossile.'],
    ]),
    cta(),
  ],

  '/solutions/pilotage-gtb-decret-bacs/': (h) => [
    keepHeader(
      h,
      'Pilotage GTB / GTC',
      "Une GTB commande chauffage, climatisation, ventilation, éclairage et production de froid selon l'occupation et la météo. L'ADEME estime les gains entre 15 et 30 % sur les consommations pilotées.",
      IMG('pilotage-gtb-decret-bacs-pexen.webp'),
      { label: 'Solutions', link: '/solutions/' }
    ),
    cards(
      'Nos solutions de GTB tertiaire et de GTC',
      [
        { title: 'Audit et cahier des charges', text: 'Inventaire des équipements, automates et protocoles (BACnet, Modbus, KNX).', image: IMG('drive-pilotage-gtb-gtc.webp') },
        { title: 'Installation et programmation', text: 'Comptage par usage, sondes, automates, supervision. Plages horaires, réduits, délestage.', image: IMG('pilotage-gtb-decret-bacs-pexen.webp') },
        { title: 'Indicateurs industrie', text: 'Mesure des consommations par atelier ou machine.', image: IMG('efficacite-energetique-d-un-site-industriel.webp') },
        { title: 'Données OPERAT', text: 'Tableaux de bord, alertes de dérive, données prêtes pour la déclaration annuelle.', image: IMG('echeances-du-decret-tertiaire-et-du-decret-bacs.webp') },
      ],
      { eyebrow: 'GTB / BACS', style: 'hoverDark', columns: 2 }
    ),
    faq('Questions fréquentes sur la GTB tertiaire', [
      ['Mon bâtiment est-il soumis au décret BACS ?', "Au-delà de 290 kW, obligation depuis 2025 ; entre 70 et 290 kW, au 1er janvier 2030."],
      ['Quelle différence entre GTB et GTC ?', "La GTC centralise un lot technique. La GTB coordonne l'ensemble des lots selon l'occupation, les consignes et la météo."],
      ['Quelle classe viser : A ou B ?', 'La classe B suffit souvent au décret BACS. La classe A ajoute des fonctions d’optimisation.'],
    ]),
    cta(),
  ],

  '/solutions/isolation-technique/': (h) => [
    keepHeader(
      h,
      'Isolation technique',
      "Une canalisation non isolée, une vanne nue, une toiture-terrasse sans isolant : la chaleur se perd avant d'atteindre son usage. L'isolation technique traite ces pertes en priorité.",
      IMG('isolation-technique-calorifugeage-pexen.webp'),
      { label: 'Solutions', link: '/solutions/' }
    ),
    cards(
      "Nos solutions d'isolation technique",
      [
        { title: 'Calorifugeage', text: 'Isolation des tuyauteries, ballons et parois.', image: IMG('drive-isolation-technique-sur-reseau-hvac-industriel.webp') },
        { title: 'Matelas isolants', text: 'Housses démontables sur points singuliers.', image: IMG('matelas-isolant-demontable-isolation-technique.webp') },
        { title: 'Toitures-terrasses', text: "Isolant posé sur l'étanchéité ou sous une nouvelle étanchéité.", image: IMG('isolation-technique-d-une-toiture-terrasse-par-pexen.webp') },
      ],
      { eyebrow: 'Solutions', style: 'hoverDark', columns: 3 }
    ),
    faq("Questions fréquentes sur l'isolation technique", [
      ["Faut-il arrêter l'installation pour la calorifuger ?", 'Non dans la plupart des cas : les isolants et matelas se posent sur des réseaux en service.'],
      ['Le calorifugeage est-il financé par les CEE ?', 'Oui, en industrie (IND-UT-131 / 121) et en tertiaire pour la toiture-terrasse (BAT-EN-107).'],
      ["Isolez-vous aussi les réseaux d'eau glacée ?", 'Oui, avec un isolant à pare-vapeur continu.'],
    ]),
    cta(),
  ],

  '/secteurs/': (h) => [
    keepHeader(
      h,
      'Une approche 100 % B2B',
      "L'efficacité énergétique ne se traite pas de la même manière dans une usine, un supermarché ou une résidence. PEXEN intervient sur trois secteurs, avec des solutions et des priorités propres à chacun.",
      IMG('installation-technique.webp')
    ),
    b(
      'panels',
      {
        eyebrow: 'Secteurs',
        title: 'Efficacité énergétique par secteur',
        items: [
          { id: uid('p'), image: IMG('drive-secteur-industriel.webp'), imageAlt: 'Industrie', title: 'Industrie', text: 'Froid process, vapeur et air comprimé optimisés pendant que la production tourne.', bullets: [], link: '/secteurs/efficacite-energetique-industrielle/', linkLabel: 'Découvrir' },
          { id: uid('p'), image: IMG('drive-secteur-batiment-tertiaire.webp'), imageAlt: 'Tertiaire', title: 'Tertiaire', text: 'Grande distribution, bureaux, entrepôts : le décret tertiaire a une date. Votre plan aussi.', bullets: [], link: '/secteurs/efficacite-energetique-tertiaire/', linkLabel: 'Découvrir' },
          { id: uid('p'), image: IMG('drive-secteur-renovation-globale-collectif.webp'), imageAlt: 'Collectifs', title: 'Bâtiments collectifs', text: 'Chaufferies collectives, sortie du fioul, confort tenu, dossier prêt pour la décision.', bullets: [], link: '/secteurs/batiments-collectifs/', linkLabel: 'Découvrir' },
        ],
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    textMedia(
      'Une seule méthode, des priorités différentes',
      "<p>Dans l'industrie, la priorité va aux utilités qui tournent en continu. Dans le tertiaire, au froid commercial, au chauffage des grands volumes et au pilotage. Dans le collectif, à la chaufferie et au confort des occupants.</p>",
      IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
      { eyebrow: 'Méthode', bullets: ['Mesurer', 'Dimensionner', 'Prouver'], position: 'right' }
    ),
    cta(),
  ],

  '/secteurs/efficacite-energetique-industrielle/': (h) => [
    keepHeader(
      h,
      'Efficacité énergétique industrielle',
      "Vos lignes ne s'arrêtent pas. Vos économies non plus. PEXEN agit sur les utilités qui tournent en continu : froid process, chaufferies, air comprimé, réseaux — sans perturber la production.",
      IMG('drive-secteur-industriel.webp'),
      { label: 'Secteurs', link: '/secteurs/' }
    ),
    cards(
      'Priorités industrielles',
      [
        { title: 'Froid process', text: 'Régulation et modernisation des centrales sans rompre la chaîne du froid.', link: '/solutions/froid-commercial-industriel/', image: IMG('colorcon-groupe-froid-efficacite-energetique-industrielle.webp') },
        { title: 'Chaleur fatale', text: 'Valorisation et rehausse de température pour chauffer ou préchauffer.', link: '/solutions/recuperation-de-chaleur/', image: IMG('chaufferie-vapeur-d-un-site-industriel-efficacite-energetique-industrielle.webp') },
        { title: 'Calorifugeage', text: 'Réseaux et points singuliers : temps de retour parmi les plus courts.', link: '/solutions/isolation-technique/', image: IMG('colorcon-reseaux-calorifuges-industrie.webp') },
      ],
      { eyebrow: 'Industrie', style: 'hoverDark', columns: 3 }
    ),
    projects('Réalisation industrielle'),
    faq("Questions fréquentes sur l'efficacité énergétique industrielle", [
      ['Pouvez-vous intervenir pendant un arrêt technique court ?', 'Oui. Les fournitures sont préparées en amont pour concentrer les raccordements sur la fenêtre d’arrêt.'],
      ["Mon site est-il soumis à l'audit énergétique obligatoire ?", 'Oui si sa consommation annuelle moyenne atteint 2,75 GWh sans SME certifié ISO 50001.'],
      ["Pouvez-vous valoriser la chaleur d'un process à basse température ?", 'Oui, avec une pompe à chaleur en rehausse de température.'],
    ]),
    cta(),
  ],

  '/secteurs/efficacite-energetique-tertiaire/': (h) => [
    keepHeader(
      h,
      'Efficacité énergétique tertiaire',
      'Grande distribution, bureaux, entrepôts, santé : le décret tertiaire impose −40 % en 2030. PEXEN traite d’abord le froid, le chauffage des grands volumes et le pilotage.',
      IMG('drive-secteur-batiment-tertiaire.webp'),
      { label: 'Secteurs', link: '/secteurs/' }
    ),
    cards(
      'Nos interventions par type de bâtiment',
      [
        { title: 'Grande distribution', text: 'Régulation froid, fermeture des meubles, récupération de chaleur, PAC, GTB.', link: '/solutions/froid-commercial-industriel/', image: IMG('carrefour-market.webp') },
        { title: 'Bureaux', text: 'GTB classe A ou B, pompes à chaleur, équilibrage, isolation toiture.', link: '/solutions/pilotage-gtb-decret-bacs/', image: IMG('efficacite-energetique-des-batiments-tertiaires.webp') },
        { title: 'Entrepôts & grande hauteur', text: 'Déstratification, remplacement aérothermes, isolation toiture.', link: '/solutions/pompe-a-chaleur-tertiaire/', image: IMG('cedim.webp') },
        { title: 'Santé & hébergement', text: 'ECS, récupération eaux grises, pilotage des CTA.', link: '/solutions/recuperation-de-chaleur/', image: IMG('installation-technique.webp') },
      ],
      { eyebrow: 'Tertiaire', style: 'hoverDark', columns: 2 }
    ),
    faq('Questions fréquentes sur l’efficacité énergétique tertiaire', [
      ['Qui est responsable du décret tertiaire : propriétaire ou locataire ?', 'Les deux. Ils se répartissent les actions selon le bail et déclarent sur OPERAT.'],
      ['Les travaux de froid commercial comptent-ils pour le décret tertiaire ?', 'Oui. Le décret porte sur toutes les consommations d’énergie finale, froid alimentaire compris.'],
    ]),
    cta(),
  ],

  '/secteurs/batiments-collectifs/': (h) => [
    keepHeader(
      h,
      'Bâtiments collectifs',
      'Chaufferies collectives, sortie du fioul, confort tenu, dossier prêt pour la décision des bailleurs et des copropriétés.',
      IMG('drive-secteur-renovation-globale-collectif.webp'),
      { label: 'Secteurs', link: '/secteurs/' }
    ),
    cards(
      'Nos solutions collectifs',
      [
        { title: 'Sortie du fioul', text: 'Pompes à chaleur collectives, installateur RGE QualiPAC.', image: IMG('chaufferie-de-batiments-collectifs-modernisee-par-pexen.webp'), link: '/solutions/pompe-a-chaleur-tertiaire/' },
        { title: 'Chaufferie modernisée', text: 'Régulation, équilibrage, calorifugeage.', image: IMG('batiments-collectifs-chaufferie-pexen.webp') },
        { title: 'Isolation technique', text: 'Réseaux et points singuliers en chaufferie.', image: IMG('isolation-technique-calorifugeage-pexen.webp'), link: '/solutions/isolation-technique/' },
      ],
      { eyebrow: 'Collectif', style: 'hoverDark', columns: 3 }
    ),
    cta(),
  ],

  '/partenaires/': (h) => [
    keepHeader(
      h,
      'Partenaires professionnels',
      'Installateurs, bureaux d’études, mainteneurs : PEXEN co-réalise des projets d’efficacité énergétique avec un dossier cohérent de l’étude au contrôle.',
      IMG('partenaires-installateur-pexen.webp')
    ),
    cards(
      'Pourquoi travailler avec PEXEN',
      [
        { title: 'Ingénierie interne', text: 'Notes de calcul et dimensionnement portés par la même équipe que le chantier.', image: IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp') },
        { title: 'Dossier prêt', text: 'Pièces alignées pour la valorisation et le contrôle.', image: IMG('cee-tertiaire.webp') },
        { title: 'Site occupé', text: 'Phasage calé sur l’exploitation de vos clients.', image: IMG('drive-equipe-pexen.webp') },
      ],
      { eyebrow: 'Partenariat', style: 'hoverDark', columns: 3 }
    ),
    cta(),
  ],
};

/** Enrichit une fiche réalisation : garde stats, remplace richText par textMedia + projects + cta. */
function enrichProjectPage(page: {
  path: string;
  blocks: CmsBlock[];
  title?: string;
  project?: { client?: string; summary?: string; image?: string; results?: string[] };
}) {
  if (page.path === '/realisations/') return;

  const header = page.blocks.find((x) => x.type === 'pageHeader');
  const stats = page.blocks.filter((x) => x.type === 'stats');
  const existingMedia = page.blocks.find((x) => x.type === 'textMedia');
  const ctaBlock = page.blocks.find((x) => x.type === 'cta') || cta();
  const rich = page.blocks.find((x) => x.type === 'richText');
  const seedHtml = String(seedByPath.get(page.path)?.bodyHtml || '');
  const html = String((rich?.data as { html?: string })?.html || seedHtml || '');
  const decoded = html
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');
  const image = String(
    (header?.data as { image?: string })?.image ||
      page.project?.image ||
      IMG('projets-de-performance-energetique-realises-par-pexen.webp')
  );
  const title = String((header?.data as { title?: string })?.title || page.title || 'Réalisation');
  const summary = page.project?.summary || page.project?.client || '';
  const results = (page.project?.results || []).filter(Boolean).slice(0, 2);

  const middle: CmsBlock[] = [];
  if (existingMedia) {
    middle.push(existingMedia);
  } else if (decoded.replace(/<[^>]+>/g, '').trim()) {
    middle.push(
      textMedia(title, decoded, image, {
        eyebrow: page.project?.client || 'Réalisation',
        bullets: results.length ? results.map((r) => r.slice(0, 48)) : summary ? [summary.slice(0, 48)] : ['Preuve terrain'],
        position: 'right',
      })
    );
  } else if (summary) {
    middle.push(
      textMedia(title, `<p>${summary}</p>`, image, {
        eyebrow: page.project?.client || 'Réalisation',
        bullets: results.length ? results.map((r) => r.slice(0, 48)) : ['Preuve terrain'],
        position: 'right',
      })
    );
  }
  middle.push(projects('Autres réalisations'));
  page.blocks = [header!, ...stats, ...middle, ctaBlock].filter(Boolean) as CmsBlock[];
}

const snap = await updateSnapshot((s) => {
  for (const page of s.pages) {
    if (SKIP.has(page.path)) continue;
    if (page.template === 'legal') continue;

    const build = builders[page.path];
    if (build) {
      const header = page.blocks.find((x) => x.type === 'pageHeader');
      page.blocks = build(header);
      page.updatedAt = new Date().toISOString();
      continue;
    }

    if (page.path !== '/realisations/' && (page.template === 'project' || page.path.startsWith('/realisations/'))) {
      enrichProjectPage(page);
      page.updatedAt = new Date().toISOString();
      continue;
    }

    /* Autres pages encore en richText : décoder entités au minimum */
    for (const block of page.blocks) {
      if (block.type !== 'richText') continue;
      const d = block.data as { html?: string };
      if (d.html) d.html = d.html.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&apos;/g, "'");
    }
  }
});

const report = snap.pages
  .filter((p) => builders[p.path] || p.path.startsWith('/realisations/'))
  .map((p) => `${p.path} → ${p.blocks.map((b) => b.type).join(' + ')}`);
console.log(report.join('\n'));
console.log(`\nEnriched ${report.length} pages`);
await pool.end();
