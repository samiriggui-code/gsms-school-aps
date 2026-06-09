import type { PrismaClient } from '@repo/database';
import { CrmEventService } from '../../crm-events';
import type { WorkflowEventDefinition } from '../catalog';

export type CrmOutboxEmitOptions = {
  dedupeKey?: string;
  createdById?: string | null;
  severity?: WorkflowEventDefinition['severity'];
};

export async function enqueueWorkflowCrmEvent(
  prisma: PrismaClient,
  definition: WorkflowEventDefinition,
  payload: Record<string, unknown>,
  options?: CrmOutboxEmitOptions,
): Promise<void> {
  const events = new CrmEventService(prisma);

  await events.enqueue({
    eventType: definition.crmEventType,
    moduleKey: definition.moduleKey,
    category: definition.category,
    severity: options?.severity ?? definition.severity,
    title: definition.buildTitle(payload),
    body: definition.buildBody(payload),
    href: definition.buildHref?.(payload) ?? null,
    audience: 'BROADCAST_ACTIVE_USERS',
    payload,
    dedupeKey: options?.dedupeKey,
    createdById: options?.createdById ?? null,
  });
}
