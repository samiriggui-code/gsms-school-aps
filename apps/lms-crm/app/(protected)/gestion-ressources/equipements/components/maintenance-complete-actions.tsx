'use client';

import { PackageCheck, Ban } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type MaintenanceCompleteActionsProps = {
  maintenanceId?: string | null;
  equipmentId?: string | null;
  equipmentStatus?: string | null;
  disabled?: boolean;
  invalidateKeys?: string[][];
  size?: 'sm' | 'default';
  layout?: 'buttons' | 'dropdown';
  onComplete?: () => void;
};

export function MaintenanceCompleteActions({
  maintenanceId,
  equipmentId,
  equipmentStatus,
  disabled,
  invalidateKeys = [],
  size = 'sm',
  layout = 'dropdown',
  onComplete,
}: MaintenanceCompleteActionsProps) {
  const queryClient = useQueryClient();

  const canComplete =
    Boolean(maintenanceId) ||
    (Boolean(equipmentId) && equipmentStatus === 'MAINTENANCE');

  const completeMutation = useMutation({
    mutationFn: async (outcome: 'restock' | 'out_of_service') => {
      if (maintenanceId) {
        const res = await apiFetch(
          `/api/sections/gestion-ressources/equipements/inventaire/maintenance/${maintenanceId}/complete`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ outcome }),
          },
        );
        if (!res.ok) {
          const j = await res.json();
          throw new Error(j?.error?.message || j?.message || 'Clôture impossible');
        }
        return res.json();
      }

      if (!equipmentId) throw new Error('Aucune intervention ouverte.');

      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire/${equipmentId}/maintenance/complete-open`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outcome }),
        },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || j?.message || 'Clôture impossible');
      }
      return res.json();
    },
    onSuccess: (_data, outcome) => {
      for (const key of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
      toast.success(
        outcome === 'out_of_service'
          ? 'Intervention clôturée — équipement classé hors service'
          : 'Intervention clôturée — pièce remise en stock',
      );
      onComplete?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!canComplete) return null;

  const pending = completeMutation.isPending;

  if (layout === 'buttons') {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size={size}
          className="gap-1.5 font-semibold"
          disabled={disabled || pending}
          onClick={() => completeMutation.mutate('restock')}
        >
          <PackageCheck className="size-4" />
          Fin intervention — remise en stock
        </Button>
        <Button
          type="button"
          variant="destructive"
          size={size}
          className="gap-1.5 font-semibold"
          disabled={disabled || pending}
          onClick={() => completeMutation.mutate('out_of_service')}
        >
          <Ban className="size-4" />
          HS — désaffectation
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className="h-8 gap-1 text-xs"
          disabled={disabled || pending}
        >
          <PackageCheck className="size-3.5" />
          Clôturer
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          className="gap-2"
          onClick={() => completeMutation.mutate('restock')}
        >
          <PackageCheck className="size-3.5" />
          Retour en stock
        </DropdownMenuItem>
        <DropdownMenuItem
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => completeMutation.mutate('out_of_service')}
        >
          <Ban className="size-3.5" />
          HS — non réparable
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
