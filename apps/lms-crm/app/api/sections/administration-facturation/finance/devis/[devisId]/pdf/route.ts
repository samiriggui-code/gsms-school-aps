import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { buildFinanceDevisHtml } from '@/lib/finance/finance-devis-html';
import { buildFinanceDevisPdfBuffer } from '@/lib/finance/finance-devis-pdf';
import { loadFinanceDevisPdfRow } from '@/lib/finance/load-finance-devis-pdf-row';
import { storeFinancePdfAsset } from '@/lib/finance/store-finance-pdf-asset';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ devisId: string }> };

function requestOrigin(request: NextRequest): string | undefined {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') ?? 'http';
  if (!host) return undefined;
  return `${proto}://${host}`;
}

/** Aperçu HTML brandé ou PDF binaire (?format=pdf). */
export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { devisId } = await context.params;
  const format = request.nextUrl.searchParams.get('format');

  try {
    const row = await loadFinanceDevisPdfRow(devisId);
    if (!row) return new NextResponse('Devis introuvable', { status: 404 });

    if (format === 'pdf') {
      const { buffer, filename } = await buildFinanceDevisPdfBuffer(row, 'devis');
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      });
    }

    const origin = requestOrigin(request);
    const html = await buildFinanceDevisHtml(row, 'devis', origin);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="devis-${row.referenceCode}.html"`,
      },
    });
  } catch (e) {
    console.error('[finance-devis pdf GET]', e);
    return new NextResponse('Erreur', { status: 500 });
  }
}

/** Génère le PDF devis et le stocke sur MinIO (FileAsset category quote-pdf). */
export async function POST(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { devisId } = await context.params;

  try {
    const row = await loadFinanceDevisPdfRow(devisId);
    if (!row) return fail('Devis introuvable.', 404);

    const { buffer, filename } = await buildFinanceDevisPdfBuffer(row, 'devis');
    const asset = await storeFinancePdfAsset({
      devisId,
      category: 'quote-pdf',
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
    console.error('[finance-devis pdf POST]', e);
    return fail('Impossible de générer et archiver le PDF.', 500, e);
  }
}
