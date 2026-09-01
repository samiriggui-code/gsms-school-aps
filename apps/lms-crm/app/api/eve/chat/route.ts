import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { ModelMessage } from 'ai';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  appendAgentMessage,
  getOrCreateAgentConversation,
  listAgentMessages,
} from '@/lib/ai/agent-conversation-service';
import { getAiApiKeyStatus } from '@/lib/ai/ai-client';
import { runEveChatTurn } from '@/lib/eve/eve-chat-service';
import { EVE_TARGET_ENTITY_TYPE } from '@/lib/eve/eve-types';

/** POST — envoie un message à EVE (chat synchrone V1, lecture seule). */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  if (!getAiApiKeyStatus()) {
    return fail('ANTHROPIC_API_KEY non configurée — EVE indisponible.', 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide', 400);
  }

  const text =
    body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
      ? (body as { message: string }).message.trim()
      : '';
  if (!text) return fail('message requis', 400);

  const conversation = await getOrCreateAgentConversation({
    targetEntityType: EVE_TARGET_ENTITY_TYPE,
    targetEntityId: session.user.id,
  });

  const priorMessages = await listAgentMessages(conversation.id);
  await appendAgentMessage({ conversationId: conversation.id, role: 'USER', content: text });

  const history: ModelMessage[] = priorMessages.map((m) => ({
    role: m.role === 'USER' ? ('user' as const) : ('assistant' as const),
    content: m.content,
  }));
  history.push({ role: 'user', content: text });

  try {
    const { reply, toolsUsed } = await runEveChatTurn({
      session,
      userId: session.user.id,
      history,
    });

    await appendAgentMessage({ conversationId: conversation.id, role: 'ASSISTANT', content: reply });

    return ok({ reply, toolsUsed, conversationId: conversation.id });
  } catch (e) {
    console.error('[eve/chat] POST', e);
    return fail('Réponse EVE impossible.', 500, e);
  }
}
