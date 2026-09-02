'use client';

import { useEffect } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@repo/ui/button';

export function DevisPlaquettePrintBar({ autoPrint }: { autoPrint: boolean }) {
  useEffect(() => {
    if (!autoPrint) return;
    const t = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(t);
  }, [autoPrint]);

  return (
    <div className="no-print sticky top-0 z-10 flex justify-end gap-2 border-b border-border bg-background/95 px-4 py-3 backdrop-blur print:hidden">
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
        <Printer className="size-4" />
        Imprimer ou PDF
      </Button>
    </div>
  );
}
