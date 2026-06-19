/** Compteurs par statut d’unité (pas les mouvements IN/OUT du ledger). */
export type EquipmentStatusStockStats = {
  availableCount: number;
  inUseCount: number;
  maintenanceCount: number;
  outOfServiceCount: number;
  unitCount: number;
  /** @deprecated alias — disponibles */
  currentStock: number;
  /** @deprecated alias — en utilisation */
  totalIn: number;
  /** @deprecated alias — en maintenance */
  totalOut: number;
};

export function buildStatusStockStats(
  units: Array<{ status: string }>,
): EquipmentStatusStockStats {
  const availableCount = units.filter((u) => u.status === 'AVAILABLE').length;
  const inUseCount = units.filter((u) => u.status === 'IN_USE').length;
  const maintenanceCount = units.filter((u) => u.status === 'MAINTENANCE').length;
  const outOfServiceCount = units.filter((u) => u.status === 'OUT_OF_SERVICE').length;
  return {
    availableCount,
    inUseCount,
    maintenanceCount,
    outOfServiceCount,
    unitCount: units.length,
    currentStock: availableCount,
    totalIn: inUseCount,
    totalOut: maintenanceCount,
  };
}
