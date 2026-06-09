import { prisma } from '@/lib/prisma';
import type { FinanceDevisPdfRow } from './finance-devis-types';

export async function loadFinanceDevisPdfRow(devisId: string): Promise<FinanceDevisPdfRow | null> {
  const row = await prisma.financeDevis.findUnique({
    where: { id: devisId },
    include: {
      lead: { select: { firstName: true, lastName: true, email: true } },
      formation: { select: { name: true } },
    },
  });
  if (!row) return null;
  return row;
}
