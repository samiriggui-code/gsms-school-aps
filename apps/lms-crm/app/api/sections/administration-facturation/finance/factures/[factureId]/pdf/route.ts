import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { buildFinanceDevisHtml } from '@/lib/finance/finance-devis-html';
import { buildFinanceDevisPdfBuffer } from '@/lib/finance/finance-devis-pdf';
import { loadFinanceDevisPdfRow } from '@/lib/finance/load-finance-devis-pdf-row';
import { storeFinancePdfAsset } from '@/lib/finance/store-finance-pdf-asset';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ factureId: string }> };

function requestOrigin(request: NextRequest): string | undefined {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  if (!host) return undefined;
  return `${proto}://${host}`;
}

async function assertIssuedInvoice(factureId: string) {
  const invoice = await prisma.financeInvoice.findUnique({
    where: { id: factureId },
    select: { id: true, devisId: true, number: true, status: true },
  });
  if (!invoice) return { ok: false as const, status: 404, message: 'Facture introuvable.' };
  return { ok: true as const, invoice };
}

/** Aperçu HTML brandé ou PDF binaire (?format=pdf). */
export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { factureId } = await context.params;
  const format = request.nextUrl.searchParams.get('format');

  try {
    const check = await assertIssuedInvoice(factureId);
    if (!check.ok) return new NextResponse(check.message, { status: check.status });

    const row = await loadFinanceDevisPdfRow(check.invoice.devisId);
    if (!row) return new NextResponse('Devis lié introuvable', { status: 404 });
    const rowForDoc = { ...row, referenceCode: check.invoice.number };

    if (format === 'pdf') {
      const { buffer, filename } = await buildFinanceDevisPdfBuffer(rowForDoc, 'facture');
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    const origin = requestOrigin(request);
    const html = await buildFinanceDevisHtml(rowForDoc, 'facture', origin);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="facture-${check.invoice.number}.html"`,
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
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { factureId } = await context.params;

  try {
    const check = await assertIssuedInvoice(factureId);
    if (!check.ok) return fail(check.message, check.status);

    const row = await loadFinanceDevisPdfRow(check.invoice.devisId);
    if (!row) return fail('Devis lié introuvable.', 404);
    const rowForDoc = { ...row, referenceCode: check.invoice.number };

    const { buffer, filename } = await buildFinanceDevisPdfBuffer(rowForDoc, 'facture');
    const asset = await storeFinancePdfAsset({
      devisId: check.invoice.id,
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
