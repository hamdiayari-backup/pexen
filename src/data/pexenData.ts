import { ExpertiseItem, SecteurItem, RealisationItem, CeeSheet } from '../types';

export const PEXEN_INFO = {
  name: 'PEXEN®',
  legalName: 'PEXEN SAS',
  baseline: 'Ingénierie & Performance Énergétique',
  slogan: 'Optimiser aujourd\'hui. Performer demain.',
  phone: '01 41 93 52 80',
  phoneClean: '+33141935280',
  contactEmail: 'contact@pexen.fr',
  slaHours: '48 h ouvrées',
  address: 'Paris & Déploiement partout en France',
  rgeBadges: [
    { name: 'RGE Ventilation+', desc: 'Ventilation & traitement d\'air haute efficacité' },
    { name: 'RGE Qualisol CESI', desc: 'Solaire thermique & eau chaude sanitaire collective' },
    { name: 'SOCOTEC Fluides Frigorigènes', desc: 'Attestation de capacité Catégorie I (installations frigorifiques)' }
  ],
  partnerEngineering: {
    name: 'Leo Energy',
    qualifications: [
      'OPQIBI 1717 — Audit énergétique dans l\'industrie',
      'OPQIBI 1905 — Audit énergétique des bâtiments tertiaires et collectifs'
    ]
  },
  insurance: {
    name: 'MIC Insurance',
    type: 'RC Pro & Garantie Décennale'
  }
};

