'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';

export function SallesPlanning() {
  const { data, isLoading } = useQuery({
    queryKey: ['venue-rooms-planning'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/gestion-ressources/equipements/salles/planning',
      );
      if (!res.ok) throw new Error('Planning indisponible');
      const json = await res.json();
      return json?.data?.rooms ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <Loader2 className="inline size-4 animate-spin mr-2" />
        Chargement du planning…
      </div>
    );
  }

  const rooms = (data ?? []) as Array<{
    id: string;
    name: string;
    shortCode: string | null;
    sessions: Array<{
      id: string;
      label: string;
      formationName: string | null;
      startDate: string | null;
      endDate: string | null;
      trainerName: string | null;
    }>;
  }>;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <div key={room.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div>
            <h3 className="font-bold">{room.name}</h3>
            {room.shortCode ? (
              <p className="text-xs text-muted-foreground">{room.shortCode}</p>
            ) : null}
          </div>
          {room.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune session sur la période</p>
          ) : (
            <ul className="space-y-2">
              {room.sessions.map((s) => (
                <li key={s.id} className="rounded-lg bg-muted/30 px-3 py-2 text-xs">
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-muted-foreground">{s.formationName || 'Formation'}</div>
                  <div className="text-muted-foreground">
                    {s.startDate ? formatDateTime(s.startDate) : '—'} →{' '}
                    {s.endDate ? formatDateTime(s.endDate) : '—'}
                  </div>
                  {s.trainerName ? (
                    <div className="text-muted-foreground">Formateur : {s.trainerName}</div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
