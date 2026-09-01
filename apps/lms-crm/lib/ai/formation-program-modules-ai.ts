import { prisma } from '@/lib/prisma';
import {
  AI_PROGRAM_MODULES_USE_CASE,
  FORMATION_ENTITY_TYPE,
  ProgramModuleDraftSchema,
  enqueueProgramModulesDraft,
} from '@repo/api-core';
import { markAiArtifactApplied } from '@/lib/ai/ai-run-service';
import { invalidateFormationCatalogCaches } from '@/lib/catalog-public-cache';

export {
  AI_PROGRAM_MODULES_USE_CASE,
  ProgramModuleDraftSchema,
  type ProgramModuleDraft,
} from '@repo/api-core';

const TARGET_ENTITY_TYPE = FORMATION_ENTITY_TYPE;

/**
 * Enfile un brouillon IA du programme (GSMS-AI-02) — AiRun PENDING, exécution worker.
 */
export async function enqueueFormationProgramModulesDraft(input: {
  formationId: string;
  requestedById: string;
}) {
  return enqueueProgramModulesDraft(prisma, input);
}

/** @deprecated Synchrone supprimé — préférer enqueueFormationProgramModulesDraft + worker. */
export async function draftFormationProgramModules(input: {
  formationId: string;
  requestedById: string;
}) {
  const run = await enqueueFormationProgramModulesDraft(input);
  return { runId: run.id, status: run.status, artifactId: null as string | null };
}

/**
 * Applique un artefact IA APPROVED : écrit `Formation.programModules` puis marque
 * l'artefact APPLIED. Refuse tout artefact non approuvé (voir markAiArtifactApplied).
 */
export async function applyFormationProgramModulesArtifact(input: { artifactId: string }) {
  const artifact = await prisma.aiArtifact.findUnique({ where: { id: input.artifactId } });
  if (!artifact) throw new Error('Artefact introuvable.');
  if (artifact.targetEntityType !== TARGET_ENTITY_TYPE || !artifact.targetEntityId) {
    throw new Error('Artefact non lié à une formation.');
  }

  const parsed = ProgramModuleDraftSchema.safeParse(artifact.payload);
  if (!parsed.success) {
    throw new Error("Contenu de l'artefact invalide — impossible d'appliquer.");
  }

  const formation = await prisma.formation.update({
    where: { id: artifact.targetEntityId },
    data: { programModules: parsed.data.modules },
    select: { slug: true },
  });

  await markAiArtifactApplied(input.artifactId);

  void invalidateFormationCatalogCaches(formation.slug).catch((e) => {
    console.error('[ai/program-modules] invalidation cache', e);
  });

  return { formationSlug: formation.slug };
}
