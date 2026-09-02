'use client';

import {
  FINANCE_DATAGRID_TABLE_LAYOUT,
  USER_MANAGEMENT_TABLE_CLASSNAMES,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleDataGridShell, type ModuleDataGridShellProps } from '@/components/common/module-data-grid-shell';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { Card, CardFooter, CardTable } from '@repo/ui/card';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { cn } from '@/lib/utils';

/** Shell DataGrid module finance — layout simplifié, sans pin/drag colonnes. */
export function FinanceModuleDataGrid<T extends object>({
  table,
  recordCount,
  isLoading,
  emptyMessage,
  onRowClick,
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
      tableLayout={FINANCE_DATAGRID_TABLE_LAYOUT}
      tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
    >
      <Card className={cn('border-border shadow-none', cardClassName)}>
        <CardTable className="overflow-hidden">
          <ScrollArea className="w-full">
            <div className="min-w-[960px]">
              <DataGridTable />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter className="border-t border-border">
          {footer ?? <DataGridPagination />}
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
