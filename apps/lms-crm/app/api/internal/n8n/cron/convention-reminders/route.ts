import { NextRequest } from 'next/server';
import { ok } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';
import { processConventionReminders } from '@/lib/vie-scolaire/session-convention-lifecycle';

/** Cron WF-08 — relances convention J+2 / J+5. */
export async function GET(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  const result = await processConventionReminders(prisma);
  return ok(result);
}
