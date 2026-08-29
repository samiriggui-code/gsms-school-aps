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

import { ChevronDown, Download, ExternalLink, FileUp, Loader2, RefreshCw } from 'lucide-react';

import { format, parseISO } from 'date-fns';

import { fr } from 'date-fns/locale';

import { apiFetch } from '@/lib/api';

import { formatDateTime } from '@/lib/helpers';

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

import {

  DropdownMenu,

  DropdownMenuContent,

  DropdownMenuItem,

  DropdownMenuTrigger,

} from '@/components/ui/dropdown-menu';

import { SUIVI_DAY_SLOT_LABELS } from '@/lib/suivi-formations/session-location';

import type { SuiviDocumentRow, SuiviSessionOption } from '../types/suivi-formations-api';

import { SuiviDocumentDepositSheet } from './suivi-document-deposit-sheet';
import { SuiviDossierCloseButton } from './suivi-dossier-close-button';



function formatBytes(size: number) {

  if (size < 1024) return `${size} o`;

  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} Ko`;

  return `${(size / (1024 * 1024)).toFixed(1)} Mo`;

}



function formatDay(iso: string | null) {

  if (!iso) return '—';

  try {

    return format(parseISO(iso), 'd MMM yyyy', { locale: fr });

  } catch {

    return iso;

  }

}



export function SuiviDocumentsList({

  sessionId,

  sessionSummary,

}: {

  sessionId: string | null;

  sessionSummary: SuiviSessionOption | null;

}) {

  const queryClient = useQueryClient();

  const [depositOpen, setDepositOpen] = useState(false);

  const [pagination, setPagination] = useState<PaginationState>({

    pageIndex: 0,

    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,

  });

  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }]);



  const queryKey = [

    'gestion-academique',

    'vie-scolaire',

    'suivi-formations',

    'documents',

    sessionId,

  ] as const;



  const { isSyncing, sync: handleSync } = useDatagridSync({

    preset: 'vieScolaire',

    queryKeys: [queryKey],

  });



  const fetchDocuments = async (): Promise<DataGridApiResponse<SuiviDocumentRow>> => {

    if (!sessionId) return { data: [], empty: true, pagination: { total: 0, page: 1 } };

    const response = await apiFetch(

      `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/documents`,

    );

    if (!response.ok) throw new Error('Échec du chargement des documents.');

    const result = await response.json();

    const items = (result?.data?.items ?? []) as SuiviDocumentRow[];

    return {

      data: items,

      empty: items.length === 0,

      pagination: { total: items.length, page: 1 },

    };

  };



  const { data, isLoading } = useQuery({

    queryKey,

    queryFn: fetchDocuments,

    enabled: Boolean(sessionId),

    staleTime: 30_000,

  });



  const exportMutation = useMutation({

    mutationFn: async (variant: 'cpf' | 'france-travail' | 'all') => {

      if (!sessionId) throw new Error('Session requise.');

      const res = await apiFetch(

        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/exports/conformite`,

        {

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({ variant, download: true }),

        },

      );

      if (!res.ok) {

        const j = await res.json().catch(() => ({}));

        throw new Error(j?.error ?? 'Export impossible.');

      }

      const blob = await res.blob();

      const filename =

        variant === 'cpf'

          ? `export-cpf.csv`

          : variant === 'france-travail'

            ? `export-france-travail.csv`

            : `export-conformite.csv`;

      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');

      a.href = url;

      a.download = filename;

      a.click();

      URL.revokeObjectURL(url);

    },

    onSuccess: () => {

      toast.success('Export CSV téléchargé et archivé.');

      queryClient.invalidateQueries({ queryKey });

    },

    onError: (e: Error) => toast.error(e.message),

  });



  const columns = useMemo<ColumnDef<SuiviDocumentRow>[]>(

    () => [

      {

        id: 'title',

        accessorFn: (row) => row.title ?? row.originalName,

        header: ({ column }) => <DataGridColumnHeader column={column} title="Document" />,

        cell: ({ row }) => (

          <div className="min-w-[200px] max-w-[280px]">

            <p className="font-medium truncate">

              {row.original.title ?? row.original.originalName}

            </p>

            <p className="text-xs text-muted-foreground truncate">{row.original.originalName}</p>

            {row.original.legalHold ? (

              <Badge variant="secondary" appearance="light" className="mt-1 text-[10px]">

                Legal hold

              </Badge>

            ) : null}

          </div>

        ),

      },

      {

        id: 'documentKindLabel',

        accessorKey: 'documentKindLabel',

        header: ({ column }) => <DataGridColumnHeader column={column} title="Nature" />,

        cell: ({ row }) => (

          <span className="text-sm text-muted-foreground">

            {row.original.documentKindLabel ?? '—'}

          </span>

        ),

      },

      {

        id: 'categoryLabel',

        accessorKey: 'categoryLabel',

        header: ({ column }) => <DataGridColumnHeader column={column} title="Dossier" />,

        cell: ({ row }) => (

          <Badge variant="secondary" appearance="outline">

            {row.original.categoryLabel}

          </Badge>

        ),

      },

      {

        id: 'slotRole',

        accessorKey: 'slotRole',

        header: ({ column }) => <DataGridColumnHeader column={column} title="Rôle" />,

        cell: ({ row }) => {

          const { slotRole, scanIndex } = row.original;

          if (slotRole === 'template-pdf') {

            return (

              <Badge variant="secondary" appearance="light" className="text-[10px]">

                Modèle PDF

              </Badge>

            );

          }

          if (slotRole === 'signed-scan') {

            return (

              <span className="text-xs text-muted-foreground">

                Scan signé{scanIndex ? ` n°${scanIndex}` : ''}

              </span>

            );

          }

          return <span className="text-muted-foreground">—</span>;

        },

      },

      {

        id: 'dayDate',

        accessorKey: 'dayDate',

        header: ({ column }) => <DataGridColumnHeader column={column} title="Jour" />,

        cell: ({ row }) => (

          <div className="text-sm text-muted-foreground">

            <p>{formatDay(row.original.dayDate)}</p>

            {row.original.slot ? (

              <p className="text-xs">{SUIVI_DAY_SLOT_LABELS[row.original.slot]}</p>

            ) : null}

          </div>

        ),

      },

      {

        id: 'createdAt',

        accessorKey: 'createdAt',

        header: ({ column }) => <DataGridColumnHeader column={column} title="Ajouté le" />,

        cell: ({ row }) => (

          <span className="text-sm text-muted-foreground">

            {formatDateTime(row.original.createdAt)}

          </span>

        ),

      },

      {

        id: 'createdByName',

        accessorKey: 'createdByName',

        header: ({ column }) => <DataGridColumnHeader column={column} title="Par" />,

        cell: ({ row }) => (

          <span className="text-sm">{row.original.createdByName ?? '—'}</span>

        ),

      },

      {

        id: 'actions',

        header: () => null,

        cell: ({ row }) => (

          <Button variant="ghost" size="sm" className="gap-1.5" asChild>

            <a href={row.original.url} target="_blank" rel="noopener noreferrer">

              <ExternalLink className="size-4" />

              Ouvrir

            </a>

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

          Choisissez une session pour afficher les documents archivés.

        </CardContent>

      </Card>

    );

  }



  return (

    <>

      <DataGrid table={table} recordCount={data?.pagination.total ?? 0} isLoading={isLoading}>

        <Card>

          <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 py-3">

            <p className="hidden min-w-0 truncate text-xs text-muted-foreground xl:block">

              Dossier session MinIO — PDF générés, scans signés, exports financeurs et archives.

            </p>



            <div className="flex w-full min-w-0 flex-nowrap items-center justify-end gap-1.5 sm:gap-2 xl:w-auto">

              <DropdownMenu>

                <DropdownMenuTrigger asChild>

                  <Button

                    type="button"

                    variant="outline"

                    size="sm"

                    className="h-8 shrink-0 gap-1 px-2.5"

                    disabled={exportMutation.isPending || !sessionId}

                  >

                    {exportMutation.isPending ? (

                      <Loader2 className="size-3.5 animate-spin" />

                    ) : (

                      <Download className="size-3.5" />

                    )}

                    <span>Exporter</span>

                    <ChevronDown className="size-3 opacity-60" />

                  </Button>

                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="min-w-[12rem]">

                  <DropdownMenuItem

                    disabled={exportMutation.isPending}

                    onClick={() => exportMutation.mutate('cpf')}

                  >

                    Export CPF / transition pro

                  </DropdownMenuItem>

                  <DropdownMenuItem

                    disabled={exportMutation.isPending}

                    onClick={() => exportMutation.mutate('france-travail')}

                  >

                    Export France Travail / AIF

                  </DropdownMenuItem>

                  <DropdownMenuItem

                    disabled={exportMutation.isPending}

                    onClick={() => exportMutation.mutate('all')}

                  >

                    Export conformité complet

                  </DropdownMenuItem>

                </DropdownMenuContent>

              </DropdownMenu>



              <Button

                type="button"

                variant="outline"

                size="sm"

                mode="icon"

                className="size-8 shrink-0"

                disabled={isSyncing}

                title="Actualiser"

                aria-label="Actualiser"

                onClick={() => void handleSync()}

              >

                <RefreshCw className={cn('size-3.5', isSyncing && 'animate-spin')} />

              </Button>



              <SuiviDossierCloseButton sessionId={sessionId} />



              <Button

                type="button"

                variant="primary"

                size="sm"

                className="h-8 shrink-0 gap-1.5 px-2.5"

                onClick={() => setDepositOpen(true)}

              >

                <FileUp className="size-3.5" />

                <span className="hidden sm:inline">Déposer un document</span>

                <span className="sm:hidden">Déposer</span>

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



      <SuiviDocumentDepositSheet

        open={depositOpen}

        onOpenChange={setDepositOpen}

        sessionId={sessionId}

        sessionSummary={sessionSummary}

      />

    </>

  );

}


