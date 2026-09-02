'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime, getAvatarUrl, getInitials } from '@/lib/helpers';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Progress } from '@repo/ui/progress';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import { cn } from '@/lib/utils';
import {
  SUIVI_ENROLLMENT_STATUS_LABELS,
  SUIVI_EXAM_OUTCOME_LABELS,
  type SuiviStagiaireRow,
} from '../types/suivi-formations-api';
import { SuiviStagiaireDetailsSheet } from './suivi-stagiaire-details-sheet';

function normalizeParticipantsResponse(
  payload: unknown,
  pageSize: number,
  pageIndex: number,
): DataGridApiResponse<SuiviStagiaireRow> {
  const fallback: DataGridApiResponse<SuiviStagiaireRow> = {
    data: [],
    empty: true,
    pagination: { total: 0, page: pageIndex + 1 },
  };

  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const rootData = record.data as Record<string, unknown> | undefined;
  const items = Array.isArray(rootData?.items) ? (rootData.items as SuiviStagiaireRow[]) : [];
  const pagination = rootData?.pagination as { total?: number; page?: number } | undefined;
  const total = Number(pagination?.total ?? items.length);
  const page = Number(pagination?.page ?? pageIndex + 1);

  return {
    data: items,
    empty: items.length === 0,
    pagination: { total, page },
  };
}

export function SuiviSessionStagiairesDatagrid({
  sessionId,
  variant = 'page',
  title = 'Stagiaires de la session',
  enabled = true,
}: {
  sessionId: string | null;
  /** `page` : liste principale ; `embedded` : sheets journal / contexte */
  variant?: 'page' | 'embedded';
  title?: string;
  enabled?: boolean;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<SuiviStagiaireRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const queryKey = [
    'gestion-academique',
    'vie-scolaire',
    'suivi-formations',
    'participants',
    sessionId,
    variant,
    pagination,
    searchQuery,
  ] as const;

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'vieScolaire',
    queryKeys: [queryKey],
  });

  const fetchParticipants = async ({
    pageIndex,
    pageSize,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<SuiviStagiaireRow>> => {
    if (!sessionId) {
      return { data: [], empty: true, pagination: { total: 0, page: 1 } };
    }
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(searchQuery ? { query: searchQuery } : {}),
    });
    const response = await apiFetch(
      `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/participants?${params.toString()}`,
    );
    if (!response.ok) throw new Error('Échec du chargement des stagiaires.');
    const result = await response.json();
    return normalizeParticipantsResponse(result, pageSize, pageIndex);
  };

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () =>
      fetchParticipants({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
    enabled: enabled && Boolean(sessionId),
    staleTime: 60_000,
  });

  const openDetails = (row: SuiviStagiaireRow) => {
    setSelectedRow(row);
    setSheetOpen(true);
  };

  const columns = useMemo<ColumnDef<SuiviStagiaireRow>[]>(
    () => [
      {
        id: 'name',
        accessorFn: (row) => row.name ?? row.email,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Stagiaire" />,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex min-w-[200px] items-center gap-3">
              <Avatar className="size-9">
                <AvatarImage src={getAvatarUrl(item.avatar)} alt={item.name ?? item.email} />
                <AvatarFallback>{getInitials(item.name ?? item.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{item.name ?? '—'}</p>
                <p className="truncate text-xs text-muted-foreground">{item.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'fundingModeLabel',
        accessorKey: 'fundingModeLabel',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Financeur" />,
        cell: ({ row }) => (
          <div className="min-w-[140px]">
            <p className="text-sm">{row.original.fundingModeLabel}</p>
            {row.original.fundingReference ? (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.fundingReference}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: 'enrollmentStatus',
        accessorKey: 'enrollmentStatus',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Inscription" />,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="outline">
            {SUIVI_ENROLLMENT_STATUS_LABELS[row.original.enrollmentStatus] ??
              row.original.enrollmentStatus}
          </Badge>
        ),
      },
      {
        id: 'progressPercent',
        accessorKey: 'progressPercent',
        header: ({ column }) => <DataGridColumnHeader column={column} title="E-learning" />,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-[140px] space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{item.progressPercent} %</span>
                <span className="text-muted-foreground">
                  {item.completedChapters}/{item.totalChapters} UV
                </span>
              </div>
              <Progress value={item.progressPercent} className="h-1.5" />
            </div>
          );
        },
      },
      {
        id: 'quizPassed',
        accessorFn: (row) => row.quizPassed,
        header: ({ column }) => <DataGridColumnHeader column={column} title="Quiz" />,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <span className="text-sm">
              {item.quizPassed}/{item.quizTotal}
            </span>
          );
        },
      },
      {
        id: 'examOutcome',
        accessorKey: 'examOutcome',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Examen" />,
        cell: ({ row }) => (
          <Badge
            variant={row.original.examOutcome === 'PASSED' ? 'success' : 'secondary'}
            appearance="outline"
          >
            {SUIVI_EXAM_OUTCOME_LABELS[row.original.examOutcome] ?? row.original.examOutcome}
          </Badge>
        ),
      },
      {
        id: 'lastActivityAt',
        accessorKey: 'lastActivityAt',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Dernière activité" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.lastActivityAt ? formatDateTime(row.original.lastActivityAt) : '—'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => null,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => openDetails(row.original)}
          >
            <Eye className="size-4" />
            Détail
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
    manualPagination: true,
    manualSorting: true,
  });

  if (!sessionId) {
    return (
      <Card className={cn(variant === 'embedded' && 'border-border/60 shadow-none')}>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune session sélectionnée.
        </CardContent>
      </Card>
    );
  }

  const grid = (
    <DataGrid table={table} recordCount={data?.pagination.total ?? 0} isLoading={isLoading}>
      <Card className={cn(variant === 'embedded' && 'border-border/60 shadow-none')}>
        <CardHeader
          className={cn(
            'flex flex-col gap-3 border-b border-border/60 py-4 sm:flex-row sm:items-center sm:justify-between',
            variant === 'embedded' && 'px-4 py-3',
          )}
        >
          {variant === 'embedded' ? (
            <p className="shrink-0 text-sm font-semibold text-foreground">{title}</p>
          ) : null}
          <div
            className={cn(
              'relative w-full sm:max-w-sm',
              variant === 'page' && 'sm:flex-1',
            )}
          >
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              placeholder="Rechercher un stagiaire…"
              className="ps-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={isSyncing}
            onClick={() => void handleSync()}
          >
            <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
            Synchroniser
          </Button>
        </CardHeader>
        <CardTable>
          <ScrollArea className="w-full">
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter className={cn('border-t border-border/60 py-3', variant === 'embedded' && 'px-4')}>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );

  return (
    <>
      {grid}
      <SuiviStagiaireDetailsSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        stagiaire={selectedRow}
        sessionId={sessionId}
      />
    </>
  );
}
