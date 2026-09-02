'use client';

import type { ReactNode } from 'react';
import type { Table } from '@tanstack/react-table';
import Link from 'next/link';
import { Button } from '@repo/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardTitle,
} from '@repo/ui/card';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import {
  USER_MANAGEMENT_TABLE_LAYOUT,
  USER_MANAGEMENT_TABLE_CLASSNAMES,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { MODULE_LANDING_TABLE_CARD_CLASS } from './module-landing-panel-styles';
import { useTranslation } from '@/hooks/useTranslation';

type ModuleLandingDataGridShellProps<T extends object> = {
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  table: Table<T>;
  recordCount: number;
  isLoading?: boolean;
  headerExtra?: ReactNode;
};

export function ModuleLandingDataGridShell<T extends object>({
  title,
  viewAllHref,
  viewAllLabel,
  table,
  recordCount,
  isLoading,
  headerExtra,
}: ModuleLandingDataGridShellProps<T>) {
  const { t } = useTranslation();
  const resolvedViewAllLabel = viewAllLabel ?? t('datagrid.viewAll');
  return (
    <DataGrid
      table={table}
      recordCount={recordCount}
      isLoading={isLoading}
      tableLayout={{ ...USER_MANAGEMENT_TABLE_LAYOUT, cellBorder: true }}
      tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
    >
      <Card className={MODULE_LANDING_TABLE_CARD_CLASS}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-dashed py-3.5">
          <CardTitle className="text-base font-bold uppercase text-foreground">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {headerExtra}
            {viewAllHref ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-card hover:bg-secondary/50 font-bold text-2xs uppercase"
                asChild
              >
                <Link href={viewAllHref}>{resolvedViewAllLabel}</Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
