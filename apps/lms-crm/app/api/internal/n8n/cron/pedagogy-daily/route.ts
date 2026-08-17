import { NextRequest } from 'next/server';
import { verifyN8nInternalAuth, fetchPedagogyDailyAlerts } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!verifyN8nInternalAuth(request.headers)) {
    return fail('Unauthorized request', 401);
  }

  const dateParam = request.nextUrl.searchParams.get('date');
  let ref = new Date();
  if (dateParam) {
    const parsed = new Date(`${dateParam}T12:00:00.000Z`);
    if (Number.isNaN(parsed.getTime())) {
      return fail('date invalide (YYYY-MM-DD)', 400);
    }
    ref = parsed;
  }

  const alerts = await fetchPedagogyDailyAlerts(prisma, ref);
  return ok(alerts);
}
