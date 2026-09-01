import { prisma } from '@/lib/prisma';
import type { Prisma } from '@repo/database';
import {
  AI_PEDAGOGICAL_OUTLINE_USE_CASE,
  FORMATION_SESSION_ENTITY_TYPE,
  PedagogicalOutlineDraftSchema,
  enqueuePedagogicalOutlineDraft,
} from '@repo/api-core';

export {
  AI_PEDAGOGICAL_OUTLINE_USE_CASE,
  PedagogicalOutlineDraftSchema,
  type PedagogicalOutlineDraft,
} from '@repo/api-core';

const TARGET_ENTITY_TYPE = FORMATION_SESSION_ENTITY_TYPE;

/**
 * Enfile un brouillon déroulé pédagogique (AiRun PENDING — worker async OPS-03).
 */
export async function enqueueSessionPedagogicalOutlineDraft(input: {
  sessionId: string;
  requestedById: string;
}) {
  return enqueuePedagogicalOutlineDraft(prisma, input);
}

/** @deprecated Synchrone — conservé pour compat ; préférer enqueue + worker. */
export async function draftSessionPedagogicalOutline(input: {
  sessionId: string;
  requestedById: string;
}) {
  const run = await enqueueSessionPedagogicalOutlineDraft(input);
  return { runId: run.id, status: run.status, artifactId: null as string | null };
}

/** Applique un artefact APPROVED sur `FormationSession.pedagogicalOutline`. */
export async function applySessionPedagogicalOutlineArtifact(input: { artifactId: string }) {
  const artifact = await prisma.aiArtifact.findUnique({ where: { id: input.artifactId } });
  if (!artifact) throw new Error('Artefact introuvable.');
  if (artifact.targetEntityType !== TARGET_ENTITY_TYPE || !artifact.targetEntityId) {
    throw new Error('Artefact non lié à une session.');
  }
  if (artifact.status !== 'APPROVED') {
    throw new Error(
      `Artefact non approuvé (statut actuel : ${artifact.status}) — application refusée.`,
    );
  }

  const parsed = PedagogicalOutlineDraftSchema.safeParse(artifact.payload);
  if (!parsed.success) {
    throw new Error("Contenu de l'artefact invalide — impossible d'appliquer.");
  }

  const sessionId = artifact.targetEntityId;

  await prisma.$transaction(async (tx) => {
    await tx.formationSession.update({
      where: { id: sessionId },
      data: {
        pedagogicalOutline: parsed.data.days as unknown as Prisma.InputJsonValue,
      },
    });
    await tx.aiArtifact.update({
      where: { id: input.artifactId },
      data: { status: 'APPLIED', appliedAt: new Date() },
    });
  });

  return { sessionId };
}
