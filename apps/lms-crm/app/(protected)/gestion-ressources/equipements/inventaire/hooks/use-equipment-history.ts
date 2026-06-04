'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { apiFetch } from '@/lib/api';

export interface EquipmentHistoryEntry {
  id: string;
  action: string;
  label: string;
  description: string;
  metadata: any;
  createdAt: string;
  ipAddress?: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar?: string | null;
  } | null;
}

export interface EquipmentHistorySummary {
  total: number;
  createCount: number;
  updateCount: number;
  deleteCount: number;
}

interface EquipmentHistoryResponse {
  data: EquipmentHistoryEntry[];
  summary: EquipmentHistorySummary;
}

const EMPTY_SUMMARY: EquipmentHistorySummary = {
  total: 0,
  createCount: 0,
  updateCount: 0,
  deleteCount: 0,
};

async function fetchEquipmentHistory(
  equipmentId: string,
  limit: number,
) {
  // NOTE: This might need a real endpoint later
  const response = await apiFetch(
    `/api/sections/gestion-ressources/equipements/inventaire/${equipmentId}/history?limit=${limit}`,
  );

  if (!response.ok) {
    // Return empty if endpoint doesn't exist yet to avoid crashing UI
    return { success: true, data: { data: [], summary: EMPTY_SUMMARY } };
  }

  return response.json();
}

export function useEquipmentHistory(
  equipmentId?: string,
  options?: { limit?: number; enabled?: boolean },
) {
  const limit = options?.limit ?? 20;
  const enabled = Boolean(options?.enabled ?? true) && Boolean(equipmentId);

  const query = useQuery({
    queryKey: ['equipment-history', equipmentId, limit],
    queryFn: () => fetchEquipmentHistory(equipmentId!, limit),
    enabled,
  });

  return {
    ...query,
    entries: (query.data as any)?.data?.data ?? [],
    summary: (query.data as any)?.data?.summary ?? EMPTY_SUMMARY,
  };
}
