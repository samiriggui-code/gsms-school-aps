import type { Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import {
  DOCUMENT_AUDIT_COMPLIANCE_EVENT_LABELS,
  DOCUMENT_AUDIT_FILE_EVENT_LABELS,
  labelDocumentAuditDossierKind,
} from '@/lib/governance/document-audit-labels';

export type DocumentAuditSource = 'compliance' | 'file' | 'version';

export type DocumentAuditRow = {
  id: string;
  occurredAt: string;
  source: DocumentAuditSource;
  eventType: string;
  eventLabel: string;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  documentLabel: string;
  actorName: string | null;
  detail: string;
  fileAssetId: string | null;
};

export type DocumentAuditListInput = {
  page: number;
  limit: number;
  q?: string;
  source?: DocumentAuditSource | 'all';
  eventType?: string;
  module?: string;
  entityType?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type DocumentAuditListResult = {
  data: DocumentAuditRow[];
  stats: {
    total: number;
    compliance: number;
    fileLifecycle: number;
    last7Days: number;
    today: number;
  };
  filters: {
    modules: string[];
    entityTypes: string[];
    eventTypes: string[];
  };
  pagination: { page: number; limit: number; total: number };
};

const COMPLIANCE_EVENT_LABELS = DOCUMENT_AUDIT_COMPLIANCE_EVENT_LABELS;
const FILE_EVENT_LABELS = DOCUMENT_AUDIT_FILE_EVENT_LABELS;

function eventLabel(type: string, map: Record<string, string>): string {
  return map[type] ?? type.replace(/[._]/g, ' ');
}

function actorDisplay(user: { name: string | null; email: string } | null | undefined): string | null {
  if (!user) return null;
  return user.name?.trim() || user.email;
}

function matchesSearch(row: DocumentAuditRow, q: string): boolean {
  const needle = q.toLowerCase();
  return (
    row.documentLabel.toLowerCase().includes(needle) ||
    row.detail.toLowerCase().includes(needle) ||
    row.eventLabel.toLowerCase().includes(needle) ||
    (row.actorName?.toLowerCase().includes(needle) ?? false) ||
    (row.module?.toLowerCase().includes(needle) ?? false) ||
    (row.entityType?.toLowerCase().includes(needle) ?? false)
  );
}

async function loadComplianceEvents(
  from?: Date,
  to?: Date,
): Promise<DocumentAuditRow[]> {
  const where: Prisma.ComplianceItemEventWhereInput = {};
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const rows = await prisma.complianceItemEvent.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 2000,
    include: {
      actor: { select: { name: true, email: true } },
      fileAsset: { select: { id: true, originalName: true, module: true, entityType: true, entityId: true } },
      dossier: { select: { kind: true, subjectType: true, subjectId: true } },
      dossierItem: { select: { label: true, code: true } },
    },
  });

  return rows.map((r) => {
    const payload =
      r.payload && typeof r.payload === 'object' && !Array.isArray(r.payload)
        ? (r.payload as Record<string, unknown>)
        : {};
    const detailParts = [
      r.dossierItem?.label,
      r.dossier?.kind ? labelDocumentAuditDossierKind(r.dossier.kind) : null,
      typeof payload.message === 'string' ? payload.message : null,
    ].filter(Boolean);

    return {
      id: `compliance-${r.id}`,
      occurredAt: r.createdAt.toISOString(),
      source: 'compliance' as const,
      eventType: r.eventType,
      eventLabel: eventLabel(r.eventType, COMPLIANCE_EVENT_LABELS),
      module: r.fileAsset?.module ?? 'conformité',
      entityType: r.fileAsset?.entityType ?? r.dossier?.subjectType ?? null,
      entityId: r.fileAsset?.entityId ?? r.dossier?.subjectId ?? null,
      documentLabel: r.fileAsset?.originalName ?? r.dossierItem?.label ?? r.dossier?.kind ?? '—',
      actorName: actorDisplay(r.actor),
      detail: detailParts.join(' · ') || '—',
      fileAssetId: r.fileAssetId,
    };
  });
}

