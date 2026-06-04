'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
};

export type Equipment = {
  id: string;
  serialNumber: string;
  label: string;
  type?: string;
  status?: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE' | string;
  assignedSite?: { id?: string; name?: string } | null;
};

type InventaireListPayload = {
  data: Equipment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type MaintenanceRecord = {
  id: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
};

type StockMovement = {
  id: string;
  type: 'IN' | 'OUT' | 'TRANSFER';
  quantity: number;
  movementDate: string;
  Equipment?: { label?: string } | null;
};

const EMPTY_INVENTAIRE: InventaireListPayload = { data: [] };
const EMPTY_MAINTENANCE: ApiEnvelope<MaintenanceRecord[]> = { success: true, data: [] };
const EMPTY_MOVEMENTS: ApiEnvelope<StockMovement[]> = { success: true, data: [] };

async function safeGet<T>(url: string, fallback: ApiEnvelope<T>): Promise<ApiEnvelope<T>> {
  try {
    const response = await apiFetch(url);
    if (!response.ok) return fallback;
    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return json as ApiEnvelope<T>;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export type EquipmentAffectationRow = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  startDate: string;
  endDate: string;
  clientSiteName: string | null;
  equipmentId: string;
  equipmentLabel: string;
  equipmentSerial: string;
  equipmentAvatar?: string | null;
  trainerName?: string | null;
};

export function useRecentEquipmentAffectations(limit = 5) {
  return useQuery({
    queryKey: ['equipment-recent-affectations', limit],
    queryFn: async () => {
      try {
        const response = await apiFetch(
          `/api/sections/gestion-ressources/equipements/affectations?limit=${limit}`,
        );
        if (!response.ok) return [] as EquipmentAffectationRow[];
        const json = await response.json();
        const payload = json?.data;
        if (payload && Array.isArray(payload.data)) {
          return payload.data as EquipmentAffectationRow[];
        }
        if (Array.isArray(payload)) {
          return payload as EquipmentAffectationRow[];
        }
        return [];
      } catch {
        return [];
      }
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useEquipments() {
  return useQuery({
    queryKey: ['equipments-list'],
    queryFn: async () => {
      try {
        const response = await apiFetch(
          '/api/sections/gestion-ressources/equipements/inventaire?limit=50',
        );
        if (!response.ok) return EMPTY_INVENTAIRE;
        const json = await response.json();
        const payload = json?.data;
        if (payload && Array.isArray(payload.data)) {
          return payload as InventaireListPayload;
        }
        if (Array.isArray(payload)) {
          return { data: payload as Equipment[] };
        }
        return EMPTY_INVENTAIRE;
      } catch {
        return EMPTY_INVENTAIRE;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useMaintenanceRecords() {
  return useQuery({
    queryKey: ['equipments-maintenance'],
    queryFn: () =>
      safeGet<MaintenanceRecord[]>(
        '/api/sections/gestion-ressources/equipements/maintenance?limit=100',
        EMPTY_MAINTENANCE,
      ),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['equipments-stock-movements'],
    queryFn: () =>
      safeGet<StockMovement[]>(
        '/api/sections/gestion-ressources/equipements/mouvements?limit=100',
        EMPTY_MOVEMENTS,
      ),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
