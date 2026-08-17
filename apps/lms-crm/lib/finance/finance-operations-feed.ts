import type { PrismaClient } from '@repo/database';
import { financeDecimalNum } from '@/lib/finance/finance-decimal';

export type FinanceOperationRow = {
  id: string;
  kind: 'DEVIS' | 'FACTURE' | 'PAIEMENT';
  typeLabel: 'Devis' | 'Facture' | 'Paiement';
  reference: string;
  client: string;
  amount: number;
  dueDate: string | null;
  status: string;
  statusUi: 'PENDING' | 'PAID' | 'OVERDUE' | 'DRAFT' | 'SENT' | 'ACCEPTED' | 'FAILED';
  href: string;
  updatedAt: string;
};

function clientLabelFromDevis(row: {
  lead: { firstName: string; lastName: string; email: string } | null;
  clientSnapshot: unknown;
  title: string;
}): string {
  if (row.lead) return `${row.lead.firstName} ${row.lead.lastName}`.trim() || row.lead.email;
  if (row.clientSnapshot && typeof row.clientSnapshot === 'object' && !Array.isArray(row.clientSnapshot)) {
    const snap = row.clientSnapshot as Record<string, unknown>;
    const company = typeof snap.company === 'string' ? snap.company.trim() : '';
    if (company) return company;
    const contact = typeof snap.contactName === 'string' ? snap.contactName.trim() : '';
    if (contact) return contact;
  }
  return row.title;
}

function devisStatusUi(
  status: string,
  validUntil: Date | null,
): FinanceOperationRow['statusUi'] {
  if (status === 'DRAFT') return 'DRAFT';
  if (status === 'ACCEPTED') return 'ACCEPTED';
  if (status === 'SENT' && validUntil && validUntil.getTime() < Date.now()) return 'OVERDUE';
  if (status === 'SENT') return 'SENT';
  return 'PENDING';
}

function paymentStatusUi(status: string): FinanceOperationRow['statusUi'] {
  if (status === 'RECEIVED') return 'PAID';
  if (status === 'FAILED' || status === 'REFUNDED') return 'FAILED';
  return 'PENDING';
}

function factureStatusUi(
  totalTtc: number,
  paid: number,
  validUntil: Date | null,
): FinanceOperationRow['statusUi'] {
  if (paid >= totalTtc - 0.01 && totalTtc > 0) return 'PAID';
  if (validUntil && validUntil.getTime() < Date.now()) return 'OVERDUE';
  return 'PENDING';
}

/** Agrège devis, factures (ACCEPTED) et paiements récents pour le hub Finance. */
export async function buildFinanceOperationsFeed(
  prisma: PrismaClient,
  limit = 20,
): Promise<FinanceOperationRow[]> {
  const perKind = Math.max(limit, 8);

  const [devisRows, factureRows, paymentRows] = await Promise.all([
    prisma.financeDevis.findMany({
      where: { status: { not: 'ACCEPTED' } },
      orderBy: { updatedAt: 'desc' },
      take: perKind,
      select: {
        id: true,
        referenceCode: true,
        title: true,
        status: true,
        totalTtc: true,
        validUntil: true,
        updatedAt: true,
        clientSnapshot: true,
        lead: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    prisma.financeDevis.findMany({
      where: { status: 'ACCEPTED' },
      orderBy: { updatedAt: 'desc' },
      take: perKind,
      select: {
        id: true,
        referenceCode: true,
        title: true,
        totalTtc: true,
        validUntil: true,
        updatedAt: true,
        clientSnapshot: true,
        lead: { select: { firstName: true, lastName: true, email: true } },
        payments: { where: { status: 'RECEIVED' }, select: { amount: true } },
      },
    }),
    prisma.financePayment.findMany({
      orderBy: { updatedAt: 'desc' },
      take: perKind,
      include: {
        devis: {
          select: {
            lead: { select: { firstName: true, lastName: true, email: true } },
            title: true,
            clientSnapshot: true,
          },
        },
      },
    }),
  ]);

  const items: FinanceOperationRow[] = [];

  for (const row of devisRows) {
    items.push({
      id: `devis-${row.id}`,
      kind: 'DEVIS',
      typeLabel: 'Devis',
      reference: row.referenceCode,
      client: clientLabelFromDevis(row),
      amount: financeDecimalNum(row.totalTtc),
      dueDate: row.validUntil?.toISOString() ?? null,
      status: row.status,
      statusUi: devisStatusUi(row.status, row.validUntil),
      href: `/administration-facturation/finance/devis?devisId=${encodeURIComponent(row.id)}`,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  for (const row of factureRows) {
    const paid = row.payments.reduce((s, p) => s + financeDecimalNum(p.amount), 0);
    const total = financeDecimalNum(row.totalTtc);
    items.push({
      id: `facture-${row.id}`,
      kind: 'FACTURE',
      typeLabel: 'Facture',
      reference: row.referenceCode,
      client: clientLabelFromDevis(row),
      amount: total,
      dueDate: row.validUntil?.toISOString() ?? null,
      status: paid >= total - 0.01 && total > 0 ? 'PAYÉE' : 'EN ATTENTE',
      statusUi: factureStatusUi(total, paid, row.validUntil),
      href: `/administration-facturation/finance/factures?factureId=${encodeURIComponent(row.id)}`,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  for (const row of paymentRows) {
    const client = row.devis
      ? clientLabelFromDevis({
          lead: row.devis.lead,
          clientSnapshot: row.devis.clientSnapshot,
          title: row.devis.title,
        })
      : '—';
    items.push({
      id: `pay-${row.id}`,
      kind: 'PAIEMENT',
      typeLabel: 'Paiement',
      reference: row.referenceCode,
      client,
      amount: financeDecimalNum(row.amount),
      dueDate: row.paidAt?.toISOString() ?? row.updatedAt.toISOString(),
      status: row.status,
      statusUi: paymentStatusUi(row.status),
      href: `/administration-facturation/finance/paiements`,
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return items.slice(0, limit);
}
