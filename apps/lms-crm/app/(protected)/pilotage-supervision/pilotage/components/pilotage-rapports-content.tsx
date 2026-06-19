'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarRange,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Printer,
  RefreshCw,
  Search,
  SquarePen,
  Trash,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
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
  DATAGRID_SELECTION_BAR_ACTIONS,
  DATAGRID_SELECTION_BAR_INNER,
  DATAGRID_SELECTION_BAR_WRAPPER,
  DATAGRID_TOOLBAR_ACTIONS,
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { PILOTAGE_PAGE_INTRO } from '@/lib/pilotage/page-copy';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import type { PilotageModuleId } from '@/lib/pilotage/modules';
import { moduleLabelFromKey } from '@/lib/pilotage/modules';
import { deletePilotageReport, fetchPilotageRapports, pilotageReportDownloadUrl } from '@/lib/pilotage/api';
import type { PilotageRapportRow } from '@repo/api-core';
import {
  ReportPeriodRangePicker,
  reportPeriodToApi,
  type ReportPeriodValue,
} from '@/components/reports/report-period-range-picker';
import { PilotageModuleTabs, pilotageApiModuleId } from './pilotage-module-tabs';
import { PilotagePageIntro } from './pilotage-page-intro';
import { PilotageRapportDetailSheet } from './pilotage-rapport-detail-sheet';
import { PilotageRapportEditSheet } from './pilotage-rapport-edit-sheet';
import { PilotageRapportGenerateDialog } from './pilotage-rapport-generate-dialog';
import { PilotageReportActorCell } from './pilotage-report-actor-cell';
import { PilotageRapportsSchedulesSheet } from './pilotage-rapports-schedules-sheet';

const PAGE_SIZE = 10;
const KPI_ICONS = [FileText, CheckCircle2, CalendarRange, FileSpreadsheet, Clock];

function formatIcon(format: PilotageRapportRow['format']) {
  if (format === 'PDF') return FileText;
  if (format === 'Excel') return FileSpreadsheet;
  return FileText;
}

function generationSourceLabel(source?: PilotageRapportRow['generationSource']) {
  if (source === 'schedule') return 'Automatique';
  if (source === 'run_now') return 'Lancement immédiat';
  if (source === 'manual') return 'Manuel';
  return null;
}

