import type { PrismaClient } from '@repo/database';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';
import {
  equipmentAnnualAmortization,
  parseEquipmentFinanceMeta,
} from '@/lib/equipment-finance';

function equipmentAcquisitionCost(metadata: unknown): number {
  const f = parseEquipmentFinanceMeta(metadata);
  return f.acquisitionCost;
}

export function budgetCategoryForPayment(devis: {
  formationId: string | null;
  notes: string | null;
} | null): string {
  if (!devis) return 'AUTRE';
  const notes = (devis.notes ?? '').toUpperCase();
  if (notes.includes('EQUIPEMENT') || notes.includes('ÉQUIPEMENT')) return 'EQUIPEMENT';
  if (devis.formationId) return 'FORMATION';
  return 'PRESTATION';
}

async function findEquipmentBudgetLine(
  prisma: PrismaClient,
  year: number,
): Promise<{ id: string; actualAmount: unknown }> {
  const preferred = await prisma.financeBudgetLine.findFirst({
    where: {
      category: 'EQUIPEMENT',
      periodYear: year,
      periodMonth: null,
      label: { contains: 'Matériel', mode: 'insensitive' },
    },
  });
  if (preferred) return preferred;

  const existing = await prisma.financeBudgetLine.findFirst({
    where: { category: 'EQUIPEMENT', periodYear: year, periodMonth: null },
    orderBy: { label: 'asc' },
  });
  if (existing) return existing;

  return prisma.financeBudgetLine.create({
    data: {
      label: 'Matériel & consommables',
      category: 'EQUIPEMENT',
      periodYear: year,
      periodMonth: null,
      plannedAmount: 0,
      actualAmount: 0,
    },
  });
}

async function findOrCreateBudgetLine(
  prisma: PrismaClient,
  category: string,
  year: number,
  month: number | null,
): Promise<{ id: string; actualAmount: unknown }> {
  if (category === 'EQUIPEMENT' && month == null) {
    return findEquipmentBudgetLine(prisma, year);
  }

  const existing = await prisma.financeBudgetLine.findFirst({
    where: { category, periodYear: year, periodMonth: month },
    orderBy: { label: 'asc' },
  });
  if (existing) return existing;

  const labels: Record<string, string> = {
    FORMATION: 'Recettes formations (auto)',
    EQUIPEMENT: 'Équipements & matériel (auto)',
    PRESTATION: 'Prestations diverses (auto)',
    AUTRE: 'Encaissements divers (auto)',
  };

  return prisma.financeBudgetLine.create({
    data: {
      label: labels[category] ?? `${category} (auto)`,
      category,
      periodYear: year,
      periodMonth: month,
      plannedAmount: 0,
      actualAmount: 0,
    },
  });
}

/** Incrémente ou décrémente le réalisé budget quand un paiement change de statut. */
export async function syncBudgetFromPaymentStatusChange(
  prisma: PrismaClient,
  paymentId: string,
  previousStatus: string,
  nextStatus: string,
): Promise<void> {
  if (previousStatus === nextStatus) return;

  const payment = await prisma.financePayment.findUnique({
    where: { id: paymentId },
    select: {
      amount: true,
      paidAt: true,
      updatedAt: true,
      devis: { select: { formationId: true, notes: true } },
    },
  });
  if (!payment) return;

  const amount = financeDecimalNum(payment.amount);
  if (amount <= 0) return;

  const delta =
    (nextStatus === 'RECEIVED' ? amount : 0) - (previousStatus === 'RECEIVED' ? amount : 0);
  if (Math.abs(delta) < 0.0001) return;

  const when = payment.paidAt ?? payment.updatedAt;
  const category = budgetCategoryForPayment(payment.devis);

  if (category === 'EQUIPEMENT') {
    await syncEquipmentBudgetFromInventory(prisma, when.getFullYear());
    return;
  }

  const line = await findOrCreateBudgetLine(
    prisma,
    category,
    when.getFullYear(),
    when.getMonth() + 1,
  );

  const current = financeDecimalNum(line.actualAmount);
  await prisma.financeBudgetLine.update({
    where: { id: line.id },
    data: { actualAmount: Math.max(0, Math.round((current + delta) * 100) / 100) },
  });
}

/**
 * Réalisé budget EQUIPEMENT (charge annuelle estimée) :
 * Σ amortissement annuel + maintenance terminée sur l'exercice + achats datés de l'année + paiements tagués.
 */
export async function syncEquipmentBudgetFromInventory(
  prisma: PrismaClient,
  year = new Date().getFullYear(),
): Promise<{
  actualAmount: number;
  unitCount: number;
  amortizationTotal: number;
  maintenanceTotal: number;
  purchasesInYear: number;
  paymentsTotal: number;
}> {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);

  const [equipment, maintenanceRows, receivedPayments] = await Promise.all([
    prisma.equipment.findMany({ select: { metadata: true, type: true } }),
    prisma.equipmentMaintenance.findMany({
      where: {
        status: 'COMPLETED',
        completedDate: { gte: yearStart, lt: yearEnd },
      },
      select: { costAmount: true },
    }),
    prisma.financePayment.findMany({
      where: {
        status: 'RECEIVED',
        paidAt: { gte: yearStart, lt: yearEnd },
      },
      select: {
        amount: true,
        devis: { select: { formationId: true, notes: true } },
      },
    }),
  ]);

  let amortizationTotal = 0;
  let purchasesInYear = 0;
  for (const row of equipment) {
    const finance = parseEquipmentFinanceMeta(row.metadata, row.type);
    amortizationTotal += equipmentAnnualAmortization(finance);
    if (finance.purchaseDate) {
      const d = new Date(finance.purchaseDate);
      if (!Number.isNaN(d.getTime()) && d.getFullYear() === year) {
        purchasesInYear += finance.acquisitionCost + finance.installationCost;
      }
    }
  }

  let maintenanceTotal = 0;
  for (const m of maintenanceRows) {
    maintenanceTotal += financeDecimalNum(m.costAmount);
  }

  let paymentsTotal = 0;
  for (const p of receivedPayments) {
    if (budgetCategoryForPayment(p.devis) === 'EQUIPEMENT') {
      paymentsTotal += financeDecimalNum(p.amount);
    }
  }

  amortizationTotal = Math.round(amortizationTotal * 100) / 100;
  maintenanceTotal = Math.round(maintenanceTotal * 100) / 100;
  purchasesInYear = Math.round(purchasesInYear * 100) / 100;
  paymentsTotal = Math.round(paymentsTotal * 100) / 100;

  const total = Math.round(
    (amortizationTotal + maintenanceTotal + purchasesInYear + paymentsTotal) * 100,
  ) / 100;

  const line = await findEquipmentBudgetLine(prisma, year);
  await prisma.financeBudgetLine.update({
    where: { id: line.id },
    data: { actualAmount: total },
  });

  return {
    actualAmount: total,
    unitCount: equipment.length,
    amortizationTotal,
    maintenanceTotal,
    purchasesInYear,
    paymentsTotal,
  };
}

// rétrocompat tests / imports
export { equipmentAcquisitionCost };
