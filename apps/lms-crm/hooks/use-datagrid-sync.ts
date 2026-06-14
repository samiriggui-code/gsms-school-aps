'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';

export type DatagridSyncPreset =
  | 'rhAbsences'
  | 'rhPersonnel'
  | 'rhTeams'
  | 'rhConformite'
  | 'equipements'
  | 'compagnieDocuments'
  | 'vieScolaire'
  | 'candidats'
  | 'finance';

type UseDatagridSyncOptions = {
  preset: DatagridSyncPreset;
  queryKeys?: readonly (readonly unknown[])[];
};

export function useDatagridSync({ preset, queryKeys = [] }: UseDatagridSyncOptions) {
  const queryClient = useQueryClient();
  const [isSyncing, setIsSyncing] = useState(false);

  const sync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const response = await apiFetch('/api/common/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          (payload as { error?: string }).error || 'Synchronisation impossible.';
        throw new Error(message);
      }

      for (const key of queryKeys) {
        await queryClient.invalidateQueries({ queryKey: [...key] });
      }

      toast.success('Données synchronisées');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Échec de la synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }, [preset, queryClient, queryKeys]);

  return { isSyncing, sync };
}
