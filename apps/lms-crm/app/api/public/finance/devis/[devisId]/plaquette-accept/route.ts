import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { verifyPlaquetteTokenForDevis } from '@/lib/devis-plaquette-public-request';
import { createPlaquetteMessageRow } from '@/lib/devis-plaquette-messages-query';

type Ctx = { params: Promise<{ devisId: string }> };

/** Acceptation du devis par le client (lien public signé). */
export async function POST(request: NextRequest, context: Ctx) {
  const { devisId } = await context.params;
  const gate = verifyPlaquetteTokenForDevis(request, devisId);
  if (!gate.ok) return fail(gate.message, gate.status);

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      select: { id: true, status: true, referenceCode: true },
    });
    if (!row) return fail('Devis introuvable.', 404);

    if (row.status === FinanceDevisStatus.ACCEPTED) {
      return ok({ accepted: true, already: true, referenceCode: row.referenceCode });
    }

    if (row.status !== FinanceDevisStatus.SENT) {
      return fail(
        `L’acceptation en ligne est possible lorsque la proposition a été envoyée (statut actuel : ${row.status}).`,
        400,
      );
    }

    await prisma.financeDevis.update({
      where: { id: devisId },
      data: { status: FinanceDevisStatus.ACCEPTED },
    });

    await createPlaquetteMessageRow({
      devisId,
      authorKind: 'CLIENT',
      authorLabel: 'Système (client)',
      body: 'Le client a accepté la proposition via la plaquette publique.',
    });

    return ok({ accepted: true, status: FinanceDevisStatus.ACCEPTED, referenceCode: row.referenceCode });
  } catch (e) {
    console.error('[plaquette-accept]', e);
    return fail('Acceptation impossible.', 500, e);
  }
}
