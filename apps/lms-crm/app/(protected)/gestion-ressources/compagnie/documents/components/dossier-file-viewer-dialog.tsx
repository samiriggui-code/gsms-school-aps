'use client';

import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type DossierViewerFile = {
  url: string;
  mimeType: string;
  originalName: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DossierViewerFile | null;
};

export function DossierFileViewerDialog({ open, onOpenChange, file }: Props) {
  if (!file) return null;
  const mime = (file.mimeType || '').toLowerCase();
  const isPdf = mime.includes('pdf');
  const isImage = /^image\//.test(mime);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[90vh] max-h-[90vh] w-[95vw] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-border px-4 py-3 pe-12">
          <DialogTitle className="truncate text-left text-sm font-semibold text-foreground">
            {file.originalName}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 bg-muted/30">
          {isPdf ? (
            <iframe
              title={file.originalName}
              src={file.url}
              className="h-[calc(90vh-3.5rem)] w-full border-0"
            />
          ) : isImage ? (
            <div className="flex h-[calc(90vh-3.5rem)] items-center justify-center overflow-auto p-4">
              <img
                src={file.url}
                alt={file.originalName}
                className="max-h-full max-w-full object-contain shadow-sm"
              />
            </div>
          ) : (
            <div className="flex h-[calc(90vh-3.5rem)] flex-col items-center justify-center gap-4 p-8 text-center text-sm text-muted-foreground">
              <p>Aperçu intégré non disponible pour ce type de fichier.</p>
              <Button asChild variant="outline" className="gap-2">
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Ouvrir ou télécharger
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
