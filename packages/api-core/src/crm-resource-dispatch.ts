import type { PrismaClient } from '@repo/database';
import { CRM_MODULE_KEYS, CrmEventService, type CrmEventSeverity } from './crm-events';
import { sendCrmResourceEventEmails } from './crm-event-emails';
import { emitWorkflowBridge } from './workflows/workflow-bridge';

export type DispatchCrmResourceEventInput = {
  eventType: string;
  title: string;
  body: string;
  href?: string | null;
  dedupeKey?: string;
  payload?: Record<string, unknown>;
  createdById?: string | null;
  severity?: CrmEventSeverity;
  moduleKey?: string;
  detailLines?: string[];
  eyebrow?: string;
  sendEmail?: boolean;
};

/** Enqueue in-app + e-mail ops pour événements ressources (salles, matériel). */
export async function dispatchCrmResourceEvent(
  prisma: PrismaClient,
  input: DispatchCrmResourceEventInput,
): Promise<void> {
  const moduleKey = input.moduleKey ?? CRM_MODULE_KEYS.EQUIPEMENTS;
  const events = new CrmEventService(prisma);
  const enqueued = await events.enqueue({
    eventType: input.eventType,
    moduleKey,
    title: input.title,
    body: input.body,
    href: input.href ?? '/gestion-ressources/equipements',
    dedupeKey: input.dedupeKey,
    payload: input.payload,
    createdById: input.createdById,
    severity: input.severity,
  });
  if (enqueued.created) {
    await events.processPending(12);

    if (input.sendEmail !== false) {
      await sendCrmResourceEventEmails(prisma, {
        eventType: input.eventType,
        moduleKey,
        title: input.title,
        body: input.body,
        href: input.href,
        detailLines: input.detailLines,
        actorUserId: input.createdById,
        eyebrow: input.eyebrow,
      });
    }
  }

  void emitWorkflowBridge(
    prisma,
    input.eventType,
    {
      ...(input.payload ?? {}),
      title: input.title,
      body: input.body,
      href: input.href ?? null,
      eventType: input.eventType,
    },
    { dedupeKey: input.dedupeKey ? `n8n:${input.dedupeKey}` : undefined },
  );
}
