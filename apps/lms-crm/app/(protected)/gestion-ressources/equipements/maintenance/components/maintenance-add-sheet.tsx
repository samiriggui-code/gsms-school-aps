'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { VIE_SCOLAIRE_SHEET_LARGE_1000 } from '../../../constants/sheet-shell-classes';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  EquipmentCategoryUnitPicker,
  type CatalogCategoryOption,
  type CatalogUnitOption,
} from '../../components/equipment-category-unit-picker';
import { EquipmentStatus } from '@/app/models/equipment';
import { Wrench, Loader2 } from 'lucide-react';
import { formatEquipmentUnitReference } from '@/lib/equipment-catalog';

export function MaintenanceAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<CatalogCategoryOption | null>(null);
  const [unit, setUnit] = useState<CatalogUnitOption | null>(null);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');

  const reset = () => {
    setCategory(null);
    setUnit(null);
    setTitle('');
    setNotes('');
    setScheduledDate('');
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!unit?.id) throw new Error('Sélectionnez une pièce.');
      const res = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire/${unit.id}/maintenance`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || 'Intervention atelier',
            notes: notes.trim() || null,
            scheduledDate: scheduledDate || null,
          }),
        },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || 'Intervention impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['equipment-maintenance-list'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-maintenance-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-maintenance-stock'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-catalog-units-picker'] });
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Pièce envoyée en maintenance</AlertTitle>
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

  const canSubmit = Boolean(unit?.id);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE_1000}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Nouvelle intervention
          </SheetTitle>
          <SheetDescription className="sr-only">
            Choisir une catégorie, une pièce et décrire l&apos;intervention.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="border-b border-border px-5 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <Wrench className="size-5 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Catégorie → pièce → intervention
                </p>
                <p className="text-xs text-muted-foreground">
                  La fiche produit existe déjà : vous ciblez une unité précise (ex. pièce 3/3).
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
                unitStatusFilter={[EquipmentStatus.AVAILABLE, EquipmentStatus.IN_USE]}
              />

              {unit && (
                <section className="space-y-4 rounded-lg border border-border bg-muted/10 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    3. Intervention
                  </h4>
                  <div className="space-y-2">
                    <Label htmlFor="maint-title">Libellé</Label>
                    <Input
                      id="maint-title"
                      placeholder="Ex. Révision annuelle"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maint-date">Date prévue (optionnel)</Label>
                    <Input
                      id="maint-date"
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maint-notes">Notes</Label>
                    <Textarea
                      id="maint-notes"
                      rows={3}
                      placeholder="Détails atelier, pièces à commander…"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="font-mono">
                      {formatEquipmentUnitReference(unit.serialNumber, unit.label)}
                    </Badge>
                    <span>passera en statut maintenance.</span>
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
            {mutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
            Ouvrir l&apos;intervention
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
