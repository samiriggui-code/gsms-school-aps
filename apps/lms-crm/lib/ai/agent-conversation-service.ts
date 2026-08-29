import { prisma } from '@/lib/prisma';

export type AgentTargetRef = {
  targetEntityType: string;
  targetEntityId: string;
};

/** Une conversation par entité — la crée si elle n'existe pas encore. */
export async function getOrCreateAgentConversation(target: AgentTargetRef) {
  return prisma.agentConversation.upsert({
    where: {
      targetEntityType_targetEntityId: {
        targetEntityType: target.targetEntityType,
        targetEntityId: target.targetEntityId,
      },
    },
    update: {},
    create: target,
  });
}

export async function listAgentMessages(conversationId: string) {
  return prisma.agentMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function appendAgentMessage(input: {
  conversationId: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
}) {
  return prisma.agentMessage.create({ data: input });
}
