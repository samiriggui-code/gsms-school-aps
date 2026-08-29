import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { ModelMessage } from 'ai';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  getOrCreateAgentConversation,
  listAgentMessages,
  appendAgentMessage,
} from '@/lib/ai/agent-conversation-service';
import { streamFundingCaseAgentTurn } from '@/lib/ai/funding-case-agent';

const TARGET_ENTITY_TYPE = 'fundingCase';

type RouteParams = { params: Promise<{ id: string }> };

/** GET — charge le fil de conversation de l'agent pour ce dossier. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  const conversation = await getOrCreateAgentConversation({
    targetEntityType: TARGET_ENTITY_TYPE,
    targetEntityId: id,
  });
  const messages = await listAgentMessages(conversation.id);
  return ok({ conversationId: conversation.id, messages });
}

/** POST — envoie un message à l'agent, réponse en streaming. */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;
  const fundingCase = await prisma.fundingCase.findUnique({ where: { id }, select: { id: true } });
  if (!fundingCase) return fail('Dossier introuvable', 404);

  const body = (await request.json()) as { message?: string };
  const text = body.message?.trim();
  if (!text) return fail('message requis', 400);

  const conversation = await getOrCreateAgentConversation({
    targetEntityType: TARGET_ENTITY_TYPE,
    targetEntityId: id,
  });

  const priorMessages = await listAgentMessages(conversation.id);
  await appendAgentMessage({ conversationId: conversation.id, role: 'USER', content: text });

  const history: ModelMessage[] = [
    ...priorMessages.map((m) => ({
      role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
    { role: 'user', content: text },
  ];

  const result = await streamFundingCaseAgentTurn({
    caseId: id,
    requestedById: session.user.id,
    history,
    onDone: async (finalText) => {
      if (finalText.trim()) {
        await appendAgentMessage({ conversationId: conversation.id, role: 'ASSISTANT', content: finalText });
      }
    },
  });

  // Texte brut, pas le protocole UI-message d'`ai` : ce repo n'a pas `@ai-sdk/react`
  // et le panneau consomme le stream à la main (pas de nouvelle dépendance pour ça).
  return result.toTextStreamResponse();
}