async function loadFileLifecycleEvents(
  from?: Date,
  to?: Date,
): Promise<DocumentAuditRow[]> {
  const createdWhere: Prisma.FileAssetWhereInput = {};
  const archivedWhere: Prisma.FileAssetWhereInput = { archivedAt: { not: null } };
  const deletedWhere: Prisma.FileAssetWhereInput = { deletedAt: { not: null } };

  if (from || to) {
    const range = (field: 'createdAt' | 'archivedAt' | 'deletedAt') => {
      const clause: Prisma.DateTimeNullableFilter | Prisma.DateTimeFilter = {};
      if (from) clause.gte = from;
      if (to) clause.lte = to;
      return clause;
    };
    createdWhere.createdAt = range('createdAt') as Prisma.DateTimeFilter;
    archivedWhere.archivedAt = range('archivedAt') as Prisma.DateTimeNullableFilter;
    deletedWhere.deletedAt = range('deletedAt') as Prisma.DateTimeNullableFilter;
  }

  const [created, archived, deleted] = await Promise.all([
    prisma.fileAsset.findMany({
      where: createdWhere,
      orderBy: { createdAt: 'desc' },
      take: 1500,
      select: {
        id: true,
        originalName: true,
        module: true,
        entityType: true,
        entityId: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.fileAsset.findMany({
      where: archivedWhere,
      orderBy: { archivedAt: 'desc' },
      take: 1500,
      select: {
        id: true,
        originalName: true,
        module: true,
        entityType: true,
        entityId: true,
        archivedAt: true,
        archiveReason: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
    prisma.fileAsset.findMany({
      where: deletedWhere,
      orderBy: { deletedAt: 'desc' },
      take: 1500,
      select: {
        id: true,
        originalName: true,
        module: true,
        entityType: true,
        entityId: true,
        deletedAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ]);

  const fileRows: DocumentAuditRow[] = [
    ...created.map((f) => ({
      id: `file-created-${f.id}`,
      occurredAt: f.createdAt.toISOString(),
      source: 'file' as const,
      eventType: 'FILE_CREATED',
      eventLabel: eventLabel('FILE_CREATED', FILE_EVENT_LABELS),
      module: f.module,
      entityType: f.entityType,
      entityId: f.entityId,
      documentLabel: f.originalName,
      actorName: actorDisplay(f.createdBy),
      detail: 'Dépôt initial dans la GED',
      fileAssetId: f.id,
    })),
    ...archived
      .filter((f) => f.archivedAt)
      .map((f) => ({
        id: `file-archived-${f.id}`,
        occurredAt: f.archivedAt!.toISOString(),
        source: 'file' as const,
        eventType: 'FILE_ARCHIVED',
        eventLabel: eventLabel('FILE_ARCHIVED', FILE_EVENT_LABELS),
        module: f.module,
        entityType: f.entityType,
        entityId: f.entityId,
        documentLabel: f.originalName,
        actorName: actorDisplay(f.createdBy),
        detail: f.archiveReason?.trim() || 'Archivage gouvernance',
        fileAssetId: f.id,
      })),
    ...deleted
      .filter((f) => f.deletedAt)
      .map((f) => ({
        id: `file-deleted-${f.id}`,
        occurredAt: f.deletedAt!.toISOString(),
        source: 'file' as const,
        eventType: 'FILE_DELETED',
        eventLabel: eventLabel('FILE_DELETED', FILE_EVENT_LABELS),
        module: f.module,
        entityType: f.entityType,
        entityId: f.entityId,
        documentLabel: f.originalName,
        actorName: actorDisplay(f.createdBy),
        detail: 'Déplacement vers la corbeille',
        fileAssetId: f.id,
      })),
  ];

  return fileRows;
}

async function loadVersionEvents(from?: Date, to?: Date): Promise<DocumentAuditRow[]> {
  const where: Prisma.FileAssetVersionWhereInput = { versionNumber: { gt: 1 } };
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }

  const rows = await prisma.fileAssetVersion.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 1500,
    include: {
      createdBy: { select: { name: true, email: true } },
      fileAsset: {
        select: {
          id: true,
          originalName: true,
          module: true,
          entityType: true,
          entityId: true,
        },
      },
    },
  });

  return rows.map((v) => ({
    id: `version-${v.id}`,
    occurredAt: v.createdAt.toISOString(),
    source: 'version' as const,
    eventType: 'FILE_VERSIONED',
    eventLabel: eventLabel('FILE_VERSIONED', FILE_EVENT_LABELS),
    module: v.fileAsset.module,
    entityType: v.fileAsset.entityType,
    entityId: v.fileAsset.entityId,
    documentLabel: v.fileAsset.originalName,
    actorName: actorDisplay(v.createdBy),
    detail: `v${v.versionNumber}${v.changeReason ? ` — ${v.changeReason}` : ''}`,
    fileAssetId: v.fileAsset.id,
  }));
}

export async function listDocumentAuditTrail(
  input: DocumentAuditListInput,
): Promise<DocumentAuditListResult> {
  const dateFrom =
    input.dateFrom ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const dateTo = input.dateTo;

  const [compliance, fileEvents, versionEvents] = await Promise.all([
    loadComplianceEvents(dateFrom, dateTo),
    loadFileLifecycleEvents(dateFrom, dateTo),
    loadVersionEvents(dateFrom, dateTo),
  ]);

  let merged = [...compliance, ...fileEvents, ...versionEvents];

  if (input.source && input.source !== 'all') {
    merged = merged.filter((r) => r.source === input.source);
  }
  if (input.eventType) {
    merged = merged.filter((r) => r.eventType === input.eventType);
  }
  if (input.module) {
    merged = merged.filter((r) => r.module === input.module);
  }
  if (input.entityType) {
    merged = merged.filter((r) => r.entityType === input.entityType);
  }
  if (input.q?.trim()) {
    merged = merged.filter((r) => matchesSearch(r, input.q!.trim()));
  }

  merged.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const stats = {
    total: merged.length,
    compliance: merged.filter((r) => r.source === 'compliance').length,
    fileLifecycle: merged.filter((r) => r.source !== 'compliance').length,
    last7Days: merged.filter((r) => new Date(r.occurredAt) >= weekAgo).length,
    today: merged.filter((r) => new Date(r.occurredAt) >= todayStart).length,
  };

  const modules = [...new Set(merged.map((r) => r.module).filter(Boolean))] as string[];
  const entityTypes = [...new Set(merged.map((r) => r.entityType).filter(Boolean))] as string[];
  const eventTypes = [...new Set(merged.map((r) => r.eventType))].sort();

  const skip = (input.page - 1) * input.limit;
  const paged = merged.slice(skip, skip + input.limit);

  return {
    data: paged,
    stats,
    filters: { modules: modules.sort(), entityTypes: entityTypes.sort(), eventTypes },
    pagination: { page: input.page, limit: input.limit, total: merged.length },
  };
}
