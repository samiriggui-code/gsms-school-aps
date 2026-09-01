import { generateText, type ModelMessage } from 'ai';
import type { Session } from 'next-auth';
import { getAnthropicClient, DEFAULT_AI_MODEL } from '@/lib/ai/ai-client';
import { prisma } from '@/lib/prisma';
import { buildEveTools } from './eve-tool-registry';
import type { EveToolContext } from './eve-types';

const MAX_TOOL_ROUNDS = 6;

const SYSTEM = [
  "Tu es EVE, l'assistante IA du CRM GSMS School (organisme de formation sécurité privée, France).",
  'Tu réponds en français, de façon concise et factuelle.',
  'Tu as des outils en lecture seule : utilise-les pour répondre — ne devine jamais un statut, un montant ou un chiffre.',
  "Si l'utilisateur n'a pas la permission pour un outil, explique-le poliment.",
  'Pas d\'action qui modifie des données (V1 lecture seule).',
].join(' ');

export type EveChatTurnResult = {
  reply: string;
  toolsUsed: string[];
};

/**
 * Tour de chat EVE synchrone (V1) — boucle outils côté serveur, comme funding-case-agent.
 */
export async function runEveChatTurn(input: {
  session: Session;
  userId: string;
  history: ModelMessage[];
}): Promise<EveChatTurnResult> {
  const ctx: EveToolContext = { prisma, session: input.session, userId: input.userId };
  const tools = buildEveTools(ctx);
  const anthropic = getAnthropicClient();

  let messages: ModelMessage[] = [...input.history];
  const toolsUsed: string[] = [];
  let finalText = '';

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const step = await generateText({
      model: anthropic(DEFAULT_AI_MODEL),
      system: SYSTEM,
      messages,
      tools,
    });

    for (const tc of step.toolCalls) {
      if (!toolsUsed.includes(tc.toolName)) {
        toolsUsed.push(tc.toolName);
      }
    }

    if (step.finishReason !== 'tool-calls' || step.toolCalls.length === 0) {
      finalText = step.text.trim();
      break;
    }

    const toolResultsSummary = step.toolResults
      .map((r) => `Résultat de \`${r.toolName}\` : ${JSON.stringify(r.output)}`)
      .join('\n');
    messages = [
      ...messages,
      { role: 'assistant', content: step.text || '(consultation des données)' },
      { role: 'user', content: toolResultsSummary },
    ];
  }

  if (!finalText) {
    finalText =
      "Je n'ai pas pu formuler une réponse — reformulez ou précisez votre question.";
  }

  return { reply: finalText, toolsUsed };
}
