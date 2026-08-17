'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { CalendarPlus, Eye, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SuiviJournalDayRow, SuiviSessionOption } from '../types/suivi-formations-api';
import { SuiviJournalDaySheet } from './suivi-journal-day-sheet';
import { SuiviSlotDocumentsBadges } from './suivi-slot-documents-badges';
import { suiviFormationsStatsSessionQueryKey } from './suivi-formations-stats';

function formatDayLabel(iso: string) {
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

export function SuiviJournalList({
  sessionId,
  sessionSummary,
}: {
  sessionId: string | null;
  sessionSummary?: SuiviSessionOption | null;
}) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'dayDate', desc: true }]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const queryKey = [
    'gestion-academique',
    'vie-scolaire',
    'suivi-formations',
    'journal',
    sessionId,
  ] as const;

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'vieScolaire',
    queryKeys: [queryKey],
  });

  const fetchDays = async (): Promise<DataGridApiResponse<SuiviJournalDayRow>> => {
    if (!sessionId) return { data: [], empty: true, pagination: { total: 0, page: 1 } };
    const response = await apiFetch(
      `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/days`,
    );
    if (!response.ok) throw new Error('Échec du chargement du journal.');
    const result = await response.json();
    const items = (result?.data?.items ?? []) as SuiviJournalDayRow[];
    return {
      data: items,
      empty: items.length === 0,
      pagination: { total: items.length, page: 1 },
    };
  };

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: fetchDays,
    enabled: Boolean(sessionId),
    staleTime: 30_000,
  });

  const syncDaysMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('Session requise.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/days`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync-range' }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Synchronisation impossible.');
      }
      return res.json();
    },
    onSuccess: (payload) => {
      const created = payload?.data?.created ?? 0;
      toast.success(
        created > 0 ? `${created} jour(s) ajouté(s) au journal.` : 'Journal déjà à jour.',
      );
      queryClient.invalidateQueries({ queryKey });
      if (sessionId) {
        queryClient.invalidateQueries({ queryKey: suiviFormationsStatsSessionQueryKey(sessionId) });
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openDay = (dayId: string) => {
    setSelectedDayId(dayId);
    setSheetOpen(true);
  };

  const columns = useMemo<ColumnDef<SuiviJournalDayRow>[]>(
    () => [
      {
        id: 'dayDate',
        accessorKey: 'dayDate',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="font-medium capitalize">{formatDayLabel(row.original.dayDate)}</span>
        ),
      },
      {
        id: 'morning',
        header: 'Matin',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                {item.morningPresent}/{item.participantTotal} présents
              </span>
              {item.morningComplete ? (
                <Badge variant="success" appearance="outline">
                  Complet
                </Badge>
              ) : (
                <Badge variant="secondary" appearance="outline">
                  Incomplet
                </Badge>
              )}
              <SuiviSlotDocumentsBadges
                variant="compact"
                data={{
                  hasTemplate: Boolean(item.morningPdfAssetId),
                  templatePdf: null,
                  signedScanCount: item.morningScanCount ?? 0,
                  archivedTemplateCount: item.morningArchivedTemplates ?? 0,
                }}
              />
            </div>
          );
        },
      },
      {
        id: 'evening',
        header: 'Après-midi',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>
                {item.eveningPresent}/{item.participantTotal} présents
              </span>
              {item.eveningComplete ? (
                <Badge variant="success" appearance="outline">
                  Complet
                </Badge>
              ) : (
                <Badge variant="secondary" appearance="outline">
                  Incomplet
                </Badge>
              )}
              <SuiviSlotDocumentsBadges
                variant="compact"
                data={{
                  hasTemplate: Boolean(item.eveningPdfAssetId),
                  templatePdf: null,
                  signedScanCount: item.eveningScanCount ?? 0,
                  archivedTemplateCount: item.eveningArchivedTemplates ?? 0,
                }}
              />
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => openDay(row.original.id)}
          >
            <Eye className="size-4" />
            Ouvrir
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: data?.data ?? [],
    pageCount: Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize) || 1,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  if (!sessionId) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Choisissez une session pour afficher le journal quotidien.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <DataGrid table={table} recordCount={data?.pagination.total ?? 0} isLoading={isLoading}>
        <Card>
          <CardHeader className="flex flex-col gap-3 border-b border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Jours de formation — émargement matin / soir et archivage PDF.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={syncDaysMutation.isPending}
                onClick={() => syncDaysMutation.mutate()}
              >
                <CalendarPlus className="size-4" />
                Générer jours session
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isSyncing}
                onClick={() => void handleSync()}
              >
                <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardTable>
            <ScrollArea className="w-full">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="border-t border-border/60 py-3">
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <SuiviJournalDaySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        sessionId={sessionId}
        dayId={selectedDayId}
        sessionSummary={sessionSummary}
      />
    </>
  );
}
