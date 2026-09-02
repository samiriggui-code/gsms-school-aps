'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Calendar, Eye } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { useRecentEquipmentAffectations, type EquipmentAffectationRow } from '@/lib/hooks/equipment';
import { formatDateTime } from '@/lib/helpers';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { EquipmentThumbnail } from '../inventaire/components/equipment-thumbnail';

export function EquipmentRecentAffectationsTable() {
  const { data, isLoading } = useRecentEquipmentAffectations(50);
  const rows = useMemo(() => data ?? [], [data]);
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const columns = useMemo<ColumnDef<EquipmentAffectationRow>[]>(
    () => [
      {
        id: 'equipment',
        header: ({ column }) => <DataGridColumnHeader title="Équipement" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-0">
            <EquipmentThumbnail
              avatar={row.original.equipmentAvatar}
              label={row.original.equipmentLabel}
              className="size-10 shrink-0 rounded-md border border-border/50"
            />
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-foreground truncate">
                {row.original.equipmentLabel}
              </span>
              <span className="text-2xs text-muted-foreground italic truncate">
                {row.original.equipmentSerial}
              </span>
            </div>
          </div>
        ),
        size: 240,
      },
      {
        accessorKey: 'sessionTitle',
        header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
        cell: ({ row }) => (
          <span className="font-bold text-xs uppercase text-foreground/90 line-clamp-2">
            {row.original.sessionTitle}
          </span>
        ),
        size: 200,
      },
      {
        id: 'period',
        header: ({ column }) => <DataGridColumnHeader title="Période" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="size-3 shrink-0" />
              {formatDateTime(row.original.startDate)}
            </span>
            <span className="pl-4">→ {formatDateTime(row.original.endDate)}</span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'clientSiteName',
        header: ({ column }) => <DataGridColumnHeader title="Site" column={column} />,
        cell: ({ row }) => (
          <span className="text-2xs text-muted-foreground uppercase">
            {row.original.clientSiteName || 'Non renseigné'}
          </span>
        ),
        size: 140,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" asChild>
              <Link
                href={`/gestion-ressources/equipements/inventaire?equipmentId=${row.original.equipmentId}`}
              >
                <Eye className="size-4" />
              </Link>
            </Button>
          </div>
        ),
        size: 70,
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
      title="Dernières affectations"
      viewAllHref="/gestion-ressources/equipements/affectations"
      table={table}
      recordCount={rows.length}
      isLoading={isLoading}
    />
  );
}
