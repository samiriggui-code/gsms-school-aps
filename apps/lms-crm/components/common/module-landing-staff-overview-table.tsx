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
import { Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from './module-landing-datagrid-shell';

function normalizeStaff(payload: unknown): any[] {
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data as any[];
  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.items)) return nested.items as any[];
  }
  if (Array.isArray(record.items)) return record.items as any[];
  return [];
}

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'success';
    case 'ABSENT':
      return 'warning';
    case 'INACTIVE':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusLabel = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return 'ACTIF';
    case 'ABSENT':
      return 'ABSENT';
    case 'INACTIVE':
      return 'INACTIF';
    default:
      return status || 'INCONNU';
  }
};

type ModuleLandingStaffOverviewTableProps = {
  title?: string;
  viewAllHref?: string;
  fetchUrl?: string;
};

export function ModuleLandingStaffOverviewTable({
  title = 'Collaborateurs récents',
  viewAllHref = '/gestion-ressources/rh/collaborateurs',
  fetchUrl = '/api/sections/gestion-ressources/rh/collaborateurs/?limit=50&sort=createdAt&dir=desc',
}: ModuleLandingStaffOverviewTableProps) {
  const { t } = useTranslation();
  const [staff, setStaff] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiFetch(fetchUrl);
        if (response.ok) {
          const res = await response.json();
          setStaff(normalizeStaff(res));
        }
      } catch (error) {
        console.error('Erreur chargement collaborateurs récents:', error);
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [fetchUrl]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => <DataGridColumnHeader title="ID" column={column} />,
        cell: ({ row }) => (
          <span className="font-bold text-2sm text-muted-foreground">
            {row.original.id?.substring(0, 8)}
          </span>
        ),
        size: 90,
      },
      {
        id: 'collaborateur',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.staffMember')} column={column} />,
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9 border border-border/50">
                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                  {member.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-foreground truncate">{member.name}</span>
                <span className="text-2xs text-muted-foreground italic">
                  Inscrit le{' '}
                  {member.createdAt
                    ? format(new Date(member.createdAt), 'dd/MM/yyyy', { locale: fr })
                    : '—'}
                </span>
              </div>
            </div>
          );
        },
        size: 220,
      },
      {
        id: 'role',
        header: ({ column }) => <DataGridColumnHeader title="Poste & Dépt" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground/80">
              {row.original.jobFunction || 'Agent'}
            </span>
            <span className="text-2xs text-muted-foreground uppercase">
              {row.original.userCategory || 'Opérations'}
            </span>
          </div>
        ),
        size: 160,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => (
          <Badge
            appearance="light"
            className="font-bold uppercase text-2xs"
            color={getStatusColor(row.original.status) as 'success' | 'warning' | 'destructive' | 'secondary'}
          >
            {getStatusLabel(row.original.status)}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: () => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" asChild>
              <a href={viewAllHref}>
                <Eye className="size-4" />
              </a>
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
    [viewAllHref],
  );

  const table = useReactTable({
    data: staff,
    columns,
    pageCount: Math.max(1, Math.ceil(staff.length / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <ModuleLandingDataGridShell
      title={title}
      viewAllHref={viewAllHref}
      table={table}
      recordCount={staff.length}
      isLoading={isLoading}
    />
  );
}
