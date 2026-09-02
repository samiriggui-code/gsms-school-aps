'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Eye, User } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { getInitials } from '@/lib/helpers';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { Avatar, AvatarFallback } from '@repo/ui/avatar';
import { candidaturesListQueryKey } from '../constants/query-keys';

export type CandidatureListRow = {
  id: string;
  status: string;
  source: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    status: string;
    role?: { slug: string; name: string } | null;
  };
  formation: { id: string; name: string } | null;
  interestedSession: {
    id: string;
    dateDisplayLabel: string;
    formationId: string;
  } | null;
  updatedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'Attente CNAPS',
  CNAPS_APPROVED: 'CNAPS favorable',
  CNAPS_REJECTED: 'CNAPS refus',
  VALIDATED: 'Dossier validé',
  COMPLETED: 'Parcours terminé',
  REJECTED: 'Refusé',
  ARCHIVED: 'Archivé',
};

interface CandidaturesListProps {
  pipeline: 'pending' | 'validated';
  onOpenDetail: (row: CandidatureListRow) => void;
  onOpenUser: (user: Pick<CandidatureListRow['user'], 'id' | 'name' | 'email'>) => void;
  leaderSlot?: ReactNode;
  scopeTabs: ReactNode;
}

export function CandidaturesList({
  pipeline,
  onOpenDetail,
  onOpenUser,
  leaderSlot,
  scopeTabs,
}: CandidaturesListProps) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [searchQuery, setSearchQuery] = useState('');

  const queryKey = [...candidaturesListQueryKey, pipeline, pagination, searchQuery] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        pipeline,
        ...(searchQuery.trim() ? { query: searchQuery.trim() } : {}),
      });
      const res = await apiFetch(
        `/api/sections/gestion-ressources/rh/Candidatures?${params.toString()}`,
      );
      if (!res.ok) throw new Error('Échec du chargement des dossiers.');
      const json = await res.json();
      return {
        data: (json.data ?? []) as CandidatureListRow[],
        total: json.pagination?.total ?? 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const columns = useMemo<ColumnDef<CandidatureListRow>[]>(
    () => [
      {
        accessorKey: 'user.name',
        id: 'candidate',
        header: ({ column }) => <DataGridColumnHeader title="Candidat" column={column} />,
        cell: ({ row }) => {
          const u = row.original.user;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{getInitials(u.name || u.email)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <button
                  type="button"
                  className="font-semibold text-sm text-left hover:text-primary truncate"
                  onClick={() => onOpenDetail(row.original)}
                >
                  {u.name || '—'}
                </button>
                <span className="text-muted-foreground text-xs truncate">{u.email}</span>
              </div>
            </div>
          );
        },
        size: 260,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.fileStatus')} column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="light" className="font-medium text-xs">
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 160,
      },
      {
        id: 'formation',
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-foreground/90">
            {row.original.formation?.name ?? '—'}
          </span>
        ),
        size: 220,
      },
      {
        id: 'session',
        header: ({ column }) => <DataGridColumnHeader title="Session visée" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.interestedSession?.dateDisplayLabel ?? '—'}
          </span>
        ),
        size: 200,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Dossier candidature"
              onClick={() => onOpenDetail(row.original)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Fiche compte"
              onClick={() => onOpenUser(row.original.user)}
            >
              <User className="size-4" />
            </Button>
          </div>
        ),
        size: 100,
      },
    ],
    [onOpenDetail, onOpenUser],
  );

  const table = useReactTable({
    columns,
    data: data?.data ?? [],
    pageCount: Math.max(1, Math.ceil((data?.total ?? 0) / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    getRowId: (r) => r.id,
  });

  const title =
    pipeline === 'pending' ? 'Dossiers en cours' : 'Dossiers validés (aptes inscription)';
  const subtitle =
    pipeline === 'pending'
      ? 'Hors statuts « validé » et « archivé » — conformité et CNAPS à suivre ici.'
      : 'Dossiers conformes : vous pouvez les placer sur une session (onglet Inscrits).';

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="space-y-4 py-4">
          {leaderSlot}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('datagrid.search.byNameOrEmail')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="h-10 ps-9"
            />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="min-w-0">{scopeTabs}</div>
          </div>
        </CardHeader>
      </Card>
      <DataGrid
        table={table}
        recordCount={data?.total ?? 0}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
      >
        <Card className="border-border shadow-none">
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="border-t border-border">
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
    </>
  );
}
