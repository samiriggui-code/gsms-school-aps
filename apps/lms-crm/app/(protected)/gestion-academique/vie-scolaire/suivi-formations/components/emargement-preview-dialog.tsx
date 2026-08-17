'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RhEmargementSessionReport,
  type EmargementReportData,
} from '@/components/reports/templates/rh-emargement-session-report';

export function EmargementPreviewDialog({
  open,
  onOpenChange,
  data,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: EmargementReportData | null;
  isLoading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-[min(98vw,1100px)] gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-6 py-4">
          <DialogTitle>Aperçu feuille d&apos;émargement</DialogTitle>
          <DialogDescription>
            Même modèle que le PDF généré — format paysage, en-tête organisme, KPIs session et liste
            des stagiaires.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[calc(95vh-8.5rem)] overflow-y-auto bg-slate-100/80 px-4 py-5 print:max-h-none print:overflow-visible print:bg-white print:p-0">
          {isLoading ? (
            <p className="py-16 text-center text-sm text-muted-foreground">Préparation de l&apos;aperçu…</p>
          ) : data ? (
            <div className="mx-auto rounded-lg border border-slate-200 bg-white p-6 shadow-sm print:border-0 print:p-0 print:shadow-none">
              <RhEmargementSessionReport data={data} />
            </div>
          ) : null}
        </DialogBody>
        <DialogFooter className="emargement-no-print gap-2 border-t border-border/60 px-6 py-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            disabled={!data || isLoading}
            onClick={() => window.print()}
          >
            <Printer className="size-4" />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
