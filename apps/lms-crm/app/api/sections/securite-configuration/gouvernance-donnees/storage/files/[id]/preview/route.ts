import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail } from '@/app/api/_shared/http/response';
import { loadAssetBytes, parseExcelPreview, resolvePreviewKind } from '@/lib/file-asset-service';

type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  const format = request.nextUrl.searchParams.get('format');

  const loaded = await loadAssetBytes(id);
  if (!loaded) return fail('Fichier introuvable.', 404);

  const { asset, file } = loaded;
  const kind = resolvePreviewKind(asset.mimeType);

  if (format === 'json' && (kind === 'excel' || kind === 'csv')) {
    if (kind === 'csv') {
      const text = file.body.toString('utf8');
      const lines = text.split(/\r?\n/).filter(Boolean).slice(0, 51);
      const headers = (lines.shift() ?? '').split(',');
      const rows = lines.map((line) => line.split(','));
      return NextResponse.json({
        success: true,
        data: { kind: 'csv', sheetName: 'CSV', headers, rows },
      });
    }
    const preview = await parseExcelPreview(file.body);
    return NextResponse.json({
      success: true,
      data: { kind: 'excel', ...preview },
    });
  }

  if (kind === 'pdf' || kind === 'image') {
    return new NextResponse(new Uint8Array(file.body), {
      status: 200,
      headers: {
        'Content-Type': asset.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(asset.originalName)}"`,
        'Cache-Control': 'private, max-age=60',
      },
    });
  }

  return new NextResponse(new Uint8Array(file.body), {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(asset.originalName)}"`,
    },
  });
}
