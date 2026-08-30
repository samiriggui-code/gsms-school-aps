/**
 * Backfill OF-06 — crée des FinanceInvoice pour d’anciens devis ACCEPTED
 * qui avaient déjà un état e-facture (colonnes désormais retirées du devis).
 *
 * En local post-migration les colonnes einvoice* n’existent plus → no-op.
 * Conservé pour doc / éventuelle restauration depuis backup avant drop.
 *
 * Usage: pnpm --filter @lms-crm exec tsx --env-file=../../.env scripts/backfill-finance-invoices.ts
 */

import { PrismaClient, FinanceDevisStatus } from '@repo/database';
import { emitInvoiceFromDevis } from '../lib/finance/finance-invoice-service';

async function main() {
  const prisma = new PrismaClient();
  try {
    const accepted = await prisma.financeDevis.findMany({
      where: { status: FinanceDevisStatus.ACCEPTED },
      select: { id: true, referenceCode: true },
    });

    let created = 0;
    let skipped = 0;
    for (const d of accepted) {
      const existing = await prisma.financeInvoice.findFirst({
        where: { devisId: d.id, kind: 'FULL', status: { not: 'CANCELLED' } },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      // Post-drop einvoice* : émission FULL standard (issuedAt = now).
      // Si un dump pré-migration est rejoué, passer issuedAt / einvoice via emitInvoiceFromDevis.
      await emitInvoiceFromDevis(prisma, { devisId: d.id });
      created += 1;
      console.log(`OK ${d.referenceCode} → facture créée`);
    }
    console.log(`Backfill terminé : ${created} créées, ${skipped} déjà présentes, ${accepted.length} devis ACCEPTED.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
