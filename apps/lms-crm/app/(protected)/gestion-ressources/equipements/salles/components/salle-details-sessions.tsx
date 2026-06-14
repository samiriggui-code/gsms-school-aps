'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import type { VenueRoomSessionRow } from '../types';

export function SalleDetailsSessions({ roomId }: { roomId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['venue-room-detail', roomId],
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${roomId}`,
      );
      if (!res.ok) throw new Error('Chargement impossible');
      const json = await res.json();
      return (json?.data?.sessions ?? []) as VenueRoomSessionRow[];
    },
    enabled: Boolean(roomId),
  });

  if (isLoading) {
    return (
      <div className="py-10 text-center text-muted-foreground text-sm">
        <Loader2 className="inline size-4 animate-spin mr-2" />
        Chargement des sessions…
      </div>
    );
  }

  const sessions = data ?? [];

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Aucune session planifiée sur cette salle.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((s) => (
        <li key={s.id} className="rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm">
          <div className="font-semibold">{s.label}</div>
          <div className="text-muted-foreground text-xs mt-0.5">
            {s.formationName || 'Formation'}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {s.startDate ? formatDateTime(s.startDate) : '—'} →{' '}
            {s.endDate ? formatDateTime(s.endDate) : '—'}
          </div>
          {s.trainerName ? (
            <div className="text-xs text-muted-foreground mt-1">Formateur : {s.trainerName}</div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
