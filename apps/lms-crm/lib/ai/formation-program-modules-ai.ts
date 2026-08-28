import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { runStructuredAiTask } from '@/lib/ai/run-structured-ai-task';
import { markAiArtifactApplied } from '@/lib/ai/ai-run-service';
import { invalidateFormationCatalogCaches } from '@/lib/catalog-public-cache';

export const AI_PROGRAM_MODULES_USE_CASE = 'formation.program_modules.draft';
const TARGET_ENTITY_TYPE = 'formation';

export const ProgramModuleDraftSchema = z.object({
  modules: z
    .array(
      z.object({
        id: z.string().describe('Identifiant court, ex. "M1", "M2"…'),
        title: z.string().min(1),
        details: z.array(z.string().min(1)).min(1).max(8),
      }),
    )
    .min(1)
    .max(12),
});

export type ProgramModuleDraft = z.infer<typeof ProgramModuleDraftSchema>;

/**
 * Brouillon IA du programme d'une formation (GSMS-AI-02) — écrit uniquement dans
 * AiArtifact (statut PROPOSED). Aucune écriture sur `Formation.programModules` ici :
 * voir `applyFormationProgramModulesArtifact` pour l'application, qui exige un
 * artefact APPROVED par un humain au préalable.
 */
export async function draftFormationProgramModules(input: {
  formationId: string;
  requestedById: string;
}) {
  const formation = await prisma.formation.findUnique({
    where: { id: input.formationId },
    select: {
      id: true,
      name: true,
      tag: true,
      track: true,
      duration: true,
      description: true,
      longDescription: true,
      hoursMin: true,
      hoursMax: true,
      programModules: true,
    },
  });
  if (!formation) throw new Error('Formation introuvable.');

  const existingModules = Array.isArray(formation.programModules) ? formation.programModules : [];

  const system =
    "Tu es un ingénieur pédagogique pour un organisme de formation à la sécurité privée (agents de sécurité, SSIAP, télésurveillance…) en France. " +
    'Tu proposes un découpage en modules de programme de formation, factuel et vérifiable, sans jamais inventer de références réglementaires précises ' +
    '(articles de loi, numéros de décret) que tu ne peux pas garantir exactes. Reste générique sur la réglementation, précis sur le contenu pédagogique.';

  const prompt = [
    `Formation : « ${formation.name} » (${formation.tag}, filière ${formation.track}).`,
    `Durée indicative : ${formation.duration}${formation.hoursMin ? ` (${formation.hoursMin}${formation.hoursMax ? `-${formation.hoursMax}` : ''}h)` : ''}.`,
    formation.description ? `Résumé existant : ${formation.description}` : null,
    formation.longDescription ? `Description longue existante : ${formation.longDescription}` : null,
    existingModules.length
      ? `Modules déjà en place (à améliorer/compléter, pas nécessairement à l'identique) : ${JSON.stringify(existingModules)}`
      : 'Aucun module existant — propose un découpage complet.',
    'Propose entre 3 et 8 modules de programme, chacun avec un titre court et 2 à 5 points de contenu (details).',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await runStructuredAiTask({
    useCase: AI_PROGRAM_MODULES_USE_CASE,
    requestedById: input.requestedById,
    schema: ProgramModuleDraftSchema,
    system,
    prompt,
    inputSummary: { formationId: formation.id, formationName: formation.name },
    targetEntityType: TARGET_ENTITY_TYPE,
    targetEntityId: formation.id,
  });

  return result;
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
