'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';

type RecentCandidature = {
  id: string;
  status: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    status: string;
  };
  formation: { id: string; name: string | null } | null;
};

const DOSSIER_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'CNAPS',
  CNAPS_APPROVED: 'CNAPS favorable',
  CNAPS_REJECTED: 'CNAPS refus',
  VALIDATED: 'Validé',
  REJECTED: 'Refusé',
  ARCHIVED: 'Archivé',
};

function dossierBadgeVariant(status: string): 'destructive' | 'warning' | 'success' | 'secondary' {
  if (status === 'VALIDATED') return 'success';
  if (status === 'REJECTED' || status === 'CNAPS_REJECTED') return 'destructive';
  if (status === 'PENDING_CNAPS' || status === 'MISSING_DOCUMENTS') return 'warning';
  return 'secondary';
}

export function VieScolaireOverviewTable() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<RecentCandidature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch(
          '/api/sections/gestion-academique/vie-scolaire/stats?months=12',
        );
        if (response.ok) {
          const res = await response.json();
          const list = res?.data?.recentCandidatures;
          setRows(Array.isArray(list) ? list : []);
        }
      } catch (error) {
        console.error('Erreur chargement dossiers récents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const columns = useMemo<ColumnDef<RecentCandidature>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataGridColumnHeader title="ID" column={column} />,
        cell: ({ row }) => (
          <span className="font-bold text-2sm text-muted-foreground">
            {row.original.id.substring(0, 8)}
          </span>
        ),
        size: 90,
      },
      {
        id: 'apprenant',
        header: ({ column }) => <DataGridColumnHeader title="Apprenant" column={column} />,
        cell: ({ row }) => {
          const name = row.original.user?.name || row.original.user?.email || '—';
          const initials = name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border/50">
                {row.original.user?.avatar ? (
                  <AvatarImage src={row.original.user.avatar} alt={name} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{name}</span>
                <span className="text-2xs text-muted-foreground italic">
                  Mis à jour le{' '}
                  {format(new Date(row.original.updatedAt), 'dd/MM/yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          );
        },
        size: 220,
      },
      {
        id: 'formation',
        header: ({ column }) => <DataGridColumnHeader title="Formation visée" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm font-medium text-foreground/80">
            {row.original.formation?.name ?? '—'}
          </span>
        ),
        size: 180,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.fileStatus')} column={column} />,
        cell: ({ row }) => (
          <Badge
            appearance="light"
            className="font-bold uppercase text-2xs"
            variant={dossierBadgeVariant(row.original.status)}
          >
            {DOSSIER_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 140,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: () => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 hover:text-primary"
              asChild
            >
              <Link href="/gestion-academique/vie-scolaire/etudiants">
                <Eye className="size-4" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="size-8 hover:bg-secondary">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        ),
        size: 90,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: Math.max(1, Math.ceil(rows.length / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <ModuleLandingDataGridShell
      title="Dossiers récents"
      viewAllHref="/gestion-academique/vie-scolaire/etudiants"
      table={table}
      recordCount={rows.length}
      isLoading={isLoading}
    />
  );
}
