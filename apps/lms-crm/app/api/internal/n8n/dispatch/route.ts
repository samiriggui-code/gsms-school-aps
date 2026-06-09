import { NextRequest } from 'next/server';
import {
  buildN8nDispatchMessage,
  parseN8nDispatchInput,
  verifyN8nCallbackAuth,
  CrmEventService,
  type N8nDispatchChannel,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/services/send-email';

type DispatchResult = Partial<Record<N8nDispatchChannel, 'ok' | 'skipped' | 'failed'>>;

function resolveOpsEmail(): string | null {
  return (
    process.env.GSMS_OPS_EMAIL?.trim() ||
    process.env.CONTACT_TO_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    null
  );
}

async function resolveChatSenderId(): Promise<string | null> {
  const configured = process.env.N8N_SYSTEM_USER_ID?.trim();
  if (configured) return configured;

  const admin = await prisma.user.findFirst({
    where: { status: 'ACTIVE', isTrashed: false },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  });
  return admin?.id ?? null;
}

async function postChatMessage(
  conversationId: string,
  senderId: string,
  text: string,
): Promise<boolean> {
  const participant = await prisma.chatParticipant.findFirst({
    where: { conversationId, userId: senderId },
  });
  if (!participant) return false;

  await prisma.chatMessage.create({
    data: { conversationId, senderId, body: text },
  });
  await prisma.chatConversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return true;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!verifyN8nCallbackAuth(request.headers, rawBody)) {
    return fail('Unauthorized request', 401);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return fail('Corps JSON invalide', 400);
  }

  const input = parseN8nDispatchInput(parsed);
  if (!input) {
    return fail('channels et event requis', 400);
  }

  const message = buildN8nDispatchMessage(input.event, input.payload, input.emittedAt);
  if (!message) {
    return fail('Événement inconnu', 400);
  }

  const result: DispatchResult = {};
  const crmOrigin = process.env.NEXTAUTH_URL?.replace(/\/$/, '') ?? '';

  for (const channel of input.channels) {
    try {
      if (channel === 'email') {
        const to = resolveOpsEmail();
        if (!to) {
          result.email = 'skipped';
          continue;
        }
        const href = message.href && crmOrigin ? `${crmOrigin}${message.href}` : message.href;
        await sendEmail({
          to,
          subject: `[GSMS] ${message.title}`,
          content: {
            title: message.title,
            description: message.body,
            buttonLabel: href ? 'Ouvrir dans le CRM' : undefined,
            buttonUrl: href ?? undefined,
          },
        });
        result.email = 'ok';
        continue;
      }

      if (channel === 'notification') {
        const crmEvents = new CrmEventService(prisma);
        await crmEvents.enqueue({
          eventType: message.crmEventType,
          moduleKey: message.moduleKey as never,
          category: message.category as never,
          severity: message.severity as never,
          title: message.title,
          body: message.body,
          href: message.href,
          dedupeKey: message.dedupeKey,
        });
        result.notification = 'ok';
        continue;
      }

      if (channel === 'chat') {
        const conversationId = process.env.GSMS_OPS_CHAT_CONVERSATION_ID?.trim();
        if (!conversationId) {
          result.chat = 'skipped';
          continue;
        }
        const senderId = await resolveChatSenderId();
        if (!senderId) {
          result.chat = 'skipped';
          continue;
        }
        const href = message.href && crmOrigin ? `${crmOrigin}${message.href}` : null;
        const text = href
          ? `🔔 ${message.title}\n${message.body}\n${href}`
          : `🔔 ${message.title}\n${message.body}`;
        const posted = await postChatMessage(conversationId, senderId, text.slice(0, 4000));
        result.chat = posted ? 'ok' : 'failed';
      }
    } catch (err) {
      console.error(`[n8n-dispatch] ${channel}`, err instanceof Error ? err.message : err);
      result[channel] = 'failed';
    }
  }

  return ok({ event: message.event, result });
}
