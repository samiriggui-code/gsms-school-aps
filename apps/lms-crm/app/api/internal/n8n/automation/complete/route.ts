import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { assertN8nInternal, unauthorizedN8nInternal } from '../../_lib/auth';

/**
 * Clôture un circuit d'automatisation de session une fois tous ses jalons traités.
 * Appelé par le workflow n8n « GSMS — Circuit session » (nœud « Clôturer circuit »).
 */
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

  const runId = typeof raw.runId === 'string' ? raw.runId.trim() : '';
  if (!runId) return fail('runId requis', 400);

  const existing = await prisma.sessionAutomationRun.findUnique({ where: { id: runId } });
  if (!existing) return fail('Circuit introuvable', 404);

  const run = await prisma.sessionAutomationRun.update({
    where: { id: runId },
    data: { status: 'COMPLETED', completedAt: new Date() },
    select: { id: true, sessionId: true, status: true, completedAt: true },
  });

  return ok(run);
}
