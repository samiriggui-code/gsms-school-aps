'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
  ToolbarActions,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type ArtifactRow = {
  id: string;
  status: string;
  useCase: string;
  targetEntityType: string | null;
  targetEntityId: string | null;
  createdAt: string;
  provider: string;
  model: string;
};

type ListResponse = {
  items: ArtifactRow[];
  pagination: { total: number; page: number; limit: number };
};

export default function IaBrouillonsPage() {
  const { title, description } = usePageToolbarMeta('/pilotage-supervision/ia/brouillons');
  const qc = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data, isLoading } = useQuery({
    queryKey: ['ia', 'artifacts', 'PROPOSED', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const page = pagination.pageIndex + 1;
      const res = await apiFetch(
        `/api/sections/pilotage-supervision/ia/artifacts?status=PROPOSED&page=${page}&limit=${pagination.pageSize}`,
      );
      if (!res.ok) throw new Error('Chargement brouillons impossible');
      return unwrapSectionApiData<ListResponse>(await res.json());
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      const res = await apiFetch(`/api/sections/pilotage-supervision/ia/artifacts/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error?.message ?? 'Revue impossible');
      }
      return unwrapSectionApiData(await res.json());
    },
    onSuccess: (_d, vars) => {
      toast.success(vars.approve ? 'Artefact approuvé' : 'Artefact rejeté');
      void qc.invalidateQueries({ queryKey: ['ia'] });
      void qc.invalidateQueries({ queryKey: ['pilotage-supervision', 'ia'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<ArtifactRow>[]>(
    () => [
      {
        accessorKey: 'useCase',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Cas d'usage" />,
        cell: ({ row }) => <span className="font-medium">{row.original.useCase}</span>,
      },
      {
        accessorKey: 'targetEntityType',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Cible" />,
        cell: ({ row }) =>
          row.original.targetEntityType
            ? `${row.original.targetEntityType}${row.original.targetEntityId ? ` · ${row.original.targetEntityId.slice(0, 8)}…` : ''}`
            : '—',
      },
      {
        accessorKey: 'provider',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Modèle" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.provider}/{row.original.model}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Créé" />,
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: fr }),
        size: 150,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={reviewMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                reviewMutation.mutate({ id: row.original.id, approve: true });
              }}
            >
              Approuver
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={reviewMutation.isPending}
              onClick={(e) => {
                e.stopPropagation();
                reviewMutation.mutate({ id: row.original.id, approve: false });
              }}
            >
              Rejeter
            </Button>
            {row.original.targetEntityType === 'Formation' && row.original.targetEntityId ? (
              <Button size="sm" variant="ghost" asChild>
                <Link
                  href={`/gestion-academique/vie-scolaire/formations?highlight=${row.original.targetEntityId}`}
                >
                  Ouvrir
                </Link>
              </Button>
            ) : null}
          </div>
        ),
        size: 280,
      },
    ],
    [reviewMutation],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <Container className="space-y-5">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{title}</ToolbarTitle>
          <ToolbarDescription>
            {description || 'File AiArtifact PROPOSED — revue humaine avant apply métier.'}
          </ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Badge variant="warning">{data?.pagination.total ?? 0} à valider</Badge>
        </ToolbarActions>
      </Toolbar>
      <ModuleDataGridShell
        table={table}
        recordCount={data?.pagination.total ?? 0}
        isLoading={isLoading}
        emptyMessage="Aucun brouillon PROPOSED"
      />
    </Container>
  );
}
