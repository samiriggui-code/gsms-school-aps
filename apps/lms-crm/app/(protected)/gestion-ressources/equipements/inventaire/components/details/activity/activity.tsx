'use client';

import { AlertCircle, History, Settings, Trash2, PackagePlus } from 'lucide-react';
import { TimelineItem } from './timeline-item';
import { Equipment } from '@/app/models/equipment';
import {
  EquipmentHistoryEntry,
  useEquipmentHistory,
} from '../../../hooks/use-equipment-history';

function getEntryVisual(action: string) {
  switch (action) {
    case 'create':
      return { icon: PackagePlus, className: 'text-green-500' };
    case 'update':
      return { icon: Settings, className: 'text-orange-500' };
    case 'delete':
      return { icon: Trash2, className: 'text-red-500' };
    default:
      return { icon: History, className: 'text-gray-500' };
  }
}

function formatEntryMeta(entry: EquipmentHistoryEntry) {
  const parts = [
    new Date(entry.createdAt).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  ];

  if (entry.actor?.name) {
    parts.push(`Par ${entry.actor.name}`);
  }

  if (entry.ipAddress && entry.ipAddress !== 'unknown') {
    parts.push(`IP: ${entry.ipAddress}`);
  }

  return parts.join(' • ');
}

export function ActivityPage({ equipment }: { equipment: Equipment }) {
  const { entries, isLoading, isError } = useEquipmentHistory(
    equipment.id,
    { limit: 20 },
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex items-start gap-3">
            <div className="size-10 rounded-md border border-border bg-muted/50 animate-pulse shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 w-56 rounded bg-muted/50 animate-pulse" />
              <div className="h-3 w-72 rounded bg-muted/40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        Impossible de charger l'historique de l'équipement.
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted/10 px-4 py-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-border bg-background">
          <AlertCircle className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Aucun evenement historise pour cet équipement.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Les prochaines creations, modifications et suppressions apparaitront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry: EquipmentHistoryEntry, index: number) => {
        const visual = getEntryVisual(entry.action);

        return (
          <TimelineItem
            key={entry.id}
            icon={visual.icon}
            className={visual.className}
            line={index < entries.length - 1}
          >
            <div className="flex flex-col gap-1">
              <div className="text-sm font-semibold text-gray-900">
                {entry.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {entry.description}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatEntryMeta(entry)}
              </div>
            </div>
          </TimelineItem>
        );
      })}
    </div>
  );
}
