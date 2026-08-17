import { prisma } from '@/lib/prisma';
import type { FinanceDevisPdfRow } from './finance-devis-types';

export async function loadFinanceDevisPdfRow(devisId: string): Promise<FinanceDevisPdfRow | null> {
  const row = await prisma.financeDevis.findUnique({
    where: { id: devisId },
    select: {
      id: true,
      referenceCode: true,
      title: true,
      clientSnapshot: true,
      lines: true,
      subtotalHt: true,
      vatTotal: true,
      totalTtc: true,
      currency: true,
      notes: true,
      validUntil: true,
      updatedAt: true,
      lead: { select: { firstName: true, lastName: true, email: true } },
      formation: { select: { name: true } },
    },
  });
  if (!row) return null;
  return row;
}