export const CEE_SHEETS: CeeSheet[] = [
  {
    id: 'hp-flottante',
    name: 'Haute pression flottante',
    codeTertiaire: 'BAT-TH-134',
    codeIndustrie: 'IND-UT-116',
    description: 'Régulation dynamique de la haute pression selon la température extérieure pour minimiser le travail du compresseur frigorifique.',
    typicalSavings: '15% à 25% de la consommation groupe froid',
    coverageEstimate: 'Jusqu\'à 80% financé par les CEE'
  },
  {
    id: 'bp-flottante',
    name: 'Basse pression flottante',
    codeTertiaire: 'BAT-TH-145',
    codeIndustrie: 'IND-UT-115',
    description: 'Ajustement de la pression d\'évaporation selon la charge thermique réelle des postes et des meubles.',
    typicalSavings: '8% à 14% de réduction énergétique',
    coverageEstimate: 'Prise en charge CEE significative'
  },
  {
    id: 'condenseur-he',
    name: 'Condenseur haute efficacité',
    codeTertiaire: 'BAT-EQ-130',
    codeIndustrie: 'IND-UT-113',
    description: 'Condenseur à micro-canaux ou moteurs électroniques EC pour améliorer les débits thermiques et abaisser le pincement.',
    typicalSavings: '12% à 20% sur la boucle de condensation',
    coverageEstimate: 'Valorisation CEE standardisée'
  },
  {
    id: 'vev-vitesse',
    name: 'Variateur électronique de vitesse (VEV)',
    codeTertiaire: 'BAT-TH-112',
    codeIndustrie: 'IND-UT-102',
    description: 'Modulation précise de la vitesse de rotation des compresseurs, pompes et ventilateurs en fonction des besoins réels.',
    typicalSavings: '20% à 35% sur les moteurs asynchrones',
    coverageEstimate: 'Amortissement rapide accéléré CEE'
  },
  {
    id: 'fermeture-meubles',
    name: 'Fermeture des meubles frigorifiques',
    codeTertiaire: 'BAT-TH-124 / 125',
    codeIndustrie: '—',
    description: 'Portes vitrées double ou triple vitrage sur meubles froid positif et négatif pour stopper le rayonnement froid.',
    typicalSavings: '25% à 45% sur le linéaire froid commercial',
    coverageEstimate: 'Financement CEE dédié grande distribution'
  },
  {
    id: 'recup-chaleur-groupe',
    name: 'Récupération de chaleur sur groupe froid / CVC',
    codeTertiaire: 'BAT-TH-139',
    codeIndustrie: 'IND-UT-103',
    description: 'Désurchauffe et condensation totale pour chauffer gratuitement eau chaude sanitaire ou réseaux de chauffage.',
    typicalSavings: 'Économie jusqu\'à 90% sur l\'ECS ou appoint chauffage',
    coverageEstimate: 'Fiche CEE très avantageuse'
  },
  {
    id: 'chaleur-fatale',
    name: 'Récupération de chaleur fatale industrielle',
    codeTertiaire: '—',
    codeIndustrie: 'IND-UT-137',
    description: 'Captage des rejets thermiques de fours, séchoirs, compresseurs ou effluents pour réinjection directe dans le process.',
    typicalSavings: 'Réduction massive des consommations gaz ou fioul',
    coverageEstimate: 'Dossier CEE spécifique & accompagnement ADEME'
  },
  {
    id: 'recup-eaux-grises',
    name: 'Récupération instantanée sur eaux grises',
    codeTertiaire: 'BAT-TH-154',
    codeIndustrie: '—',
    description: 'Échangeurs thermiques sur eaux usées tièdes pour préchauffer l\'arrivée d\'eau de ville.',
    typicalSavings: '30% à 50% sur l\'eau chaude sanitaire',
    coverageEstimate: 'Éligible CEE tertiaire'
  },
  {
    id: 'pompe-a-chaleur',
    name: 'Pompe à chaleur air/eau (remplacement fioul/gaz)',
    codeTertiaire: 'BAT-TH-163',
    codeIndustrie: 'IND-UT-117',
    description: 'Substitution de chaudières carbonées par des PAC haute température ou aérothermiques haute efficacité.',
    typicalSavings: 'Jusqu\'à 60% d\'énergie primaire consommée',
    coverageEstimate: 'Décarbonation majeure & bonifications CEE'
  },
  {
    id: 'destratification',
    name: 'Déstratification d\'air des grands volumes',
    codeTertiaire: 'BAT-TH-142',
    codeIndustrie: 'IND-BA-116',
    description: 'Rabattement de l\'air chaud accumulé sous toiture vers la zone de vie et de travail dans les entrepôts et usines.',
    typicalSavings: '15% à 30% sur la facture de chauffage',
    coverageEstimate: 'ROI très court sous 18 mois'
  },
  {
    id: 'gtb-gtc',
    name: 'Pilotage GTB / GTC (Décret BACS)',
    codeTertiaire: 'BAT-TH-116',
    codeIndustrie: 'IND-UT-134',
    description: 'Automates programmables et supervision centrale régulant le confort, le chauffage, la climatisation et la ventilation.',
    typicalSavings: '15% à 30% d\'énergie globale du bâtiment',
    coverageEstimate: 'Mise en conformité BACS obligatoire 2025/2030'
  },
  {
    id: 'isolation-calorifugeage',
    name: 'Matelas thermiques et calorifugeage',
    codeTertiaire: 'BAT-TH-106',
    codeIndustrie: 'IND-UT-121',
    description: 'Isolation sur mesure des points singuliers (vannes, clapets, brides) et tuyauteries de fluides chauds ou glacés.',
    typicalSavings: 'Pertes thermiques réduites de plus de 80%',
    coverageEstimate: 'Travaux à très faible reste à charge'
  },
  {
    id: 'toiture-terrasse',
    name: 'Isolation de toiture terrasse',
    codeTertiaire: 'BAT-TH-107',
    codeIndustrie: '—',
    description: 'Amélioration de la résistance thermique R de l\'enveloppe du bâtiment pour limiter les déperditions.',
    typicalSavings: '10% à 20% de gain sur le bâtiment',
    coverageEstimate: 'Valorisation CEE selon surface'
  }
];

