'use client';

import { Button } from '@repo/ui/button';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { CgvDocument } from '@/components/legal/cgv-document';

/** Même gabarit que les sheets « détail formation » (largeur, hauteur, coins arrondis). */
const sheetContentClassName =
  'gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5';

const scrollAreaClassName =
  'flex flex-col h-[calc(100dvh-13.8rem)] sm:h-[calc(100dvh-15.8rem)] mx-1.5';

interface CgvSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CgvSheet({ open, onOpenChange }: CgvSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={sheetContentClassName}>
        <SheetHeader className="border-b border-border px-5 py-3.5">
          <SheetTitle className="font-medium">Conditions générales de vente</SheetTitle>
          <SheetDescription className="sr-only">
            Texte des conditions générales de vente FORM&apos;SSI
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="grow p-0">
          <ScrollArea
            className={scrollAreaClassName}
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="px-5 py-5 pe-6">
              <CgvDocument embedInSheet />
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex flex-row flex-wrap justify-end gap-2.5 border-t border-border p-4 pb-4 sm:p-5">
          <Button variant="mono" type="button" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
