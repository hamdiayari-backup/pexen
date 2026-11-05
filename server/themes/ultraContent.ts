/**
 * Contenu multipage & études de cas — thème PEXEN Ultra
 * Aligné brief Amina (19/10) + maquette ultra-s + cartes Réalisations type Tera Énergie.
 * Chaque réalisation est une vraie page CMS (`template: 'project'`) éditable dans le backoffice.
 */
import type { BlockDataMap, BlockKind, BlockStyle, ProjectMeta } from '../cms/blocks';
import { button, uid } from '../cms/blocks';
import { BLOCK_CATALOG } from '../cms/blockCatalog';
import type { CmsBlock, CmsPage } from '../cms/types';
import { defaultSeoForPath } from '../cms/defaults';

const IMG = {
  hero: '/images/renovation-energetique.webp',
  mask: '/images/audit-batiment.webp',
  diag: '/images/professionnel-pac.webp',
  diagPoster: '/images/centrale-froid.webp',
  cta: '/images/climatisation-toiture.webp',
};

function b<K extends BlockKind>(type: K, data: Partial<BlockDataMap[K]>, style: Partial<BlockStyle> = {}): CmsBlock {
  return {
    id: uid('b'),
    type,
    data: { ...BLOCK_CATALOG[type].defaults(), ...data } as unknown as Record<string, unknown>,
    style,
  };
}

const contactBtn = (label = 'Parler de votre projet') => button(label, '/contact/');

function page(
  path: string,
  title: string,
  blocks: CmsBlock[],
  seoTitle?: string,
  template: CmsPage['template'] = 'default',
  project?: ProjectMeta
): CmsPage {
  const now = new Date().toISOString();
  return {
    id: uid('p'),
    path,
    title,
    template,
    status: 'published',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    seo: {
      ...defaultSeoForPath(path, title),
      seoTitle: seoTitle || `${title} | PEXEN`,
      metaDescription: project?.summary || 'PEXEN — Ingénierie & performance énergétique. Optimiser aujourd’hui. Performer demain.',
    },
    ...(project ? { project } : {}),
    blocks,
    contentSource: 'cms',
  };
}

export interface UltraCaseStudySeed {
  slug: string;
  path: string;
  title: string;
  project: ProjectMeta;
  contextHtml: string;
  engineeringHtml: string;
  metrics: { label: string; value: string }[];
  deliverables: string[];
}

