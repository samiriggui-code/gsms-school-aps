import type { PrismaClient } from '@repo/database';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';

export type FinanceAlertRow = {
  id: string;
  kind: 'DEVIS_EXPIRED' | 'DEVIS_EXPIRING' | 'FACTURE_UNPAID' | 'PAYMENT_PENDING';
  title: string;
  subtitle: string;
  severity: 'CRITICAL' | 'WARNING';
  href: string;
  dueDate: string | null;
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function buildFinanceAlerts(prisma: PrismaClient): Promise<FinanceAlertRow[]> {
  const now = new Date();
  const in30 = new Date(now.getTime() + THIRTY_DAYS_MS);
  const alerts: FinanceAlertRow[] = [];

  const [expiredSent, expiringSent, unpaidAccepted, pendingPayments] = await Promise.all([
    prisma.financeDevis.findMany({
      where: {
        status: 'SENT',
        validUntil: { lt: now },
      },
      orderBy: { validUntil: 'asc' },
      take: 10,
      select: { id: true, referenceCode: true, title: true, validUntil: true },
    }),
    prisma.financeDevis.findMany({
      where: {
        status: 'SENT',
        validUntil: { gte: now, lte: in30 },
      },
      orderBy: { validUntil: 'asc' },
      take: 10,
      select: { id: true, referenceCode: true, title: true, validUntil: true },
    }),
    prisma.financeDevis.findMany({
      where: { status: 'ACCEPTED' },
      take: 50,
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
      where: { status: 'PENDING' },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        referenceCode: true,
        amount: true,
        updatedAt: true,
        devis: { select: { referenceCode: true } },
      },
    }),
  ]);

  for (const row of expiredSent) {
    alerts.push({
      id: `devis-expired-${row.id}`,
      kind: 'DEVIS_EXPIRED',
      title: row.referenceCode,
      subtitle: row.title,
      severity: 'CRITICAL',
      href: `/administration-facturation/finance/devis?devisId=${encodeURIComponent(row.id)}`,
      dueDate: row.validUntil?.toISOString() ?? null,
    });
  }

  for (const row of expiringSent) {
    alerts.push({
      id: `devis-expiring-${row.id}`,
      kind: 'DEVIS_EXPIRING',
      title: row.referenceCode,
      subtitle: row.title,
      severity: 'WARNING',
      href: `/administration-facturation/finance/devis?devisId=${encodeURIComponent(row.id)}`,
      dueDate: row.validUntil?.toISOString() ?? null,
    });
  }

  for (const row of unpaidAccepted) {
    const total = financeDecimalNum(row.totalTtc);
    const paid = row.payments.reduce((s, p) => s + financeDecimalNum(p.amount), 0);
    if (total <= 0 || paid >= total - 0.01) continue;
    alerts.push({
      id: `facture-unpaid-${row.id}`,
      kind: 'FACTURE_UNPAID',
      title: row.referenceCode,
      subtitle: `${row.title} — reste ${Math.round((total - paid) * 100) / 100} €`,
      severity: row.validUntil && row.validUntil.getTime() < now.getTime() ? 'CRITICAL' : 'WARNING',
      href: `/administration-facturation/finance/factures?factureId=${encodeURIComponent(row.id)}`,
      dueDate: row.validUntil?.toISOString() ?? null,
    });
  }

  for (const row of pendingPayments) {
    alerts.push({
      id: `payment-pending-${row.id}`,
      kind: 'PAYMENT_PENDING',
      title: row.referenceCode,
      subtitle: row.devis?.referenceCode
        ? `Devis ${row.devis.referenceCode} — ${financeDecimalNum(row.amount)} €`
        : `${financeDecimalNum(row.amount)} € en attente`,
      severity: 'WARNING',
      href: '/administration-facturation/finance/paiements',
      dueDate: row.updatedAt.toISOString(),
    });
  }

  const severityRank = { CRITICAL: 0, WARNING: 1 } as const;
  alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return alerts.slice(0, 20);
}

export async function countPendingInvoices(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.financeDevis.findMany({
    where: { status: 'ACCEPTED' },
    select: {
      totalTtc: true,
      payments: { where: { status: 'RECEIVED' }, select: { amount: true } },
    },
  });
  let count = 0;
  for (const row of rows) {
    const total = financeDecimalNum(row.totalTtc);
    const paid = row.payments.reduce((s, p) => s + financeDecimalNum(p.amount), 0);
    if (total > 0 && paid < total - 0.01) count += 1;
  }
  return count;
}
