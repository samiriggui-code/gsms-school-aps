'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sessionHasPermission, CRM_PERMISSION } from '@/lib/auth/crm-permissions';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  ExternalLink,
  Inbox,
  MailOpen,
  RefreshCw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { usePusher } from '@/hooks/use-pusher';
import { PILOTAGE_PAGE_INTRO } from '@/lib/pilotage/page-copy';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import {
  fetchNotifications,
  markNotificationRead,
  type InAppNotificationItem,
} from '@/lib/topbar-api';
import type { PilotageModuleId } from '@/lib/pilotage/modules';
import { moduleLabelFromKey } from '@/lib/pilotage/modules';
import {
  PilotageModuleTabs,
  pilotageModuleKeyPrefix,
} from './pilotage-module-tabs';
import { PilotageAlertDetailSheet } from './pilotage-alert-detail-sheet';
import { PilotagePageIntro } from './pilotage-page-intro';
import { PilotageAlertsPermissionMatrix } from './pilotage-alerts-permission-matrix';

const PAGE_SIZE = 10;

type SeverityFilter = 'all' | 'CRITICAL' | 'WARNING' | 'INFO';

function severityVariant(severity: InAppNotificationItem['severity']) {
  if (severity === 'CRITICAL') return 'destructive' as const;
  if (severity === 'WARNING') return 'warning' as const;
  return 'secondary' as const;
}

function severityLabel(severity: InAppNotificationItem['severity']) {
  if (severity === 'CRITICAL') return 'Critique';
  if (severity === 'WARNING') return 'Attention';
  if (severity === 'INFO') return 'Info';
  return '—';
}