export const ULTRA_CASE_STUDIES: UltraCaseStudySeed[] = [
  {
    slug: 'carrefour-market',
    path: '/realisations/carrefour-market/',
    title: 'Carrefour Market (Île-de-France) — Récupération de chaleur & optimisation frigorifique',
    project: {
      client: 'CARREFOUR MARKET · ÎLE-DE-FRANCE',
      location: 'Région Parisienne',
      department: '75 / 92',
      sector: 'Tertiaire',
      badge: 'Opération financée CEE',
      primeCee: '290 000 €',
      cumac: '30,6 GWh cumac',
      ceeSheet: 'BAT-TH-134 · BAT-TH-139 · BAT-EN-107 · BAT-EQ-124/125',
      solution: 'Récupération de chaleur & optimisation frigorifique sous CPE',
      summary:
        'Rénovation énergétique globale d’une moyenne surface alimentaire : récupération de chaleur sur centrale froid de 7 compresseurs, régulation HP flottante, fermeture des meubles frigorifiques et isolation toiture.',
      image: '/themes/ultra-s/images/pexen/installation-technique.webp',
      results: [
        'Condenseurs haute efficacité & régulation HP flottante sur 7 compresseurs',
        'Récupération de chaleur sur production frigorifique pour chauffage & ECS',
        'Fiches BAT-TH-134 / BAT-TH-139 · 30,6 GWh cumac · Objectif −40 %',
      ],
      featured: true,
    },
    metrics: [
      { label: 'Prime CEE valorisée', value: '290 000 €' },
      { label: 'Volume CEE', value: '30,6 GWh cumac' },
      { label: 'Baisse contractuelle', value: '−40 %' },
      { label: 'Continuité d’exploitation', value: '100 % en site occupé' },
    ],
    contextHtml: `<p>Sur ce site Carrefour Market d’Île-de-France, la production de froid commercial (centrale positive et négative de 7 compresseurs) représentait le premier poste de consommation électrique du magasin, devant l’éclairage et le CVC.</p>
<p>L’objectif de la direction technique était double : <strong>réduire durablement le talon électrique</strong> tout en s’inscrivant dans la trajectoire du <strong>Décret Tertiaire (−40 % à horizon 2030)</strong> avec une garantie de performance.</p>`,
    engineeringHtml: `<p>Les ingénieurs PEXEN ont conçu un bouquet d’actions complémentaires traitant simultanément la demande de froid, le rendement thermodynamique et l’enveloppe du bâtiment :</p>
<ul>
  <li><strong>Fermeture des meubles frigorifiques positifs et négatifs</strong> (BAT-EQ-124 / BAT-EQ-125) par portes vitrées double et triple vitrage anti-buée pour réduire de plus de 35 % le besoin frigorifique à la source.</li>
  <li><strong>Régulation Haute Pression Flottante</strong> (BAT-TH-134) asservissant la pression de condensation à la température extérieure dès que celle-ci descend sous 25 °C.</li>
  <li><strong>Récupération de chaleur sur le groupe froid</strong> (BAT-TH-139) : les calories autrefois rejetées en toiture préchauffent désormais l’eau chaude sanitaire et la boucle de chauffage du magasin.</li>
  <li><strong>Isolation de la toiture-terrasse</strong> (BAT-EN-107) pour supprimer le pont thermique sommital.</li>
</ul>`,
    deliverables: [
      'Audit instrumental & note de dimensionnement thermodynamique',
      'Montage intégral du dossier CEE avec bonification CPE (30,6 GWh cumac)',
      'Pose de nuit et par travées sans aucune fermeture du magasin',
      'Contrôle COFRAC validé et suivi énergétique pluriannuel',
    ],
  },
  {
    slug: 'intermarche-trevenans',
    path: '/realisations/intermarche-trevenans/',
    title: 'Intermarché Super Trévenans (90) — Sortie du fioul, PAC & centrale froid',
    project: {
      client: 'INTERMARCHÉ SUPER · TRÉVENANS (90)',
      location: 'Trévenans',
      department: '90',
      sector: 'Tertiaire',
      badge: 'Coup de pouce & CEE',
      primeCee: '170 000 €',
      cumac: '14,8 GWh cumac',
      ceeSheet: 'BAT-TH-163 · BAT-TH-139 · BAT-TH-134 · BAT-TH-112 · BAT-TH-142',
      solution: 'Modernisation centrale froid, PAC air/eau & sortie complète du fioul',
      summary:
        'Suppression de deux chaudières fioul vétustes au profit d’une pompe à chaleur air/eau couplée à la récupération de chaleur sur groupe froid, HP flottante, variateurs VEV et déstratification.',
      image: '/themes/ultra-s/images/pexen/pompes-a-chaleur-toiture.webp',
      results: [
        'Haute pression flottante & variateurs électroniques de vitesse (VEV)',
        'Remplacement chaufferie fioul par PAC air/eau + récupération de chaleur',
        '14,8 GWh cumac valorisés · Jusqu’à 25 % d’économies sur le poste froid',
      ],
      featured: true,
    },
    metrics: [
      { label: 'Prime CEE valorisée', value: '170 000 €' },
      { label: 'Volume CEE', value: '14,8 GWh cumac' },
      { label: 'Sortie du fioul', value: '100 % décarboné' },
      { label: 'Gain sur le froid', value: '−25 %' },
    ],
    contextHtml: `<p>Le supermarché Intermarché de Trévenans (Bourgogne-Franche-Comté) était chauffé par deux chaudières fioul anciennes tandis que sa centrale de froid commercial fonctionnait à pression de condensation fixe toute l’année.</p>
<p>L’enjeu consistait à <strong>sortir définitivement du fioul</strong> tout en modernisant la production frigorifique sans interrompre l’exploitation commerciale ni la chaîne du froid alimentaire.</p>`,
    engineeringHtml: `<p>PEXEN a déployé une solution énergétique intégrée :</p>
<ul>
  <li><strong>Dépose de la chaufferie fioul et installation d’une PAC air/eau haute performance</strong> (BAT-TH-163 Coup de pouce Chauffage des bâtiments tertiaires).</li>
  <li><strong>Récupération de chaleur sur la centrale frigorifique</strong> (BAT-TH-139) assurant la base des besoins thermiques en mi-saison et en hiver.</li>
  <li><strong>Régulation HP flottante (BAT-TH-134) et variateurs de vitesse VEV (BAT-TH-112)</strong> sur les compresseurs et condenseurs.</li>
  <li><strong>Déstratification d’air de la surface de vente (BAT-TH-142)</strong> et pilotage GTB de classe B (BAT-TH-116).</li>
</ul>`,
    deliverables: [
      'Étude thermique réglementaire et note de calcul hydraulique / frigorifique',
      'Cumul optimisé de 6 fiches CEE standardisées (14,8 GWh cumac)',
      'Bascule énergétique réalisée en site occupé sans perte d’exploitation',
      'Attestation de conformité COFRAC remise à la réception',
    ],
  },
  {
    slug: 'colorcon-bazainville',
    path: '/realisations/colorcon-bazainville/',
    title: 'Colorcon Bazainville (78) — Chaleur fatale industrielle & calorifugeage',
    project: {
      client: 'COLORCON · BAZAINVILLE (78)',
      location: 'Bazainville',
      department: '78',
      sector: 'Industrie',
      badge: 'Industrie pharmaceutique',
      primeCee: '96 000 €',
      cumac: '9,4 GWh cumac',
      ceeSheet: 'IND-UT-103 · IND-UT-137 · IND-UT-116 · IND-UT-121',
      solution: 'Chaleur fatale industrielle, froid process & matelas thermiques',
      summary:
        'Optimisation des utilités d’un site pharmaceutique fonctionnant en continu : récupération de chaleur sur groupes froids process, régulation HP flottante et isolation des points singuliers vapeur/eau surchauffée.',
      image: '/themes/ultra-s/images/pexen/centrale-froid.webp',
      results: [
        'Récupération de chaleur sur utilités industrielles & groupes froids process',
        'Matelas thermiques isolants sur mesure (IND-UT-121) & calorifugeage',
        'Intervention en environnement pharmaceutique sans arrêt de production',
      ],
      featured: true,
    },
    metrics: [
      { label: 'Prime CEE valorisée', value: '96 000 €' },
      { label: 'Volume CEE', value: '9,4 GWh cumac' },
      { label: 'Pertes points singuliers', value: '−82 %' },
      { label: 'Arrêt de production', value: '0 heure' },
    ],
    contextHtml: `<p>Le site industriel de Colorcon à Bazainville (Yvelines), spécialisé dans l’industrie pharmaceutique, exploite en continu une chaufferie vapeur, des groupes de production d’eau glacée process et un vaste réseau de distribution thermique.</p>
<p>Les relevés thermographiques mettaient en évidence d’importantes déperditions sur les vannes, brides et échangeurs non isolés ainsi qu’un gisement de chaleur fatale rejeté à l’atmosphère.</p>`,
    engineeringHtml: `<p>En partenariat avec notre bureau d’études qualifié <strong>OPQIBI 1717 (Leo Energy)</strong>, PEXEN a structuré le programme d’efficacité énergétique suivant :</p>
<ul>
  <li><strong>Récupération de chaleur sur les groupes de production de froid process</strong> (IND-UT-103 / IND-UT-137) pour préchauffer les boucles d’eau technique et réduire l’appel vapeur.</li>
  <li><strong>Système de régulation HP flottante industrielle</strong> (IND-UT-116) sur les compresseurs frigorifiques.</li>
  <li><strong>Confection et pose de matelas thermiques démontables</strong> (IND-UT-121) et calorifugeage haute température (IND-UT-131) permettant un démontage/remontage rapide par les équipes de maintenance.</li>
</ul>`,
    deliverables: [
      'Campagne de thermographie infrarouge et repérage unitaire des points singuliers',
      'Ingénierie de récupération de chaleur fatale compatible contraintes salle propre',
      'Dossier CEE Industrie instruit de A à Z',
      'Contrôle par organisme d’inspection accrédité COFRAC',
    ],
  },
  {
    slug: 'cedim',
    path: '/realisations/cedim/',
    title: 'Plateforme logistique CEDIM — Déstratification d’air & pilotage GTB',
    project: {
      client: 'PLATEFORME LOGISTIQUE CEDIM',
      location: 'Centre-Val de Loire',
      department: '45',
      sector: 'Tertiaire',
      badge: 'Décret BACS & Logistique',
      primeCee: '64 000 €',
      cumac: '2,1 GWh cumac',
      ceeSheet: 'BAT-TH-142 · BAT-TH-116',
      solution: 'Déstratification d’air grands volumes & pilotage GTB classe A',
      summary:
        'Traitement du gradient thermique vertical sur un bâtiment de négoce et d’entreposage de grande hauteur chauffé par aérothermes gaz, couplé à une GTB communicante.',
      image: '/themes/ultra-s/images/pexen/climatisation-toiture.webp',
      results: [
        'Déstratificateurs haute performance sur hall grande hauteur (> 5 m à 12 m)',
        'Pilotage GTB centralisé (BAT-TH-116) avec programmation horaire multizone',
        'Conformité décret BACS & baisse jusqu’à 30 % des consommations de chauffage',
      ],
      featured: true,
    },
    metrics: [
      { label: 'Prime CEE valorisée', value: '64 000 €' },
      { label: 'Économie chauffage', value: '−26 %' },
      { label: 'Écart sol / plafond', value: '< 1,5 °C' },
      { label: 'Conformité BACS', value: 'Classe A' },
    ],
    contextHtml: `<p>Dans les bâtiments de négoce et les entrepôts logistiques de grande hauteur comme le site CEDIM (Centre-Val de Loire), l’air chaud produit par les aérothermes gaz monte naturellement s’accumuler sous la toiture (jusqu’à 26 °C sous bac acier pour seulement 15 °C au sol).</p>
<p>Ce phénomène de stratification entraîne une surconsommation majeure de gaz et un inconfort permanent pour les opérateurs au sol.</p>`,
    engineeringHtml: `<p>Les équipes PEXEN ont dimensionné et installé une solution aéraulique et numérique rapide à amortir :</p>
<ul>
  <li><strong>Implantation de déstratificateurs d’air à flux vertical laminaire</strong> (BAT-TH-142) rabattant doucement la bulle d’air chaud vers la zone de travail sans courant d’air ressenti.</li>
  <li><strong>Asservissement par sondes de température hautes et basses</strong> reliées à un automate de Gestion Technique du Bâtiment (BAT-TH-116).</li>
  <li><strong>Réduction immédiate des temps d’enclenchement des brûleurs gaz</strong> et homogénéisation de la température à 18 °C dans toute la zone occupée.</li>
</ul>`,
    deliverables: [
      'Étude de maillage aéraulique selon la hauteur libre et le stockage en racks',
      'Pose en hauteur sur nacelle en dehors des flux de préparation de commandes',
      'Paramétrage GTB et formation du responsable d’exploitation',
      'Valorisation CEE BAT-TH-142 & BAT-TH-116 avec contrôle COFRAC',
    ],
  },
  {
    slug: 'agro-froid-bretagne',
    path: '/realisations/agro-froid-bretagne/',
    title: 'Usine Agroalimentaire (Bretagne) — Centrale froid NH3/CO2 & variateurs VEV',
    project: {
      client: 'USINE AGROALIMENTAIRE · BRETAGNE',
      location: 'Rennes / Bretagne',
      department: '35',
      sector: 'Industrie',
      badge: 'Froid industriel & CEE',
      primeCee: '215 000 €',
      cumac: '22,4 GWh cumac',
      ceeSheet: 'IND-UT-116 · IND-UT-115 · IND-UT-102 · IND-UT-103',
      solution: 'Optimisation centrale froid industriel, HP/BP flottante & récupération ECS',
      summary:
        'Modernisation du pilotage thermodynamique d’une salle des machines frigorifique agroalimentaire 24/7 avec récupération de chaleur pour l’eau chaude de lavage haute pression.',
      image: '/images/audit-batiment.webp',
      results: [
        'Double régulation Haute Pression (IND-UT-116) et Basse Pression flottante (IND-UT-115)',
        'Variateurs de fréquence VEV sur compresseurs & condenseurs (IND-UT-102)',
        'Production d’eau chaude de nettoyage à 60 °C par récupération sur désurchauffe',
      ],
      featured: false,
    },
    metrics: [
      { label: 'Prime CEE valorisée', value: '215 000 €' },
      { label: 'Volume CEE', value: '22,4 GWh cumac' },
      { label: 'Économie élec. froid', value: '−22 %' },
      { label: 'Eau chaude lavage', value: '85 % gratuite' },
    ],
    contextHtml: `<p>Cette unité de transformation agroalimentaire bretonne fonctionne en 3×8 avec d’importants besoins simultanés de froid négatif (tunnels de surgélation et chambres de stockage) et d’eau chaude à 60 °C pour le lavage quotidien des lignes.</p>`,
    engineeringHtml: `<p>PEXEN a optimisé le cycle frigorifique de la salle des machines :</p>
<ul>
  <li><strong>HP et BP flottantes industrielles</strong> (IND-UT-116 & IND-UT-115) réduisant le taux de compression des compresseurs toute l’année.</li>
  <li><strong>Variateurs électroniques de vitesse</strong> (IND-UT-102) sur les moteurs de ventilation des condenseurs et pompes de distribution.</li>
  <li><strong>Échangeur de désurchauffe et ballon tampon inox</strong> (IND-UT-103) préchauffant gratuitement l’eau de lavage industriel avant appoint.</li>
</ul>`,
    deliverables: [
      'Audit énergétique instrumenté sur 3 semaines de production',
      'Montage financier CEE couvrant plus de 75 % de l’investissement',
      'Raccordement hydraulique et électrique pendant les arrêts de maintenance planifiés',
      'Vérification COFRAC et suivi des compteurs d’énergie',
    ],
  },
  {
    slug: 'campus-tertiaire-lyon',
    path: '/realisations/campus-tertiaire-lyon/',
    title: 'Ensemble Tertiaire 18 000 m² (Lyon) — GTB Classe A, Décret BACS & CVC',
    project: {
      client: 'ENSEMBLE TERTIAIRE · LYON (69)',
      location: 'Lyon Part-Dieu',
      department: '69',
      sector: 'Tertiaire',
      badge: 'Décret Tertiaire & BACS',
      primeCee: '84 000 €',
      cumac: '8,9 GWh cumac',
      ceeSheet: 'BAT-TH-116 · BAT-TH-112 · BAT-TH-106',
      solution: 'Déploiement GTB Classe A multi-bâtiments & conformité OPERAT / BACS',
      summary:
        'Mise en conformité réglementaire Décret BACS et Décret Tertiaire d’un parc de bureaux de 18 000 m² : supervision GTB classe A, sous-comptage énergétique et variateurs CVC.',
      image: '/images/performance-energetique.webp',
      results: [
        'Architecture GTB Classe A conforme Décret BACS sur 4 sous-stations CVC',
        'Variateurs électroniques (BAT-TH-112) sur centrales de traitement d’air (CTA)',
        'Télédéclaration OPERAT & baisse de 21 % des consommations dès la 1re année',
      ],
      featured: false,
    },
    metrics: [
      { label: 'Prime CEE valorisée', value: '84 000 €' },
      { label: 'Surface pilotée', value: '18 000 m²' },
      { label: 'Gain énergétique An 1', value: '−21 %' },
      { label: 'Classe GTB EN 15232', value: 'Classe A' },
    ],
    contextHtml: `<p>Soumis à la fois au <strong>Décret Tertiaire</strong> (> 1 000 m²) et au <strong>Décret BACS</strong> (puissance CVC > 290 kW), ce gestionnaire d’actifs tertiaires à Lyon devait moderniser une régulation obsolète sans perturber les entreprises locataires.</p>`,
    engineeringHtml: `<p>PEXEN a assuré la maîtrise d’œuvre et le déploiement clé en main :</p>
<ul>
  <li><strong>Remplacement des automates de sous-stations et déploiement d’une GTB de classe A</strong> (fiche BAT-TH-116) assurant la régulation terminale par zone, l’optimisation des relances et le délestage.</li>
  <li><strong>Installation de variateurs électroniques de vitesse</strong> (BAT-TH-112) sur les moteurs de soufflage/reprise des CTA et les pompes de distribution primaire.</li>
  <li><strong>Calorifugeage et matelas thermiques</strong> (BAT-TH-106) sur les collecteurs et vannes en chaufferie/local froid.</li>
</ul>`,
    deliverables: [
      'Audit BACS initial et schéma directeur d’automatisation',
      'Supervision web temps réel avec export automatique des données OPERAT',
      'Valorisation de la prime CEE BAT-TH-116 et contrôle COFRAC',
      'Formation des équipes de maintenance multi-technique',
    ],
  },
];