export const EXPERTISES: ExpertiseItem[] = [
  {
    slug: 'froid',
    title: 'Froid commercial & industriel',
    shortDesc: 'Haute et basse pression flottante, condenseurs haute efficacité, variateurs et fermeture de meubles frigorifiques.',
    heroTitle: 'Froid commercial et industriel : optimiser vos groupes froids',
    metaDesc: 'Haute et basse pression flottante, condenseurs, variateurs, meubles frigorifiques : réduisez la consommation de vos groupes froids.',
    iconName: 'Snowflake',
    solutions: [
      {
        title: 'Haute pression flottante',
        description: 'Ajuste la pression de condensation en continu par rapport aux variations de température extérieure. Évite le fonctionnement inutile à haute pression pendant 80% de l\'année.',
        ceeFiches: 'BAT-TH-134 (Tertiaire) · IND-UT-116 (Industrie)'
      },
      {
        title: 'Basse pression flottante',
        description: 'Module la température d\'évaporation selon les besoins de froid effectifs des postes et des vitrines. Chaque degré gagné sur l\'évaporation réduit la puissance électrique de 3%.',
        ceeFiches: 'BAT-TH-145 (Tertiaire) · IND-UT-115 (Industrie)'
      },
      {
        title: 'Condenseur haute efficacité',
        description: 'Remplacement ou optimisation des condenseurs par des échangeurs à géométrie avancée et ventilateurs électroniques EC à haut rendement.',
        ceeFiches: 'BAT-EQ-130 (Tertiaire) · IND-UT-113 (Industrie)'
      },
      {
        title: 'Variateur électronique de vitesse (VEV)',
        description: 'Ajuste la vitesse des compresseurs aux variations de charge thermique sans à-coups ni démarrages destructeurs.',
        ceeFiches: 'BAT-TH-112 (Tertiaire) · IND-UT-102 (Industrie)'
      },
      {
        title: 'Fermeture des meubles frigorifiques',
        description: 'Pose de portes vitrées hermétiques sur meubles froids positifs et négatifs en hypermarchés et supermarchés.',
        ceeFiches: 'BAT-TH-124 (Positif) · BAT-TH-125 (Négatif)'
      }
    ],
    ceeList: ['BAT-TH-134', 'IND-UT-116', 'BAT-TH-145', 'IND-UT-115', 'BAT-EQ-130', 'IND-UT-113', 'BAT-TH-112', 'IND-UT-102', 'BAT-TH-124', 'BAT-TH-125']
  },
  {
    slug: 'recuperation-de-chaleur',
    title: 'Récupération de chaleur',
    shortDesc: 'Valorisez l\'énergie perdue de vos groupes frigorifiques, process thermiques industriels et eaux grises.',
    heroTitle: 'Récupération de chaleur : valoriser l\'énergie perdue',
    metaDesc: 'Récupérez la chaleur de vos groupes froids, de vos process et de vos eaux grises pour réduire vos besoins de chauffage.',
    iconName: 'Flame',
    solutions: [
      {
        title: 'Sur groupe frigorifique / CVC',
        description: 'Captation de l\'énergie calorifique rejetée au condenseur pour produire de l\'eau chaude sanitaire ou alimenter les boucles de préchauffage sans consommer de combustible.',
        ceeFiches: 'BAT-TH-139 (Tertiaire) · IND-UT-103 (Industrie)'
      },
      {
        title: 'Chaleur fatale industrielle',
        description: 'Installation d\'échangeurs haute performance sur effluents thermiques, fumées de fours, compresseurs et évaporateurs de procédés industriels.',
        ceeFiches: 'IND-UT-137 (Industrie)'
      },
      {
        title: 'Récupération instantanée sur eaux grises',
        description: 'Échangeurs instantanés pour réutiliser les calories de l\'eau tiède d\'évacuation des sanitaires, cuisines collectives ou laveries.',
        ceeFiches: 'BAT-TH-154 (Tertiaire)'
      }
    ],
    ceeList: ['BAT-TH-139', 'IND-UT-103', 'IND-UT-137', 'BAT-TH-154']
  },
  {
    slug: 'chauffage-traitement-air',
    title: 'Chauffage & traitement d\'air',
    shortDesc: 'Pompes à chaleur en remplacement fioul/gaz et déstratification des halls de grande hauteur.',
    heroTitle: 'Chauffage et traitement d\'air des grands volumes',
    metaDesc: 'Remplacement de chaudières fioul ou gaz par pompe à chaleur et déstratification d\'air des bâtiments de grande hauteur.',
    iconName: 'Wind',
    solutions: [
      {
        title: 'Pompe à chaleur air/eau (remplacement fioul/gaz)',
        description: 'Sortie définitive des énergies fossiles. Conception et intégration de PAC industrielles de grande puissance garantissant le régime d\'eau requis même par températures négatives.',
        ceeFiches: 'BAT-TH-163 (Tertiaire) · IND-UT-117 (Industrie)'
      },
      {
        title: 'Déstratification d\'air',
        description: 'Basse et haute vitesse automatisée pour faire redescendre les nappes chaudes stagnantes sous toiture dans les entrepôts et usines. Confort thermique homogénéisé dès le sol.',
        ceeFiches: 'BAT-TH-142 (Tertiaire) · IND-BA-116 (Industrie)'
      }
    ],
    ceeList: ['BAT-TH-163', 'IND-UT-117', 'BAT-TH-142', 'IND-BA-116']
  },
  {
    slug: 'gtb-gtc',
    title: 'Pilotage GTB / GTC',
    shortDesc: 'Gestion Technique du Bâtiment classe A/B et mise en conformité réglementaire avec le décret BACS.',
    heroTitle: 'Pilotage GTB / GTC et conformité au décret BACS',
    metaDesc: 'Pilotez vos consommations avec une GTB/GTC et mettez vos bâtiments tertiaires en conformité avec le décret BACS.',
    iconName: 'Cpu',
    solutions: [
      {
        title: 'GTB / GTC centralisée',
        description: 'Automates modulaires, compteurs communicants et supervision intuitive pour suivre en temps réel la consommation CVC, éclairage et postes auxiliaires.',
        ceeFiches: 'BAT-TH-116 (Tertiaire) · IND-UT-134 (Industrie)'
      },
      {
        title: 'Mise en conformité Décret BACS',
        description: 'Mise à niveau obligatoire : équipement d\'un système d\'automatisation et de contrôle des bâtiments pour tous les systèmes > 290 kW (2025) puis > 70 kW (2030).',
        ceeFiches: 'BAT-TH-116 (Bacs conforme)'
      }
    ],
    ceeList: ['BAT-TH-116', 'IND-UT-134']
  },
  {
    slug: 'isolation-technique',
    title: 'Isolation technique',
    shortDesc: 'Calorifugeage des réseaux hydrauliques, matelas thermiques pour vannes et isolation de toiture terrasse.',
    heroTitle: 'Isolation technique des réseaux et des bâtiments',
    metaDesc: 'Calorifugeage, matelas thermiques et isolation de toiture terrasse pour limiter les pertes de vos réseaux et bâtiments.',
    iconName: 'ShieldCheck',
    solutions: [
      {
        title: 'Matelas thermiques et calorifugeage',
        description: 'Housses isolantes amovibles en tissu technique incombustible pour robinetterie, filtres et échangeurs. Démontage et remontage instantanés lors des opérations de maintenance.',
        ceeFiches: 'BAT-TH-106 (Tertiaire) · IND-UT-121 (Industrie)'
      },
      {
        title: 'Isolation de toiture terrasse',
        description: 'Renforcement thermique des toitures plates pour stopper le pont thermique sommital et protéger les équipements techniques en toiture.',
        ceeFiches: 'BAT-TH-107 (Tertiaire)'
      }
    ],
    ceeList: ['BAT-TH-106', 'IND-UT-121', 'BAT-TH-107']
  },
  {
    slug: 'reglementation-cee',
    title: 'Réglementation & financement CEE',
    shortDesc: 'Décret tertiaire, décret BACS et montage intégral de vos dossiers de Certificats d\'Économies d\'Énergie.',
    heroTitle: 'Réglementation et financement CEE',
    metaDesc: 'PEXEN vous accompagne dans vos obligations réglementaires et monte vos dossiers de certificats d\'économies d\'énergie (CEE).',
    iconName: 'FileCheck',
    solutions: [
      {
        title: 'Décret tertiaire & Déclaration OPERAT',
        description: 'Obligation de réduction des consommations (-40% en 2030, -50% en 2040, -60% en 2050) pour les bâtiments de 1 000 m² et plus. Établissement de l\'année de référence et plan pluriannuel d\'actions.',
        ceeFiches: 'OPERAT · Trajectoire tertiaire'
      },
      {
        title: 'Décret BACS (Building Automation & Control Systems)',
        description: 'Obligation d\'installer une GTB pour les puissances > 290 kW depuis le 1er janvier 2025, et > 70 kW dès le 1er janvier 2030.',
        ceeFiches: 'Fiche BAT-TH-116 bonifiée'
      },
      {
        title: 'Ingénierie de financement CEE de A à Z',
        description: 'Montage rigoureux, contractualisation auprès des obligés et délégataires, validation technique et contrôle COFRAC systématique pour minimiser votre reste à charge.',
        ceeFiches: 'Fiches standards Tertiaire & Industrie'
      }
    ],
    ceeList: ['BAT-TH-116', 'BAT-TH-134', 'IND-UT-116', 'IND-UT-103', 'BAT-TH-139']
  }
];

