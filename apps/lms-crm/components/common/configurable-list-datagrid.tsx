'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  OnChangeFn,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { cn } from '@/lib/utils';

export type ConfigurableListColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: unknown, row: Record<string, unknown>) => string;
  cell?: (row: Record<string, unknown>) => ReactNode;
};

type ConfigurableListDataGridProps = {
  columns: ConfigurableListColumn[];
  rows: Record<string, unknown>[];
  recordCount: number;
  isLoading?: boolean;
  emptyMessage: string;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  manualPagination?: boolean;
  onRowClick?: (row: Record<string, unknown>) => void;
  renderActions?: (row: Record<string, unknown>) => ReactNode;
  toolbar?: ReactNode;
  header?: { title: string; subtitle?: string };
};

function cellAlignClass(align?: 'left' | 'right' | 'center') {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

/** Liste dynamique (colonnes config) — workspaces, CRUD simples. */
export function ConfigurableListDataGrid({
  columns,
  rows,
  recordCount,
  isLoading,
  emptyMessage,
  pagination,
  onPaginationChange,
  manualPagination = true,
  onRowClick,
  renderActions,
  toolbar,
  header,
}: ConfigurableListDataGridProps) {
  const tableColumns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const defs: ColumnDef<Record<string, unknown>>[] = columns.map((col) => ({
      id: col.key,
      accessorKey: col.key,
      header: ({ column }) => <DataGridColumnHeader title={col.label} column={column} />,
      cell: ({ row }) => {
        if (col.cell) return col.cell(row.original);
        const raw = row.original[col.key];
        const text = col.format ? col.format(raw, row.original) : raw == null ? '—' : String(raw);
        return <span className={cn('block', cellAlignClass(col.align))}>{text}</span>;
      },
      enableSorting: false,
    }));

    if (renderActions) {
      defs.push({
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            {renderActions(row.original)}
          </div>
        ),
        enableSorting: false,
        size: 120,
      });
    }

    return defs;
  }, [columns, renderActions]);

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    pageCount: Math.max(1, Math.ceil(recordCount / pagination.pageSize)),
    getRowId: (row, index) => String(row.id ?? index),
    state: { pagination },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination,
  });

  return (
    <>
      {toolbar}
      <ModuleDataGridShell
        table={table}
        recordCount={recordCount}
        isLoading={isLoading}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        header={header}
      />
    </>
  );
}
