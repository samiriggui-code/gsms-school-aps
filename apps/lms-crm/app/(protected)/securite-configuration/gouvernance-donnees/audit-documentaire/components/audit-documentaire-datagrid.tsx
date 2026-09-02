'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { ExternalLink, FileText, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { Container } from '@/components/common/container';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/lib/helpers';
import {
  fetchDocumentAuditTrail,
  type DocumentAuditRow,
  type DocumentAuditSource,
} from '@/lib/governance/document-audit-api';
import {
  labelDocumentAuditEntity,
  labelDocumentAuditEvent,
  labelDocumentAuditModule,
} from '@/lib/governance/document-audit-labels';
import { AuditDocumentaireCallout } from './audit-documentaire-callout';

const PAGE_SIZE = 15;
const ALL = '__all__';

export function AuditDocumentaireDatagrid() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta(
    '/securite-configuration/gouvernance-donnees/audit-documentaire',
  );

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [source, setSource] = useState<DocumentAuditSource | 'all'>('all');
  const [eventType, setEventType] = useState<string>(ALL);
  const [module, setModule] = useState<string>(ALL);
  const [entityType, setEntityType] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [debouncedSearch, source, eventType, module, entityType, dateFrom, dateTo]);

  const listQuery = useQuery({
    queryKey: [
      'governance-document-audit',
      pagination.pageIndex,
      pagination.pageSize,
      debouncedSearch,
      source,
      eventType,
      module,
      entityType,
      dateFrom,
      dateTo,
    ],
    queryFn: () =>
      fetchDocumentAuditTrail({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        q: debouncedSearch || undefined,
        source,
        eventType: eventType === ALL ? undefined : eventType,
        module: module === ALL ? undefined : module,
        entityType: entityType === ALL ? undefined : entityType,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
    staleTime: 30_000,
  });

  const rows = listQuery.data?.data ?? [];
  const total = listQuery.data?.pagination.total ?? 0;
  const filterOptions = listQuery.data?.filters;

  const sourceBadge = (value: DocumentAuditRow['source']) => {
    const key = `workspace.gouvernance-audit.sourceBadges.${value}` as const;
    return (
      <Badge variant={value === 'compliance' ? 'secondary' : 'outline'} appearance="light" className="text-[10px]">
        {t(key)}
      </Badge>
    );
  };

  const kpiCards = useMemo(
    () => [
      {
        label: t('workspace.gouvernance-audit.stats.total.label'),
        value: listQuery.isLoading ? '—' : (listQuery.data?.stats.total ?? 0),
        subtitle: t('workspace.gouvernance-audit.stats.total.subtitle'),
        icon: FileText,
      },
      {
        label: t('workspace.gouvernance-audit.stats.compliance.label'),
        value: listQuery.isLoading ? '—' : (listQuery.data?.stats.compliance ?? 0),
        subtitle: t('workspace.gouvernance-audit.stats.compliance.subtitle'),
        icon: ShieldCheck,
      },
      {
        label: t('workspace.gouvernance-audit.stats.fileLifecycle.label'),
        value: listQuery.isLoading ? '—' : (listQuery.data?.stats.fileLifecycle ?? 0),
        subtitle: t('workspace.gouvernance-audit.stats.fileLifecycle.subtitle'),
        icon: FileText,
      },
      {
        label: t('workspace.gouvernance-audit.stats.last7Days.label'),
        value: listQuery.isLoading ? '—' : (listQuery.data?.stats.last7Days ?? 0),
        subtitle: t('workspace.gouvernance-audit.stats.last7Days.subtitle'),
        icon: RefreshCw,
      },
      {
        label: t('workspace.gouvernance-audit.stats.today.label'),
        value: listQuery.isLoading ? '—' : (listQuery.data?.stats.today ?? 0),
        subtitle: t('workspace.gouvernance-audit.stats.today.subtitle'),
        icon: FileText,
      },
    ],
    [listQuery.data?.stats, listQuery.isLoading, t],
  );

  const columns = useMemo<ColumnDef<DocumentAuditRow>[]>(
    () => [
      {
        accessorKey: 'occurredAt',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.date')} />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
            {formatDateTime(row.original.occurredAt)}
          </span>
        ),
        size: 150,
      },
      {
        accessorKey: 'eventLabel',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.event')} />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-[120px] flex-col gap-1">
            <span className="text-sm font-medium">{row.original.eventLabel}</span>
            {sourceBadge(row.original.source)}
          </div>
        ),
      },
      {
        accessorKey: 'documentLabel',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.document')} />
        ),
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[200px] text-sm font-medium">
            {row.original.documentLabel}
          </span>
        ),
      },
      {
        accessorKey: 'module',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.module')} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] uppercase">
            {labelDocumentAuditModule(row.original.module)}
          </Badge>
        ),
      },
      {
        id: 'entity',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.entity')} />
        ),
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[140px] text-xs text-muted-foreground">
            {labelDocumentAuditEntity(row.original.entityType)}
            {row.original.entityId ? ` · ${row.original.entityId.slice(0, 8)}…` : ''}
          </span>
        ),
      },
      {
        accessorKey: 'actorName',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.actor')} />
        ),
        cell: ({ row }) => (
          <span className="max-w-[140px] truncate text-sm">{row.original.actorName ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'detail',
        header: ({ column }) => (
          <DataGridColumnHeader column={column} title={t('workspace.gouvernance-audit.columns.detail')} />
        ),
        cell: ({ row }) => (
          <span className="line-clamp-2 max-w-[220px] text-xs text-muted-foreground">
            {row.original.detail}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) =>
          row.original.fileAssetId ? (
            <Button variant="ghost" size="sm" className="h-8 gap-1" asChild>
              <Link
                href={`/securite-configuration/gouvernance-donnees/storage?dossierId=${row.original.entityId ?? ''}`}
              >
                <ExternalLink className="size-3.5" />
                {t('workspace.gouvernance-audit.columns.openGed')}
              </Link>
            </Button>
          ) : null,
      },
    ],
    [t],
  );

  const table = useReactTable({
    data: rows,
    columns,
    pageCount: Math.ceil(total / pagination.pageSize) || 1,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  const paginationInfo = t('datagrid.paginationInfo')
    .replace('{{from}}', '{from}')
    .replace('{{to}}', '{to}')
    .replace('{{count}}', '{count}');

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              variant="outline"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              <RefreshCw className={`size-4 ${listQuery.isFetching ? 'animate-spin' : ''}`} />
              {t('workspace.gouvernance-audit.refresh')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <AuditDocumentaireCallout />
        <ModuleKpiStatsRow items={kpiCards} />

        <DataGrid
          table={table}
          recordCount={total}
          isLoading={listQuery.isLoading}
          loadingMessage={t('workspace.gouvernance-audit.loading')}
          emptyMessage={t('workspace.gouvernance-audit.empty')}
          tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
          tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
        >
          <Card className="border-border shadow-none">
            <CardHeader className="space-y-4 border-b border-border/60 py-4">
              <div className="relative w-full">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="h-10 ps-9"
                  placeholder={t('workspace.gouvernance-audit.filters.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={source}
                  onValueChange={(v) => setSource(v as DocumentAuditSource | 'all')}
                >
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder={t('workspace.gouvernance-audit.filters.source')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('workspace.gouvernance-audit.filters.sources.all')}</SelectItem>
                    <SelectItem value="compliance">
                      {t('workspace.gouvernance-audit.filters.sources.compliance')}
                    </SelectItem>
                    <SelectItem value="file">{t('workspace.gouvernance-audit.filters.sources.file')}</SelectItem>
                    <SelectItem value="version">
                      {t('workspace.gouvernance-audit.filters.sources.version')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger className="h-9 w-[180px]">
                    <SelectValue placeholder={t('workspace.gouvernance-audit.filters.eventType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('workspace.gouvernance-audit.filters.allEventTypes')}</SelectItem>
                    {(filterOptions?.eventTypes ?? []).map((et) => (
                      <SelectItem key={et} value={et}>
                        {labelDocumentAuditEvent(et)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={module} onValueChange={setModule}>
                  <SelectTrigger className="h-9 w-[140px]">
                    <SelectValue placeholder={t('workspace.gouvernance-audit.filters.module')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('workspace.gouvernance-audit.filters.allModules')}</SelectItem>
                    {(filterOptions?.modules ?? []).map((m) => (
                      <SelectItem key={m} value={m}>
                        {labelDocumentAuditModule(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={entityType} onValueChange={setEntityType}>
                  <SelectTrigger className="h-9 w-[160px]">
                    <SelectValue placeholder={t('workspace.gouvernance-audit.filters.entity')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('workspace.gouvernance-audit.filters.allEntities')}</SelectItem>
                    {(filterOptions?.entityTypes ?? []).map((et) => (
                      <SelectItem key={et} value={et}>
                        {labelDocumentAuditEntity(et)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="h-9 w-[150px]"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  aria-label={t('workspace.gouvernance-audit.filters.dateFrom')}
                />
                <Input
                  type="date"
                  className="h-9 w-[150px]"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  aria-label={t('workspace.gouvernance-audit.filters.dateTo')}
                />
              </div>
            </CardHeader>
            <CardTable>
              <ScrollArea className="w-full">
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter className="border-t border-border px-5 py-3">
              <DataGridPagination
                rowsPerPageLabel={t('datagrid.rowsPerPage')}
                prevPageLabel={t('datagrid.prevPage')}
                nextPageLabel={t('datagrid.nextPage')}
                info={paginationInfo}
              />
            </CardFooter>
          </Card>
        </DataGrid>
      </Container>
    </>
  );
}