export function PilotageRapportsContent() {
  const queryClient = useQueryClient();
  const { title, description } = usePageToolbarMeta('/pilotage-supervision/pilotage/rapports');
  const intro = PILOTAGE_PAGE_INTRO.rapports;
  const [moduleId, setModuleId] = useState<PilotageModuleId>('gestion-ressources');
  const [periodValue, setPeriodValue] = useState<ReportPeriodValue>({ mode: 'preset', period: 'week' });
  const [query, setQuery] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [schedulesOpen, setSchedulesOpen] = useState(false);
  const [selected, setSelected] = useState<PilotageRapportRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PilotageRapportRow | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const apiModule = pilotageApiModuleId(moduleId);

  const periodApi = reportPeriodToApi(periodValue);
  const periodQueryKey =
    periodValue.mode === 'preset'
      ? periodValue.period
      : `custom:${periodApi.customRange?.start}:${periodApi.customRange?.end}`;

  const handlePeriodChange = (v: ReportPeriodValue) => {
    setPeriodValue(v);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setRowSelection({});
  };

  const [manualRefresh, setManualRefresh] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['pilotage-rapports', apiModule, periodQueryKey],
    queryFn: () =>
      fetchPilotageRapports(
        apiModule,
        periodApi.period === 'custom' ? 'custom' : periodApi.period,
        periodApi.customRange,
      ),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchIntervalInBackground: false,
    refetchInterval: (query) => {
      const rows = query.state.data?.rows ?? [];
      if (rows.some((r) => r.status === 'pending' || r.status === 'running')) return 30_000;
      return false;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePilotageReport(id),
    onSuccess: () => {
      toast.success('Rapport supprimé');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['pilotage-rapports'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Suppression impossible'),
  });

  const openDetail = useCallback((row: PilotageRapportRow) => {
    setSelected(row);
    setDetailOpen(true);
  }, []);

  const openEdit = useCallback((row: PilotageRapportRow) => {
    setSelected(row);
    setEditOpen(true);
  }, []);

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
        r.referenceCode.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.format.toLowerCase().includes(q) ||
        (r.createdByName?.toLowerCase().includes(q) ?? false) ||
        (r.createdBy?.name.toLowerCase().includes(q) ?? false) ||
        (r.editedBy?.name.toLowerCase().includes(q) ?? false),
    );
  }, [allRows, query]);

  const selectedRows = useMemo(
    () => filteredRows.filter((r) => rowSelection[r.id]),
    [filteredRows, rowSelection],
  );
  const selectedRowsCount = selectedRows.length;

  const columns = useMemo<ColumnDef<PilotageRapportRow>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 48,
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: 'referenceCode',
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-xs font-semibold tracking-wide text-foreground">{row.original.referenceCode}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground" title={row.original.id}>
              {row.original.id.slice(0, 8)}…
            </p>
          </div>
        ),
        size: 120,
        meta: { headerTitle: 'Référence' },
      },
      {
        id: 'label',
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Rapport" column={column} />,
        cell: ({ row }) => (
          <button type="button" className="min-w-0 max-w-md text-start" onClick={() => openDetail(row.original)}>
            <p className="text-sm font-semibold hover:text-primary">{row.original.label}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.original.description}</p>
          </button>
        ),
        size: 280,
      },
      {
        id: 'module',
        header: ({ column }) => <DataGridColumnHeader title="Module" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs font-semibold text-foreground/80">{moduleLabelFromKey(row.original.moduleKey)}</span>
        ),
        size: 130,
      },
      {
        id: 'format',
        accessorKey: 'format',
        header: ({ column }) => <DataGridColumnHeader title="Format" column={column} />,
        cell: ({ row }) => {
          const Icon = formatIcon(row.original.format);
          const status = row.original.status;
          const statusLabel =
            status === 'pending'
              ? 'En file'
              : status === 'running'
                ? 'Génération…'
                : status === 'failed'
                  ? 'Échec'
                  : null;
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="outline" appearance="light" className="gap-1 text-[10px] uppercase">
                <Icon className="size-3" />
                {row.original.format}
              </Badge>
              {statusLabel ? (
                <Badge
                  variant={status === 'failed' ? 'destructive' : 'secondary'}
                  appearance="light"
                  className="text-[10px]"
                >
                  {statusLabel}
                </Badge>
              ) : null}
            </div>
          );
        },
        size: 110,
      },
      {
        id: 'period',
        accessorKey: 'periodLabel',
        header: ({ column }) => <DataGridColumnHeader title="Période" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm text-muted-foreground">
              <CalendarRange className="size-3" />
              {row.original.periodLabel}
            </span>
            {generationSourceLabel(row.original.generationSource) ? (
              <Badge variant="secondary" appearance="light" className="w-fit text-[10px]">
                {generationSourceLabel(row.original.generationSource)}
              </Badge>
            ) : null}
          </div>
        ),
        size: 140,
      },
      {
        id: 'generatedAt',
        accessorKey: 'generatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Généré le" column={column} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {formatDateTime(row.original.generatedAt)}
          </span>
        ),
        size: 150,
      },
      {
        id: 'createdBy',
        accessorFn: (r) => r.createdBy?.name ?? r.createdByName ?? '',
        header: ({ column }) => <DataGridColumnHeader title="Généré par" column={column} />,
        cell: ({ row }) => <PilotageReportActorCell actor={row.original.createdBy} at={row.original.generatedAt} />,
        size: 200,
        meta: { headerTitle: 'Généré par' },
      },
      {
        id: 'editedBy',
        accessorFn: (r) => r.editedBy?.name ?? '',
        header: ({ column }) => <DataGridColumnHeader title="Édité par" column={column} />,
        cell: ({ row }) => (
          <PilotageReportActorCell actor={row.original.editedBy} at={row.original.editedAt} emptyLabel="Jamais édité" />
        ),
        size: 200,
        meta: { headerTitle: 'Édité par' },
      },
      {
        id: 'actions',
        header: '',
        size: 168,
        minSize: 168,
        cell: ({ row }) => {
          const r = row.original;
          const isJobRow = r.id.startsWith('job:');
          const canDownload = r.status === 'generated' && !isJobRow;
          return (
            <div className="flex items-center justify-end gap-2 pe-2">
              {r.htmlPreviewUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  mode="icon"
                  className="size-8"
                  title="Visualiser le HTML"
                  asChild
                >
                  <a href={r.htmlPreviewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 text-primary" />
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                mode="icon"
                className="size-8"
                title="Voir le rapport"
                onClick={() => openDetail(r)}
                disabled={r.status === 'pending' || r.status === 'running'}
              >
                <Eye className="size-4 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                mode="icon"
                className="size-8"
                title="Éditer le rapport"
                onClick={() => openEdit(r)}
                disabled={!canDownload}
              >
                <SquarePen className="size-4 text-muted-foreground" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                mode="icon"
                className="size-8 text-destructive hover:text-destructive"
                title="Supprimer le rapport"
                onClick={() => setDeleteTarget(r)}
                disabled={!canDownload}
              >
                <Trash className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [openDetail, openEdit],
  );

  const table = useReactTable({
    columns,
    data: filteredRows,
    state: { pagination, rowSelection },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (r) => r.id,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const bulkDownload = () => {
    if (!selectedRows.length) return;
    for (const row of selectedRows) {
      window.open(pilotageReportDownloadUrl(row.id), '_blank', 'noopener,noreferrer');
    }
    toast.success(`${selectedRows.length} téléchargement(s) lancé(s)`);
  };

  const bulkPrint = () => {
    const previews = selectedRows.filter((r) => r.htmlPreviewUrl);
    if (!previews.length) {
      toast.error('Aucun rapport PDF HTML dans la sélection');
      return;
    }
    for (const row of previews) {
      window.open(row.htmlPreviewUrl!, '_blank', 'noopener,noreferrer');
    }
    toast.info(`${previews.length} aperçu(s) ouvert(s) — utilisez Imprimer du navigateur`);
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) await deletePilotageReport(id);
    },
    onSuccess: () => {
      toast.success('Rapports supprimés');
      setRowSelection({});
      setBulkDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ['pilotage-rapports'] });
    },
    onError: (e: Error) => toast.error(e.message || 'Suppression impossible'),
  });

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className={DATAGRID_TOOLBAR_ACTIONS}>
            <Button onClick={() => setGenerateOpen(true)}>
              <FilePlus2 className="size-4" />
              Générer un rapport
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <ModuleKpiStatsRow items={kpiCards} />

        <PilotageModuleTabs value={moduleId} onChange={setModuleId} />

        <PilotagePageIntro lead={intro.lead} detail={intro.detail} />

        <Card className="mb-5 border-border shadow-none">
          <CardHeader className="space-y-4 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0 space-y-1">
                <h3 className="text-base font-semibold text-foreground">Historique des rapports générés</h3>
                <p className="text-xs text-muted-foreground">
                  Sélectionnez des lignes pour télécharger, imprimer ou supprimer en lot.
                </p>
              </div>
              <div
                className={cn(
                  'flex w-full shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end xl:w-auto',
                  DATAGRID_TOOLBAR_ACTIONS,
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ReportPeriodRangePicker value={periodValue} onChange={handlePeriodChange} />
                  {data?.periodLabel ? (
                    <Badge variant="outline" appearance="light" className="text-[10px] font-medium">
                      {data.periodLabel}
                    </Badge>
                  ) : null}
                </div>
                <Button variant="outline" type="button" onClick={() => setSchedulesOpen(true)}>
                  <CalendarClock className="size-4" />
                  Automatisations
                </Button>
                <Button
                  variant="outline"
                  disabled={manualRefresh}
                  onClick={() => {
                    setManualRefresh(true);
                    void refetch().finally(() => setManualRefresh(false));
                  }}
                >
                  <RefreshCw className={cn('size-4', manualRefresh && 'animate-spin')} />
                  Actualiser
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
                placeholder="Rechercher par réf., titre, format, auteur…"
                className="h-10 ps-9"
              />
            </div>
          </CardHeader>
        </Card>

        <DataGrid
          table={table}
          recordCount={filteredRows.length}
          isLoading={isLoading}
          loadingMessage="Chargement des rapports…"
          emptyMessage={
            data?.periodLabel
              ? `Aucun rapport sur la période « ${data.periodLabel} » — générez-en un ou lancez une automatisation.`
              : 'Aucun rapport généré sur cette période — cliquez « Générer un rapport ».'
          }
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

      <PilotageRapportGenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        legacyCsvTemplates={data?.templates ?? []}
        defaultPeriodValue={periodValue}
        onGenerated={() => queryClient.invalidateQueries({ queryKey: ['pilotage-rapports'] })}
      />

      <PilotageRapportsSchedulesSheet open={schedulesOpen} onOpenChange={setSchedulesOpen} />

      <PilotageRapportDetailSheet report={selected} open={detailOpen} onOpenChange={setDetailOpen} />

      <PilotageRapportEditSheet
        report={selected}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['pilotage-rapports'] })}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce rapport ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier « {deleteTarget?.label} » sera retiré de l&apos;historique. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selectedRowsCount} rapport(s) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les fichiers sélectionnés seront retirés de l&apos;historique. Action irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(selectedRows.map((r) => r.id))}
            >
              Supprimer la sélection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AnimatePresence>
        {selectedRowsCount > 0 ? (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={DATAGRID_SELECTION_BAR_WRAPPER}
          >
            <div className={DATAGRID_SELECTION_BAR_INNER}>
              <div className="text-sm font-medium sm:border-r sm:border-border sm:pr-6">
                <span className="text-muted-foreground">
                  {selectedRowsCount} sur {filteredRows.length} sélectionné(s)
                </span>
              </div>
              <div className={DATAGRID_SELECTION_BAR_ACTIONS}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                    >
                      Actions <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuItem onClick={bulkDownload}>
                      <Download className="size-4" />
                      Télécharger la sélection
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={bulkPrint}>
                      <Printer className="size-4" />
                      Imprimer / aperçu HTML
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setGenerateOpen(true)}>
                      <FilePlus2 className="size-4" />
                      Générer un nouveau rapport
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold text-destructive transition-colors hover:text-destructive/80"
                  onClick={() => setBulkDeleteOpen(true)}
                >
                  <Trash className="size-4" />
                  Supprimer
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                  onClick={() => setRowSelection({})}
                >
                  <X className="size-4" />
                  Désélectionner
                </button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
