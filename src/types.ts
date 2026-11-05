export type ExpertiseSlug =
  | 'froid-commercial-industriel'
  | 'recuperation-de-chaleur'
  | 'pompe-a-chaleur-tertiaire'
  | 'gtb-tertiaire-gtc'
  | 'isolation-technique'
  | 'financement-cee-reglementation';

export type SecteurSlug =
  | 'efficacite-energetique-industrielle'
  | 'efficacite-energetique-tertiaire'
  | 'renovation-energetique-copropriete';

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