export const SECTEURS: SecteurItem[] = [
  {
    slug: 'industrie',
    title: 'Industrie',
    shortDesc: 'Sites de production, process, froid industriel, chaleur fatale.',
    heroTitle: 'Performance énergétique des sites industriels',
    metaDesc: 'Froid industriel, récupération de chaleur fatale, variateurs, isolation : réduisez les consommations de vos sites de production.',
    image: '/images/terrain/gaz_renouvelable.jpg',
    enjeux: [
      'Poids prépondérant du coût de l\'énergie dans le coût de revient des process de fabrication.',
      'Impératif absolu de continuité de production sans interruption d\'activité pendant les travaux d\'ingénierie.',
      'Valorisation de la chaleur fatale industrielle perdue au condenseur et aux cheminées.'
    ],
    solutions: [
      { title: 'Froid commercial & industriel', slug: 'froid' },
      { title: 'Récupération de chaleur', slug: 'recuperation-de-chaleur' },
      { title: 'Isolation technique', slug: 'isolation-technique' }
    ],
    typicalEquipments: ['Centrales froid NH3 / CO2', 'Fours & compresseurs d\'air', 'Réseaux vapeur & eau surchauffée', 'Boucles de glycol']
  },
  {
    slug: 'tertiaire',
    title: 'Tertiaire',
    shortDesc: 'Grande distribution, bureaux, entrepôts logistiques, santé.',
    heroTitle: 'Performance énergétique des bâtiments tertiaires',
    metaDesc: 'Grande distribution, bureaux, entrepôts, santé : décret tertiaire, BACS, froid commercial et pilotage énergétique.',
    image: '/images/terrain/meubles_froids.jpg',
    enjeux: [
      'Conformité stricte aux exigences du Décret Tertiaire (échéances 2030 / 2040 / 2050 et télédéclaration OPERAT).',
      'Mise en conformité immédiate avec le Décret BACS (systèmes CVC > 290 kW puis > 70 kW).',
      'Maîtrise des coûts électriques du froid commercial alimentaire et du chauffage des grands volumes logistiques.'
    ],
    solutions: [
      { title: 'Froid commercial & industriel', slug: 'froid' },
      { title: 'Pilotage GTB / GTC', slug: 'gtb-gtc' },
      { title: 'Chauffage & traitement d\'air', slug: 'chauffage-traitement-air' }
    ],
    typicalEquipments: ['Meubles froids & centrales positives/négatives', 'Rooftops & CTA', 'Supervision GTB', 'Déstratificateurs d\'air']
  },
  {
    slug: 'residentiel-collectif',
    title: 'Résidentiel collectif',
    shortDesc: 'Bailleurs sociaux, syndics et gestionnaires de copropriétés.',
    heroTitle: 'Performance énergétique du résidentiel collectif',
    metaDesc: 'Bailleurs sociaux, syndics, gestionnaires : maîtrisez les consommations et les charges de vos bâtiments collectifs.',
    image: '/images/terrain/maison_solaire.jpg',
    enjeux: [
      'Maîtrise indispensable des charges locatives et d\'énergie répercutées sur les occupants.',
      'Modernisation des chaufferies collectives vieillissantes et transition hors des combustibles fossiles (fioul/gaz).',
      'Sécurisation des financements CEE pour réduire au strict minimum l\'effort financier des copropriétaires et bailleurs.'
    ],
    solutions: [
      { title: 'Chauffage & traitement d\'air', slug: 'chauffage-traitement-air' },
      { title: 'Isolation technique', slug: 'isolation-technique' },
      { title: 'Récupération de chaleur', slug: 'recuperation-de-chaleur' }
    ],
    typicalEquipments: ['Chaufferies collectives & sous-stations', 'Pompes à chaleur hybrides ou collectives', 'Réseaux primaires calorifugés', 'Ventilation hygroréglable']
  }
];