export function PilotageAlertsDatagrid() {
  const { title, description } = usePageToolbarMeta('/pilotage-supervision/pilotage/alertes');
  const intro = PILOTAGE_PAGE_INTRO.alertes;
  const { data: session } = useSession();
  const canViewPilotage = sessionHasPermission(session, CRM_PERMISSION.pilotageView);
  const queryClient = useQueryClient();
  const [moduleId, setModuleId] = useState<PilotageModuleId>('all');
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [severity, setSeverity] = useState<SeverityFilter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<InAppNotificationItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const modulePrefix = pilotageModuleKeyPrefix(moduleId);

  const listQuery = useQuery({
    queryKey: [
      'pilotage-alerts',
      modulePrefix,
      tab,
      query,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchNotifications({
        tab,
        query,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        scope: 'crm-user',
        module: modulePrefix,
      }),
    refetchInterval: 30_000,
    enabled: canViewPilotage,
  });

  usePusher(session?.user?.id, () => {
    void queryClient.invalidateQueries({ queryKey: ['pilotage-alerts'] });
    void queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
  });

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [moduleId, tab, query, severity]);

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pilotage-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
    },
  });

  function openDetail(item: InAppNotificationItem) {
    setSelected(item);
    setSheetOpen(true);
  }

  function markReadIfNeeded(item: InAppNotificationItem, force = false) {
    if (!item.unread && !force) return;
    markRead.mutate(item.id);
  }

  const stats = listQuery.data?.stats;
  const kpiCards = useMemo(
    () => [
      {
        label: 'Alertes actives',
        value: stats?.active ?? '—',
        subtitle: 'Non archivées',
        icon: Inbox,
      },
      {
        label: 'Non lues',
        value: stats?.unread ?? listQuery.data?.unreadCount ?? '—',
        subtitle: 'À traiter en priorité',
        icon: Bell,
      },
      {
        label: 'Critiques',
        value: stats?.bySeverity?.CRITICAL ?? '—',
        subtitle: 'Sévérité haute',
        icon: ShieldAlert,
      },
      {
        label: "Aujourd'hui",
        value: stats?.today ?? '—',
        subtitle: 'Reçues ce jour',
        icon: CalendarClock,
      },
      {
        label: 'Attention',
        value: stats?.bySeverity?.WARNING ?? '—',
        subtitle: 'À surveiller',
        icon: AlertTriangle,
      },
    ],
    [listQuery.data?.unreadCount, stats],
  );

  const columns = useMemo<ColumnDef<InAppNotificationItem>[]>(
    () => [
      {
        id: 'severity',
        header: ({ column }) => <DataGridColumnHeader title="Niveau" column={column} />,
        cell: ({ row }) => (
          <Badge variant={severityVariant(row.original.severity)} appearance="light" className="text-[10px] font-bold uppercase">
            {severityLabel(row.original.severity)}
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'module',
        header: ({ column }) => <DataGridColumnHeader title="Module" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground/80">
            {moduleLabelFromKey(row.original.moduleKey)}
          </span>
        ),
        size: 140,
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: ({ column }) => <DataGridColumnHeader title="Alerte" column={column} />,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <button type="button" className="min-w-0 max-w-md text-start" onClick={() => openDetail(item)}>
              <p className={cn('truncate text-sm font-semibold hover:text-primary', item.unread ? 'text-foreground' : 'text-foreground/80')}>
                {item.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
            </button>
          );
        },
        size: 300,
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: ({ column }) => <DataGridColumnHeader title="Catégorie" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" appearance="light" className="text-[10px] uppercase">
            {row.original.category}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant={row.original.unread ? 'primary' : 'secondary'} appearance="light" className="text-[10px] uppercase">
            {row.original.unread ? 'Non lue' : 'Lue'}
          </Badge>
        ),
        size: 90,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
        size: 160,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1 pe-2">
              {item.href ? (
                <Button variant="ghost" mode="icon" className="size-8" asChild title="Ouvrir le module">
                  <Link href={item.href} onClick={() => markReadIfNeeded(item)}>
                    <ExternalLink className="size-4 text-muted-foreground" />
                  </Link>
                </Button>
              ) : null}
              {item.unread ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    markReadIfNeeded(item, true);
                    toast.success('Alerte marquée comme lue');
                  }}
                >
                  <CheckCheck className="size-3.5 me-1" />
                  Lue
                </Button>
              ) : null}
            </div>
          );
        },
        size: 130,
      },
    ],
    [],
  );

  const rawRows = listQuery.data?.items ?? [];
  const rows = useMemo(() => {
    if (severity === 'all') return rawRows;
    return rawRows.filter((r) => r.severity === severity);
  }, [rawRows, severity]);

  const total = listQuery.data?.pagination?.total ?? rows.length;

  const table = useReactTable({
    columns,
    data: rows,
    pageCount: Math.max(1, Math.ceil(total / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
  });

  return (
    <>
      {!canViewPilotage ? (
        <Container className="py-16 text-center text-sm text-muted-foreground">
          Vous n&apos;avez pas la permission d&apos;accéder au registre des alertes pilotage.
        </Container>
      ) : (
      <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" type="button" disabled={listQuery.isFetching} onClick={() => listQuery.refetch()}>
              <RefreshCw className={cn('size-4', listQuery.isFetching && 'animate-spin')} />
              Actualiser
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <ModuleKpiStatsRow items={kpiCards} />

        <PilotageModuleTabs value={moduleId} onChange={setModuleId} />

        <PilotagePageIntro lead={intro.lead} detail={intro.detail} />

        <PilotageAlertsPermissionMatrix />

        <Card className="mb-5 border-border shadow-none">
          <CardHeader className="space-y-4 py-4">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">Registre des alertes opérationnelles</h3>
              <p className="text-xs text-muted-foreground">
                Filtrez par module, sévérité ou état de lecture — synchronisé avec la cloche du CRM.
              </p>
            </div>

            <div className="relative w-full">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une alerte, un module, une catégorie…"
                className="h-10 ps-9"
              />
            </div>

            <div
              role="tablist"
              aria-label="Filtres alertes"
              className="flex h-auto min-h-10 w-full min-w-0 flex-wrap justify-start gap-1 rounded-lg border border-border bg-accent p-1"
            >
              {(['all', 'unread'] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={tab === value}
                  size="sm"
                  variant={tab === value ? 'secondary' : 'ghost'}
                  className="text-xs sm:text-sm"
                  onClick={() => setTab(value)}
                >
                  {value === 'all' ? (
                    <>
                      <MailOpen className="size-3.5 me-1" />
                      Toutes
                    </>
                  ) : (
                    <>
                      <Bell className="size-3.5 me-1" />
                      Non lues
                      {listQuery.data?.unreadCount ? ` (${listQuery.data.unreadCount})` : ''}
                    </>
                  )}
                </Button>
              ))}
            </div>

            <ScrollArea className="w-full">
              <div className="flex w-max gap-1 pb-1">
                {(['all', 'CRITICAL', 'WARNING', 'INFO'] as const).map((value) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={severity === value ? 'secondary' : 'ghost'}
                    className="text-xs"
                    onClick={() => setSeverity(value)}
                  >
                    {value === 'all' ? 'Toutes sévérités' : severityLabel(value)}
                    {value !== 'all' && stats?.bySeverity?.[value] != null ? ` · ${stats.bySeverity[value]}` : ''}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardHeader>
        </Card>

        <DataGrid
          table={table}
          recordCount={total}
          isLoading={listQuery.isLoading}
          loadingMessage="Chargement des alertes…"
          emptyMessage={listQuery.isError ? 'Impossible de charger les alertes.' : 'Aucune alerte pour ce filtre.'}
          tableLayout={{ ...USER_MANAGEMENT_TABLE_LAYOUT, headerSticky: true, dense: false }}
          tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
        >
          <Card className="border-border shadow-sm overflow-hidden">
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter className="border-t border-border px-4 py-3">
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      </Container>

      <PilotageAlertDetailSheet
        alert={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onMarkRead={(id) => {
          markRead.mutate(id);
          toast.success('Alerte marquée comme lue');
        }}
      />
      </>
      )}
    </>
  );
}
