'use client';

import { useMemo, useRef, useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SESSION_DOCUMENT_CATEGORY_LABELS } from '@/lib/formation-session-document-storage';
import type { SuiviDocumentRow } from '../types/suivi-formations-api';

const UPLOAD_CATEGORIES = ['general', 'emargement', 'suivi-quotidien', 'conformite', 'archives'] as const;

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

export function SuiviDocumentsList({ sessionId }: { sessionId: string | null }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] =
    useState<(typeof UPLOAD_CATEGORIES)[number]>('conformite');
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

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!sessionId) throw new Error('Session requise.');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', uploadCategory);
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/documents/upload`,
        { method: 'POST', body: formData },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Upload impossible.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Document archivé.');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onFilePicked = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    event.target.value = '';
  };

  const columns = useMemo<ColumnDef<SuiviDocumentRow>[]>(
    () => [
      {
        id: 'originalName',
        accessorKey: 'originalName',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Document" />,
        cell: ({ row }) => (
          <div className="min-w-[200px]">
            <p className="font-medium truncate">{row.original.originalName}</p>
            <p className="text-xs text-muted-foreground">{formatBytes(row.original.size)}</p>
          </div>
        ),
      },
      {
        id: 'categoryLabel',
        accessorKey: 'categoryLabel',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="outline">
            {row.original.categoryLabel}
          </Badge>
        ),
      },
      {
        id: 'dayDate',
        accessorKey: 'dayDate',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Jour" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDay(row.original.dayDate)}</span>
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
    <DataGrid table={table} recordCount={data?.pagination.total ?? 0} isLoading={isLoading}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-border/60 py-3">
          <p className="hidden min-w-0 truncate text-xs text-muted-foreground xl:block">
            PDF émargement, exports financeurs et pièces archivées sur MinIO.
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

            <Select
              value={uploadCategory}
              onValueChange={(v) => setUploadCategory(v as (typeof UPLOAD_CATEGORIES)[number])}
            >
              <SelectTrigger className="h-8 w-[7.5rem] shrink-0 px-2 text-xs sm:w-36">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                {UPLOAD_CATEGORIES.map((key) => (
                  <SelectItem key={key} value={key}>
                    {SESSION_DOCUMENT_CATEGORY_LABELS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.csv,.xlsx,.xls,image/jpeg,image/png,image/webp"
              onChange={onFilePicked}
            />

            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-8 shrink-0 gap-1.5 px-2.5"
              disabled={uploadMutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileUp className="size-3.5" />
              )}
              <span className="hidden sm:inline">Déposer</span>
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
  );
}
