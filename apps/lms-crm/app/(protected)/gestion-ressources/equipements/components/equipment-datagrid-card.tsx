'use client';

import type { ReactNode } from 'react';
import type { Table } from '@tanstack/react-table';
import { Card, CardFooter, CardTable } from '@repo/ui/card';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
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
    <>
      <Card className="mb-5 border-border shadow-none">{toolbar}</Card>
      <DataGrid
        table={table}
        recordCount={recordCount}
        isLoading={isLoading}
        tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
        tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
      >
        <Card className="border-border shadow-sm overflow-hidden">
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
    </>
  );
}
