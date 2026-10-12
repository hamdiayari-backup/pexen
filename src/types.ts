export type ExpertiseSlug = 
  | 'froid'
  | 'recuperation-de-chaleur'
  | 'chauffage-traitement-air'
  | 'gtb-gtc'
  | 'isolation-technique'
  | 'reglementation-cee';

export type SecteurSlug =
  | 'industrie'
  | 'tertiaire'
  | 'residentiel-collectif';

export interface CeeSheet {
  id: string;
  name: string;
  codeTertiaire: string;
  codeIndustrie: string;
  description: string;
  typicalSavings: string;
  coverageEstimate: string;
}

export interface ExpertiseItem {
  slug: ExpertiseSlug;
  title: string;
  shortDesc: string;
  heroTitle: string;
  metaDesc: string;
  iconName: string;
  solutions: {
    title: string;
    description: string;
    ceeFiches: string;
  }[];
  ceeList: string[];
}

export interface SecteurItem {
  slug: SecteurSlug;
  title: string;
  shortDesc: string;
  heroTitle: string;
  metaDesc: string;
  image: string;
  enjeux: string[];
  solutions: {
    title: string;
    slug: ExpertiseSlug;
  }[];
  typicalEquipments: string[];
}

export interface RealisationItem {
  id: string;
  slug: string;
  client: string;
  location: string;
  department: string;
  sector: 'Industrie' | 'Tertiaire' | 'Résidentiel collectif';
  solution: string;
  shortDescription: string;
  problem: string;
  solutionDetail: string;
  results: string[];
  image: string;
  ceeSheet?: string;
  metrics: {
    label: string;
    value: string;
    sublabel?: string;
  }[];
}

export interface ContactFormData {
  vousEtes: string;
  entreprise: string;
  nomPrenom: string;
  fonction: string;
  email: string;
  telephone: string;
  typologieSite: string;
  natureBesoin: string;
  localisationSite: string;
  message: string;
  commentConnu: string;
  rgpdAccepted: boolean;
}
