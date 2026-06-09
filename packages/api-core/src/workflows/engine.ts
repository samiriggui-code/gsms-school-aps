import type { PrismaClient } from '@repo/database';
import {
  STANDARD_WEBHOOK_EVENT_META,
  STANDARD_WEBHOOK_CRM,
  type StandardWebhookEventType,
} from './standard-catalog';
import { enqueueWorkflowCrmEvent, type CrmOutboxEmitOptions } from './handlers/crm-outbox';
import { dispatchN8nWebhook } from './handlers/n8n-webhook';
import { dispatchStandardWebhook } from './handlers/standard-webhook';

export type WorkflowEmitOptions = CrmOutboxEmitOptions & {
  /** Webhook standard n8n (`/webhook/standard/gsms`). Défaut : true. */
  standard?: boolean;
  /** Hub legacy n8n (`/webhook/gsms-events`). Défaut : false. */
  legacyHub?: boolean;
  /** Si false, n’enqueue pas d’événement CRM. */
  crm?: boolean;
};

export class WorkflowEngine {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Bus d’événements : webhook standard + outbox CRM + hub legacy optionnel.
   * Ne lève pas — les erreurs sont loguées pour ne pas casser le flux HTTP métier.
   */
  async emit(
    eventType: StandardWebhookEventType,
    payload: Record<string, unknown>,
    options?: WorkflowEmitOptions,
  ): Promise<void> {
    const meta = STANDARD_WEBHOOK_EVENT_META[eventType];
    if (!meta) {
      console.warn('[workflow] événement inconnu', eventType);
      return;
    }

    const runCrm = options?.crm !== false;
    const runStandard = options?.standard !== false;
    const runLegacyHub = options?.legacyHub === true;

    const crmDefinition = STANDARD_WEBHOOK_CRM[eventType];
    const tasks: Promise<void>[] = [];

    if (runCrm && crmDefinition) {
      tasks.push(
        enqueueWorkflowCrmEvent(this.prisma, crmDefinition, payload, options).catch((err) => {
          console.error('[workflow] CRM outbox', err instanceof Error ? err.message : err);
        }),
      );
    }

    if (runStandard) {
      tasks.push(dispatchStandardWebhook(eventType, payload));
    }

    if (runLegacyHub) {
      tasks.push(dispatchN8nWebhook(eventType, payload));
    }

    await Promise.all(tasks);
  }
}

export function createWorkflowEngine(prisma: PrismaClient): WorkflowEngine {
  return new WorkflowEngine(prisma);
}
