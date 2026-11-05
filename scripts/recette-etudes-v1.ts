/**
 * Recette Phase 2 — fiche Études et ingénierie (textes Amina, tels quels).
 */
import 'dotenv/config';
import type { BlockDataMap, BlockKind, BlockStyle, ButtonData } from '../server/cms/blocks';
import { button, uid } from '../server/cms/blocks';
import { BLOCK_CATALOG } from '../server/cms/blockCatalog';
import { updateSnapshot } from '../server/cms/store';
import type { CmsBlock } from '../server/cms/types';
import { pool } from '../server/db/client';

const IMG = (f: string) => `/themes/ultra-s/images/pexen/${f}`;

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (label = 'Parler de votre projet', link = '/contact/'): ButtonData => button(label, link);
const estimBtn = (): ButtonData => button('Estimer le financement', '/estimation-financement/', 'secondary', 'none');
const etudeBtn = (): ButtonData => button('Demander une étude', '/contact/?demande=etude');

const snap = await updateSnapshot((s) => {
  /* Menus CMS : aligner sur recette */
  const primary = s.menus.find((m) => m.id === 'primary');
  if (primary) {
    primary.items = [
      {
        id: 'u-exp',
        label: 'Expertises',
        path: '/expertises/',
        children: [
          { id: 'e1', label: 'Études et ingénierie', path: '/etudes-ingenierie-energetique/' },
          { id: 'e2', label: 'Accompagnement travaux et AMO', path: '/accompagnement-travaux/' },
          { id: 'e3', label: 'Contrat de performance énergétique', path: '/contrat-de-performance-energetique/' },
          { id: 'e4', label: 'Réglementation et financement', path: '/decret-tertiaire-decret-bacs/' },
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
          { id: 's4', label: 'Pilotage GTB / GTC', path: '/solutions/pilotage-gtb-decret-bacs/' },
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
          { id: 'c3', label: 'Bâtiments collectifs', path: '/secteurs/batiments-collectifs/' },
        ],
      },
      { id: 'u-real', label: 'Réalisations', path: '/realisations/' },
      { id: 'u-meth', label: 'Notre approche', path: '/notre-approche/' },
      { id: 'u-contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
    ];
  }

  /* FAQ : plus de carte contact partout */
  for (const page of s.pages) {
    for (const block of page.blocks) {
      if (block.type === 'faq') (block.data as { showContactCard?: boolean }).showContactCard = false;
    }
  }

  const page = s.pages.find((p) => p.path === '/etudes-ingenierie-energetique/');
  if (!page) throw new Error('page etudes introuvable');

  page.seo = {
    ...page.seo,
    seoTitle: "Bureau d'études fluides CVC et ingénierie énergétique | PEXEN",
    metaDescription:
      "Bureau d'études fluides PEXEN : CVC, plomberie, désenfumage, audit énergétique, notes de dimensionnement et calcul du gisement d'économies, réalisés en interne.",
    focusKeyword: "bureau d'études fluides",
  };

  page.blocks = [
    b(
      'pageHeader',
      {
        breadcrumb: true,
        parentLabel: 'Expertises',
        parentLink: '/expertises/',
        eyebrow: 'Expertises',
        title: 'Études et ingénierie énergétique',
        intro:
          "Toute économie d'énergie commence par une étude. L'ingénierie énergétique de PEXEN réunit deux métiers complémentaires, réalisés en interne : l'ingénierie fluides, qui dimensionne les installations, et l'ingénierie efficacité énergétique, qui mesure le gisement et justifie chaque action.",
        buttons: [contactBtn(), estimBtn()],
        image: IMG('ingenieur-pexen-sur-site-ingenierie-et-performance-energetique.webp'),
        imageAlt: 'Ingénieur PEXEN sur site, ingénierie et performance énergétique',
        metrics: [
          { id: uid('m'), value: '2 métiers', label: 'fluides et efficacité, en interne' },
          { id: uid('m'), value: '3 ans', label: 'de consommations analysées' },
          { id: uid('m'), value: '1 note', label: 'de calcul : datée et signée' },
        ],
      },
      { background: 'surface', paddingBottom: 'md' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Ingénierie fluides',
        title: 'Dimensionner les installations',
        html: "<p>Remplacer une chaufferie, installer une pompe à chaleur, reprendre un réseau de ventilation : chaque équipement se dimensionne à partir des besoins réels du bâtiment. Nos ingénieurs fluides calculent les puissances, les débits, les températures de départ et les réseaux associés.</p>",
        bullets: ['CVC et plomberie', 'Désenfumage et réseaux'],
        buttons: [],
        mediaType: 'image',
        image: IMG('installation-technique.webp'),
        imageAlt: 'Installation technique CVC',
        videoSource: 'file',
        mediaPosition: 'right',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'textMedia',
      {
        eyebrow: 'Ingénierie efficacité énergétique',
        title: 'Mesurer et justifier chaque action',
        html: "<p>Le thermicien évalue ce que le site consomme, ce qu'il peut économiser et par quelles actions. Ses calculs fondent la décision d'investir et la valorisation des travaux.</p><p>Les audits réglementaires sont conduits via notre bureau d'études partenaire Leo Energy, qualifié OPQIBI 1905 pour les bâtiments tertiaires et collectifs et OPQIBI 1717 pour l'industrie.</p>",
        bullets: ['Audit et gisement'],
        buttons: [etudeBtn()],
        mediaType: 'image',
        image: IMG('audit-energetique-entreprise.webp'),
        imageAlt: 'Audit énergétique entreprise',
        videoSource: 'file',
        mediaPosition: 'left',
        mediaStyle: 'framed',
        ratio: 'landscape',
        autoplay: false,
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Complémentarité',
        title: 'Deux métiers, une seule équipe',
        intro: '',
        style: 'minimal',
        columns: 2,
        headerLinkLabel: '',
        headerLink: '',
        items: [
          {
            id: uid('c'),
            title: "Bureau d'études seul ou installateur seul",
            text: "Un bureau d'études qui ne réalise pas les travaux sous-estime parfois les contraintes de chantier. Un installateur sans ingénierie dimensionne au catalogue.",
            tags: [],
          },
          {
            id: uid('c'),
            title: 'Avec PEXEN',
            text: 'La note de calcul, le chantier et le suivi répondent à la même logique, portée par la même équipe.',
            tags: [],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'stats',
      {
        eyebrow: 'Repères',
        title: 'Les repères de nos études',
        style: 'strip',
        countUp: false,
        items: [
          {
            id: uid('k'),
            value: '45 à 75',
            suffix: ' %',
            label: "des dépenses d'énergie d'un supermarché viennent du froid alimentaire · Source : Perifem",
          },
          {
            id: uid('k'),
            value: '30',
            prefix: "Jusqu'à ",
            suffix: ' %',
            label: "d'économie sur un groupe froid ancien avec la haute pression flottante",
          },
          {
            id: uid('k'),
            value: '15 à 30',
            suffix: ' %',
            label: "d'économie sur les consommations pilotées par une GTB · Source : ADEME",
          },
          {
            id: uid('k'),
            value: '3 à 4',
            suffix: ' kWh',
            label: "de chaleur produits par une pompe à chaleur pour 1 kWh d'électricité",
          },
        ],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Parcours',
        title: 'Comment se déroule une étude',
        intro: 'Un interlocuteur unique du relevé à la restitution chiffrée.',
        style: 'timeline',
        deliverableLabel: '',
        phaseBanner: 'Sur site (01, 02) · Au bureau d’études (03, 04) · Restitution (05)',
        items: [
          {
            id: uid('s'),
            num: '01',
            title: 'Visite technique',
            text: 'Relevé des équipements, des plaques signalétiques, des températures et des temps de fonctionnement.',
          },
          {
            id: uid('s'),
            num: '02',
            title: 'Collecte des consommations',
            text: 'Consommations sur trois ans et courbes de charge.',
          },
          {
            id: uid('s'),
            num: '03',
            title: 'Modélisation',
            text: 'Besoins et calcul du gisement par action.',
          },
          {
            id: uid('s'),
            num: '04',
            title: 'Dimensionnement',
            text: 'Solutions retenues et note de calcul signée.',
          },
          {
            id: uid('s'),
            num: '05',
            title: 'Restitution',
            text: 'Scénarios chiffrés, planning, plan de financement.',
          },
        ],
        buttons: [contactBtn()],
      } as Partial<BlockDataMap['steps']> & { phaseBanner: string },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        eyebrow: 'Livrables',
        title: 'Nos livrables',
        cards: [
          {
            id: uid('ck'),
            title: 'Documents remis',
            icon: 'fa-check',
            entries: [
              { id: uid('e'), title: 'Audit énergétique' },
              { id: uid('e'), title: 'DPE tertiaire' },
              { id: uid('e'), title: 'Notes de dimensionnement datées et signées' },
              { id: uid('e'), title: 'Calcul du gisement action par action' },
            ],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'md' }
    ),
    b(
      'faq',
      {
        eyebrow: 'FAQ',
        title: 'Questions fréquentes sur nos études',
        layout: 'stacked',
        showContactCard: false,
        items: [
          {
            id: uid('f'),
            question: 'Quelle différence entre ingénierie fluides et efficacité énergétique ?',
            answer:
              "<p>L'ingénierie fluides dimensionne les installations (chauffage, ventilation, climatisation, plomberie, désenfumage). L'ingénierie efficacité énergétique mesure les consommations, calcule le gisement d'économies et justifie chaque action.</p>",
          },
          {
            id: uid('f'),
            question: 'Mon entreprise doit-elle réaliser un audit énergétique ?',
            answer:
              "<p>Oui si sa consommation annuelle moyenne atteint 2,75 GWh et qu'elle ne dispose pas d'un système de management de l'énergie certifié ISO 50001. L'audit se renouvelle tous les quatre ans.</p>",
          },
          {
            id: uid('f'),
            question: 'Les études sont-elles réalisées en interne ?',
            answer: '<p>Oui. Seuls les audits réglementaires sont conduits avec notre partenaire qualifié Leo Energy.</p>',
          },
          {
            id: uid('f'),
            question: "Combien de temps dure une étude ?",
            answer:
              '<p>De quelques jours pour une action ciblée à plusieurs semaines pour un audit de site complet. Le délai est fixé après la visite technique.</p>',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cta',
      {
        variant: 'dark',
        layout: 'centered',
        title: 'Un projet ? Parlons-en.',
        text: 'Un ingénieur PEXEN étudie votre site, évalue le gisement et vous répond sous 48 h ouvrées.',
        buttons: [contactBtn(), button('01 41 93 52 80', 'tel:+33141935280', 'secondary', 'phone')],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
  ];

  page.updatedAt = new Date().toISOString();
});

const et = snap.pages.find((p) => p.path === '/etudes-ingenierie-energetique/')!;
console.log(et.blocks.map((b) => b.type).join(' + '));
console.log('menus', snap.menus.find((m) => m.id === 'primary')?.items?.map((i) => `${i.label}(${i.children?.length || 0})`).join(' | '));
await pool.end();
