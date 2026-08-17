'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../../constants/sheet-shell-classes';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderCircle } from 'lucide-react';

export function SalleBookingAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [venueRoomId, setVenueRoomId] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'STAFF_MEETING' | 'INFO_MEETING' | 'OTHER'>('STAFF_MEETING');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [notes, setNotes] = useState('');

  const { data: rooms = [] } = useQuery({
    queryKey: ['venue-rooms-simple'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/equipements/salles');
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json?.data) ? json.data : [];
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/equipements/salles/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueRoomId,
          title,
          kind,
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          notes: notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || j?.message || 'Réservation impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Réservation enregistrée');
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-list'] });
      onOpenChange(false);
      setTitle('');
      setNotes('');
      setStartAt('');
      setEndAt('');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader>
          <SheetTitle>Réservation ponctuelle de salle</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4 py-4">
          <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Réunion / événement ponctuel</strong> : la salle fournit son
            mobilier fixe (chaises, tables, VP). Réservez uniquement du matériel <strong>mobile</strong> si besoin
            (micros, caméras, kits déplacement) — la réservation d&apos;équipement sur ce type d&apos;événement
            sera disponible dans une prochaine itération.
          </div>
          <div className="space-y-2">
            <Label>Salle</Label>
            <Select value={venueRoomId} onValueChange={setVenueRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une salle" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room: { id: string; name: string }) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="STAFF_MEETING">Réunion du personnel</SelectItem>
                <SelectItem value="INFO_MEETING">Réunion d&apos;information</SelectItem>
                <SelectItem value="OTHER">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Réunion équipe pédagogique"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Début</Label>
              <Input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fin</Label>
              <Input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={mutation.isPending || !venueRoomId || !title.trim() || !startAt || !endAt}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin mr-2" />
            ) : null}
            Réserver
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
