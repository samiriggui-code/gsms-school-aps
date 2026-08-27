import { prisma } from '@/lib/prisma';
import type { AiRun, AiRunStatus, Prisma } from '@repo/database';

const DEFAULT_PROVIDER = 'anthropic';
const DEFAULT_MODEL = 'claude-sonnet-5';

export type CreateAiRunInput = {
  useCase: string;
  requestedById: string;
  inputSummary?: Record<string, unknown>;
  provider?: string;
  model?: string;
};

/** Ouvre un AiRun à l'état RUNNING — un appel modèle = un run, jamais d'écriture directe en base. */
export async function createAiRun(input: CreateAiRunInput): Promise<AiRun> {
  return prisma.aiRun.create({
    data: {
      useCase: input.useCase,
      requestedById: input.requestedById,
      provider: input.provider ?? DEFAULT_PROVIDER,
      model: input.model ?? DEFAULT_MODEL,
      inputSummary: (input.inputSummary ?? {}) as Prisma.InputJsonValue,
      status: 'RUNNING',
    },
  });
}

export async function completeAiRun(
  runId: string,
  usage: { promptTokens?: number; completionTokens?: number; costCents?: number },
): Promise<AiRun> {
  return prisma.aiRun.update({
    where: { id: runId },
    data: {
      status: 'SUCCEEDED',
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      costCents: usage.costCents,
      completedAt: new Date(),
    },
  });
}

export async function failAiRun(runId: string, errorMessage: string): Promise<AiRun> {
  return prisma.aiRun.update({
    where: { id: runId },
    data: {
      status: 'FAILED' as AiRunStatus,
      errorMessage: errorMessage.slice(0, 2000),
      completedAt: new Date(),
    },
  });
}

export type CreateAiArtifactInput = {
  runId: string;
  payload: Record<string, unknown>;
  citations?: unknown[];
  targetEntityType?: string;
  targetEntityId?: string;
};

/**
 * Enregistre la sortie du modèle comme proposition (PROPOSED) — jamais appliquée
 * automatiquement. Une fonction apply* dédiée, appelée après revue humaine, écrit
 * réellement les données métier et marque l'artefact APPLIED.
 */
export async function createAiArtifact(input: CreateAiArtifactInput) {
  return prisma.aiArtifact.create({
    data: {
      runId: input.runId,
      payload: input.payload as Prisma.InputJsonValue,
      citations: (input.citations ?? []) as Prisma.InputJsonValue,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    },
  });
}

/** Revue humaine : PROPOSED → APPROVED (prêt pour apply*) ou REJECTED (jamais appliqué). */
export async function reviewAiArtifact(
  artifactId: string,
  input: { reviewedById: string; approve: boolean },
) {
  return prisma.aiArtifact.update({
    where: { id: artifactId },
    data: {
      status: input.approve ? 'APPROVED' : 'REJECTED',
      reviewedById: input.reviewedById,
      reviewedAt: new Date(),
    },
  });
}

/**
 * Marque un artefact comme réellement appliqué — à appeler uniquement depuis la
 * fonction apply* déterministe correspondante, jamais depuis le modèle, et jamais
 * sur un artefact qui n'est pas au statut APPROVED.
 */
export async function markAiArtifactApplied(artifactId: string) {
  const artifact = await prisma.aiArtifact.findUnique({ where: { id: artifactId } });
  if (!artifact) throw new Error('Artefact introuvable.');
  if (artifact.status !== 'APPROVED') {
    throw new Error(`Artefact non approuvé (statut actuel : ${artifact.status}) — application refusée.`);
  }
  return prisma.aiArtifact.update({
    where: { id: artifactId },
    data: { status: 'APPLIED', appliedAt: new Date() },
  });
}
