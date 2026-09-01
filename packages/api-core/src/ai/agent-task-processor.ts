import type { Prisma, PrismaClient } from '@repo/database';
import { AGENT_TASK_KIND_SESSION_READINESS_SCAN } from './agent-task-kinds';
import { scanSessionReadiness } from './session-readiness-scan';

export type CreateAgentTaskInput = {
  kind: string;
  requestedById: string;
  payload?: Record<string, unknown>;
};

export async function createAgentTask(prisma: PrismaClient, input: CreateAgentTaskInput) {
  return prisma.agentTask.create({
    data: {
      kind: input.kind,
      requestedById: input.requestedById,
      payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      status: 'PENDING',
    },
  });
}

async function completeTask(prisma: PrismaClient, taskId: string, result: Record<string, unknown>) {
  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: 'COMPLETED',
      result: result as Prisma.InputJsonValue,
      completedAt: new Date(),
    },
  });
}

async function failTask(prisma: PrismaClient, taskId: string, message: string) {
  await prisma.agentTask.update({
    where: { id: taskId },
    data: {
      status: 'FAILED',
      error: message.slice(0, 2000),
      completedAt: new Date(),
    },
  });
}

async function executeSessionReadinessScan(
  prisma: PrismaClient,
  taskId: string,
  payload: unknown,
): Promise<Record<string, unknown>> {
  const sessionId =
    payload && typeof payload === 'object' && !Array.isArray(payload)
      ? (payload as Record<string, unknown>).sessionId
      : undefined;
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new Error('sessionId requis dans payload.');
  }

  const summary = await scanSessionReadiness(prisma, sessionId.trim(), taskId);
  return summary as unknown as Record<string, unknown>;
}

async function executeTask(prisma: PrismaClient, taskId: string, kind: string, payload: unknown) {
  switch (kind) {
    case AGENT_TASK_KIND_SESSION_READINESS_SCAN:
      return executeSessionReadinessScan(prisma, taskId, payload);
    default:
      throw new Error(`Kind AgentTask non implémenté : ${kind}`);
  }
}

/**
 * Poll les AgentTask PENDING (file EVE — proactif / long-running).
 */
export async function processPendingAgentTasks(prisma: PrismaClient, limit = 3): Promise<number> {
  const pending = await prisma.agentTask.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: limit,
    select: { id: true, kind: true, payload: true },
  });

  let processed = 0;
  for (const task of pending) {
    const claimed = await prisma.agentTask.updateMany({
      where: { id: task.id, status: 'PENDING' },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    if (claimed.count === 0) continue;

    try {
      const result = await executeTask(prisma, task.id, task.kind, task.payload);
      await completeTask(prisma, task.id, result);
      processed += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[AgentTask] ${task.id} (${task.kind}) failed:`, message);
      await failTask(prisma, task.id, message);
    }
  }

  return processed;
}
