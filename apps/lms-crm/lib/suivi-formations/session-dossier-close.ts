import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import { ensureSessionSuiviStoragePrefixes } from '@/lib/entity-storage';
import { isoDateOnly } from '@/lib/suivi-formations/session-days';

const MODULE = 'gestion-academique';
const ENTITY_TYPE = 'formation_session';
const CLOSURE_CATEGORY = 'session-dossier-closure';

export type SessionDossierStatus = {
  closed: boolean;
  closedAt: string | null;
  closedByName: string | null;
  documentCount: number;
  closureManifestId: string | null;
};

function readMeta(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function getSessionDossierStatus(sessionId: string): Promise<SessionDossierStatus> {
  const closure = await prisma.fileAsset.findFirst({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      category: CLOSURE_CATEGORY,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      createdAt: true,
      metadata: true,
      createdBy: { select: { name: true } },
    },
  });

  const documentCount = await prisma.fileAsset.count({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: sessionId,
      status: { in: ['ACTIVE', 'ARCHIVED'] },
      category: { not: CLOSURE_CATEGORY },
    },
  });

  if (!closure) {
    return {
      closed: false,
      closedAt: null,
      closedByName: null,
      documentCount,
      closureManifestId: null,
    };
  }

  const meta = readMeta(closure.metadata);
  return {
    closed: true,
    closedAt:
      (typeof meta.closedAt === 'string' ? meta.closedAt : null) ??
      closure.createdAt.toISOString(),
    closedByName: closure.createdBy?.name ?? null,
    documentCount,
    closureManifestId: closure.id,
  };
}

/** Clôture le dossier session : legal hold sur tous les documents + manifeste JSON archivé. */
export async function closeSessionDossier(input: {
  sessionId: string;
  closedById: string;
  notes?: string | null;
}) {
  const existing = await getSessionDossierStatus(input.sessionId);
  if (existing.closed) throw new Error('DOSSIER_ALREADY_CLOSED');

  const session = await prisma.formationSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      startDate: true,
      endDate: true,
      formation: { select: { name: true } },
    },
  });
  if (!session) throw new Error('SESSION_NOT_FOUND');

  const assets = await prisma.fileAsset.findMany({
    where: {
      module: MODULE,
      entityType: ENTITY_TYPE,
      entityId: input.sessionId,
      status: { in: ['ACTIVE', 'ARCHIVED'] },
      category: { not: CLOSURE_CATEGORY },
    },
    select: {
      id: true,
      originalName: true,
      category: true,
      mimeType: true,
      size: true,
      url: true,
      metadata: true,
      legalHold: true,
      status: true,
      createdAt: true,
    },
  });

  const closedAt = new Date();

  const manifest = {
    kind: 'session-dossier-closure',
    sessionId: input.sessionId,
    formationName: session.formation.name,
    sessionLabel: session.dateDisplayLabel,
    startDate: session.startDate ? isoDateOnly(session.startDate) : null,
    endDate: session.endDate ? isoDateOnly(session.endDate) : null,
    closedAt: closedAt.toISOString(),
    closedById: input.closedById,
    notes: input.notes?.trim() || null,
    documentCount: assets.length,
    documents: assets.map((d) => {
      const meta = readMeta(d.metadata);
      return {
        id: d.id,
        title: (typeof meta.title === 'string' ? meta.title : null) ?? d.originalName,
        category: d.category,
        dayDate: typeof meta.dayDate === 'string' ? meta.dayDate : null,
        slot: meta.slot ?? null,
        url: d.url,
        status: d.status,
        legalHold: d.legalHold,
      };
    }),
  };

  await ensureSessionSuiviStoragePrefixes(input.sessionId);

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
  const manifestFilename = `dossier-session-cloture_${input.sessionId.slice(0, 8)}_${closedAt.toISOString().slice(0, 10)}.json`;
  const manifestFile = new File([Uint8Array.from(manifestBuffer)], manifestFilename, {
    type: 'application/json',
  });

  const uploaded = await uploadFile({
    file: manifestFile,
    module: MODULE,
    entityType: 'session',
    entityId: input.sessionId,
    category: 'archives',
    visibility: 'private',
  });

  await prisma.$transaction(async (tx) => {
    for (const asset of assets) {
      const meta = readMeta(asset.metadata);
      await tx.fileAsset.update({
        where: { id: asset.id },
        data: {
          legalHold: true,
          metadata: {
            ...meta,
            dossierClosedAt: closedAt.toISOString(),
            dossierClosedById: input.closedById,
          },
        },
      });
    }

    await tx.fileAsset.create({
      data: {
        module: MODULE,
        entityType: ENTITY_TYPE,
        entityId: input.sessionId,
        category: CLOSURE_CATEGORY,
        originalName: uploaded.originalName,
        mimeType: 'application/json',
        size: manifestBuffer.length,
        storageKey: uploaded.key,
        url: uploaded.url,
        visibility: 'PRIVATE',
        provider: 's3',
        createdById: input.closedById,
        legalHold: true,
        metadata: {
          kind: 'session-dossier-closure',
          sessionId: input.sessionId,
          closedAt: closedAt.toISOString(),
          notes: input.notes?.trim() || null,
          documentCount: assets.length,
        },
      },
    });
  });

  return {
    closedAt: closedAt.toISOString(),
    documentCount: assets.length,
    manifestUrl: uploaded.url,
  };
}
