import { EQUIPMENT_TYPE_LABELS, type EquipmentTypeValue } from '@/lib/equipment-constants';

/** Nature comptable / budgétaire d'un équipement (métadonnées JSON). */
export const EQUIPMENT_FINANCE_CATEGORY_VALUES = [
  'ACHAT',
  'INSTALLATION',
  'MOBILIER_SALLE',
  'BUREAU',
  'PEDAGOGIQUE_MOBILE',
  'CONSOMMABLE',
  'MAINTENANCE',
] as const;

export type EquipmentFinanceCategory = (typeof EQUIPMENT_FINANCE_CATEGORY_VALUES)[number];

export const EQUIPMENT_FINANCE_CATEGORY_LABELS: Record<EquipmentFinanceCategory, string> = {
  ACHAT: 'Achat matériel',
  INSTALLATION: 'Travaux / installation',
  MOBILIER_SALLE: 'Mobilier de salle (fixe)',
  BUREAU: 'Bureau (PC, photocopieur…)',
  PEDAGOGIQUE_MOBILE: 'Matériel pédagogique mobile',
  CONSOMMABLE: 'Consommable',
  MAINTENANCE: 'Maintenance / réparation',
};

export function getEquipmentFinanceCategoryLabel(v: string | null | undefined): string {
  if (!v) return 'Non classé';
  return EQUIPMENT_FINANCE_CATEGORY_LABELS[v as EquipmentFinanceCategory] ?? v;
}

/** Durée d'amortissement indicative par type technique. */
export function defaultAmortizationYears(type: string | null | undefined): number {
  switch (type) {
    case 'INFORMATIQUE':
      return 3;
    case 'MOBILIER':
      return 7;
    case 'INCENDIE':
    case 'SECOURISME':
      return 5;
    default:
      return 5;
  }
}

export type EquipmentFinanceMeta = {
  acquisitionCost: number;
  installationCost: number;
  financialCategory: EquipmentFinanceCategory | '';
  purchaseInvoiceRef: string;
  amortizationYears: number;
  supplier: string;
  purchaseDate: string;
};

export function parseEquipmentFinanceMeta(metadata: unknown, equipmentType?: string | null): EquipmentFinanceMeta {
  const m =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};

  const num = (k: string) => {
    const raw = m[k];
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const cat = String(m.financialCategory ?? '').trim();
  const financialCategory = EQUIPMENT_FINANCE_CATEGORY_VALUES.includes(cat as EquipmentFinanceCategory)
    ? (cat as EquipmentFinanceCategory)
    : '';

  const amortRaw = num('amortizationYears');
  const amortizationYears =
    amortRaw > 0 ? amortRaw : defaultAmortizationYears(equipmentType ?? null);

  return {
    acquisitionCost: num('acquisitionCost'),
    installationCost: num('installationCost'),
    financialCategory,
    purchaseInvoiceRef: String(m.purchaseInvoiceRef ?? '').trim(),
    amortizationYears,
    supplier: String(m.supplier ?? '').trim(),
    purchaseDate: String(m.purchaseDate ?? '').trim(),
  };
}

export function equipmentTotalCapitalized(meta: EquipmentFinanceMeta): number {
  return Math.round((meta.acquisitionCost + meta.installationCost) * 100) / 100;
}

export function equipmentAnnualAmortization(meta: EquipmentFinanceMeta): number {
  const base = equipmentTotalCapitalized(meta);
  if (base <= 0 || meta.amortizationYears <= 0) return 0;
  return Math.round((base / meta.amortizationYears) * 100) / 100;
}

export function equipmentFinanceSummaryLabel(type: string | null | undefined): string {
  if (!type) return 'Autre';
  return EQUIPMENT_TYPE_LABELS[type as EquipmentTypeValue] ?? type;
}

export function sumMaintenanceCosts(
  items: Array<{ costAmount: unknown; status: string }>,
): number {
  let total = 0;
  for (const item of items) {
    if (item.status !== 'COMPLETED') continue;
    const n =
      item.costAmount == null
        ? 0
        : typeof item.costAmount === 'object' &&
            item.costAmount !== null &&
            'toNumber' in item.costAmount
          ? (item.costAmount as { toNumber: () => number }).toNumber()
          : Number(item.costAmount);
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return Math.round(total * 100) / 100;
}
