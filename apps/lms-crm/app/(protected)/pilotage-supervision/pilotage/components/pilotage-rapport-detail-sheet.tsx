'use client';

import { Download, ExternalLink, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/helpers';
import { moduleLabelFromKey } from '@/lib/pilotage/modules';
import { pilotageReportDownloadUrl } from '@/lib/pilotage/api';
import type { PilotageRapportRow } from '@repo/api-core';
import { PilotageReportActorCell } from './pilotage-report-actor-cell';

type Props = {
  report: PilotageRapportRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatBytes(size: number | null) {
  if (!size) return '—';
  if (size < 1024) return `${size} o`;
  return `${(size / 1024).toFixed(1)} Ko`;
}

export function PilotageRapportDetailSheet({ report, open, onOpenChange }: Props) {
  if (!report) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border px-5 py-4 text-start">
          <SheetTitle className="flex items-start gap-2 text-base leading-snug">
            <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
            {report.label}
          </SheetTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" appearance="light" className="font-mono text-[10px] uppercase">
              {report.referenceCode}
            </Badge>
            <Badge variant="outline" appearance="light" className="text-[10px] uppercase">
              {report.format}
            </Badge>
            <Badge variant="success" appearance="light" className="text-[10px] uppercase">
              Généré
            </Badge>
          </div>
        </SheetHeader>

        <SheetBody className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{report.description || '—'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Identifiant technique</p>
              <p className="break-all font-mono text-[10px] text-muted-foreground">{report.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Module</p>
              <p className="font-medium">{moduleLabelFromKey(report.moduleKey)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Période</p>
              <p className="font-medium">{report.periodLabel}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Fichier</p>
              <p className="truncate font-medium">{report.fileName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taille</p>
              <p className="font-medium">{formatBytes(report.fileSize)}</p>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/15 p-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Généré par</p>
              <PilotageReportActorCell actor={report.createdBy} at={report.generatedAt} />
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Édité par</p>
              <PilotageReportActorCell actor={report.editedBy} at={report.editedAt} emptyLabel="Jamais édité" />
            </div>
          </div>
        </SheetBody>

        <SheetFooter className="gap-2 border-t border-border px-5 py-4 sm:flex-col">
          {report.htmlPreviewUrl ? (
            <Button className="w-full" asChild>
              <a href={report.htmlPreviewUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" />
                Visualiser le rapport HTML
              </a>
            </Button>
          ) : null}
          <Button variant="outline" className="w-full" asChild>
            <a href={pilotageReportDownloadUrl(report.id)} download={report.fileName ?? undefined}>
              <Download className="size-4" />
              Télécharger le fichier
            </a>
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
