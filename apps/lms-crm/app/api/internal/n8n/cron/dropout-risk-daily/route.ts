import { NextRequest } from 'next/server';
import { ok } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';
import { processDropoutRiskDaily } from '@/lib/vie-scolaire/dropout-risk-service';

/** Cron WF-19 — détection quotidienne risque de rupture. */
export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  const result = await processDropoutRiskDaily(prisma);
  return ok(result);
}
