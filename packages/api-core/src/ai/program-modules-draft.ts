import { createAnthropic } from '@ai-sdk/anthropic';
import { generateObject } from 'ai';
import type { PrismaClient } from '@repo/database';
import { z } from 'zod';
import {
  AI_PROGRAM_MODULES_USE_CASE,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_PROVIDER,
  FORMATION_ENTITY_TYPE,
} from './constants';

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

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY manquant — voir .env.');
  }
  return createAnthropic({ apiKey });
}

function readFormationId(inputSummary: unknown): string | null {
  if (!inputSummary || typeof inputSummary !== 'object') return null;
  const formationId = (inputSummary as Record<string, unknown>).formationId;
  return typeof formationId === 'string' && formationId.trim() ? formationId.trim() : null;
}

/** Enfile un brouillon programme modules (AiRun PENDING — exécution worker). */
export async function enqueueProgramModulesDraft(
  prisma: PrismaClient,
  input: { formationId: string; requestedById: string },
) {
  const formation = await prisma.formation.findUnique({
    where: { id: input.formationId },
    select: { id: true, name: true },
  });
  if (!formation) throw new Error('Formation introuvable.');

  return prisma.aiRun.create({
    data: {
      useCase: AI_PROGRAM_MODULES_USE_CASE,
      status: 'PENDING',
      requestedById: input.requestedById,
      provider: DEFAULT_AI_PROVIDER,
      model: DEFAULT_AI_MODEL,
      inputSummary: {
        formationId: formation.id,
        formationName: formation.name,
        targetEntityType: FORMATION_ENTITY_TYPE,
        targetEntityId: formation.id,
      },
    },
  });
}

/** Exécute un AiRun PENDING/RUNNING pour le brouillon programme modules (GSMS-AI-02). */
export async function executeProgramModulesDraftRun(
  prisma: PrismaClient,
  runId: string,
): Promise<{ artifactId: string }> {
  const run = await prisma.aiRun.findUnique({ where: { id: runId } });
  if (!run) throw new Error('AiRun introuvable.');
  if (run.useCase !== AI_PROGRAM_MODULES_USE_CASE) {
    throw new Error(`Use case incompatible : ${run.useCase}`);
  }

  const formationId = readFormationId(run.inputSummary);
  if (!formationId) throw new Error('formationId manquant dans inputSummary.');

  const formation = await prisma.formation.findUnique({
    where: { id: formationId },
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

  const anthropic = getAnthropicClient();
  const { object, usage } = await generateObject({
    model: anthropic(DEFAULT_AI_MODEL),
    schema: ProgramModuleDraftSchema,
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
      targetEntityType: FORMATION_ENTITY_TYPE,
      targetEntityId: formation.id,
    },
  });

  return { artifactId: artifact.id };
}
