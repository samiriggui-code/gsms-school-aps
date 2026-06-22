'use client';

import { type ComponentProps } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDatagridExport } from '@/hooks/use-datagrid-export';
import type { ListExportConfig } from '@/lib/datagrid/list-export';
import { cn } from '@/lib/utils';

type Props = {
  config: ListExportConfig;
  label?: string;
  className?: string;
  size?: ComponentProps<typeof Button>['size'];
  variant?: ComponentProps<typeof Button>['variant'];
};

export function DataGridExportMenu({
  config,
  label = 'Exporter',
  className,
  size = 'md',
  variant = 'outline',
}: Props) {
  const { exportAs, isExporting, exportingFormat } = useDatagridExport(config);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          type="button"
          className={cn('gap-2', className)}
          disabled={isExporting}
        >
          {isExporting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {label}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void exportAs('csv')}
          className="gap-2"
        >
          {exportingFormat === 'csv' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          CSV (toutes les lignes)
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void exportAs('excel')}
          className="gap-2"
        >
          {exportingFormat === 'excel' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="size-4" />
          )}
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isExporting}
          onClick={() => void exportAs('pdf')}
          className="gap-2"
        >
          {exportingFormat === 'pdf' ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileText className="size-4" />
          )}
          PDF (document)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
