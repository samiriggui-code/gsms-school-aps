'use client';

import type { ReactNode } from 'react';
import type { Table } from '@tanstack/react-table';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const PORTAL_TABLE_LAYOUT = {
  width: 'fixed' as const,
  cellBorder: true,
  headerSticky: true,
};

const PORTAL_TABLE_CLASSNAMES = {
  header: 'text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80',
  bodyRow: 'hover:bg-muted/40',
  bodyCell: 'text-[13px]',
};

type PortalDataGridProps<T extends object> = {
  table: Table<T>;
  recordCount: number;
  isLoading?: boolean;
  toolbar?: ReactNode;
  className?: string;
};

export function PortalDataGrid<T extends object>({
  table,
  recordCount,
  isLoading,
  toolbar,
  className,
}: PortalDataGridProps<T>) {
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      isLoading={isLoading}
      tableLayout={PORTAL_TABLE_LAYOUT}
      tableClassNames={PORTAL_TABLE_CLASSNAMES}
    >
      <div className={cn('overflow-hidden rounded-xl border bg-card shadow-xs', className)}>
        {toolbar ? <div className="border-b border-border/60 px-4 py-3">{toolbar}</div> : null}
        <ScrollArea>
          <DataGridTable />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="border-t border-border/60 px-4 py-2">
          <DataGridPagination />
        </div>
      </div>
    </DataGrid>
  );
}

export const INSTRUCTOR_DATAGRID_PAGE_SIZE = 10;
