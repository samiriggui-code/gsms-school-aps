import { NextRequest } from 'next/server';
import { fetchPedagogyEveningAlerts } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';
import { processPedagogyEveningWorkflows } from '@/lib/of/pedagogy-evening-workflows';

export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  const dateParam = request.nextUrl.searchParams.get('date');
  let ref = new Date();
  if (dateParam) {
    const parsed = new Date(`${dateParam}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) return fail('date invalide (YYYY-MM-DD)', 400);
    ref = parsed;
  }

  const alerts = await fetchPedagogyEveningAlerts(prisma, ref);
  const processed = await processPedagogyEveningWorkflows(prisma, ref);

  return ok({
    ...alerts,
    signatureNotices: processed.signatureNotices,
    justificationRequests: processed.justificationRequests,
    skipped: processed.skipped,
  });
}
