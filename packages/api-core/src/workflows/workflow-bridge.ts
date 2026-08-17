import type { PrismaClient } from '@repo/database';
import { createWorkflowEngine } from './engine';
import type { StandardWebhookEventType } from './standard-catalog';

/** Pont événements CRM catalogue → webhook standard n8n (sans double notification). */
export const CRM_EVENT_TO_STANDARD_WEBHOOK: Partial<Record<string, StandardWebhookEventType>> = {
  'equipment.maintenance.out_of_service': 'crm.equipment.alert',
  'equipment.maintenance.started': 'crm.equipment.alert',
  'equipment.batch_released': 'crm.equipment.alert',
  'compliance.document.expiring': 'crm.compliance.document.expiring',
  'compliance.document.missing': 'crm.compliance.document.missing',
  'compliance.document.requested': 'crm.compliance.document.requested',
  'support.ticket.created': 'crm.support.ticket.created',
  'venue.room.deactivated': 'crm.room.alert',
  'venue.room.reactivated': 'crm.room.alert',
  'venue.room.reserved': 'crm.room.alert',
  'venue.room.released': 'crm.room.alert',
  'venue.room.reservation_updated': 'crm.room.alert',
  'venue.room.booking_created': 'crm.room.alert',
  'venue.room.booking_cancelled': 'crm.room.alert',
  'venue.room.session_ended': 'crm.room.alert',
};

export async function emitWorkflowBridge(
  prisma: PrismaClient,
  crmEventType: string,
  payload: Record<string, unknown>,
  options?: { dedupeKey?: string },
): Promise<void> {
  const standard = CRM_EVENT_TO_STANDARD_WEBHOOK[crmEventType];
  if (!standard) return;

  try {
    const workflows = createWorkflowEngine(prisma);
    await workflows.emit(standard, payload, {
      crm: false,
      dedupeKey: options?.dedupeKey,
    });
  } catch (err) {
    console.error(
      '[workflow-bridge]',
      crmEventType,
      err instanceof Error ? err.message : err,
    );
  }
}
