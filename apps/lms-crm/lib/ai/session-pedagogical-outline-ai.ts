import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { runStructuredAiTask } from '@/lib/ai/run-structured-ai-task';
import { markAiArtifactApplied } from '@/lib/ai/ai-run-service';
import type { Prisma } from '@repo/database';

export const AI_PEDAGOGICAL_OUTLINE_USE_CASE = 'session.pedagogical_outline.draft';
const TARGET_ENTITY_TYPE = 'FormationSession';

export const PedagogicalOutlineDraftSchema = z.object({
  days: z
    .array(
      z.object({
        dayIndex: z.number().int().min(1),
        dateLabel: z.string().min(1).describe('Libellé jour, ex. Jour 1 — lundi 12 mai'),
        morning: z
          .object({
            title: z.string().min(1),
            objectives: z.array(z.string().min(1)).min(1).max(5),
            activities: z.array(z.string().min(1)).min(1).max(6),
          })
          .nullable(),
        evening: z
          .object({
            title: z.string().min(1),
            objectives: z.array(z.string().min(1)).min(1).max(5),
            activities: z.array(z.string().min(1)).min(1).max(6),
          })
          .nullable(),
      }),
    )
    .min(1)
    .max(30),
});

export type PedagogicalOutlineDraft = z.infer<typeof PedagogicalOutlineDraftSchema>;

/**
 * Brouillon IA du déroulé pédagogique d'une session (GSMS-AI-03).
 * Écrit uniquement AiArtifact PROPOSED — jamais FormationSession.pedagogicalOutline.
 */
export async function draftSessionPedagogicalOutline(input: {
  sessionId: string;
  requestedById: string;
}) {
  const session = await prisma.formationSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      startDate: true,
      endDate: true,
      sessionKind: true,
      location: true,
      pedagogicalOutline: true,
      formation: {
        select: {
          id: true,
          name: true,
          tag: true,
          track: true,
          duration: true,
          hoursMin: true,
          hoursMax: true,
          programModules: true,
          description: true,
        },
      },
    },
  });
  if (!session) throw new Error('Session introuvable.');

  const modules = Array.isArray(session.formation.programModules)
    ? session.formation.programModules
    : [];
  const existing = Array.isArray(session.pedagogicalOutline) ? session.pedagogicalOutline : [];

  const system =
    "Tu es un ingénieur pédagogique pour un organisme de formation à la sécurité privée en France. " +
    'Tu proposes un déroulé jour par jour / créneau (matin/soir), factuel, sans inventer de références réglementaires précises. ' +
    'Appuie-toi sur le programme modules fourni. Si un créneau n’est pas pertinent, mets null.';

  const prompt = [
    `Formation : « ${session.formation.name} » (${session.formation.tag}, filière ${session.formation.track}).`,
    `Durée indicative : ${session.formation.duration}` +
      (session.formation.hoursMin
        ? ` (${session.formation.hoursMin}${session.formation.hoursMax ? `-${session.formation.hoursMax}` : ''}h)`
        : ''),
    `Session : ${session.dateDisplayLabel} (${session.sessionKind}), lieu ${session.location}.`,
    session.startDate ? `Début : ${session.startDate.toISOString().slice(0, 10)}` : null,
    session.endDate ? `Fin : ${session.endDate.toISOString().slice(0, 10)}` : null,
    session.formation.description ? `Résumé formation : ${session.formation.description}` : null,
    modules.length
      ? `Programme modules (source AI-02 / fiche) : ${JSON.stringify(modules)}`
      : 'Aucun programme modules — propose un déroulé générique cohérent avec le tag formation.',
    existing.length
      ? `Déroulé déjà appliqué (à améliorer) : ${JSON.stringify(existing)}`
      : 'Aucun déroulé appliqué.',
    'Propose un déroulé sur le nombre de jours réaliste pour la durée (typiquement 1 à 15 jours), chaque jour avec morning et/ou evening (title, objectives, activities).',
  ]
    .filter(Boolean)
    .join('\n');

  return runStructuredAiTask({
    useCase: AI_PEDAGOGICAL_OUTLINE_USE_CASE,
    requestedById: input.requestedById,
    schema: PedagogicalOutlineDraftSchema,
    system,
    prompt,
    inputSummary: {
      sessionId: session.id,
      formationId: session.formation.id,
      formationName: session.formation.name,
    },
    targetEntityType: TARGET_ENTITY_TYPE,
    targetEntityId: session.id,
  });
}

/** Applique un artefact APPROVED sur `FormationSession.pedagogicalOutline`. */
export async function applySessionPedagogicalOutlineArtifact(input: { artifactId: string }) {
  const artifact = await prisma.aiArtifact.findUnique({ where: { id: input.artifactId } });
  if (!artifact) throw new Error('Artefact introuvable.');
  if (artifact.targetEntityType !== TARGET_ENTITY_TYPE || !artifact.targetEntityId) {
    throw new Error('Artefact non lié à une session.');
  }

  const parsed = PedagogicalOutlineDraftSchema.safeParse(artifact.payload);
  if (!parsed.success) {
    throw new Error("Contenu de l'artefact invalide — impossible d'appliquer.");
  }

  await prisma.formationSession.update({
    where: { id: artifact.targetEntityId },
    data: {
      pedagogicalOutline: parsed.data.days as unknown as Prisma.InputJsonValue,
    },
  });

  await markAiArtifactApplied(input.artifactId);
  return { sessionId: artifact.targetEntityId };
}
