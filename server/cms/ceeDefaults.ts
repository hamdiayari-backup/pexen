/**
 * Barème indicatif du calculateur CEE — éditable dans le backoffice (bloc Simulateur).
 * Première fourchette €, sans pourcentage ni kWh cumac (brief Amina).
 */
import type { SimulatorData, SimulatorEnergy, SimulatorOperation, SimulatorOption } from './blocks';

export const CEE_SITE_TYPES: SimulatorOption[] = [
  { id: 'supermarche', label: 'Supermarché', factor: 1.15 },
  { id: 'bureaux', label: 'Bureaux', factor: 0.85 },
  { id: 'entrepot', label: 'Entrepôt', factor: 1 },
  { id: 'hotel', label: 'Hôtel', factor: 0.95 },
  { id: 'sante', label: 'Santé', factor: 1.05 },
  { id: 'industriel', label: 'Site industriel', factor: 1.2 },
  { id: 'collectif', label: 'Bâtiment collectif', factor: 0.9 },
];

export const CEE_REGIONS: SimulatorOption[] = [
  { id: 'idf', label: 'Île-de-France', factor: 1.05 },
  { id: 'hdf', label: 'Hauts-de-France', factor: 1.08 },
  { id: 'ge', label: 'Grand Est', factor: 1.08 },
  { id: 'nor', label: 'Normandie', factor: 1.05 },
  { id: 'bre', label: 'Bretagne', factor: 1 },
  { id: 'pdl', label: 'Pays de la Loire', factor: 1 },
  { id: 'cvl', label: 'Centre-Val de Loire', factor: 1.02 },
  { id: 'bfc', label: 'Bourgogne-Franche-Comté', factor: 1.06 },
  { id: 'naq', label: 'Nouvelle-Aquitaine', factor: 0.95 },
  { id: 'occ', label: 'Occitanie', factor: 0.9 },
  { id: 'ara', label: 'Auvergne-Rhône-Alpes', factor: 1.04 },
  { id: 'pac', label: 'Provence-Alpes-Côte d’Azur', factor: 0.88 },
  { id: 'cor', label: 'Corse', factor: 0.85 },
];

export const CEE_OPERATIONS: SimulatorOperation[] = [
  { id: 'pac', label: 'Pompe à chaleur', minPerM2: 8, maxPerM2: 22, minPerKw: 40, maxPerKw: 110 },
  { id: 'recup', label: 'Récupération de chaleur', minPerM2: 12, maxPerM2: 32, minPerKw: 30, maxPerKw: 90 },
  { id: 'froid', label: 'Régulation du froid', minPerM2: 8, maxPerM2: 20, minPerKw: 25, maxPerKw: 80 },
  { id: 'meubles', label: 'Fermeture des meubles frigorifiques', minPerM2: 15, maxPerM2: 40 },
  { id: 'destrat', label: 'Déstratification', minPerM2: 4, maxPerM2: 12 },
  { id: 'gtb', label: 'GTB', minPerM2: 5, maxPerM2: 16 },
  { id: 'isolation', label: 'Isolation', minPerM2: 7, maxPerM2: 20 },
  { id: 'led', label: 'Éclairage LED', minPerM2: 3, maxPerM2: 10 },
];

export const CEE_ENERGIES: SimulatorEnergy[] = [
  { id: 'fioul', label: 'Fioul', factor: 1.25 },
  { id: 'gaz', label: 'Gaz', factor: 1.12 },
  { id: 'electricite', label: 'Électricité', factor: 1 },
  { id: 'reseau', label: 'Réseau de chaleur', factor: 0.95 },
];

const TEASER_INTRO =
  'Type de site, travaux envisagés, puissance : obtenez un premier ordre de grandeur du financement mobilisable.';
const TOOL_INTRO =
  'Décrivez votre site et les travaux envisagés : vous obtenez un premier ordre de grandeur du financement des travaux énergétiques mobilisable.';
const DISCLAIMER =
  '* Première estimation indicative, sans valeur contractuelle : le dimensionnement et le montant définitif sont établis après analyse du site.';
const RESULT_NOTE = 'Un ingénieur PEXEN affine cette estimation lors d’un premier échange.';
const HOW_TEXT =
  'Chaque action correspond à une opération standardisée qui fixe un volume d’économies selon le secteur, la zone climatique et la puissance installée. Ce volume est valorisé au prix du marché ; des bonifications s’appliquent pour la sortie des énergies fossiles ou un contrat de performance énergétique.';

