import type { PrismaClient } from '@repo/database';
import { AI_PEDAGOGICAL_OUTLINE_USE_CASE, AI_PROGRAM_MODULES_USE_CASE } from './constants';
import { executePedagogicalOutlineDraftRun } from './pedagogical-outline-draft';
import { executeProgramModulesDraftRun } from './program-modules-draft';

async function failRun(prisma: PrismaClient, runId: string, message: string) {
  await prisma.aiRun.update({
    where: { id: runId },
    data: {
      status: 'FAILED',
      errorMessage: message.slice(0, 2000),
      completedAt: new Date(),
    },
  });
}

async function executeRun(prisma: PrismaClient, runId: string, useCase: string) {
  switch (useCase) {
    case AI_PEDAGOGICAL_OUTLINE_USE_CASE:
      await executePedagogicalOutlineDraftRun(prisma, runId);
      return;
    case AI_PROGRAM_MODULES_USE_CASE:
      await executeProgramModulesDraftRun(prisma, runId);
      return;
    default:
      throw new Error(`Use case non pris en charge par le worker : ${useCase}`);
  }
}

/**
 * Poll les AiRun PENDING et les exécute (OPS-03 — socle futur AgentTask EVE).
 */
export async function processPendingAiRuns(prisma: PrismaClient, limit = 3): Promise<number> {
  const pending = await prisma.aiRun.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, useCase: true },
  });

  let processed = 0;
  for (const run of pending) {
    const claimed = await prisma.aiRun.updateMany({
      where: { id: run.id, status: 'PENDING' },
      data: { status: 'RUNNING' },
    });
    if (claimed.count === 0) continue;

    try {
      await executeRun(prisma, run.id, run.useCase);
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[AiRun] ${run.id} (${run.useCase}) failed:`, message);
      await failRun(prisma, run.id, message);
    }
  }

  return processed;
}
