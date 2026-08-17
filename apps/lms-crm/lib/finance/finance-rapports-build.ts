import type { PrismaClient } from '@repo/database';
import { FinanceDevisStatus, FinancePaymentStatus } from '@repo/database';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';
import { countPendingInvoices } from '@/lib/finance/finance-alerts';

export type FinanceRapportsKpi = {
  key: string;
  label: string;
  value: string | number;
  subtitle: string;
};

export type FinanceRapportsPayload = {
  periodMonths: number;
  kpis: FinanceRapportsKpi[];
  charts: {
    evolutionTitle: string;
    evolutionSeriesName: string;
    evolution: { label: string; ca: number; devis: number; leads: number }[];
    devisStatusTitle: string;
    devisStatus: { name: string; value: number }[];
    budgetTitle: string;
    budgetByCategory: { name: string; planned: number; actual: number }[];
    paymentsTitle: string;
    paymentsStatus: { name: string; count: number; amount: number }[];
    paymentsReceivedAmount: number;
    paymentsPendingAmount: number;
  };
  tables: {
    budgetLines: {
      id: string;
      label: string;
      category: string;
      plannedAmount: number;
      actualAmount: number;
      consumptionPct: number;
    }[];
    unpaidInvoices: {
      id: string;
      referenceCode: string;
      title: string;
      totalTtc: number;
      paid: number;
      remaining: number;
      collectionLabel: 'Soldée' | 'Partielle' | 'À encaisser';
      validUntil: string | null;
    }[];
    recentPayments: {
      id: string;
      referenceCode: string;
      amount: number;
      status: string;
      devisRef: string | null;
      paidAt: string | null;
    }[];
    monthlySummary: {
      month: string;
      leads: number;
      devisCreated: number;
      devisAccepted: number;
      caAccepted: number;
    }[];
  };
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  EXPIRED: 'Expiré',
  PENDING: 'En attente',
  RECEIVED: 'Encaissé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

export async function buildFinanceRapports(
  prisma: PrismaClient,
  periodMonths = 12,
): Promise<FinanceRapportsPayload> {
  const months = Math.min(Math.max(periodMonths, 3), 24);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const year = now.getFullYear();

  const [
    totalDevis,
    acceptedDevis,
    totalLeads,
    pendingInvoices,
    devisRows,
    leadsRows,
    budgetRows,
    paymentRows,
    unpaidRows,
    recentPayments,
  ] = await Promise.all([
    prisma.financeDevis.count(),
    prisma.financeDevis.count({ where: { status: 'ACCEPTED' } }),
    prisma.lead.count({ where: { createdAt: { gte: start } } }),
    countPendingInvoices(prisma),
    prisma.financeDevis.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true, status: true, totalTtc: true },
    }),
    prisma.lead.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    }),
    prisma.financeBudgetLine.findMany({
      where: { periodYear: year },
      orderBy: { label: 'asc' },
    }),
    prisma.financePayment.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.financeDevis.findMany({
      where: { status: 'ACCEPTED' },
      take: 30,
      select: {
        id: true,
        referenceCode: true,
        title: true,
        totalTtc: true,
        validUntil: true,
        payments: { where: { status: 'RECEIVED' }, select: { amount: true } },
      },
    }),
    prisma.financePayment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 12,
      include: { devis: { select: { referenceCode: true } } },
    }),
  ]);

  const statusCounts = new Map<string, number>();
  for (const s of Object.values(FinanceDevisStatus)) {
    statusCounts.set(s, 0);
  }
  for (const row of devisRows) {
    statusCounts.set(row.status, (statusCounts.get(row.status) ?? 0) + 1);
  }

  const evolution: FinanceRapportsPayload['charts']['evolution'] = [];
  const monthlySummary: FinanceRapportsPayload['tables']['monthlySummary'] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const key = monthKey(d);

    const monthDevis = devisRows.filter((x) => x.createdAt >= d && x.createdAt < next);
    const monthLeads = leadsRows.filter((l) => l.createdAt >= d && l.createdAt < next).length;
    const accepted = monthDevis.filter((x) => x.status === 'ACCEPTED');
    const ca = accepted.reduce((s, x) => s + financeDecimalNum(x.totalTtc), 0);

    evolution.push({
      label: monthLabel(key),
      ca: Math.round(ca),
      devis: monthDevis.length,
      leads: monthLeads,
    });

    monthlySummary.push({
      month: key,
      leads: monthLeads,
      devisCreated: monthDevis.length,
      devisAccepted: accepted.length,
      caAccepted: Math.round(ca),
    });
  }

  const budgetByCategoryMap = new Map<string, { planned: number; actual: number }>();
  for (const line of budgetRows) {
    const cat = line.category || 'AUTRE';
    const prev = budgetByCategoryMap.get(cat) ?? { planned: 0, actual: 0 };
    prev.planned += financeDecimalNum(line.plannedAmount);
    prev.actual += financeDecimalNum(line.actualAmount);
    budgetByCategoryMap.set(cat, prev);
  }

  const unpaidInvoices = unpaidRows
    .map((row) => {
      const total = financeDecimalNum(row.totalTtc);
      const paid = row.payments.reduce((s, p) => s + financeDecimalNum(p.amount), 0);
      const remaining = Math.round((total - paid) * 100) / 100;
      const collectionLabel: 'Soldée' | 'Partielle' | 'À encaisser' =
        remaining <= 0.01 ? 'Soldée' : paid > 0.01 ? 'Partielle' : 'À encaisser';
      return {
        id: row.id,
        referenceCode: row.referenceCode,
        title: row.title,
        totalTtc: total,
        paid,
        remaining: Math.max(remaining, 0),
        collectionLabel,
        validUntil: row.validUntil?.toISOString() ?? null,
      };
    })
    .sort((a, b) => b.remaining - a.remaining || b.totalTtc - a.totalTtc)
    .slice(0, 12);

  const paymentByStatus = new Map(
    paymentRows.map((p) => [
      p.status,
      { count: p._count._all, amount: financeDecimalNum(p._sum.amount) },
    ]),
  );
  const paymentsStatus = Object.values(FinancePaymentStatus).map((status) => {
    const row = paymentByStatus.get(status) ?? { count: 0, amount: 0 };
    return {
      name: STATUS_LABELS[status] ?? status,
      count: row.count,
      amount: Math.round(row.amount * 100) / 100,
    };
  });
  const paymentsReceivedAmount = paymentsStatus.find((p) => p.name === 'Encaissé')?.amount ?? 0;
  const paymentsPendingAmount = paymentsStatus.find((p) => p.name === 'En attente')?.amount ?? 0;

  const totalPlanned = budgetRows.reduce((s, r) => s + financeDecimalNum(r.plannedAmount), 0);
  const totalActual = budgetRows.reduce((s, r) => s + financeDecimalNum(r.actualAmount), 0);

  const receivedPayments = await prisma.financePayment.aggregate({
    where: { status: 'RECEIVED', paidAt: { gte: start } },
    _sum: { amount: true },
  });
  const caEncaisse = financeDecimalNum(receivedPayments._sum.amount);

  return {
    periodMonths: months,
    kpis: [
      { key: 'devis', label: 'Devis', value: totalDevis, subtitle: 'Tous statuts' },
      { key: 'accepted', label: 'Acceptés', value: acceptedDevis, subtitle: 'Vue factures' },
      {
        key: 'pending',
        label: 'Factures impayées',
        value: pendingInvoices,
        subtitle: 'Devis acceptés non soldés',
      },
      {
        key: 'ca',
        label: 'Encaissements',
        value: `${Math.round(caEncaisse).toLocaleString('fr-FR')} €`,
        subtitle: `Reçus sur ${months} mois · ${totalLeads} leads`,
      },
      {
        key: 'budget',
        label: 'Budget réalisé',
        value: `${Math.round(totalActual).toLocaleString('fr-FR')} €`,
        subtitle: `Sur ${Math.round(totalPlanned).toLocaleString('fr-FR')} € prévus`,
      },
    ],
    charts: {
      evolutionTitle: 'Chiffre d’affaires & pipeline',
      evolutionSeriesName: 'CA accepté (€)',
      evolution,
      devisStatusTitle: 'Répartition des devis',
      devisStatus: Array.from(statusCounts.entries())
        .filter(([, v]) => v > 0)
        .map(([status, value]) => ({
          name: STATUS_LABELS[status] ?? status,
          value,
        })),
      budgetTitle: 'Budget par catégorie',
      budgetByCategory: Array.from(budgetByCategoryMap.entries()).map(([name, v]) => ({
        name,
        planned: Math.round(v.planned),
        actual: Math.round(v.actual),
      })),
      paymentsTitle: 'Paiements par statut',
      paymentsStatus,
      paymentsReceivedAmount,
      paymentsPendingAmount,
    },
    tables: {
      budgetLines: budgetRows.map((r) => {
        const planned = financeDecimalNum(r.plannedAmount);
        const actual = financeDecimalNum(r.actualAmount);
        return {
          id: r.id,
          label: r.label,
          category: r.category,
          plannedAmount: planned,
          actualAmount: actual,
          consumptionPct: planned > 0 ? Math.round((actual / planned) * 100) : 0,
        };
      }),
      unpaidInvoices,
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        referenceCode: p.referenceCode,
        amount: financeDecimalNum(p.amount),
        status: p.status,
        devisRef: p.devis?.referenceCode ?? null,
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
      monthlySummary,
    },
  };
}
