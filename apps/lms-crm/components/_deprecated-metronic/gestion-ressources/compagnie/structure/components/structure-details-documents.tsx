'use client';

import { useTranslation } from '@/hooks/useTranslation';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Download, Eye, FileText, ShieldCheck } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';

type DocumentRow = {
  key: string;
  label: string;
  category: string;
  url?: string | null;
  icon?: ComponentType<{ className?: string }>;
  updatedAt?: string;
};

const getFileName = (url?: string | null) => {
  if (!url) return '';
  try {
    const clean = url.split('?')[0].split('#')[0];
    const parts = clean.split('/');
    return parts[parts.length - 1] || '';
  } catch {
    return '';
  }
};

const renderActionLink = (
  url: string | null | undefined,
  {
    label,
    icon: Icon,
    download,
  }: { label: string; icon: ComponentType<{ className?: string }>; download?: boolean },
) => {
  if (!url) {
    return (
      <Button variant="ghost" mode="icon" size="sm" disabled aria-label={label}>
        <Icon className="size-4" />
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" mode="icon" size="sm" aria-label={label}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        {...(download ? { download: '' } : {})}
      >
        <Icon className="size-4" />
      </a>
    </Button>
  );
};

export function StructureDetailsDocuments({ structure }: { structure: any }) {
  const { t } = useTranslation();
  const isSub = structure?.type === 'SUBCONTRACTOR';
  const updatedAt = structure?.updatedAt ? formatDateTime(new Date(structure.updatedAt)) : '-';

  const documents: DocumentRow[] = useMemo(() => {
    const rows: DocumentRow[] = [
      {
        key: 'documentInsurance',
        label: 'Attestation assurance',
        category: 'Assurance',
        url: structure?.documentInsurance,
        icon: ShieldCheck,
        updatedAt,
      },
      {
        key: 'documentKbis',
        label: 'Extrait Kbis',
        category: 'Legal',
        url: structure?.documentKbis,
        icon: FileText,
        updatedAt,
      },
    ];

    if (isSub) {
      rows.push({
        key: 'documentAgreement',
        label: 'Agrement CNAPS',
        category: 'Securite privee',
        url: structure?.documentAgreement,
        icon: ShieldCheck,
        updatedAt,
      });
    }

    return rows;
  }, [isSub, structure?.documentAgreement, structure?.documentInsurance, structure?.documentKbis, updatedAt]);

  const totalDocuments = documents.length;
  const availableDocuments = documents.filter((doc) => !!doc.url).length;
  const missingDocuments = totalDocuments - availableDocuments;
  const agreementDoc = documents.find((doc) => doc.key === 'documentAgreement');

  const stats = [
    { label: 'Documents totaux', value: String(totalDocuments) },
    { label: 'Documents charges', value: String(availableDocuments) },
    { label: 'Documents manquants', value: String(missingDocuments) },
    { label: 'Agrement CNAPS', value: isSub ? (agreementDoc?.url ? 'OK' : 'Manquant') : 'N/A' },
  ];

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<DocumentRow>[]>(
    () => [
      {
        id: 'document',
        accessorFn: (row) => row.label,
        header: ({ column }) => (
          <DataGridColumnHeader title="Document" column={column} />
        ),
        cell: (info) => {
          const row = info.row.original;
          const Icon = row.icon || FileText;
          const isAvailable = !!row.url;
          return (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'flex size-8 items-center justify-center rounded-lg border',
                  isAvailable ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-muted/40',
                )}
              >
                <Icon
                  className={cn(
                    'size-4',
                    isAvailable ? 'text-emerald-600' : 'text-muted-foreground',
                  )}
                />
              </span>
              <span className="font-medium text-foreground">{row.label}</span>
            </div>
          );
        },
        size: 240,
      },
      {
        id: 'category',
        accessorFn: (row) => row.category,
        header: ({ column }) => (
          <DataGridColumnHeader title="Categorie" column={column} />
        ),
        cell: (info) => (
          <Badge variant="secondary" appearance="light" className="text-[10px] font-semibold uppercase">
            {info.row.original.category}
          </Badge>
        ),
        size: 140,
      },
      {
        id: 'file',
        accessorFn: (row) => row.url,
        header: ({ column }) => (
          <DataGridColumnHeader title="Fichier" column={column} />
        ),
        cell: (info) => {
          const fileName = getFileName(info.row.original.url);
          return (
            <span
              className="block max-w-[220px] truncate text-muted-foreground"
              title={fileName || ''}
            >
              {fileName || '--'}
            </span>
          );
        },
        size: 260,
      },
      {
        id: 'status',
        accessorFn: (row) => row.url,
        header: ({ column }) => (
          <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />
        ),
        cell: (info) => {
          const isAvailable = !!info.row.original.url;
          return (
            <Badge
              variant={isAvailable ? 'success' : 'warning'}
              appearance="light"
              className="text-[10px] font-semibold uppercase"
            >
              {isAvailable ? 'Charge' : 'Manquant'}
            </Badge>
          );
        },
        size: 120,
      },
      {
        id: 'updated',
        accessorFn: (row) => row.updatedAt || '',
        header: ({ column }) => (
          <DataGridColumnHeader title="Mise a jour" column={column} />
        ),
        cell: (info) => (
          <span className="text-muted-foreground">
            {info.row.original.url ? info.row.original.updatedAt || '-' : '--'}
          </span>
        ),
        size: 170,
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <DataGridColumnHeader title="" column={column} />
        ),
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-end gap-1">
            {renderActionLink(info.row.original.url, { label: 'Consulter', icon: Eye })}
            {renderActionLink(info.row.original.url, { label: 'Telecharger', icon: Download, download: true })}
          </div>
        ),
        size: 90,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: documents,
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Documents legaux</h3>
          <p className="text-xs text-muted-foreground">
            Consulter et telecharger les documents charges.
          </p>
        </div>
        <Badge
          variant={availableDocuments ? 'success' : 'secondary'}
          appearance="light"
          className="text-[10px] font-semibold uppercase"
        >
          {availableDocuments ? 'Documents disponibles' : 'Aucun document'}
        </Badge>
      </div>

      <Card className="rounded-md mb-5 bg-accent/70 p-1">
        <CardContent className="rounded-md p-0 bg-background border border-border">
          <div className="grid sm:grid-cols-4 lg:gap-5">
            {stats.map((item, index) => (
              <div key={item.label} className={`flex flex-col px-4 py-3 ${index > 0 ? 'sm:border-s border-border' : ''}`}>
                <span className="text-2xl font-semibold text-foreground">{item.value}</span>
                <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataGrid
        table={table}
        recordCount={documents.length}
        tableLayout={{
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
          cellBorder: true,
        }}
        tableClassNames={{ base: 'min-w-[1000px]' }}
      >
        <Card className="border border-border/60 shadow-none">
          <CardTable>
            <ScrollArea className="w-full min-w-0">
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
    </div>
  );
}
