'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ExternalLink,
  Eye,
  FileStack,
  FolderOpen,
  Inbox,
  MailWarning,
  RefreshCw,
  Search,
  Send,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { usePusher } from '@/hooks/use-pusher';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import {
  fetchDemandesDocuments,
  notifyDossierByEmail,
  type DemandeDocumentRow,
} from '@/lib/governance/demandes-documents-api';
import { DemandeDocumentSheet } from './demande-document-sheet';

const PAGE_SIZE = 10;
const QUERY_KEY = 'gouvernance-demandes';

export function DemandesDocumentsDatagrid() {
  const { title, description } = usePageToolbarMeta(
    '/securite-configuration/gouvernance-donnees/demandes-documents',
  );
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selected, setSelected] = useState<DemandeDocumentRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [evaluateOnFetch, setEvaluateOnFetch] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedQuery]);

  const listQuery = useQuery({
    queryKey: [QUERY_KEY, debouncedQuery, pagination.pageIndex, pagination.pageSize, evaluateOnFetch],
    queryFn: () =>
      fetchDemandesDocuments({
        q: debouncedQuery,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        evaluate: evaluateOnFetch,
      }),
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (listQuery.isFetched && evaluateOnFetch) {
      setEvaluateOnFetch(false);
    }
  }, [listQuery.isFetched, evaluateOnFetch]);

  usePusher(session?.user?.id, () => {
    void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  });

  const sendEmail = useMutation({
    mutationFn: (input: { dossierId: string; message?: string }) => notifyDossierByEmail(input),
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success(
          `1 e-mail envoyé à ${data.recipientEmail} (${data.piecesCount} pièce${data.piecesCount > 1 ? 's' : ''}).`,
        );
      } else if (data.emailError) {
        toast.warning(
          `Demande enregistrée mais e-mail non envoyé : ${data.emailError}`,
        );
      } else {
        toast.info(
          `Demande enregistrée pour ${data.recipientEmail} (SMTP non configuré).`,
        );
      }
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      setSheetOpen(false);
      setEmailMessage('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function openDetail(row: DemandeDocumentRow) {
    setSelected(row);
    setEmailMessage('');
    setSheetOpen(true);
  }

  function handleRefresh() {
    setEvaluateOnFetch(true);
    void listQuery.refetch();
  }

  const stats = listQuery.data?.stats;
  const kpiCards = useMemo(
    () => [
      {
        label: 'Dossiers incomplets',
        value: stats?.total ?? '—',
        subtitle: 'Tous profils',
        icon: Inbox,
      },
      {
        label: 'Pièces à demander',
        value: stats?.missingItems ?? '—',
        subtitle: 'Manquantes / rejetées',
        icon: MailWarning,
      },
      {
        label: 'Demandes ouvertes',
        value: stats?.openRequests ?? '—',
        subtitle: 'En cours',
        icon: Send,
      },
      {
        label: 'Pièces demandées',
        value: stats?.requestedItems ?? '—',
        subtitle: 'En attente dépôt',
        icon: FileStack,
      },
      {
        label: 'Profils concernés',
        value: stats?.profiles ?? '—',
        subtitle: 'Types de sujets',
        icon: Users,
      },
    ],
    [stats],
  );

  const columns = useMemo<ColumnDef<DemandeDocumentRow>[]>(
    () => [
      {
        id: 'subjectTypeLabel',
        accessorKey: 'subjectTypeLabel',
        header: ({ column }) => <DataGridColumnHeader title="Profil" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
            {row.original.subjectTypeLabel}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'personName',
        accessorKey: 'personName',
        header: ({ column }) => <DataGridColumnHeader title="Personne" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{row.original.personName}</p>
            <p className="truncate text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
        size: 180,
      },
      {
        id: 'dossierKindLabel',
        accessorKey: 'dossierKindLabel',
        header: ({ column }) => <DataGridColumnHeader title="Dossier" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.dossierKindLabel}</span>
        ),
        size: 160,
      },
      {
        id: 'contextLabel',
        accessorKey: 'contextLabel',
        header: ({ column }) => <DataGridColumnHeader title="Contexte" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.contextLabel}</span>
        ),
        size: 140,
      },
      {
        id: 'missingPieces',
        accessorKey: 'missingCount',
        header: ({ column }) => <DataGridColumnHeader title="Pièces" column={column} />,
        cell: ({ row }) => {
          const { missingPieces, missingCount, requestedCount } = row.original;
          if (missingCount === 0 && requestedCount === 0) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const visible = missingPieces.slice(0, 2);
          return (
            <div className="flex flex-wrap items-center gap-1">
              {visible.map((piece) => (
                <Badge key={piece} variant="destructive" appearance="light" className="text-[10px]">
                  {piece}
                </Badge>
              ))}
              {missingCount > 2 ? (
                <Badge variant="outline" className="text-[10px]">
                  +{missingCount - 2}
                </Badge>
              ) : null}
              {missingCount === 0 && requestedCount > 0 ? (
                <Badge variant="warning" appearance="light" className="text-[10px]">
                  {requestedCount} demandée(s)
                </Badge>
              ) : null}
            </div>
          );
        },
        size: 200,
      },
      {
        id: 'completenessPct',
        accessorKey: 'completenessPct',
        header: ({ column }) => <DataGridColumnHeader title="Complétion" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{row.original.completenessPct} %</span>
        ),
        size: 90,
      },
      {
        id: 'updatedAt',
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Màj" column={column} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDateTime(row.original.updatedAt)}
          </span>
        ),
        size: 130,
      },
      {
        id: 'shortcuts',
        header: () => <span className="sr-only">Raccourcis</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-0.5 pe-1">
              {item.gedPath && item.gedPath !== '#' ? (
                <Button
                  variant="ghost"
                  mode="icon"
                  className="size-8"
                  title="Dossier GED"
                  asChild
                >
                  <Link href={item.gedPath} title="Dossier GED">
                    <FolderOpen className="size-4 text-muted-foreground" />
                  </Link>
                </Button>
              ) : null}
              {item.editPath ? (
                <Button variant="ghost" mode="icon" className="size-8" title="Ouvrir la fiche" asChild>
                  <Link href={item.editPath} title="Ouvrir la fiche CRM">
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        },
        size: 72,
        minSize: 72,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end pe-2">
            <Button
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Voir la demande"
              onClick={() => openDetail(row.original)}
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ),
        size: 48,
        minSize: 48,
      },
    ],
    [],
  );

  const rows = listQuery.data?.items ?? [];
  const total = listQuery.data?.pagination?.total ?? 0;

  const table = useReactTable({
    columns,
    data: rows,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              variant="outline"
              type="button"
              disabled={listQuery.isFetching}
              onClick={handleRefresh}
            >
              <RefreshCw className={cn('size-4', listQuery.isFetching && 'animate-spin')} />
              Actualiser
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <ModuleKpiStatsRow items={kpiCards} />

        <DataGrid
          table={table}
          recordCount={total}
          isLoading={listQuery.isLoading}
          loadingMessage="Chargement des demandes…"
          emptyMessage={
            listQuery.isError
              ? 'Impossible de charger les demandes documentaires.'
              : 'Aucun dossier incomplet pour ce filtre.'
          }
          tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
          tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
        >
          <Card className="border-border shadow-none">
            <CardHeader className="space-y-4 py-4">
              <div className="relative w-full">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, e-mail, formation…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-10 ps-9"
                />
              </div>
            </CardHeader>
            <CardTable>
              <ScrollArea className="w-full">
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter className="border-t border-border px-5 py-3">
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      </Container>

      <DemandeDocumentSheet
        row={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        message={emailMessage}
        onMessageChange={setEmailMessage}
        sending={sendEmail.isPending}
        onSendEmail={(row, message) =>
          sendEmail.mutate({ dossierId: row.id, message })
        }
      />
    </>
  );
}
