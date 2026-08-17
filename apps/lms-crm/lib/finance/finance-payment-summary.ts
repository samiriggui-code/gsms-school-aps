import type { FinancePaymentStatus, Prisma } from '@repo/database';

export type FinanceInvoicePaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export type FinancePaymentSummary = {
  paidTotal: number;
  balanceDue: number;
  invoicePaymentStatus: FinanceInvoicePaymentStatus;
  paymentCount: number;
  pendingCount: number;
};

type PaymentSlice = { amount: unknown; status: FinancePaymentStatus };

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export function summarizePayments(totalTtc: number, payments: PaymentSlice[]): FinancePaymentSummary {
  const paidTotal = payments
    .filter((p) => p.status === 'RECEIVED')
    .reduce((sum, p) => sum + decimalNum(p.amount), 0);
  const balanceDue = Math.max(0, Math.round((totalTtc - paidTotal) * 100) / 100);
  const pendingCount = payments.filter((p) => p.status === 'PENDING').length;

  let invoicePaymentStatus: FinanceInvoicePaymentStatus = 'UNPAID';
  if (balanceDue <= 0.009 && paidTotal > 0) invoicePaymentStatus = 'PAID';
  else if (paidTotal > 0) invoicePaymentStatus = 'PARTIAL';

  return {
    paidTotal: Math.round(paidTotal * 100) / 100,
    balanceDue,
    invoicePaymentStatus,
    paymentCount: payments.length,
    pendingCount,
  };
}

/** Agrège les paiements par dossier (facture = FinanceDevis accepté). */
export function summarizePaymentsByDevisId(
  rows: { devisId: string | null; amount: unknown; status: FinancePaymentStatus }[],
): Map<string, PaymentSlice[]> {
  const map = new Map<string, PaymentSlice[]>();
  for (const row of rows) {
    if (!row.devisId) continue;
    const list = map.get(row.devisId) ?? [];
    list.push({ amount: row.amount, status: row.status });
    map.set(row.devisId, list);
  }
  return map;
}
