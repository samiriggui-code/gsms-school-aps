/**
 * Fil chat « GSMS Ops » — alertes n8n (email/chat callback).
 * Id conversation → GSMS_OPS_CHAT_CONVERSATION_ID dans .env VPS.
 */
const OPS_CHAT_TITLE = 'GSMS Ops';

async function seedGsmsOpsChat(tx) {
  const users = await tx.user.findMany({
    where: { status: 'ACTIVE', isTrashed: false },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  if (users.length === 0) {
    console.log('GSMS Ops chat skipped: no active users.');
    return null;
  }

  let conv = await tx.chatConversation.findFirst({
    where: { title: OPS_CHAT_TITLE },
  });

  if (!conv) {
    conv = await tx.chatConversation.create({
      data: {
        type: 'GROUP',
        title: OPS_CHAT_TITLE,
        participants: {
          create: users.map((u) => ({ userId: u.id })),
        },
      },
    });

    await tx.chatMessage.create({
      data: {
        conversationId: conv.id,
        senderId: users[0].id,
        body:
          'Fil ops GSMS — alertes automatisées (landing, finance, vie scolaire). ' +
          'Les messages n8n apparaissent ici.',
      },
    });

    console.log(`GSMS Ops chat created: ${conv.id}`);
    return conv.id;
  }

  const existing = await tx.chatParticipant.findMany({
    where: { conversationId: conv.id },
    select: { userId: true },
  });
  const existingIds = new Set(existing.map((p) => p.userId));
  const missing = users.filter((u) => !existingIds.has(u.id));
  for (const u of missing) {
    await tx.chatParticipant.create({
      data: { conversationId: conv.id, userId: u.id },
    });
  }

  console.log(`GSMS Ops chat exists: ${conv.id}`);
  return conv.id;
}

module.exports = { seedGsmsOpsChat, OPS_CHAT_TITLE };
