import { NextRequest } from 'next/server';
import { completeSessionAutomationRun } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';

export async function POST(request: NextRequest) {
  if (!assertN8nInternal(request)) return unauthorizedN8nInternal();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide', 400);
  }

  const runId =
    body && typeof body === 'object' && typeof (body as { runId?: unknown }).runId === 'string'
      ? (body as { runId: string }).runId.trim()
      : '';
  if (!runId) return fail('runId requis', 400);

  const run = await completeSessionAutomationRun(prisma, runId);
  return ok(run);
}
