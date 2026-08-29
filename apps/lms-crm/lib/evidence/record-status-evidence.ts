import type { EvidenceSourceType, Prisma, PrismaClient } from '@repo/database';

type Db = PrismaClient | Prisma.TransactionClient;

export type RecordStatusEvidenceInput = {
  category: string;
  sourceType: EvidenceSourceType;
  sourceId: string;
  eventName: string;
  fromStatus?: string | null;
  toStatus: string;
  sessionId?: string | null;
  formationId?: string | null;
  learnerUserId?: string | null;
  companyId?: string | null;
  metadata?: Record<string, unknown>;
};

/** Preuve HISTORIQUE/DOCUMENT liée à un changement de statut (SD-06 / G8). */
export async function recordStatusEvidence(db: Db, input: RecordStatusEvidenceInput) {
  return db.evidence.create({
    data: {
      category: input.category,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      status: 'VALID',
      eventName: input.eventName,
      sessionId: input.sessionId ?? undefined,
      formationId: input.formationId ?? undefined,
      learnerUserId: input.learnerUserId ?? undefined,
      companyId: input.companyId ?? undefined,
      metadata: {
        fromStatus: input.fromStatus ?? null,
        toStatus: input.toStatus,
        ...(input.metadata ?? {}),
      },
    },
  });
}