export function defaultSimulatorData(variant: 'teaser' | 'tool' = 'tool'): SimulatorData {
  const teaser = variant === 'teaser';
  return {
    variant,
    align: teaser ? 'left' : 'left',
    eyebrow: teaser ? 'Estimation' : 'Financement',
    title: teaser ? 'Estimer le financement de votre projet' : 'Décrivez votre site et les travaux envisagés',
    intro: teaser ? TEASER_INTRO : TOOL_INTRO,
    teaserCtaLabel: 'Estimer le financement',
    teaserCtaLink: '/estimation-financement/',
    teaserNote: 'Première estimation indicative : le dimensionnement est établi après analyse du site.',
    formId: 'contact-main',
    siteTypes: CEE_SITE_TYPES,
    regions: CEE_REGIONS,
    operations: CEE_OPERATIONS,
    energies: CEE_ENERGIES,
    disclaimer: DISCLAIMER,
    resultPrefix: 'Financement estimé',
    resultNote: RESULT_NOTE,
    ctaLabel: 'Envoyer ma demande',
    howTitle: teaser ? '' : 'Comment le financement des travaux énergétiques est-il estimé ?',
    howText: teaser ? '' : HOW_TEXT,
    privacyPath: '/politique-de-confidentialite/',
    contactTitle: teaser ? '' : 'Un projet ? Parlons-en.',
    contactText: teaser
      ? ''
      : 'Prise de contact sous 48 h ouvrées par un ingénieur PEXEN, pour qualifier votre besoin et définir les prochaines étapes.',
  };
}

export function resolveSimulatorVariant(d?: Partial<SimulatorData> | null): 'teaser' | 'tool' {
  if (d?.variant === 'teaser' || d?.variant === 'tool') return d.variant;
  const t = `${d?.title || ''} ${d?.eyebrow || ''}`.toLowerCase();
  if (t.includes('estimer le financement') || (t.includes('estimation') && !t.includes('estimez'))) return 'teaser';
  return 'tool';
}

export type ResolvedSimulator = SimulatorData & {
  variant: 'teaser' | 'tool';
  siteTypes: SimulatorOption[];
  regions: SimulatorOption[];
  operations: SimulatorOperation[];
  energies: SimulatorEnergy[];
};

export function mergeSimulatorData(d?: Partial<SimulatorData> | null): ResolvedSimulator {
  const variant = resolveSimulatorVariant(d);
  const base = defaultSimulatorData(variant);
  return {
    ...base,
    ...d,
    variant,
    siteTypes: d?.siteTypes?.length ? d.siteTypes : (base.siteTypes as SimulatorOption[]),
    regions: d?.regions?.length ? d.regions : (base.regions as SimulatorOption[]),
    operations: d?.operations?.length ? d.operations : (base.operations as SimulatorOperation[]),
    energies: d?.energies?.length ? d.energies : (base.energies as SimulatorEnergy[]),
  };
}

const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500);

export function estimateCeeRange(input: {
  siteTypes: SimulatorOption[];
  regions: SimulatorOption[];
  operations: SimulatorOperation[];
  energies: SimulatorEnergy[];
  siteTypeId: string;
  regionId: string;
  operationIds: string[];
  energyId: string;
  surfaceM2: number;
  powerKw: number;
}): { min: number; max: number } | null {
  const { operationIds, surfaceM2, powerKw } = input;
  if (!operationIds.length || !(surfaceM2 > 0)) return null;
  const ops = input.operations.filter((o) => operationIds.includes(o.id));
  if (!ops.length) return null;
  const sf = input.siteTypes.find((s) => s.id === input.siteTypeId)?.factor ?? 1;
  const rf = input.regions.find((r) => r.id === input.regionId)?.factor ?? 1;
  const ef = input.energies.find((e) => e.id === input.energyId)?.factor ?? 1;
  const m = sf * rf * ef;
  let min = ops.reduce((a, o) => a + (Number(o.minPerM2) || 0), 0) * surfaceM2 * m;
  let max = ops.reduce((a, o) => a + (Number(o.maxPerM2) || 0), 0) * surfaceM2 * m;
  if (powerKw > 0) {
    min += ops.reduce((a, o) => a + (Number(o.minPerKw) || 0), 0) * powerKw * m;
    max += ops.reduce((a, o) => a + (Number(o.maxPerKw) || 0), 0) * powerKw * m;
  }
  min = round500(min);
  max = round500(max);
  if (max <= min) max = min + 2500;
  return { min, max };
}

export function formatEur(n: number): string {
  return `${n.toLocaleString('fr-FR')} €`;
}
