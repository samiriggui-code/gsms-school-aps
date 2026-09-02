'use client';

import type { ReactNode } from 'react';
import type { Table } from '@tanstack/react-table';
import { Card, CardFooter, CardHeader, CardTable, CardTitle } from '@repo/ui/card';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { MODULE_LANDING_TABLE_CARD_CLASS } from '@/components/common/module-landing-panel-styles';
import { cn } from '@/lib/utils';

export type ModuleDataGridShellProps<T extends object> = {
  table: Table<T>;
  recordCount: number;
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  header?: { title: string; subtitle?: string };
  cardClassName?: string;
  footer?: ReactNode;
};

/** Shell DataGrid standard — référence unique pour listes module (finance, équipements, rapports…). */
export function ModuleDataGridShell<T extends object>({
  table,
  recordCount,
  isLoading,
  emptyMessage,
  onRowClick,
  header,
  cardClassName,
  footer,
}: ModuleDataGridShellProps<T>) {
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      isLoading={isLoading}
      emptyMessage={emptyMessage}
      onRowClick={onRowClick}
      tableLayout={{ ...USER_MANAGEMENT_TABLE_LAYOUT, cellBorder: true }}
      tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
    >
      <Card
        className={cn(header ? MODULE_LANDING_TABLE_CARD_CLASS : 'border-border shadow-none', cardClassName)}
      >
        {header ? (
          <CardHeader className="border-b border-dashed py-3.5">
            <CardTitle className="text-base font-bold uppercase text-foreground">{header.title}</CardTitle>
            {header.subtitle ? (
              <p className="text-xs font-normal text-muted-foreground">{header.subtitle}</p>
            ) : null}
          </CardHeader>
        ) : null}
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter className={cn('border-t border-border', !footer && 'border-t')}>
          {footer ?? <DataGridPagination />}
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
