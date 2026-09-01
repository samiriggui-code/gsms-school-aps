import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import type { PrismaClient } from '@repo/database';
import { z } from 'zod';
import {
  AI_PEDAGOGICAL_OUTLINE_USE_CASE,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_PROVIDER,
  FORMATION_SESSION_ENTITY_TYPE,
} from './constants';

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

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY manquant — voir .env.');
  }
  return createAnthropic({ apiKey });
}

function readSessionId(inputSummary: unknown): string | null {
  if (!inputSummary || typeof inputSummary !== 'object') return null;
  const sessionId = (inputSummary as Record<string, unknown>).sessionId;
  return typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : null;
}

/** Enfile un brouillon déroulé pédagogique (AiRun PENDING — exécution worker). */
export async function enqueuePedagogicalOutlineDraft(
  prisma: PrismaClient,
  input: { sessionId: string; requestedById: string },
) {
  const session = await prisma.formationSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      formation: { select: { id: true, name: true } },
    },
  });
  if (!session) throw new Error('Session introuvable.');

  return prisma.aiRun.create({
    data: {
      useCase: AI_PEDAGOGICAL_OUTLINE_USE_CASE,
      status: 'PENDING',
      requestedById: input.requestedById,
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      inputSummary: {
        sessionId: session.id,
        formationId: session.formation.id,
        formationName: session.formation.name,
        targetEntityType: FORMATION_SESSION_ENTITY_TYPE,
        targetEntityId: session.id,
      },
    },
  });
}

/** Exécute un AiRun PENDING/RUNNING pour le déroulé pédagogique. */
export async function executePedagogicalOutlineDraftRun(
  prisma: PrismaClient,
  runId: string,
): Promise<{ artifactId: string }> {
  const run = await prisma.aiRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error('AiRun introuvable.');
  if (run.useCase !== AI_PEDAGOGICAL_OUTLINE_USE_CASE) {
    throw new Error(`Use case incompatible : ${run.useCase}`);
  }

  const sessionId = readSessionId(run.inputSummary);
  if (!sessionId) throw new Error('sessionId manquant dans inputSummary.');

  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
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

  const anthropic = getAnthropicClient();
  const { object, usage } = await generateObject({
    model: anthropic(DEFAULT_AI_MODEL),
    schema: PedagogicalOutlineDraftSchema,
    system,
    prompt,
  });

  await prisma.aiRun.update({
    where: { id: runId },
    data: {
      status: 'SUCCEEDED',
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      completedAt: new Date(),
    },
  });

  const artifact = await prisma.aiArtifact.create({
    data: {
      runId,
      payload: object,
      targetEntityType: FORMATION_SESSION_ENTITY_TYPE,
      targetEntityId: session.id,
    },
  });

  return { artifactId: artifact.id };
}
