import type { Equipment, EquipmentMaintenance, VenueRoomFixedEquipment } from '@repo/database';
import {
  equipmentAnnualAmortization,
  equipmentTotalCapitalized,
  getEquipmentFinanceCategoryLabel,
  parseEquipmentFinanceMeta,
} from '@/lib/equipment-finance';
import { getEquipmentTypeLabel } from '@/lib/equipment-constants';

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export type SerializedRoomFixedEquipmentRow = {
  id: string;
  venueRoomId: string;
  equipmentId: string;
  quantity: number;
  installedAt: string | null;
  notes: string | null;
  equipment: {
    id: string;
    label: string;
    serialNumber: string;
    type: string | null;
    typeLabel: string;
    status: string;
    financialCategory: string;
    financialCategoryLabel: string;
    acquisitionCost: number;
    installationCost: number;
    totalCapitalized: number;
    annualAmortization: number;
    purchaseInvoiceRef: string;
    maintenanceCostCompleted: number;
  };
};

export function serializeRoomFixedEquipmentRow(
  row: VenueRoomFixedEquipment & {
    equipment: Equipment & { maintenanceItems: EquipmentMaintenance[] };
  },
): SerializedRoomFixedEquipmentRow {
  const finance = parseEquipmentFinanceMeta(row.equipment.metadata, row.equipment.type);
  const maintenanceCostCompleted = row.equipment.maintenanceItems
    .filter((m) => m.status === 'COMPLETED')
    .reduce((s, m) => s + decimalNum(m.costAmount), 0);

  return {
    id: row.id,
    venueRoomId: row.venueRoomId,
    equipmentId: row.equipmentId,
    quantity: row.quantity,
    installedAt: row.installedAt?.toISOString() ?? null,
    notes: row.notes,
    equipment: {
      id: row.equipment.id,
      label: row.equipment.label,
      serialNumber: row.equipment.serialNumber,
      type: row.equipment.type,
      typeLabel: getEquipmentTypeLabel(row.equipment.type),
      status: row.equipment.status,
      financialCategory: finance.financialCategory,
      financialCategoryLabel: getEquipmentFinanceCategoryLabel(finance.financialCategory),
      acquisitionCost: finance.acquisitionCost,
      installationCost: finance.installationCost,
      totalCapitalized: equipmentTotalCapitalized(finance),
      annualAmortization: equipmentAnnualAmortization(finance),
      purchaseInvoiceRef: finance.purchaseInvoiceRef,
      maintenanceCostCompleted: Math.round(maintenanceCostCompleted * 100) / 100,
    },
  };
}

export function summarizeFixedInventory(rows: SerializedRoomFixedEquipmentRow[]) {
  const totals = rows.reduce(
    (acc, r) => {
      acc.count += r.quantity;
      acc.capitalized += r.equipment.totalCapitalized * r.quantity;
      acc.amortization += r.equipment.annualAmortization * r.quantity;
      acc.maintenance += r.equipment.maintenanceCostCompleted;
      return acc;
    },
    { count: 0, capitalized: 0, amortization: 0, maintenance: 0 },
  );
  return {
    itemCount: rows.length,
    unitCount: totals.count,
    totalCapitalized: Math.round(totals.capitalized * 100) / 100,
    annualAmortization: Math.round(totals.amortization * 100) / 100,
    maintenanceCompleted: Math.round(totals.maintenance * 100) / 100,
  };
}
