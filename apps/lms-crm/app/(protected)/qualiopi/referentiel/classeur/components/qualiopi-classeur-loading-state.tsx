import { Loader2 } from 'lucide-react';

export function QualiopiClasseurLoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-20 text-sm text-muted-foreground">
      <Loader2 className="size-5 animate-spin" />
      Chargement du classeur Qualiopi…
    </div>
  );
}
