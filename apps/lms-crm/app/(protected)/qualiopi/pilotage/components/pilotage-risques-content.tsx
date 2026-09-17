'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
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
  ExternalLink,
  FileWarning,
  Flame,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
  UserX,
  Wrench,
} from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { Container } from '@/components/common/container';
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
import { PILOTAGE_PAGE_INTRO } from '@/lib/pilotage/page-copy';
import { cn } from '@/lib/utils';
import type { PilotageModuleId } from '@/lib/pilotage/modules';
import { moduleLabelFromKey } from '@/lib/pilotage/modules';
import { fetchPilotageRisques } from '@/lib/pilotage/api';
import type { PilotageRisqueRow } from '@repo/api-core';
import { PilotageModuleTabs, pilotageApiModuleId } from './pilotage-module-tabs';
import { PilotageRisquesCharts } from './pilotage-risques-charts';
import { PilotagePageIntro } from './pilotage-page-intro';

const PAGE_SIZE = 10;
const KPI_ICONS = [Target, Flame, FileWarning, Wrench, UserX];

function graviteVariant(g: PilotageRisqueRow['gravite']) {
  if (g === 'Élevée') return 'destructive' as const;
  if (g === 'Moyenne') return 'warning' as const;
  return 'secondary' as const;
}

export function PilotageRisquesContent() {
  const { title, description } = usePageToolbarMeta('/pilotage-supervision/pilotage/risques');
  const intro = PILOTAGE_PAGE_INTRO.risques;
  const [moduleId, setModuleId] = useState<PilotageModuleId>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<PilotageRisqueRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const apiModule = pilotageApiModuleId(moduleId);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pilotage-risques', apiModule],
    queryFn: () => fetchPilotageRisques(apiModule),
    refetchInterval: 60_000,
  });

  const kpiCards = useMemo(() => {
    if (!data?.kpis?.length) return [];
    return data.kpis.map((kpi, i) => ({
      label: kpi.label,
      value: kpi.value,
      subtitle: kpi.subtitle,
      icon: KPI_ICONS[i % KPI_ICONS.length],
    }));
  }, [data?.kpis]);

  const allRows = data?.rows ?? [];
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        r.risque.toLowerCase().includes(q) ||
        r.mesure.toLowerCase().includes(q) ||
        r.gravite.toLowerCase().includes(q),
    );
  }, [allRows, query]);

  const pageRows = filteredRows.slice(
    pagination.pageIndex * pagination.pageSize,
    (pagination.pageIndex + 1) * pagination.pageSize,
  );

  const columns = useMemo<ColumnDef<PilotageRisqueRow>[]>(
    () => [
      {
        id: 'gravite',
        accessorKey: 'gravite',
        header: ({ column }) => <DataGridColumnHeader title="Gravité" column={column} />,
        cell: ({ row }) => (
          <Badge variant={graviteVariant(row.original.gravite)} appearance="light" className="text-[10px] font-bold uppercase">
            {row.original.gravite}
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'risque',
        accessorKey: 'risque',
        header: ({ column }) => <DataGridColumnHeader title="Risque" column={column} />,
        cell: ({ row }) => (
          <button
            type="button"
            className="min-w-0 max-w-md text-start"
            onClick={() => {
              setSelected(row.original);
              setSheetOpen(true);
            }}
          >
            <p className="truncate text-sm font-semibold hover:text-primary">{row.original.risque}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.original.mesure}</p>
          </button>
        ),
        size: 300,
      },
      {
        id: 'module',
        header: ({ column }) => <DataGridColumnHeader title="Module" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground/80">{moduleLabelFromKey(row.original.moduleKey)}</span>
        ),
        size: 140,
      },
      {
        id: 'exposition',
        accessorKey: 'exposition',
        header: ({ column }) => <DataGridColumnHeader title="Exposition" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm font-bold tabular-nums">{row.original.exposition}</span>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1 pe-2">
            <Button variant="ghost" mode="icon" className="size-8" asChild title="Ouvrir le module">
              <Link href={row.original.href}>
                <ExternalLink className="size-4 text-muted-foreground" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setSelected(row.original);
                setSheetOpen(true);
              }}
            >
              Détail
            </Button>
          </div>
        ),
        size: 120,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: pageRows,
    pageCount: Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize)),
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
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              Actualiser
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <ModuleKpiStatsRow items={kpiCards} />

        <PilotageModuleTabs value={moduleId} onChange={setModuleId} />

        <PilotagePageIntro lead={intro.lead} detail={intro.detail} />

        {data?.charts ? <PilotageRisquesCharts charts={data.charts} /> : null}

        <Card className="mb-5 border-border shadow-none">
          <CardHeader className="space-y-4 py-4">
            <div className="space-y-1">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <ShieldAlert className="size-4 text-destructive" />
                Registre des risques opérationnels
              </h3>
              <p className="text-xs text-muted-foreground">
                Recherchez un risque, une mesure ou un responsable — filtrez par module via les onglets ci-dessus.
              </p>
            </div>
            <div className="relative w-full">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                  setQuery(e.target.value);
                }}
                placeholder="Rechercher un risque, une mesure…"
                className="h-10 ps-9"
              />
            </div>
          </CardHeader>
        </Card>

        <DataGrid
          table={table}
          recordCount={filteredRows.length}
          isLoading={isLoading}
          loadingMessage="Chargement des risques…"
          emptyMessage="Aucun risque identifié pour ce filtre."
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

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          {selected ? (
            <>
              <SheetHeader className="border-b border-border px-5 py-4 text-start">
                <SheetTitle className="flex items-start gap-2 text-base leading-snug">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
                  {selected.risque}
                </SheetTitle>
                <Badge variant={graviteVariant(selected.gravite)} appearance="light" className="mt-2 w-fit text-[10px] uppercase">
                  Gravité {selected.gravite}
                </Badge>
              </SheetHeader>
              <SheetBody className="space-y-4 overflow-y-auto px-5 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Exposition</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums">{selected.exposition}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mesure préventive</p>
                  <p className="mt-1 text-sm">{selected.mesure}</p>
                </div>
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                  <p className="flex items-center gap-1 text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="size-3.5" />
                    Recommandation
                  </p>
                  <p className="mt-2 text-sm text-foreground/90">{selected.recommendation}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Module</p>
                  <p className="font-medium">{moduleLabelFromKey(selected.moduleKey)}</p>
                </div>
              </SheetBody>
              <SheetFooter className="border-t border-border px-5 py-4">
                <Button size="sm" asChild>
                  <Link href={selected.href} onClick={() => setSheetOpen(false)}>
                    Aller corriger
                    <ExternalLink className="ms-1 size-3.5" />
                  </Link>
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