function buildCaseStudyBlocks(cs: UltraCaseStudySeed): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      parentLabel: 'Réalisations',
      parentLink: '/realisations/',
      backLabel: 'Toutes les réalisations',
      backLink: '/realisations/',
      eyebrow: `${cs.project.sector} · ${cs.project.location} (${cs.project.department})`,
      title: cs.project.solution,
      intro: cs.project.summary,
      buttons: [contactBtn('Étudier un projet similaire'), button('Estimer le financement', '/estimation-financement/', 'secondary', 'none')],
      image: cs.project.image,
      imageAlt: cs.title,
    }),
    b('stats', {
      eyebrow: 'Chiffres clés du chantier',
      title: 'Impact énergétique & financier',
      style: 'cards',
      countUp: false,
      items: cs.metrics.map((m) => ({ id: uid('st'), value: m.value, label: m.label })),
    }),
    b('richText', {
      html: `<h2>Le contexte et l’enjeu du site</h2>${cs.contextHtml}<h2>La solution d’ingénierie déployée par PEXEN</h2>${cs.engineeringHtml}`,
      size: 'normal',
    }),
    b('checklist', {
      eyebrow: 'Livrables & conformité',
      title: 'Ce que PEXEN a pris en charge de A à Z',
      cards: [
        {
          id: uid('ck'),
          tag: cs.project.ceeSheet || 'Fiches CEE',
          title: 'Résultats & livrables contractuels',
          entries: [...cs.project.results, ...cs.deliverables].map((title) => ({ id: uid('e'), title })),
        },
      ],
    }),
    b('cta', {
      variant: 'dark',
      layout: 'split',
      title: 'Vous avez une installation similaire ?',
      text: 'Nos ingénieurs chiffrent le gisement d’économies et le financement mobilisable à partir de votre installation réelle.',
      buttons: [contactBtn(), button('Estimer le financement', '/estimation-financement/', 'secondary', 'none')],
    }),
  ];
}

