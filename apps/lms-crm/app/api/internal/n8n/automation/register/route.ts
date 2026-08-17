import { NextRequest } from 'next/server';
import { registerSessionAutomationRun } from '@repo/api-core';
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

  if (!body || typeof body !== 'object') return fail('Payload invalide', 400);
  const raw = body as Record<string, unknown>;
  const sessionId = typeof raw.sessionId === 'string' ? raw.sessionId.trim() : '';
  if (!sessionId) return fail('sessionId requis', 400);

  const run = await registerSessionAutomationRun(prisma, {
    sessionId,
    participantId: typeof raw.participantId === 'string' ? raw.participantId : null,
    candidatureId: typeof raw.candidatureId === 'string' ? raw.candidatureId : null,
    circuitKey: typeof raw.circuitKey === 'string' ? raw.circuitKey : 'default',
    n8nExecutionId: typeof raw.n8nExecutionId === 'string' ? raw.n8nExecutionId : null,
    milestones: Array.isArray(raw.milestones) ? raw.milestones : [],
    metadata:
      raw.metadata && typeof raw.metadata === 'object' && !Array.isArray(raw.metadata)
        ? (raw.metadata as Record<string, unknown>)
        : {},
  });

  return ok(run);
}
