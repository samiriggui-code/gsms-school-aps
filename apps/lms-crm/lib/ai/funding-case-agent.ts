import { generateText, tool, type ModelMessage } from 'ai';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getAnthropicClient, DEFAULT_AI_MODEL } from '@/lib/ai/ai-client';
import { createAiRun, createAiArtifact, completeAiRun, failAiRun } from '@/lib/ai/ai-run-service';

const TARGET_ENTITY_TYPE = 'fundingCase';
const USE_CASE = 'funding_case.agent_turn';

const SYSTEM = [
  "Tu assistes un gestionnaire de dossiers de financement dans un organisme de formation français (sécurité privée).",
  "Tu réponds en français, brièvement. Appelle TOUJOURS `read_funding_case` avant de répondre à toute question sur le dossier, dans le même tour — ne dis jamais 'je vais vérifier' sans le faire réellement, et ne devine jamais un statut, un montant ou une pièce.",
  "Si tu veux suggérer une note à ajouter au dossier, appelle `propose_case_note` : cela crée une proposition qu'un humain doit approuver, ce n'est jamais une écriture directe. Ne prétends jamais avoir déjà ajouté la note toi-même.",
  "Après CHAQUE appel d'outil, termine toujours par une phrase courte en français qui répond à la personne — jamais de réponse vide après avoir agi.",
].join(' ');

function buildTools(caseId: string, runId: { current: string | null }, requestedById: string) {
  return {
    read_funding_case: tool({
      description:
        "Lit le dossier de financement : financeur, montants, statut, pièces demandées/fournies, historique des transitions de statut.",
      inputSchema: z.object({}),
      execute: async () => {
        const fundingCase = await prisma.fundingCase.findUnique({
          where: { id: caseId },
          include: {
            provider: true,
            documents: true,
            events: { orderBy: { createdAt: 'desc' }, take: 10 },
          },
        });
        if (!fundingCase) return { error: 'Dossier introuvable.' };
        return {
          reference: fundingCase.reference,
          status: fundingCase.status,
          funderType: fundingCase.funderType,
          provider: fundingCase.provider ? { code: fundingCase.provider.code, label: fundingCase.provider.label } : null,
          requestedAmount: fundingCase.requestedAmount,
          approvedAmount: fundingCase.approvedAmount,
          currency: fundingCase.currency,
          notes: fundingCase.notes,
          documents: fundingCase.documents.map((d) => ({ code: d.code, label: d.label, status: d.status })),
          recentEvents: fundingCase.events.map((e) => ({
            fromStatus: e.fromStatus,
            toStatus: e.toStatus,
            source: e.source,
            createdAt: e.createdAt,
          })),
        };
      },
    }),
    propose_case_note: tool({
      description:
        "Propose une note à ajouter au dossier. Ne l'ajoute PAS toi-même : crée une proposition (AiArtifact, statut PROPOSED) qu'un humain doit approuver avant qu'elle ne soit écrite sur le dossier.",
      inputSchema: z.object({
        note: z.string().min(1).describe('Le texte de la note proposée.'),
      }),
      execute: async ({ note }) => {
        if (!runId.current) return { error: "Impossible de proposer hors d'un run tracé." };
        const artifact = await createAiArtifact({
          runId: runId.current,
          payload: { note },
          targetEntityType: TARGET_ENTITY_TYPE,
          targetEntityId: caseId,
        });
        return { artifactId: artifact.id, status: 'PROPOSED' };
      },
    }),
  };
}

/**
 * Un tour de conversation de l'agent attaché à un FundingCase. Trace l'appel dans
 * AiRun comme `runStructuredAiTask`, mais en streaming multi-tour plutôt qu'en
 * génération structurée unique — toute écriture métier reste hors de ce fichier
 * (voir `propose_case_note` ci-dessus, et GSMS-AI-01 dans run-structured-ai-task.ts).
 */
const MAX_TOOL_ROUNDS = 4;

/**
 * Un tour de conversation de l'agent attaché à un FundingCase. Trace l'appel dans
 * AiRun comme `runStructuredAiTask`, mais avec des outils et plusieurs allers-retours
 * modèle↔outils plutôt qu'une génération structurée unique — toute écriture métier
 * reste hors de ce fichier (voir `propose_case_note` ci-dessus, GSMS-AI-01).
 *
 * Résolution manuelle des tool calls (pas le `stopWhen` intégré de `streamText`) :
 * dans la version installée du SDK, la boucle intégrée ne continue que pour des
 * tool calls "côté client" — nos tools s'exécutent côté serveur (`execute` direct),
 * donc `stopWhen` seul laissait l'agent s'arrêter juste après avoir appelé l'outil,
 * sans jamais formuler la réponse finale (vérifié par smoke test).
 */
export async function streamFundingCaseAgentTurn(input: {
  caseId: string;
  requestedById: string;
  history: ModelMessage[];
  onDone?: (text: string) => void | Promise<void>;
}) {
  const run = await createAiRun({
    useCase: USE_CASE,
    requestedById: input.requestedById,
    inputSummary: { caseId: input.caseId },
    model: DEFAULT_AI_MODEL,
  });

  const runId = { current: run.id as string | null };
  const anthropic = getAnthropicClient();
  const tools = buildTools(input.caseId, runId, input.requestedById);

  let messages: ModelMessage[] = [...input.history];
  let finalText = '';
  let promptTokens = 0;
  let completionTokens = 0;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      const step = await generateText({
        model: anthropic(DEFAULT_AI_MODEL),
        system: SYSTEM,
        messages,
        tools,
      });
      promptTokens += step.usage?.inputTokens ?? 0;
      completionTokens += step.usage?.outputTokens ?? 0;

      if (step.finishReason !== 'tool-calls' || step.toolCalls.length === 0) {
        finalText = step.text;
        break;
      }

      // Relais en texte simple plutôt que de rejouer le format interne exact
      // tool-call/tool-result du SDK (essayé, rejeté par sa validation Zod côté
      // input — les parts de sortie et d'entrée n'ont pas la même forme dans
      // cette version). Le modèle reçoit le résultat comme un fait à lire, pas
      // besoin du protocole d'origine pour répondre correctement.
      const toolResultsSummary = step.toolResults
        .map((r) => `Résultat de \`${r.toolName}\` : ${JSON.stringify(r.output)}`)
        .join('\n');
      messages = [
        ...messages,
        { role: 'assistant', content: step.text || '(consultation des données du dossier)' },
        { role: 'user', content: toolResultsSummary },
      ];
    }
  } catch (error) {
    runId.current = null;
    await failAiRun(run.id, error instanceof Error ? error.message : String(error));
    throw error;
  }

  // Garde-fou code, pas seulement prompt : un modèle peut occasionnellement rendre
  // un texte vide après un tool call malgré la consigne — mieux vaut une phrase
  // générique qu'un silence côté utilisateur.
  if (!finalText.trim()) {
    finalText = "Fait — voir les changements/propositions liés à ce dossier.";
  }

  await completeAiRun(run.id, { promptTokens, completionTokens });
  await input.onDone?.(finalText);

  return {
    toTextStreamResponse(): Response {
      return new Response(finalText, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    },
  };
}