export const REALISATIONS: RealisationItem[] = [
  {
    id: 'intermarche-trevenans',
    slug: 'intermarche-trevenans',
    client: 'Intermarché Super',
    location: 'Trévenans',
    department: '90',
    sector: 'Tertiaire',
    solution: 'Haute Pression Flottante & Optimisation Centrale Froid',
    shortDescription: 'Modernisation du système frigorifique alimentaire avec intégration de haute pression flottante et variateurs de vitesse.',
    problem: 'Consommations électriques excessives sur les centrales de production frigorifique positive et négative avec sur-pression de condensation en mi-saison et période estivale.',
    solutionDetail: 'Installation d\'automates de régulation HP flottante asservie à la température de bulbe humide extérieure, remplacement des condenseurs et pose de variateurs de fréquence VEV.',
    results: [
      'Consommation électrique des compresseurs diminuée significativement',
      'Suppression des pointes de condensation estivales',
      'Travaux réalisés sans aucune rupture de la chaîne du froid'
    ],
    image: '/images/terrain/meubles_froids.jpg',
    ceeSheet: 'BAT-TH-134 & BAT-TH-112',
    metrics: [
      { label: 'Secteur', value: 'Grande distribution' },
      { label: 'Site', value: 'Trévenans (90)' },
      { label: 'Solution', value: 'HP Flottante & VEV' },
      { label: 'Dossier CEE', value: '100% instruit' }
    ]
  },
  {
    id: 'colorcon-bazainville',
    slug: 'colorcon-bazainville',
    client: 'Colorcon',
    location: 'Bazainville',
    department: '78',
    sector: 'Industrie',
    solution: 'Récupération de Chaleur Fatale & Calorifugeage Industriel',
    shortDescription: 'Captation des rejets thermiques process et isolation haute température sur site pharmaceutique de pointe.',
    problem: 'Pertes calorifiques importantes sur les réseaux d\'eau surchauffée et rejets thermiques non exploités dans l\'atmosphère au niveau des échangeurs process.',
    solutionDetail: 'Intégration d\'une boucle de récupération d\'énergie thermique fatale pour préchauffer les fluides industriels et confection sur mesure de matelas thermiques démontables pour toutes les vannes singulières.',
    results: [
      'Baisse directe de la consommation de gaz naturel sur le générateur thermique',
      'Amortissement technique rapide via les Certificats d\'Économies d\'Énergie',
      'Intervention en salle propre sans interruption de la production'
    ],
    image: '/images/terrain/gaz_renouvelable.jpg',
    ceeSheet: 'IND-UT-103 & IND-UT-121',
    metrics: [
      { label: 'Secteur', value: 'Industrie pharmaceutique' },
      { label: 'Site', value: 'Bazainville (78)' },
      { label: 'Solution', value: 'Chaleur fatale & Matelas' },
      { label: 'Audit', value: 'Ingénierie Leo Energy' }
    ]
  },
  {
    id: 'carrefour-market-idf',
    slug: 'carrefour-market',
    client: 'Carrefour Market',
    location: 'Région Parisienne',
    department: '75/92',
    sector: 'Tertiaire',
    solution: 'Condenseurs Haute Efficacité & Fermeture Meubles Froid',
    shortDescription: 'Rénovation intégrale de la boucle de condensation et fermeture étanche des linéaires froids alimentaires.',
    problem: 'Déperditions thermiques sévères au niveau des meubles de vente en libre-service et vieillissement des aéroréfrigérants en toiture terrasse.',
    solutionDetail: 'Installation de condenseurs adiabatiques haute efficacité et vitrage haute performance avec joints anti-rayonnement sur l\'ensemble des linéaires de vente.',
    results: [
      'Baisse majeure du talon de puissance de l\'hypermarché',
      'Amélioration notable du confort client dans les allées réfrigérées',
      'Prise en charge financière majeure par le dispositif CEE'
    ],
    image: '/images/terrain/froid_condenseurs.jpg',
    ceeSheet: 'BAT-EQ-130 & BAT-TH-124',
    metrics: [
      { label: 'Secteur', value: 'Grande distribution' },
      { label: 'Site', value: 'Île-de-France' },
      { label: 'Solution', value: 'Condenseurs HE & Meubles' },
      { label: 'Contrôle', value: 'COFRAC systématique' }
    ]
  },
  {
    id: 'cedim-logistique',
    slug: 'cedim',
    client: 'CEDIM',
    location: 'Plateforme Logistique',
    department: 'France',
    sector: 'Tertiaire',
    solution: 'Déstratification d\'Air Grands Volumes & GTB',
    shortDescription: 'Homogénéisation thermique des zones de stockage et régulation automatique multizone.',
    problem: 'Gradient thermique vertical de plus de 10°C entre le sol et la toiture de l\'entrepôt de 12 mètres, entraînant une surconsommation en période de chauffe.',
    solutionDetail: 'Déploiement d\'une flotte de déstratificateurs d\'air asservis par sondes de température étagées, pilotés via une GTB communicante avec calendrier horaire d\'occupation.',
    results: [
      'Température homogène à 18°C sur toute la zone de préparation de commandes',
      'Baisse immédiate du déclenchement des aérothermes en toiture',
      'Supervision accessible à distance par le gestionnaire technique'
    ],
    image: '/images/terrain/rooftop_cta.jpg',
    ceeSheet: 'BAT-TH-142 & BAT-TH-116',
    metrics: [
      { label: 'Secteur', value: 'Entrepôt logistique' },
      { label: 'Hauteur', value: '12 mètres utiles' },
      { label: 'Solution', value: 'Déstratification & GTB' },
      { label: 'Conformité', value: 'Décret BACS validé' }
    ]
  }
];

