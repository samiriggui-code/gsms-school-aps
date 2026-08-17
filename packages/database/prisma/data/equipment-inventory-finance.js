'use strict';

/**
 * Calculs finance inventaire — miroir de apps/lms-crm/lib/equipment-finance.ts
 * et finance-budget-sync (sans dépendance Next).
 */

function defaultAmortizationYears(type) {
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

function parseFinance(metadata, equipmentType) {
  const m =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : {};
  const num = (k) => {
    const raw = m[k];
    const n = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };
  const amortRaw = num('amortizationYears');
  return {
    acquisitionCost: num('acquisitionCost'),
    installationCost: num('installationCost'),
    amortizationYears: amortRaw > 0 ? amortRaw : defaultAmortizationYears(equipmentType),
    purchaseDate: String(m.purchaseDate ?? '').trim(),
  };
}

function totalCapitalized(finance) {
  return Math.round((finance.acquisitionCost + finance.installationCost) * 100) / 100;
}

function annualAmortization(finance) {
  const base = totalCapitalized(finance);
  if (base <= 0 || finance.amortizationYears <= 0) return 0;
  return Math.round((base / finance.amortizationYears) * 100) / 100;
}

function decimalNum(d) {
  if (d == null) return 0;
  if (typeof d === 'object' && d !== null && 'toNumber' in d) return d.toNumber();
  const n = Number(d);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Array<{ metadata: unknown, type?: string }>} equipmentRows
 */
function summarizeInventoryFinance(equipmentRows) {
  let capitalized = 0;
  let amortizationAnnual = 0;
  const byCategory = new Map();
  const byYear = new Map();

  for (const row of equipmentRows) {
    const finance = parseFinance(row.metadata, row.type);
    const cap = totalCapitalized(finance);
    const amort = annualAmortization(finance);
    capitalized += cap;
    amortizationAnnual += amort;

    const cat =
      row.metadata &&
      typeof row.metadata === 'object' &&
      !Array.isArray(row.metadata) &&
      row.metadata.catalogKey
        ? String(row.metadata.catalogKey)
        : 'non-classé';
    const cur = byCategory.get(cat) ?? { units: 0, capitalized: 0 };
    cur.units += 1;
    cur.capitalized += cap;
    byCategory.set(cat, cur);

    if (finance.purchaseDate) {
      const y = new Date(finance.purchaseDate).getFullYear();
      if (Number.isFinite(y)) {
        byYear.set(y, (byYear.get(y) ?? 0) + cap);
      }
    }
  }

  return {
    unitCount: equipmentRows.length,
    totalCapitalized: Math.round(capitalized * 100) / 100,
    annualAmortization: Math.round(amortizationAnnual * 100) / 100,
    byCategory,
    purchasesByYear: Object.fromEntries(byYear),
  };
}

/**
 * Alimente la ligne budget EQUIPEMENT (réalisé annuel estimé).
 * @param {import('@repo/database').Prisma.TransactionClient} tx
 */
async function syncEquipmentBudgetFromInventorySeed(tx, year = new Date().getFullYear()) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const equipment =
    await tx.$queryRaw`SELECT "metadata", "type"::text AS "type" FROM "Equipment"`;
  const maintenanceRows = await tx.$queryRaw`
    SELECT "costAmount", "status"::text AS "status"
    FROM "EquipmentMaintenance"
    WHERE "status" = 'COMPLETED'
      AND "completedDate" >= ${yearStart}
      AND "completedDate" < ${yearEnd}
  `;

  let amortizationTotal = 0;
  let purchasesInYear = 0;
  for (const row of equipment) {
    const finance = parseFinance(row.metadata, row.type);
    amortizationTotal += annualAmortization(finance);
    if (finance.purchaseDate) {
      const d = new Date(finance.purchaseDate);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() === year) {
        purchasesInYear += totalCapitalized(finance);
      }
    }
  }

  let maintenanceTotal = 0;
  for (const m of maintenanceRows) {
    maintenanceTotal += decimalNum(m.costAmount);
  }

  amortizationTotal = Math.round(amortizationTotal * 100) / 100;
  purchasesInYear = Math.round(purchasesInYear * 100) / 100;
  maintenanceTotal = Math.round(maintenanceTotal * 100) / 100;
  const total = Math.round((amortizationTotal + purchasesInYear + maintenanceTotal) * 100) / 100;

  const existing = await tx.financeBudgetLine.findFirst({
    where: {
      category: 'EQUIPEMENT',
      periodYear: year,
      periodMonth: null,
      label: { contains: 'Matériel', mode: 'insensitive' },
    },
  });

  if (existing) {
    await tx.financeBudgetLine.update({
      where: { id: existing.id },
      data: { actualAmount: total },
    });
  } else {
    await tx.financeBudgetLine.create({
      data: {
        label: 'Matériel & consommables',
        category: 'EQUIPEMENT',
        periodYear: year,
        periodMonth: null,
        plannedAmount: Math.round(amortizationTotal * 1.2 * 100) / 100,
        actualAmount: total,
        notes: 'Réalisé auto-sync inventaire (amortissement + achats exercice + maintenance)',
      },
    });
  }

  return {
    year,
    actualAmount: total,
    amortizationTotal,
    purchasesInYear,
    maintenanceTotal,
    unitCount: equipment.length,
  };
}

module.exports = {
  parseFinance,
  totalCapitalized,
  annualAmortization,
  summarizeInventoryFinance,
  syncEquipmentBudgetFromInventorySeed,
};
