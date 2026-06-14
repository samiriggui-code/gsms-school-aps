'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { VenueRoomRow } from '../types';

export function SalleActiveToggle({
  room,
  onUpdated,
}: {
  room: VenueRoomRow;
  onUpdated?: (item: VenueRoomRow) => void;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${room.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || 'Mise à jour impossible');
      }
      return res.json();
    },
    onSuccess: (json) => {
      const item = json?.data?.item as VenueRoomRow | undefined;
      if (item) onUpdated?.(item);
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-list'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      void queryClient.invalidateQueries({ queryKey: ['topbar-notifications'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>
              {item?.isActive ? 'Salle réactivée' : 'Salle désactivée'}
            </AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
    onError: (e: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{e.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  return (
    <div className="flex flex-col items-end gap-1.5 shrink-0 text-right max-w-[200px]">
      <div className="flex items-center gap-2.5">
        <Label
          htmlFor={`salle-active-${room.id}`}
          className="text-xs font-bold text-foreground cursor-pointer"
        >
          Salle active
        </Label>
        <Switch
          id={`salle-active-${room.id}`}
          checked={room.isActive}
          disabled={mutation.isPending}
          onCheckedChange={(checked) => mutation.mutate(checked)}
        />
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">
        Désactiver si la salle n&apos;est plus réservable.
      </p>
    </div>
  );
}