export const METHODE_STEPS = [
  {
    num: '01',
    title: 'Prévisite & audit énergétique terrain',
    subtitle: 'Analyse sur site des consommations et faisabilité',
    description: 'Visite de vos installations, recueil des données de puissance, relevés thermodynamiques et aérauliques, étude d\'éligibilité aux dispositifs CEE.',
    deliverable: 'Pré-étude d\'ingénierie détaillée'
  },
  {
    num: '02',
    title: 'Dimensionnement & ingénierie technico-financière',
    subtitle: 'Calculs thermiques et montage du financement',
    description: 'Sélection des matériels et technologies optimales, calculs thermiques précis, estimation des retours sur investissement (ROI) et montage complet du dossier de subvention CEE.',
    deliverable: 'Dossier de dimensionnement, devis ferme & offre de financement CEE'
  },
  {
    num: '03',
    title: 'Installation, pose & mise en service',
    subtitle: 'Travaux sans interruption d\'activité',
    description: 'Déploiement par nos équipes qualifiées en milieu occupé, paramétrage fin des automates et boucles de régulation, essais fonctionnels et autocontrôles stricts.',
    deliverable: 'Procès-verbal de réception & fiche d\'autocontrôle de mise en service'
  },
  {
    num: '04',
    title: 'Contrôle COFRAC, suivi & performance',
    subtitle: 'Audit indépendant et pérennisation des économies',
    description: 'Contrôle systématique par un organisme accrédité COFRAC pour sceller la conformité réglementaire, suivi des consommations réelles et accompagnement dans la durée.',
    deliverable: 'Attestation de conformité COFRAC & bilan d\'économies d\'énergie'
  }
];

