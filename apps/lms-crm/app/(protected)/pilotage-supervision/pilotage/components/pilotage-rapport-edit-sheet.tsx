'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SquarePen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { updatePilotageReport } from '@/lib/pilotage/api';
import type { PilotageRapportRow } from '@repo/api-core';

type Props = {
  report: PilotageRapportRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (row: PilotageRapportRow) => void;
};

export function PilotageRapportEditSheet({ report, open, onOpenChange, onSaved }: Props) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (report) {
      setLabel(report.label);
      setDescription(report.description);
    }
  }, [report]);

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!report) throw new Error('Rapport manquant');
      return updatePilotageReport(report.id, { label, description });
    },
    onSuccess: (data) => {
      toast.success('Rapport mis à jour');
      onSaved?.(data.row);
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message || 'Mise à jour impossible'),
  });

  if (!report) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-center gap-2 text-base">
            <SquarePen className="size-4 text-muted-foreground" />
            Éditer le rapport
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="rapport-label">Titre affiché</Label>
            <Input
              id="rapport-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nom du rapport"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rapport-desc">Description</Label>
            <Textarea
              id="rapport-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Notes ou contexte pour ce rapport"
            />
          </div>
        </SheetBody>

        <SheetFooter className="gap-2 border-t border-border px-5 py-4 sm:flex-row">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            className="flex-1"
            disabled={!label.trim() || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
