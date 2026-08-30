/**
 * OF-06 — émission facture + allocation numéro légal gapless (même TX).
 * Pas de lazy-create sur GET : l’émission est toujours un acte staff explicite.
 */

import {
  FinanceDevisStatus,
  FinanceEinvoiceStatus,
  FinanceInvoiceKind,
  FinanceInvoiceStatus,
  FinanceNumberSequenceScope,
  Prisma,
  type PrismaClient,
} from '@repo/database';

export class FinanceInvoiceError extends Error {
  constructor(
    message: string,
    readonly code: 'NOT_FOUND' | 'NOT_ACCEPTED' | 'INVALID_KIND' | 'CONFLICT',
  ) {
    super(message);
    this.name = 'FinanceInvoiceError';
  }
}

function formatInvoiceNumber(year: number, seq: number): string {
  return `FAC-${year}-${String(seq).padStart(6, '0')}`;
}

/** Alloue le prochain numéro FAC-YYYY-###### dans la transaction courante. */
export async function allocateInvoiceNumber(
  tx: Prisma.TransactionClient,
  issuedAt: Date = new Date(),
): Promise<string> {
  const year = issuedAt.getFullYear();
  const scope = FinanceNumberSequenceScope.INVOICE;

  await tx.financeNumberSequence.upsert({
    where: { scope_year: { scope, year } },
    create: { scope, year, lastValue: 0 },
    update: {},
  });

  const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
    UPDATE "FinanceNumberSequence"
    SET "lastValue" = "lastValue" + 1, "updatedAt" = NOW()
    WHERE "scope" = ${scope}::"FinanceNumberSequenceScope" AND "year" = ${year}
    RETURNING "lastValue"
  `;

  const lastValue = rows[0]?.lastValue;
  if (lastValue == null || lastValue < 1) {
    throw new Error('Allocation numéro facture impossible.');
  }
  return formatInvoiceNumber(year, lastValue);
}

export type EmitInvoiceInput = {
  devisId: string;
  kind?: FinanceInvoiceKind;
  /** Backfill uniquement — sinon now(). */
  issuedAt?: Date;
  /** Backfill — copie einvoice depuis l’ancien devis. */
  einvoice?: {
    einvoiceStatus: FinanceEinvoiceStatus;
    einvoiceProfile: string;
    einvoiceGeneratedAt: Date | null;
    einvoicePdpMessageId: string | null;
    einvoiceLastError: string | null;
    einvoiceXmlAssetKey: string | null;
  };
};

export async function emitInvoiceFromDevis(prisma: PrismaClient, input: EmitInvoiceInput) {
  const kind = input.kind ?? FinanceInvoiceKind.FULL;
  if (!Object.values(FinanceInvoiceKind).includes(kind)) {
    throw new FinanceInvoiceError('Kind de facture invalide.', 'INVALID_KIND');
  }

  return prisma.$transaction(async (tx) => {
    const devis = await tx.financeDevis.findUnique({
      where: { id: input.devisId },
      select: {
        id: true,
        status: true,
        title: true,
        lines: true,
        subtotalHt: true,
        vatTotal: true,
        totalTtc: true,
        currency: true,
        notes: true,
      },
    });

    if (!devis) throw new FinanceInvoiceError('Devis introuvable.', 'NOT_FOUND');
    if (devis.status !== FinanceDevisStatus.ACCEPTED) {
      throw new FinanceInvoiceError(
        'Seuls les devis acceptés peuvent être facturés.',
        'NOT_ACCEPTED',
      );
    }

    if (kind === FinanceInvoiceKind.FULL) {
      const existingFull = await tx.financeInvoice.findFirst({
        where: { devisId: devis.id, kind: FinanceInvoiceKind.FULL, status: { not: FinanceInvoiceStatus.CANCELLED } },
        select: { id: true, number: true },
      });
      if (existingFull) {
        throw new FinanceInvoiceError(
          `Une facture FULL existe déjà (${existingFull.number}).`,
          'CONFLICT',
        );
      }
    }

    const issuedAt = input.issuedAt ?? new Date();
    const number = await allocateInvoiceNumber(tx, issuedAt);
    const e = input.einvoice;

    return tx.financeInvoice.create({
      data: {
        number,
        devisId: devis.id,
        kind,
        status: FinanceInvoiceStatus.ISSUED,
        lines: devis.lines as Prisma.InputJsonValue,
        subtotalHt: devis.subtotalHt,
        vatTotal: devis.vatTotal,
        totalTtc: devis.totalTtc,
        currency: devis.currency,
        notes: devis.notes,
        issuedAt,
        einvoiceStatus: e?.einvoiceStatus ?? FinanceEinvoiceStatus.NOT_READY,
        einvoiceProfile: e?.einvoiceProfile ?? 'BASIC',
        einvoiceGeneratedAt: e?.einvoiceGeneratedAt ?? null,
        einvoicePdpMessageId: e?.einvoicePdpMessageId ?? null,
        einvoiceLastError: e?.einvoiceLastError ?? null,
        einvoiceXmlAssetKey: e?.einvoiceXmlAssetKey ?? null,
      },
    });
  });
}
