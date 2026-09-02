'use client';

import { useQuery } from '@tanstack/react-query';
import { Info, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import type { SuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context-types';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../vie-scolaire/constants/sheet-shell-classes';
import { SuiviSessionContextPanel } from './suivi-session-context-panel';
import { SuiviSessionStagiairesDatagrid } from './suivi-session-stagiaires-datagrid';
import type { SuiviSessionOption } from '../types/suivi-formations-api';

export function SuiviSessionContextSheet({
  open,
  onOpenChange,
  sessionId,
  sessionSummary,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  sessionSummary?: SuiviSessionOption | null;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'context', sessionId],
    queryFn: async (): Promise<SuiviSessionContext> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/context`,
      );
      if (!res.ok) throw new Error('Contexte session indisponible.');
      const j = await res.json();
      if (!j?.success || !j?.data) throw new Error('Réponse invalide.');
      return j.data as SuiviSessionContext;
    },
    enabled: open && Boolean(sessionId),
    staleTime: 60_000,
  });

  const title =
    sessionSummary?.formation.name ??
    data?.formationName ??
    'Contexte session';

  const subtitle =
    sessionSummary?.dateDisplayLabel ??
    data?.dateDisplayLabel ??
    'Formateur, salle, planning et effectifs.';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-left">{title}</SheetTitle>
          <SheetDescription className="text-left">{subtitle}</SheetDescription>
        </SheetHeader>

        <SheetBody className="min-h-0 flex-1 overflow-hidden px-0 py-0">
          {isLoading || !data ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Chargement du contexte session…
            </div>
          ) : (
            <ScrollArea className="h-full max-h-[calc(100dvh-8rem)]">
              <div className="space-y-6 p-6">
                <SuiviSessionContextPanel context={data} variant="default" showPlanning />
                <SuiviSessionStagiairesDatagrid
                  sessionId={sessionId}
                  variant="embedded"
                  enabled={open}
                />
              </div>
            </ScrollArea>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}

export function SuiviSessionContextSheetTrigger({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2 self-start sm:self-center"
      disabled={disabled}
      onClick={onClick}
    >
      <Info className="size-4" />
      Contexte session
    </Button>
  );
}
