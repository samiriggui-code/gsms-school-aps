import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { getStoredFinancePdf } from '@/lib/finance/store-finance-pdf-asset';
import { fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ factureId: string }> };

/** Redirige vers le PDF facture archivé (id = FinanceInvoice). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;

  try {
    const invoice = await prisma.financeInvoice.findUnique({
      where: { id: factureId },
      select: { id: true, number: true },
    });
    if (!invoice) return fail('Facture introuvable.', 404);

    const asset = await getStoredFinancePdf(factureId, 'invoice-pdf');
    if (!asset?.url) {
      return fail('Aucun PDF facture archivé. Générez-le depuis le détail du dossier.', 404);
    }

    return NextResponse.redirect(asset.url, { status: 302 });
  } catch (e) {
    console.error('[finance-factures pdf stored GET]', e);
    return fail('Lecture du PDF archivé impossible.', 500, e);
  }
}
