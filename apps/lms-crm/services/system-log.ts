import { Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { getCollaborateurActivityChannel, COLLABORATEUR_ACTIVITY_EVENT } from '@/lib/collaborateur-activity';
import { getEtudiantActivityChannel, Etudiant_ACTIVITY_EVENT } from '@/lib/etudiant-activity';

export interface SystemLogProps {
  event: string;
  userId: string;
  entityId?: string;
  entityType?: string;
  description?: string;
  ipAddress?: string;
  meta?: string;
}

const ENTITY_ACTIVITY: Record<
  string,
  { eventName: string; channel: (tenantId: string, entityId: string) => string }
> = {
  user: {
    eventName: COLLABORATEUR_ACTIVITY_EVENT,
    channel: getCollaborateurActivityChannel,
  },
  collaborateur: {
    eventName: COLLABORATEUR_ACTIVITY_EVENT,
    channel: getCollaborateurActivityChannel,
  },
  etudiant: {
    eventName: Etudiant_ACTIVITY_EVENT,
    channel: getEtudiantActivityChannel,
  },
  candidat: {
    eventName: Etudiant_ACTIVITY_EVENT,
    channel: getEtudiantActivityChannel,
  },
};

function activityTenantId(): string {
  return (
    process.env.NEXT_PUBLIC_SCHOOL_TENANT_ID?.trim() ||
    process.env.SCHOOL_TENANT_ID?.trim() ||
    'solo'
  );
}

async function publishEntityActivity(props: SystemLogProps) {
  const entityType = props.entityType?.trim().toLowerCase();
  const entityId = props.entityId?.trim() || props.userId;
  if (!entityType || !entityId) return;

  const mapping = ENTITY_ACTIVITY[entityType];
  if (!mapping) return;

  try {
    const { triggerActivityEvent } = await import('@repo/realtime');
    await triggerActivityEvent(mapping.channel(activityTenantId(), entityId), mapping.eventName, {
      event: props.event,
      entityId,
      entityType,
      description: props.description ?? null,
      at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[LOG] Failed to publish activity event:', error);
  }
}

export async function systemLog(
  {
    event,
    userId,
    entityId,
    entityType,
    description,
    ipAddress,
    meta,
  }: SystemLogProps,
  tx?: Prisma.TransactionClient,
) {
  try {
    const connection = tx ?? prisma;

    await connection.systemLog.create({
      data: {
        event,
        userId,
        entityId,
        entityType,
        description,
        ipAddress,
        meta,
      },
    });

    void publishEntityActivity({
      event,
      userId,
      entityId,
      entityType,
      description,
    });
  } catch (error) {
    console.error('[LOG] Failed to log activity:', error);
  }
}
