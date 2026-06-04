import { apiFetch } from '@/lib/api';

/** Aligné sur l’UI RH / journal d’activité (création, màj, suppression). */
export type RhActivityAction = 'create' | 'update' | 'delete';

export interface RhActivityHistoryEntry {
  id: string;
  action: RhActivityAction;
  label: string;
  description: string;
  metadata: Record<string, unknown> | string | null;
  createdAt: string;
  ipAddress?: string | null;
  entityId?: string | null;
  entityType?: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export interface RhActivityHistorySummary {
  /** Total des logs IAM pour cet utilisateur (pagination côté API). */
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

export interface RhActivityHistoryResponse {
  data: RhActivityHistoryEntry[];
  summary: RhActivityHistorySummary;
}

function classifyAction(event: string | null | undefined): RhActivityAction {
  const e = (event || '').toLowerCase();
  if (e.includes('delete') || e.includes('remove')) return 'delete';
  if (e.includes('create') || e.includes('register') || e.includes('signup')) return 'create';
  return 'update';
}

function formatLogDescription(log: {
  entityType?: string | null;
  entityId?: string | null;
  ipAddress?: string | null;
  meta?: string | null;
  description?: string | null;
}): string {
  const parts: string[] = [];
  if (log.entityType) parts.push(String(log.entityType));
  if (log.entityId) parts.push(String(log.entityId).slice(0, 12));
  if (log.ipAddress) parts.push(`IP ${log.ipAddress}`);
  const meta = log.meta?.trim();
  if (meta) parts.push(meta.length > 120 ? `${meta.slice(0, 120)}…` : meta);
  return parts.length > 0 ? parts.join(' · ') : log.description?.trim() || '—';
}

type SystemLogRow = {
  id: string;
  userId?: string;
  createdAt: string | Date;
  entityId?: string | null;
  entityType?: string | null;
  event?: string | null;
  description?: string | null;
  ipAddress?: string | null;
  meta?: string | null;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  } | null;
};

/**
 * Mappe des lignes `SystemLog` (API accès ou Prisma) vers le format du journal RH.
 */
export function mapSystemLogsToRhActivity(
  logs: SystemLogRow[],
  totalAll: number,
): RhActivityHistoryResponse {
  let createCount = 0;
  let updateCount = 0;
  let deleteCount = 0;

  const data: RhActivityHistoryEntry[] = logs.map((log) => {
    const action = classifyAction(log.event);
    if (action === 'create') createCount += 1;
    else if (action === 'delete') deleteCount += 1;
    else updateCount += 1;

    const createdAt =
      typeof log.createdAt === 'string'
        ? log.createdAt
        : log.createdAt instanceof Date
          ? log.createdAt.toISOString()
          : new Date(String(log.createdAt)).toISOString();

    return {
      id: log.id,
      action,
      label: (log.description || log.event || 'Événement').trim(),
      description: formatLogDescription(log),
      metadata: log.meta ?? null,
      createdAt,
      ipAddress: log.ipAddress ?? null,
      entityId: log.entityId ?? null,
      entityType: log.entityType ?? null,
      actor: log.user
        ? {
            id: log.user.id,
            name: log.user.name?.trim() || log.user.email,
            email: log.user.email,
            avatar: log.user.avatar ?? null,
          }
        : null,
    };
  });

  return {
    data,
    summary: {
      total: totalAll,
      createCount,
      updateCount,
      deleteCount,
    },
  };
}

/**
 * Données réelles : `SystemLog` via l’API accès (l’ancien `.../collaborateurs/:id/history` renvoyait une liste vide).
 */
export async function fetchRhActivityHistoryFromIam(
  userId: string,
  limit: number,
): Promise<RhActivityHistoryResponse> {
  const response = await apiFetch(
    `/api/sections/securite-configuration/acces/users/${userId}/logs?page=1&limit=${limit}`,
  );

  if (!response.ok) {
    throw new Error("Impossible de charger l'historique d'activité.");
  }

  const json = (await response.json()) as {
    data?: SystemLogRow[];
    pagination?: { total?: number; page?: number; limit?: number };
  };

  const logs = Array.isArray(json.data) ? json.data : [];
  const totalAll = json.pagination?.total ?? logs.length;

  return mapSystemLogsToRhActivity(logs, totalAll);
}
