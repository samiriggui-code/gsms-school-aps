'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Loader2, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../constants/sheet-shell-classes';
import { toast } from 'sonner';
import {
  SUIVI_EMARGEMENT_STATUS_LABELS,
  type SuiviEmargementStatus,
} from '../types/suivi-formations-api';
import { suiviFormationsStatsQueryKey } from './suivi-formations-stats';

type DayParticipant = {
  participantId: string;
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  morning: { status: SuiviEmargementStatus; notes: string | null } | null;
  evening: { status: SuiviEmargementStatus; notes: string | null } | null;
};

type DayDetailPayload = {
  id: string;
  dayDate: string;
  journalNotesMorning: string | null;
  journalNotesEvening: string | null;
  participantTotal: number;
  slots: Array<{
    slot: 'MORNING' | 'EVENING';
    presentCount: number;
    markedCount: number;
    participantTotal: number;
    complete: boolean;
    pdfAssetId: string | null;
  }>;
  participants: DayParticipant[];
  session: {
    dateDisplayLabel: string;
    location: string;
    formation: { name: string };
  };
};

type SlotKey = 'MORNING' | 'EVENING';

function formatDayTitle(iso: string) {
  try {
    return format(parseISO(iso), 'EEEE d MMMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

export function SuiviJournalDaySheet({
  open,
  onOpenChange,
  sessionId,
  dayId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  dayId: string | null;
}) {
  const queryClient = useQueryClient();
  const [activeSlot, setActiveSlot] = useState<SlotKey>('MORNING');
  const [marks, setMarks] = useState<Record<string, SuiviEmargementStatus>>({});
  const [journalNotes, setJournalNotes] = useState('');

  const detailQueryKey = [
    'gestion-academique',
    'vie-scolaire',
    'suivi-formations',
    'journal-day',
    sessionId,
    dayId,
  ] as const;

  const { data, isLoading, refetch } = useQuery({
    queryKey: detailQueryKey,
    queryFn: async (): Promise<DayDetailPayload> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/days/${dayId}`,
      );
      if (!res.ok) throw new Error('Détail journal indisponible.');
      const j = await res.json();
      if (!j?.success || !j?.data) throw new Error('Réponse invalide.');
      return j.data as DayDetailPayload;
    },
    enabled: open && Boolean(sessionId && dayId),
  });

  useEffect(() => {
    if (!data) return;
    const nextMarks: Record<string, SuiviEmargementStatus> = {};
    for (const p of data.participants) {
      const mark = activeSlot === 'MORNING' ? p.morning : p.evening;
      nextMarks[p.participantId] = mark?.status ?? 'PRESENT';
    }
    setMarks(nextMarks);
    setJournalNotes(
      activeSlot === 'MORNING'
        ? (data.journalNotesMorning ?? '')
        : (data.journalNotesEvening ?? ''),
    );
  }, [data, activeSlot]);

  const slotMeta = useMemo(
    () => data?.slots.find((s) => s.slot === activeSlot) ?? null,
    [data, activeSlot],
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !dayId) throw new Error('Jour requis.');
      const payload = {
        slot: activeSlot,
        journalNotes,
        marks: data!.participants.map((p) => ({
          participantId: p.participantId,
          status: marks[p.participantId] ?? 'PRESENT',
        })),
      };
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/days/${dayId}/emargement`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Enregistrement impossible.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Émargement enregistré.');
      void refetch();
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'journal', sessionId],
      });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: suiviFormationsStatsQueryKey(sessionId) });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pdfMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !dayId) throw new Error('Jour requis.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/days/${dayId}/emargement`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot: activeSlot }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Génération PDF impossible.');
      }
      return res.json();
    },
    onSuccess: (payload) => {
      toast.success('PDF émargement archivé.');
      const url = payload?.data?.asset?.url;
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
      void refetch();
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'journal', sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'documents', sessionId],
      });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: suiviFormationsStatsQueryKey(sessionId) });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-left capitalize">
            {data ? formatDayTitle(data.dayDate) : 'Journal quotidien'}
          </SheetTitle>
          {data ? (
            <p className="text-sm text-muted-foreground">
              {data.session.formation.name} — {data.session.dateDisplayLabel} · {data.session.location}
            </p>
          ) : null}
        </SheetHeader>

        <SheetBody className="min-h-0 flex-1 overflow-hidden px-0 py-0">
          {isLoading || !data ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Chargement…
            </div>
          ) : (
            <Tabs
              value={activeSlot}
              onValueChange={(v) => setActiveSlot(v as SlotKey)}
              className="flex h-full min-h-0 flex-col"
            >
              <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <TabsList>
                  <TabsTrigger value="MORNING">Matin</TabsTrigger>
                  <TabsTrigger value="EVENING">Soir</TabsTrigger>
                </TabsList>
                {slotMeta ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>
                      {slotMeta.presentCount}/{slotMeta.participantTotal} présents
                    </span>
                    {slotMeta.complete ? (
                      <Badge variant="success" appearance="outline">
                        Créneau complet
                      </Badge>
                    ) : (
                      <Badge variant="secondary" appearance="outline">
                        {slotMeta.markedCount}/{slotMeta.participantTotal} marqués
                      </Badge>
                    )}
                    {slotMeta.pdfAssetId ? (
                      <Badge variant="secondary" appearance="light">
                        PDF archivé
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {(['MORNING', 'EVENING'] as const).map((slot) => (
                <TabsContent key={slot} value={slot} className="mt-0 min-h-0 flex-1">
                  <ScrollArea className="h-[calc(100dvh-18rem)]">
                    <div className="space-y-5 p-6">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Notes journal {slot === 'MORNING' ? 'matin' : 'soir'}</p>
                        <Textarea
                          value={journalNotes}
                          onChange={(e) => setJournalNotes(e.target.value)}
                          rows={3}
                          placeholder="Observations pédagogiques, incidents, rappels…"
                        />
                      </div>

                      <div className="overflow-hidden rounded-lg border border-border/60">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/40">
                            <tr>
                              <th className="px-4 py-2 text-left font-medium">Stagiaire</th>
                              <th className="px-4 py-2 text-left font-medium">Statut</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.participants.map((p) => (
                              <tr key={p.participantId} className="border-t border-border/50">
                                <td className="px-4 py-3">
                                  <p className="font-medium">{p.name}</p>
                                  <p className="text-xs text-muted-foreground">{p.email}</p>
                                </td>
                                <td className="px-4 py-3">
                                  <Select
                                    value={marks[p.participantId] ?? 'PRESENT'}
                                    onValueChange={(v) =>
                                      setMarks((prev) => ({
                                        ...prev,
                                        [p.participantId]: v as SuiviEmargementStatus,
                                      }))
                                    }
                                  >
                                    <SelectTrigger className="w-40">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Object.keys(SUIVI_EMARGEMENT_STATUS_LABELS) as SuiviEmargementStatus[]).map(
                                        (key) => (
                                          <SelectItem key={key} value={key}>
                                            {SUIVI_EMARGEMENT_STATUS_LABELS[key]}
                                          </SelectItem>
                                        ),
                                      )}
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </SheetBody>

        <SheetFooter className="border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            disabled={pdfMutation.isPending || !data}
            onClick={() => pdfMutation.mutate()}
          >
            {pdfMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            Générer PDF
          </Button>
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            disabled={saveMutation.isPending || !data}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            Enregistrer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