export const VOS_ENJEUX = [
  {
    icon: 'TrendingDown',
    title: 'Des factures énergétiques trop élevées',
    solutionText: 'Nous identifions vos postes les plus consommateurs (froid, chauffage, process) et engageons les actions au meilleur retour sur investissement.',
    link: '/expertises/'
  },
  {
    icon: 'ShieldAlert',
    title: 'Des obligations réglementaires strictes',
    solutionText: 'Décret tertiaire, décret BACS : nous vous aidons à atteindre vos objectifs chiffrés et à sécuriser votre conformité sans stress.',
    link: '/expertises/reglementation-cee/'
  },
  {
    icon: 'Wrench',
    title: 'Des installations techniques vieillissantes',
    solutionText: 'Groupes froids énergivores, chaufferies fossiles, réseaux non isolés : nous modernisons vos équipements sans interrompre votre activité.',
    link: '/expertises/'
  },
  {
    icon: 'BadgePercent',
    title: 'Un budget travaux à financer et sécuriser',
    solutionText: 'Nous montons et valorisons vos dossiers CEE de A à Z pour réduire le reste à charge de vos travaux au strict minimum.',
    link: '/expertises/reglementation-cee/'
  }
];

export const FAQ_HOME = [
  {
    question: 'Quels types de sites accompagnez-vous ?',
    answer: 'PEXEN intervient sur les sites industriels, les bâtiments tertiaires (grande distribution, bureaux, entrepôts, santé) et le résidentiel collectif, partout en France.'
  },
  {
    question: 'Comment se déroule un projet avec PEXEN ?',
    answer: 'En 4 étapes : prévisite et audit, dimensionnement et ingénierie technico-financière, installation et mise en service, puis contrôle COFRAC et suivi des performances. Un document vous est remis à chaque étape.'
  },
  {
    question: 'Mes travaux peuvent-ils être financés par les CEE ?',
    answer: 'La plupart de nos solutions correspondent à des fiches standardisées de certificats d\'économies d\'énergie. PEXEN monte et valorise vos dossiers CEE, en direct ou via ses délégataires et mandataires partenaires. Le montant dépend de l\'étude de votre site.'
  },
  {
    question: 'Mon bâtiment est-il concerné par le décret tertiaire ?',
    answer: 'Oui s\'il accueille des activités tertiaires sur 1 000 m² ou plus. Le décret fixe une baisse des consommations de 40 % en 2030, 50 % en 2040 et 60 % en 2050 par rapport à une année de référence, avec une déclaration annuelle sur la plateforme OPERAT.'
  },
  {
    question: 'Le décret BACS m\'oblige-t-il à installer une GTB ?',
    answer: 'Les bâtiments tertiaires dont le chauffage ou la climatisation dépasse 290 kW doivent être équipés d\'un système de pilotage (GTB) depuis le 1er janvier 2025. Le seuil passe à 70 kW au 1er janvier 2030.'
  },
  {
    question: 'Je suis mandataire, délégataire ou fournisseur : comment travailler avec PEXEN ?',
    answer: 'Présentez-nous votre activité via le formulaire de contact en choisissant votre profil. Un interlocuteur dédié revient vers vous sous 48 h ouvrées.'
  },
  {
    question: 'Sous quel délai répondez-vous ?',
    answer: 'Un ingénieur ou chargé d\'affaires vous répond sous 48 h ouvrées.'
  }
];
