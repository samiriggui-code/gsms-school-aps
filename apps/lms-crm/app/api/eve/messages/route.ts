import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  getOrCreateAgentConversation,
  listAgentMessages,
} from '@/lib/ai/agent-conversation-service';
import { EVE_TARGET_ENTITY_TYPE } from '@/lib/eve/eve-types';
import { getAiApiKeyStatus } from '@/lib/ai/ai-client';

/** GET — historique chat EVE de l'utilisateur connecté. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const conversation = await getOrCreateAgentConversation({
    targetEntityType: EVE_TARGET_ENTITY_TYPE,
    targetEntityId: session.user.id,
  });
  const messages = await listAgentMessages(conversation.id);

  return ok({
    conversationId: conversation.id,
    messages,
    aiConfigured: getAiApiKeyStatus(),
  });
}
