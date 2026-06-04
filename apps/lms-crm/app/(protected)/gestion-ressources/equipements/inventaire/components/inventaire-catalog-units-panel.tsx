'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/helpers';
import { getInventaireStatusProps } from '../constants/status';
import { Loader2, MapPin, Package } from 'lucide-react';
import type { EquipmentStatus } from '@/app/models/equipment';
import { formatEquipmentUnitReference } from '@/lib/equipment-catalog';

type CatalogUnit = {
  id: string;
  serialNumber: string;
  label: string;
  status: EquipmentStatus;
  unitIndex: number | null;
  unitLabel: string | null;
  sessions?: Array<{
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location: string | null;
  }>;
  maintenanceItems?: Array<{
    id: string;
    status: string;
    title: string | null;
    scheduledDate: string | null;
  }>;
};

export function InventaireCatalogUnitsPanel({
  catalogLabel,
  filterStatus,
  emptyMessage,
}: {
  catalogLabel: string;
  filterStatus?: EquipmentStatus | EquipmentStatus[];
  emptyMessage: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['equipment-catalog-units', catalogLabel],
    queryFn: async () => {
      const params = new URLSearchParams({
        mode: 'catalog-units',
        label: catalogLabel,
      });
      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`,
      );
      if (!response.ok) throw new Error('Chargement des pièces impossible');
      const json = await response.json();
      return json.data as { units: CatalogUnit[] };
    },
    enabled: Boolean(catalogLabel),
  });

  const statuses = filterStatus
    ? Array.isArray(filterStatus)
      ? filterStatus
      : [filterStatus]
    : null;

  const units = (data?.units ?? []).filter((u) =>
    statuses ? statuses.includes(u.status) : true,
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {units.map((unit) => {
        const statusProps = getInventaireStatusProps(unit.status);
        const session = unit.sessions?.[0];

        return (
          <div
            key={unit.id}
            className="border border-border/60 rounded-xl p-4 bg-card hover:border-primary/30 transition-colors"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-10 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                  <Package className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm text-foreground font-mono tracking-tight">
                    {formatEquipmentUnitReference(unit.serialNumber, unit.label)}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {unit.label}
                  </p>
                </div>
              </div>
              <Badge
                variant={statusProps.variant as 'success' | 'warning' | 'primary' | 'outline'}
                appearance="light"
                size="sm"
                className="font-bold uppercase text-[9px]"
              >
                {statusProps.label}
              </Badge>
            </div>

            {unit.status === 'IN_USE' && session && (
              <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 text-xs">
                <p className="font-bold text-foreground uppercase tracking-tight truncate">
                  {session.title}
                </p>
                <p className="text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="size-3 shrink-0" />
                  {session.location || 'Salle non renseignée'}
                </p>
                <p className="text-muted-foreground">
                  {formatDateTime(session.startDate)} → {formatDateTime(session.endDate)}
                </p>
              </div>
            )}

            {unit.status === 'MAINTENANCE' && unit.maintenanceItems?.[0] && (
              <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {unit.maintenanceItems[0].title || 'Maintenance en cours'}
                </span>
                {unit.maintenanceItems[0].scheduledDate && (
                  <span className="ml-2">
                    — {formatDateTime(unit.maintenanceItems[0].scheduledDate)}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
