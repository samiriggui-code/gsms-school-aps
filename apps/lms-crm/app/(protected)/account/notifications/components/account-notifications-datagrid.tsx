'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Archive,
  Bell,
  CheckCheck,
  ExternalLink,
  Inbox,
  MailOpen,
  Search,
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
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import {
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import {
  archiveAllNotifications,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type InAppNotificationItem,
} from '@/lib/topbar-api';

const ACCOUNT_NOTIFICATIONS_PAGE_SIZE = 10;

const NOTIFICATION_CATEGORIES = ['SYSTEM', 'TICKET', 'FINANCE', 'ACADEMIC', 'TEAM'] as const;

function categoryBadgeVariant(
  category: string,
): 'primary' | 'info' | 'success' | 'destructive' | 'secondary' | 'warning' {
  switch (category) {
    case 'TICKET':
      return 'info';
    case 'FINANCE':
      return 'warning';
    case 'ACADEMIC':
      return 'primary';
    case 'TEAM':
      return 'success';
    default:
      return 'secondary';
  }
}

function statusBadgeVariant(item: InAppNotificationItem): 'primary' | 'secondary' | 'outline' {
  if (item.archivedAt) return 'outline';
  if (item.unread) return 'primary';
  return 'secondary';
}

export function AccountNotificationsDatagrid() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: ACCOUNT_NOTIFICATIONS_PAGE_SIZE,
  });

  const listQuery = useQuery({
    queryKey: [
      'account-notifications',
      tab,
      query,
      category,
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: () =>
      fetchNotifications({
        tab,
        query,
        category,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
  });

  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      toast.success(t('topbar.notifications.readAllSuccess'));
      queryClient.invalidateQueries({ queryKey: ['account-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
    },
  });

  const archiveAll = useMutation({
    mutationFn: archiveAllNotifications,
    onSuccess: () => {
      toast.success(t('topbar.notifications.archivedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['account-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
    },
  });

  const stats = listQuery.data?.stats;
  const kpiCards = useMemo(
    () => [
      {
        label: t('account.notifications.page.kpi.active'),
        value: stats?.active ?? '—',
        subtitle: t('account.notifications.page.kpi.activeHint'),
        icon: Inbox,
      },
      {
        label: t('account.notifications.page.kpi.unread'),
        value: stats?.unread ?? listQuery.data?.unreadCount ?? '—',
        subtitle: t('account.notifications.page.kpi.unreadHint'),
        icon: Bell,
      },
      {
        label: t('account.notifications.page.kpi.read'),
        value: stats?.read ?? '—',
        subtitle: t('account.notifications.page.kpi.readHint'),
        icon: MailOpen,
      },
      {
        label: t('account.notifications.page.kpi.archived'),
        value: stats?.archived ?? '—',
        subtitle: t('account.notifications.page.kpi.archivedHint'),
        icon: Archive,
      },
    ],
    [listQuery.data?.unreadCount, stats, t],
  );

  const columns = useMemo<ColumnDef<InAppNotificationItem>[]>(
    () => [
      {
        id: 'status',
        accessorKey: 'unread',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('account.notifications.page.columns.status')} column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          const label = item.archivedAt
            ? t('account.notifications.page.status.archived')
            : item.unread
              ? t('account.notifications.page.status.unread')
              : t('account.notifications.page.status.read');
          return (
            <Badge variant={statusBadgeVariant(item)} appearance="light" className="font-semibold text-[10px] uppercase">
              {label}
            </Badge>
          );
        },
        size: 110,
      },
      {
        id: 'category',
        accessorKey: 'category',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('account.notifications.page.columns.category')} column={column} />
        ),
        cell: ({ row }) => {
          const cat = row.original.category;
          const label = t(`topbar.notifications.categories.${cat}`, cat);
          return (
            <Badge
              variant={categoryBadgeVariant(cat)}
              appearance="light"
              className="font-semibold text-[10px] uppercase"
            >
              {label}
            </Badge>
          );
        },
        size: 120,
      },
      {
        id: 'title',
        accessorKey: 'title',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('account.notifications.page.columns.title')} column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-0 max-w-md">
              <p
                className={cn(
                  'truncate text-sm font-semibold',
                  item.unread ? 'text-foreground' : 'text-foreground/80',
                )}
              >
                {item.title}
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.body}</p>
            </div>
          );
        },
        size: 280,
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('account.notifications.page.columns.date')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
        size: 160,
      },
      {
        id: 'actions',
        header: () => (
          <span className="sr-only">{t('account.notifications.page.columns.actions')}</span>
        ),
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex items-center justify-end gap-1 pe-2">
              {item.href ? (
                <Button variant="ghost" mode="icon" className="size-8" asChild title={t('account.notifications.page.open')}>
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
                  onClick={() => markReadIfNeeded(item, true)}
                >
                  <CheckCheck className="size-3.5 me-1" />
                  {t('account.notifications.page.markRead')}
                </Button>
              ) : null}
            </div>
          );
        },
        size: 140,
      },
    ],
    [t],
  );

  function markReadIfNeeded(item: InAppNotificationItem, force = false) {
    if (!item.unread && !force) return;
    markNotificationRead(item.id).then(() => {
      queryClient.invalidateQueries({ queryKey: ['account-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['topbar-summary'] });
    });
  }

  const rows = listQuery.data?.items ?? [];
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
    <div className="space-y-5 lg:space-y-7.5">
      <div className={MODULE_LANDING_STATS_GRID_ROW}>
        {kpiCards.map((card, i) => {
          const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
            >
              <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
                <Icon className={cn('size-4 shrink-0', accent.icon)} aria-hidden />
              </div>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </div>
          );
        })}
      </div>

      {stats?.byCategory ? (
        <div className="flex flex-wrap gap-2">
          {NOTIFICATION_CATEGORIES.map((cat) => {
            const count = stats.byCategory[cat] ?? 0;
            if (count === 0) return null;
            return (
              <Badge key={cat} variant={categoryBadgeVariant(cat)} appearance="light">
                {t(`topbar.notifications.categories.${cat}`, cat)} · {count}
              </Badge>
            );
          })}
        </div>
      ) : null}

      <Card className="border-border shadow-none">
        <CardHeader className="space-y-4 border-b border-border py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">{t('account.notifications.page.tableTitle')}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={readAll.isPending || tab === 'archived'}
                onClick={() => readAll.mutate()}
              >
                <CheckCheck className="size-4" />
                {t('topbar.notifications.markAllRead')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={archiveAll.isPending || tab === 'archived'}
                onClick={() => archiveAll.mutate()}
              >
                <Archive className="size-4" />
                {t('topbar.notifications.archiveAll')}
              </Button>
            </div>
          </div>

          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setPagination((p) => ({ ...p, pageIndex: 0 }));
                setQuery(e.target.value);
              }}
              placeholder={t('account.notifications.page.search')}
              className="h-10 ps-9"
            />
          </div>

          <div
            role="tablist"
            aria-label={t('account.notifications.page.filterTabs')}
            className="flex h-auto min-h-10 w-full min-w-0 flex-wrap justify-start gap-1 rounded-lg border border-border bg-accent p-1"
          >
            {(['all', 'unread', 'archived'] as const).map((value) => (
              <Button
                key={value}
                type="button"
                role="tab"
                aria-selected={tab === value}
                size="sm"
                variant={tab === value ? 'secondary' : 'ghost'}
                className="text-xs sm:text-sm"
                onClick={() => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setTab(value);
                }}
              >
                {t(`account.notifications.page.tabs.${value}`)}
                {value === 'unread' && listQuery.data?.unreadCount
                  ? ` (${listQuery.data.unreadCount})`
                  : ''}
              </Button>
            ))}
          </div>

          <ScrollArea className="w-full">
            <div className="flex w-max gap-1 pb-1">
              <Button
                type="button"
                size="sm"
                variant={category === 'all' ? 'secondary' : 'ghost'}
                className="text-xs"
                onClick={() => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setCategory('all');
                }}
              >
                {t('account.notifications.page.categoryAll')}
              </Button>
              {NOTIFICATION_CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  size="sm"
                  variant={category === cat ? 'secondary' : 'ghost'}
                  className="text-xs"
                  onClick={() => {
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                    setCategory(cat);
                  }}
                >
                  {t(`topbar.notifications.categories.${cat}`, cat)}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardHeader>

        <DataGrid
          table={table}
          recordCount={total}
          isLoading={listQuery.isLoading}
          loadingMessage={t('topbar.notifications.loading')}
          emptyMessage={
            listQuery.isError
              ? t('topbar.notifications.loadError')
              : tab === 'unread'
                ? t('topbar.notifications.emptyUnread')
                : tab === 'archived'
                  ? t('account.notifications.page.emptyArchived')
                  : t('topbar.notifications.empty')
          }
          tableLayout={{
            ...USER_MANAGEMENT_TABLE_LAYOUT,
            headerSticky: true,
            dense: false,
          }}
          tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
        >
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="border-t border-border px-4 py-3">
            <DataGridPagination />
          </CardFooter>
        </DataGrid>
      </Card>
    </div>
  );
}
