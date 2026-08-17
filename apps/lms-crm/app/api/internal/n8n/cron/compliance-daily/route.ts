import { NextRequest } from 'next/server';
import { verifyN8nInternalAuth, fetchComplianceDailyAlerts } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!verifyN8nInternalAuth(request.headers)) {
    return fail('Unauthorized request', 401);
  }

  const alerts = await fetchComplianceDailyAlerts(prisma);
  return ok(alerts);
}
