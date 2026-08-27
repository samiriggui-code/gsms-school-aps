import { generateObject } from 'ai';
import type { z } from 'zod';
import { getAnthropicClient, DEFAULT_AI_MODEL } from '@/lib/ai/ai-client';
import { completeAiRun, createAiArtifact, createAiRun, failAiRun } from '@/lib/ai/ai-run-service';

export type RunStructuredAiTaskInput<Schema extends z.ZodTypeAny> = {
  useCase: string;
  requestedById: string;
  schema: Schema;
  system: string;
  prompt: string;
  inputSummary?: Record<string, unknown>;
  targetEntityType?: string;
  targetEntityId?: string;
};

export type RunStructuredAiTaskResult<Schema extends z.ZodTypeAny> = {
  runId: string;
  artifactId: string;
  data: z.infer<Schema>;
};

/**
 * Point d'entrée unique pour une tâche IA générative structurée (GSMS-AI-01).
 * Trace l'appel dans AiRun, force une sortie validée par schéma Zod (jamais du texte
 * libre à recopier), et enregistre le résultat en AiArtifact au statut PROPOSED —
 * aucune écriture métier n'a lieu ici. L'application reste à la charge d'une fonction
 * apply* déterministe, appelée seulement après revue humaine (voir ai-run-service.ts).
 */
export async function runStructuredAiTask<Schema extends z.ZodTypeAny>(
  input: RunStructuredAiTaskInput<Schema>,
): Promise<RunStructuredAiTaskResult<Schema>> {
  const run = await createAiRun({
    useCase: input.useCase,
    requestedById: input.requestedById,
    inputSummary: input.inputSummary,
    model: DEFAULT_AI_MODEL,
  });

  try {
    const anthropic = getAnthropicClient();
    const { object, usage } = await generateObject({
      model: anthropic(DEFAULT_AI_MODEL),
      schema: input.schema,
      system: input.system,
      prompt: input.prompt,
    });

    await completeAiRun(run.id, {
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
    });

    const artifact = await createAiArtifact({
      runId: run.id,
      payload: object as Record<string, unknown>,
      targetEntityType: input.targetEntityType,
      targetEntityId: input.targetEntityId,
    });

    return { runId: run.id, artifactId: artifact.id, data: object };
  } catch (error) {
    await failAiRun(run.id, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
