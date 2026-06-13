'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../constants/sheet-shell-classes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  EquipmentCategoryUnitPicker,
  type CatalogCategoryOption,
  type CatalogUnitOption,
} from '../../components/equipment-category-unit-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { formatEquipmentUnitReference } from '@/lib/equipment-catalog';

type FormationSessionOption = {
  id: string;
  label: string;
  startDate: string | null;
  endDate: string | null;
  venueRoomName: string | null;
};

export function AffectationAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<CatalogCategoryOption | null>(null);
  const [unit, setUnit] = useState<CatalogUnitOption | null>(null);
  const [sessionId, setSessionId] = useState('');

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['formation-sessions-picker'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/gestion-academique/vie-scolaire/sessions?limit=80',
      );
      if (!res.ok) return [];
      const json = await res.json();
      const items = json?.data?.items ?? json?.data ?? [];
      if (!Array.isArray(items)) return [];
      return items.map((s: Record<string, unknown>) => ({
        id: String(s.id),
        label: String(
          s.sessionSubtitle ||
            s.formationName ||
            s.dateDisplayLabel ||
            'Session',
        ),
        startDate: (s.startDate as string) ?? null,
        endDate: (s.endDate as string) ?? null,
        venueRoomName:
          (s.venueRoom as { name?: string })?.name ??
          (s.location as string) ??
          null,
      })) as FormationSessionOption[];
    },
    enabled: open,
  });

  const reset = () => {
    setCategory(null);
    setUnit(null);
    setSessionId('');
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!unit?.id || !sessionId) {
        throw new Error('Sélectionnez une pièce et une session.');
      }
      const res = await apiFetch(
        '/api/sections/gestion-ressources/equipements/affectations/assign',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ equipmentId: unit.id, sessionId }),
        },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || 'Affectation impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment-affectations-list'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-affectations-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-catalog-units-picker'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Pièce affectée à la session</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
      reset();
      onOpenChange(false);
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

  const canSubmit = Boolean(unit?.id && sessionId);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Nouvelle affectation
          </SheetTitle>
          <SheetDescription className="sr-only">
            Choisir une catégorie, une pièce disponible et une session de formation.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="border-b border-border px-5 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <CalendarPlus className="size-5 text-primary" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Catégorie → pièce → session
                </p>
                <p className="text-xs text-muted-foreground">
                  La fiche produit existe déjà : vous mobilisez uniquement une unité (ex. pièce 3/3).
                </p>
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="px-5 py-5 space-y-6">
              <EquipmentCategoryUnitPicker
                selectedCategoryKey={category?.catalogKey ?? null}
                onCategoryChange={setCategory}
                selectedUnitId={unit?.id ?? null}
                onUnitChange={setUnit}
                unitStatusFilter="AVAILABLE"
              />

              {unit && (
                <section className="space-y-3 rounded-lg border border-border bg-muted/10 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    3. Session de formation
                  </h4>
                  {sessionsLoading ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : (
                    <Select value={sessionId} onValueChange={setSessionId}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Choisir une session…" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                            {s.venueRoomName ? ` — ${s.venueRoomName}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono">
                      {formatEquipmentUnitReference(unit.serialNumber, unit.label)}
                    </Badge>
                    <span>sera réservée sur la session choisie.</span>
                  </div>
                </section>
              )}
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t p-5 gap-2 bg-background shrink-0">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="ml-auto font-bold"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : null}
            Affecter la pièce
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
