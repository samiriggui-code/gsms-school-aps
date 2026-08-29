'use client';

import { ExternalLink, FileText, ScanLine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SlotDocumentsBadgeData = {
  /** Liste journal : indique un modèle sans URL. */
  hasTemplate?: boolean;
  templatePdf: { id: string; url: string; originalName: string } | null;
  archivedTemplateCount?: number;
  signedScanCount: number;
  signedScans?: Array<{
    id: string;
    url: string;
    originalName: string;
    scanIndex: number | null;
  }>;
};

type Variant = 'compact' | 'detailed';

export function SuiviSlotDocumentsBadges({
  data,
  variant = 'compact',
  className,
}: {
  data: SlotDocumentsBadgeData;
  variant?: Variant;
  className?: string;
}) {
  const hasTemplate = data.hasTemplate ?? Boolean(data.templatePdf);
  const scanCount = data.signedScanCount;
  const archived = data.archivedTemplateCount ?? 0;

  if (!hasTemplate && scanCount === 0 && archived === 0) {
    return (
      <span className={cn('text-xs text-muted-foreground', className)}>Aucun document</span>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
        {hasTemplate ? (
          <Badge variant="secondary" appearance="light" className="gap-1 text-[10px]">
            <FileText className="size-3" />
            Modèle PDF
          </Badge>
        ) : null}
        {scanCount > 0 ? (
          <Badge variant="success" appearance="outline" className="gap-1 text-[10px]">
            <ScanLine className="size-3" />
            {scanCount} scan{scanCount > 1 ? 's' : ''}
          </Badge>
        ) : null}
        {archived > 0 ? (
          <Badge variant="secondary" appearance="outline" className="text-[10px]">
            +{archived} arch.
          </Badge>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border/60 bg-muted/20 p-3 text-sm space-y-2',
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Dossier créneau
      </p>
      <div className="flex flex-wrap gap-2">
        {hasTemplate && data.templatePdf ? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
            <a href={data.templatePdf.url} target="_blank" rel="noopener noreferrer">
              <FileText className="size-3.5" />
              Modèle PDF actif
              <ExternalLink className="size-3 opacity-60" />
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Pas de modèle PDF — générez la feuille.</span>
        )}
        {scanCount > 0 ? (
          <Badge variant="success" appearance="outline" className="h-8 gap-1 px-2.5 text-xs">
            <ScanLine className="size-3.5" />
            {scanCount} scan{scanCount > 1 ? 's' : ''} signé{scanCount > 1 ? 's' : ''}
          </Badge>
        ) : (
          <span className="text-xs text-amber-700">Scan signé non déposé</span>
        )}
        {archived > 0 ? (
          <Badge variant="secondary" appearance="outline" className="text-[10px]">
            {archived} ancien modèle PDF archivé{archived > 1 ? 's' : ''}
          </Badge>
        ) : null}
      </div>
      {data.signedScans && data.signedScans.length > 0 ? (
        <ul className="space-y-1 border-t border-border/40 pt-2">
          {data.signedScans.map((scan) => (
            <li key={scan.id}>
              <a
                href={scan.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ScanLine className="size-3" />
                Scan{scan.scanIndex ? ` n°${scan.scanIndex}` : ''} — {scan.originalName}
                <ExternalLink className="size-3 opacity-50" />
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
