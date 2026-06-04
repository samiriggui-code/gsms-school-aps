import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { PILOTAGE_EXPORT_DATASETS, PilotageExportService, isPilotageExportDataset } from '@repo/api-core';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const dataset = (request.nextUrl.searchParams.get('dataset') ?? '').trim();

  if (!dataset) {
    return ok({ datasets: PILOTAGE_EXPORT_DATASETS });
  }

  if (!isPilotageExportDataset(dataset)) {
    return fail('Jeu de données export inconnu.', 400);
  }

  try {
    const service = new PilotageExportService(prisma);
    const { filename, csv } = await service.exportCsv(dataset);
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('[pilotage-export]', e);
    return fail('Export impossible.', 500, e);
  }
}
