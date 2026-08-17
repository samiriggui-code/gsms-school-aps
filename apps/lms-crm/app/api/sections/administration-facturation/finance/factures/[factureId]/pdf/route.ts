import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FinanceDevisStatus } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { buildFinanceDevisHtml } from '@/lib/finance/finance-devis-html';
import { buildFinanceDevisPdfBuffer } from '@/lib/finance/finance-devis-pdf';
import { loadFinanceDevisPdfRow } from '@/lib/finance/load-finance-devis-pdf-row';
import { storeFinancePdfAsset } from '@/lib/finance/store-finance-pdf-asset';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ factureId: string }> };

function requestOrigin(request: NextRequest): string | undefined {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  if (!host) return undefined;
  return `${proto}://${host}`;
}

async function assertAcceptedFacture(factureId: string) {
  const row = await prisma.financeDevis.findUnique({
    where: { id: factureId },
    select: { id: true, status: true },
  });
  if (!row) return { ok: false as const, status: 404, message: 'Dossier introuvable.' };
  if (row.status !== FinanceDevisStatus.ACCEPTED) {
    return {
      ok: false as const,
      status: 404,
      message: 'Ce dossier ne figure pas dans les propositions acceptées à facturer.',
    };
  }
  return { ok: true as const };
}

/** Aperçu HTML brandé ou PDF binaire (?format=pdf). */
export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { factureId } = await context.params;
  const format = request.nextUrl.searchParams.get('format');

  try {
    const check = await assertAcceptedFacture(factureId);
    if (!check.ok) return new NextResponse(check.message, { status: check.status });

    const row = await loadFinanceDevisPdfRow(factureId);
    if (!row) return new NextResponse('Dossier introuvable', { status: 404 });

    if (format === 'pdf') {
      const { buffer, filename } = await buildFinanceDevisPdfBuffer(row, 'facture');
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    const origin = requestOrigin(request);
    const html = await buildFinanceDevisHtml(row, 'facture', origin);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="facture-${row.referenceCode}.html"`,
      },
    });
  } catch (e) {
    console.error('[finance-factures pdf GET]', e);
    return new NextResponse('Erreur', { status: 500 });
  }
}

/** Génère le PDF facture et le stocke sur MinIO (FileAsset category invoice-pdf). */
export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;

  try {
    const check = await assertAcceptedFacture(factureId);
    if (!check.ok) return fail(check.message, check.status);

    const row = await loadFinanceDevisPdfRow(factureId);
    if (!row) return fail('Dossier introuvable.', 404);

    const { buffer, filename } = await buildFinanceDevisPdfBuffer(row, 'facture');
    const asset = await storeFinancePdfAsset({
      devisId: factureId,
      category: 'invoice-pdf',
      buffer,
      filename,
      createdById: session.user.id,
    });

    return ok({
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
      size: asset.size,
      createdAt: asset.createdAt.toISOString(),
    });
  } catch (e) {
    console.error('[finance-factures pdf POST]', e);
    return fail('Impossible de générer et archiver le PDF facture.', 500, e);
  }
}
