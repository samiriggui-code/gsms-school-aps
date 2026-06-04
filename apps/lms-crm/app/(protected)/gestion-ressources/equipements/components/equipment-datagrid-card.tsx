'use client';

import type { ReactNode } from 'react';
import type { Table } from '@tanstack/react-table';
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';

type EquipmentDataGridCardProps<T extends object> = {
  table: Table<T>;
  recordCount: number;
  isLoading?: boolean;
  toolbar: ReactNode;
  footer?: ReactNode;
  /** Remplace le tableau (ex. vue cartes) tout en gardant la carte bordée. */
  alternateBody?: ReactNode;
};

export function EquipmentDataGridCard<T extends object>({
  table,
  recordCount,
  isLoading,
  toolbar,
  footer,
  alternateBody,
}: EquipmentDataGridCardProps<T>) {
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      isLoading={isLoading}
      tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
      tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
    >
      <Card>
        {toolbar}
        {alternateBody ?? (
          <>
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter>{footer ?? <DataGridPagination />}</CardFooter>
          </>
        )}
      </Card>
    </DataGrid>
  );
}