/**
 * Accueil V5 (brief Amina 21/10) — ordre non négociable :
 * 1 Hero → 2 Preuves → 3 Enjeux → 4 Interlocuteur → 5 Solutions (5, sans Rénovation/LED) →
 * 6 Parcours → 7 Réalisations → 7b Qualifications → 8 Secteurs → 10 FAQ → 11 Estimation → 12 Contact.
 * Une seule mention « 48 h » (bloc Contact). Pas d’e-mail affiché.
 */
function homeBlocks(): CmsBlock[] {
  const img = (f: string) => `/themes/ultra-s/images/pexen/${f}`;
  return [
    b(
      'hero',
      {
        layout: 'split',
        badgeTag: 'PEXEN',
        badgeText: 'Ingénierie et performance énergétique',
        title: 'Réduisez la consommation énergétique\nde vos sites industriels et tertiaires.',
        rotatingWords: [],
        subtitle:
          'PEXEN conçoit, dimensionne et réalise vos projets de performance énergétique : de l’étude du site aux travaux, jusqu’au suivi des consommations.',
        buttons: [contactBtn(), button('Voir nos réalisations', '/realisations/', 'secondary', 'none')],
        liveText: '',
        trustItems: [],
        media: 'image',
        video: '',
        videoPoster: img('centrale-froid.webp'),
        mainImage: img('centrale-froid.webp'),
        mainImageAlt: 'Centrale froid optimisée par PEXEN, performance énergétique d’un site tertiaire',
        parallax: false,
        marquee: [],
      },
      { background: 'navy', paddingTop: 'none', paddingBottom: 'none' }
    ),
    b(
      'stats',
      {
        eyebrow: 'Ils nous confient leurs sites',
        title: 'Preuves terrain',
        style: 'strip',
        countUp: true,
        footnote:
          '* Volume d’économies d’énergie estimé selon les fiches d’opérations standardisées mobilisées : le kWh cumac cumule et actualise les économies sur la durée de vie conventionnelle des équipements. Il ne constitue pas une mesure des consommations réelles.\n* Objectif contractuel de réduction des consommations, sur le périmètre et la durée du contrat de performance énergétique (10 ans), à conditions d’exploitation comparables.',
        items: [
          { id: uid('k'), value: '535', suffix: ' kW', label: 'de chaleur récupérée sur le froid commercial · Carrefour Market', link: '/realisations/carrefour-market-recuperation-de-chaleur/' },
          { id: uid('k'), value: '1650', suffix: ' m²', label: 'chauffés et sortis du fioul · Intermarché', link: '/realisations/intermarche-sortie-du-fioul/' },
          { id: uid('k'), value: '47.5', suffix: ' GWh cumac*', label: 'd’économies d’énergie estimées sur 3 chantiers', link: '/realisations/' },
          { id: uid('k'), value: '40', suffix: ' %*', label: 'd’économie d’énergie visée sur 10 ans par contrat de performance', link: '/contrat-de-performance-energetique/' },
        ],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'stats',
      {
        title: 'Vos enjeux énergétiques',
        style: 'cards',
        countUp: false,
        items: [
          {
            id: uid('k'),
            value: '',
            label: 'Le froid, un poste énergétique majeur',
            hint: 'Sur les sites alimentaires et logistiques, la production frigorifique peut représenter une part majeure des consommations électriques. Régulation, HP flottante, récupération de chaleur ou modernisation des équipements : le potentiel d’optimisation se détermine à partir des conditions réelles d’exploitation.',
          },
          {
            id: uid('k'),
            value: '',
            label: 'Le décret tertiaire fixe une trajectoire',
            hint: '−40 % de consommation en 2030, −50 % en 2040, −60 % en 2050 pour les bâtiments tertiaires de 1 000 m² et plus, avec une déclaration annuelle sur OPERAT.',
          },
          {
            id: uid('k'),
            value: '',
            label: 'Le décret BACS impose le pilotage',
            hint: 'Un système d’automatisation et de contrôle est obligatoire au-delà de 290 kW de chauffage ou de climatisation depuis 2025, au-delà de 70 kW en 2030.',
          },
          {
            id: uid('k'),
            value: '',
            label: 'Des installations à moderniser',
            hint: 'Chaudières fioul, réseaux non isolés, régulations figées : chaque équipement se dimensionne à partir d’un relevé sur site et d’une note de calcul.',
          },
        ],
      },
      { background: 'surface', paddingTop: 'xl', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'INGÉNIERIE · TRAVAUX · SUIVI DE PERFORMANCE · FINANCEMENT CEE',
        title: 'Un seul interlocuteur, de l’étude à la performance suivie',
        intro: 'Nos travaux ne se limitent pas aux opérations CEE : chaque solution est d’abord dimensionnée pour la performance de votre site.',
        style: 'minimal',
        columns: 4,
        items: [
          { id: uid('c'), icon: 'drafting', title: 'Ingénierie', text: 'Ingénierie fluides (chauffage, ventilation, climatisation, plomberie, désenfumage) et ingénierie efficacité énergétique (audit, notes de dimensionnement, calcul du gisement), réalisées en interne.', tags: [], link: '/etudes-ingenierie-energetique/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'wrench', title: 'Travaux', text: 'Installation par nos équipes, suivi de chantier, assistance à maîtrise d’ouvrage et mise en service, sans interrompre votre exploitation.', tags: [], link: '/accompagnement-travaux/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'chart', title: 'Suivi de performance', text: 'Contrôle de conformité, suivi des consommations après travaux, contrat de performance énergétique.', tags: [], link: '/contrat-de-performance-energetique/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'badge', title: 'Financement CEE', text: 'Un levier intégré au projet lorsque l’opération y est éligible : éligibilité vérifiée dès l’étude, dossier constitué avec les pièces du chantier.', tags: [], link: '/decret-tertiaire-decret-bacs/', linkLabel: 'Découvrir' },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'cards',
      {
        eyebrow: 'Solutions',
        title: 'Cinq expertises pour la performance énergétique de vos sites',
        intro: 'Toutes nos solutions',
        style: 'numbered',
        columns: 5,
        items: [
          { id: uid('c'), icon: 'snowflake', image: img('centrale-froid.webp'), title: 'Froid commercial et industriel', text: 'Régulation HP et BP flottantes, condenseurs haute efficacité, variation électronique de vitesse, fermeture des meubles frigorifiques.', tags: [], link: '/solutions/froid-commercial-industriel/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'flame', image: img('installation-technique.webp'), title: 'Récupération de chaleur', text: 'La chaleur des groupes froids, des compresseurs d’air et des process chauffe les locaux et l’eau.', tags: [], link: '/solutions/recuperation-de-chaleur/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'wind', image: img('pompes-a-chaleur-toiture.webp'), title: 'Chauffage et traitement d’air', text: 'Pompes à chaleur en remplacement du fioul ou du gaz, déstratification des grands volumes.', tags: [], link: '/solutions/pompe-a-chaleur-tertiaire/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'cpu', image: img('climatisation-toiture.webp'), title: 'Pilotage GTB / GTC', text: 'Gestion technique du bâtiment de classe A ou B, conformité au décret BACS.', tags: [], link: '/solutions/pilotage-gtb-decret-bacs/', linkLabel: 'Découvrir' },
          { id: uid('c'), icon: 'shield', image: img('cee-tertiaire.webp'), title: 'Isolation technique', text: 'Toitures-terrasses, calorifugeage des réseaux, matelas isolants sur les points singuliers.', tags: [], link: '/solutions/isolation-technique/', linkLabel: 'Découvrir' },
        ],
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'xl' }
    ),
    b(
      'steps',
      {
        eyebrow: 'Parcours',
        title: 'Votre projet en 5 étapes, de l’étude au suivi',
        style: 'timeline',
        deliverableLabel: 'Livrable',
        items: [
          { id: uid('s'), num: '01', title: 'Étude et éligibilité', text: 'Audit énergétique, relevés sur site et calcul du gisement. Étude de faisabilité technique et vérification de l’éligibilité aux dispositifs de financement.', deliverable: '' },
          { id: uid('s'), num: '02', title: 'Ingénierie et planification', text: 'Notes de dimensionnement, choix des équipements, devis et plan de financement. Planning des travaux et organisation de l’assistance à maîtrise d’ouvrage.', deliverable: '' },
          { id: uid('s'), num: '03', title: 'Travaux et suivi de chantier', text: 'Installation par nos équipes, suivi de chantier et AMO pour alléger votre charge, mise en service et réglages, sans interrompre l’exploitation.', deliverable: '' },
          { id: uid('s'), num: '04', title: 'Fin de travaux et contrôle', text: 'Documents de fin de travaux et procès-verbal de réception. Pour les opérations CEE : contrôle par un organisme accrédité COFRAC.', deliverable: '' },
          { id: uid('s'), num: '05', title: 'Prise en charge et suivi', text: 'Rapport final et suivi du dossier de financement jusqu’à la prise en charge complète. Suivi des consommations après travaux.', deliverable: '' },
        ],
        buttons: [button('Notre approche', '/notre-approche/', 'secondary', 'none')],
      },
      { background: 'navy', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'projects',
      {
        eyebrow: 'Réalisations',
        title: 'Nos réalisations en performance énergétique',
        intro: 'Preuves terrain : un chiffre clé par chantier.',
        layout: 'grid',
        filter: 'all',
        showFilters: false,
        limit: 3,
        headerLinkLabel: 'Voir toutes nos réalisations',
        headerLink: '/realisations/',
      },
      { background: 'navy', paddingTop: 'xl', paddingBottom: 'lg' }
    ),
    b(
      'checklist',
      {
        eyebrow: 'Qualifications',
        title: 'Qualifiés, assurés, contrôlés',
        intro: 'Logos officiels — ancre #qualifications.',
        cards: [
          {
            id: uid('ck'),
            tag: 'Qualifications PEXEN',
            title: 'Qualifications PEXEN',
            icon: 'fa-certificate',
            entries: [
              { id: uid('e'), title: 'RGE QualiPAC (chauffage et eau chaude sanitaire)' },
              { id: uid('e'), title: 'RGE Qualisol CESI' },
            ],
          },
          {
            id: uid('ck'),
            tag: 'Audit énergétique',
            title: 'Audit énergétique, via notre bureau d’études partenaire Leo Energy',
            icon: 'fa-drafting-compass',
            entries: [
              { id: uid('e'), title: 'OPQIBI 1905 (bâtiments tertiaires et collectifs)' },
              { id: uid('e'), title: 'OPQIBI 1717 (industrie)' },
            ],
          },
          {
            id: uid('ck'),
            tag: 'Assurances et contrôle',
            title: 'Assurances et contrôle',
            icon: 'fa-shield-alt',
            entries: [
              { id: uid('e'), title: 'RC Pro et décennale MIC Insurance' },
              { id: uid('e'), title: 'Opérations CEE contrôlées par un organisme accrédité COFRAC' },
            ],
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg', anchor: 'qualifications' }
    ),
    b(
      'panels',
      {
        eyebrow: 'Secteurs',
        title: 'Industrie, tertiaire, bâtiments collectifs :\nune approche 100 % B2B',
        items: [
          {
            id: uid('p'),
            image: img('centrale-froid.webp'),
            title: 'Industrie',
            text: 'Froid process, vapeur et air comprimé optimisés pendant que la production tourne.',
            bullets: [],
            link: '/secteurs/efficacite-energetique-industrielle/',
            linkLabel: 'Découvrir',
          },
          {
            id: uid('p'),
            image: img('installation-technique.webp'),
            title: 'Tertiaire',
            text: 'Des plans d’actions chiffrés pour le décret tertiaire et le décret BACS.',
            bullets: [],
            link: '/secteurs/efficacite-energetique-tertiaire/',
            linkLabel: 'Découvrir',
          },
          {
            id: uid('p'),
            image: img('pompes-a-chaleur-toiture.webp'),
            title: 'Bâtiments collectifs',
            text: 'Chaufferies, sortie du fioul et équilibrage des réseaux, pour les bailleurs et les syndics.',
            bullets: [],
            link: '/secteurs/batiments-collectifs/',
            linkLabel: 'Découvrir',
          },
          {
            id: uid('p'),
            image: img('professionnel-pac.webp'),
            title: 'Partenaires professionnels',
            text: 'Délégataires, mandataires, fabricants et bureaux d’études nous confient la réalisation et la documentation de leurs opérations.',
            bullets: [],
            link: '/partenaires/',
            linkLabel: 'Découvrir',
          },
        ],
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'faq',
      {
        eyebrow: 'FAQ',
        title: 'Questions fréquentes sur la performance énergétique',
        layout: 'split',
        showContactCard: false,
        items: [
          {
            id: uid('f'),
            question: 'Par quoi commencer pour réduire la consommation énergétique d’un site ?',
            answer:
              'Par une étude sur site : relevé des équipements, lecture des consommations, identification des postes les plus énergivores. Le froid, le chauffage des grands volumes et le pilotage concentrent souvent l’essentiel du gisement.',
          },
          {
            id: uid('f'),
            question: 'PEXEN réalise-t-il les travaux ou seulement l’étude ?',
            answer:
              'Les deux. PEXEN étudie, dimensionne, réalise les travaux avec ses équipes, met en service et suit les consommations. Un seul interlocuteur porte la note de calcul et le chantier.',
          },
          {
            id: uid('f'),
            question: 'Mes travaux peuvent-ils être financés ?',
            answer:
              'Une partie de nos solutions correspond à des opérations standardisées reconnues par l’État et peut bénéficier du financement CEE, à condition de l’engager avant la signature du devis. Nous réalisons aussi des travaux hors de ce dispositif.',
          },
          {
            id: uid('f'),
            question: 'Mon bâtiment est-il concerné par le décret tertiaire ?',
            answer:
              'Oui s’il accueille des activités tertiaires sur 1 000 m² ou plus. Les consommations se déclarent chaque année sur la plateforme OPERAT de l’ADEME, avant le 30 septembre.',
          },
          {
            id: uid('f'),
            question: 'Intervenez-vous sans arrêter l’exploitation ?',
            answer:
              'Oui. Les travaux sont phasés par circuit, par zone ou hors des heures d’ouverture : magasins ouverts, lignes de production en marche.',
          },
        ],
      },
      { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }
    ),
    b(
      'simulator',
      {
        eyebrow: 'Estimation',
        title: 'Estimer le financement de votre projet',
        intro: 'Type de site, travaux envisagés, puissance : obtenez un premier ordre de grandeur du financement mobilisable.',
      },
      { background: 'white', paddingTop: 'none', paddingBottom: 'none' }
    ),
        b(
          'contactForm',
          {
            formId: 'contact-main',
            title: 'Parlons de votre projet',
            intro: 'Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.',
            phoneLabel: 'Téléphone',
            phoneHint: '01 41 93 52 80',
            listItems: [
              'Un ingénieur étudie votre demande.',
              'Il prend contact avec vous pour qualifier le besoin.',
              'Nous organisons la visite technique de votre site.',
            ],
            submitLabel: 'Envoyer ma demande',
            variant: 'default',
            privacyPath: '/politique-de-confidentialite/',
          },
          { background: 'navy', paddingTop: 'xl', paddingBottom: 'xl' }
        ),
  ];
}

function approcheBlocks(): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      parentLabel: 'Accueil',
      parentLink: '/',
      title: 'Notre approche',
      intro: 'Méthode process : mesurer, dimensionner, installer, prouver — avec livrables à chaque jalon.',
      buttons: [contactBtn()],
    }),
    b(
      'steps',
      {
        eyebrow: 'Méthode',
        title: 'La méthode PEXEN',
        style: 'timeline',
        deliverableLabel: 'Livrable',
        items: [
          { id: uid('s'), num: '01', title: 'Mesurer', text: 'Prévisite & audit énergétique terrain.', deliverable: 'Pré-étude d’ingénierie détaillée' },
          { id: uid('s'), num: '02', title: 'Dimensionner', text: 'Ingénierie technico-financière & CEE.', deliverable: 'Dossier technique & offre ferme' },
          { id: uid('s'), num: '03', title: 'Installer', text: 'Pose et mise en service en site occupé.', deliverable: 'PV de réception & autocontrôle' },
          { id: uid('s'), num: '04', title: 'Prouver', text: 'Contrôle COFRAC & suivi des économies.', deliverable: 'Attestation COFRAC & bilan' },
        ],
        buttons: [contactBtn()],
      },
      { background: 'surface' }
    ),
  ];
}

function realisationsBlocks(): CmsBlock[] {
  return [
    b('pageHeader', {
      breadcrumb: true,
      parentLabel: 'Accueil',
      parentLink: '/',
      title: 'Des projets concrets',
      intro: 'Mix maquette Ultra + mise en avant type Tera : client, solution, puces techniques, prime CEE.',
      buttons: [button('Estimer le financement', '/estimation-financement/', 'secondary', 'none')],
    }),
    b(
      'projects',
      {
        title: 'Nos réalisations',
        layout: 'grid',
        filter: 'all',
        showFilters: true,
        limit: 12,
      },
      { background: 'surface', paddingTop: 'lg', paddingBottom: 'xl' }
    ),
  ];
}

export function ultraThemePages(): CmsPage[] {
  const casePages = ULTRA_CASE_STUDIES.map((cs) =>
    page(cs.path, cs.title, buildCaseStudyBlocks(cs), `${cs.title} | PEXEN`, 'project', cs.project)
  );

  return [
    page('/', 'Accueil', homeBlocks(), 'PEXEN — Ingénierie & Performance Énergétique', 'landing'),
    page('/notre-approche/', 'Notre approche', approcheBlocks()),
    page('/realisations/', 'Réalisations', realisationsBlocks()),
    ...casePages,
    page(
      '/estimation-financement/',
      'Estimer le financement',
      [
        b('pageHeader', {
          breadcrumb: true,
          parentLabel: 'Accueil',
          parentLink: '/',
          title: 'Estimez le financement de votre projet',
          intro:
            'Décrivez votre site et les travaux envisagés : vous obtenez un premier ordre de grandeur du financement des travaux énergétiques mobilisable. Il ne remplace ni la visite technique, ni les relevés, ni la note de calcul : un ingénieur PEXEN l’établit ensuite à partir de votre installation réelle.',
          buttons: [],
        }),
        b('simulator', { variant: 'tool' }, { background: 'white', paddingTop: 'lg', paddingBottom: 'lg' }),
      ]
    ),
    page(
      '/contact/',
      'Contact',
      [
        b(
          'contactForm',
          {
            formId: 'contact-main',
            title: 'Parlons de votre projet',
            intro:
              'Décrivez votre site, vos installations et vos échéances. Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.',
            phoneLabel: 'Téléphone',
            phoneHint: '01 41 93 52 80',
            listItems: [
              'Un ingénieur étudie votre demande.',
              'Il prend contact avec vous pour qualifier le besoin.',
              'Nous organisons la visite technique de votre site.',
            ],
            submitLabel: 'Envoyer ma demande',
            variant: 'default',
            privacyPath: '/politique-de-confidentialite/',
          },
          { background: 'navy', paddingTop: 'xl', paddingBottom: 'xl' }
        ),
      ]
    ),
  ];
}

export function ultraPrimaryMenu() {
  return [
    {
      id: 'u-exp',
      label: 'Expertises',
      path: '/etudes-ingenierie-energetique/',
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
        // Rénovation globale + Éclairage LED désactivés (mise en ligne)
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
        { id: 'c4', label: 'Partenaires professionnels', path: '/partenaires/' },
      ],
    },
    { id: 'u-real', label: 'Réalisations', path: '/realisations/' },
    { id: 'u-meth', label: 'Notre approche', path: '/notre-approche/' },
    { id: 'u-contact', label: 'Parler de votre projet', path: '/contact/', highlight: true },
  ];
}

export function ultraFooterMenu() {
  return [
    { id: 'uf-sec', label: 'Secteurs', path: '/secteurs/' },
    { id: 'uf-real', label: 'Réalisations', path: '/realisations/' },
    { id: 'uf-app', label: 'Notre approche', path: '/notre-approche/' },
    { id: 'uf-ctc', label: 'Contact', path: '/contact/' },
    { id: 'uf-leg', label: 'Mentions légales', path: '/mentions-legales/' },
  ];
}
