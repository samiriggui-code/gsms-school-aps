'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, MoreHorizontal, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardHeader } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import { Progress } from '@repo/ui/progress';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { FinanceModuleDataGrid } from '../../components/finance-module-datagrid';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { cn } from '@/lib/utils';
import { PiggyBank, Target, TrendingDown, Wallet, BarChart3 } from 'lucide-react';
import { BudgetDetailSheet, type BudgetDetailInitialTab } from './budget-detail-sheet';

function fmtMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

type BudgetRow = {
  id: string;
  label: string;
  category: string;
  plannedAmount: number;
  actualAmount: number;
};

type BudgetResponse = {
  stats: {
    total: number;
    planned: number;
    actual: number;
    ecart: number;
    consumptionRate: number;
  };
  items: BudgetRow[];
  pagination: { page: number; limit: number; total: number };
};

const KPI_ICONS = [BarChart3, Target, Wallet, TrendingDown, PiggyBank];

export function FinanceBudgetPageContent() {
  const year = new Date().getFullYear();
  const { title, description } = usePageToolbarMeta('/administration-facturation/finance/budget');
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTab, setSheetTab] = useState<BudgetDetailInitialTab>('overview');
  const [form, setForm] = useState({
    label: '',
    category: 'FORMATION',
    plannedAmount: '',
    actualAmount: '0',
    notes: '',
  });

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['finance-budget', year, search, pagination] as const,
    queryFn: async () => {
      const sp = new URLSearchParams({
        year: String(year),
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });
      if (search.trim()) sp.set('q', search.trim());
      const res = await apiFetch(`/api/sections/administration-facturation/finance/budget?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Erreur chargement budget');
      return unwrapSectionApiData<BudgetResponse>(json);
    },
  });

  const kpiCards = useMemo(() => {
    const s = data?.stats;
    if (!s) return [];
    return [
      { label: 'Lignes', value: s.total ?? 0, subtitle: `Exercice ${year}`, icon: KPI_ICONS[0] },
      { label: 'Prévu', value: fmtMoney(s.planned), subtitle: 'Total planifié', icon: KPI_ICONS[1] },
      { label: 'Réalisé', value: fmtMoney(s.actual), subtitle: 'Consommé', icon: KPI_ICONS[2] },
      { label: 'Écart', value: fmtMoney(s.ecart), subtitle: 'Prévu − réalisé', icon: KPI_ICONS[3] },
      {
        label: 'Consommation',
        value: `${s.consumptionRate ?? 0} %`,
        subtitle: 'Réalisé / prévu',
        icon: KPI_ICONS[4],
      },
    ];
  }, [data?.stats, year]);

  async function createLine() {
    const plannedAmount = Number(form.plannedAmount);
    if (!form.label.trim() || !Number.isFinite(plannedAmount)) {
      toast.error('Libellé et montant prévu requis');
      return;
    }
    const res = await apiFetch('/api/sections/administration-facturation/finance/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label: form.label.trim(),
        category: form.category,
        periodYear: year,
        plannedAmount,
        actualAmount: Number(form.actualAmount) || 0,
        notes: form.notes.trim() || null,
      }),
    });
    if (!res.ok) {
      toast.error('Création impossible');
      return;
    }
    toast.success('Ligne budget ajoutée');
    setOpenCreate(false);
    setForm({ label: '', category: 'FORMATION', plannedAmount: '', actualAmount: '0', notes: '' });
    void qc.invalidateQueries({ queryKey: ['finance-budget'] });
  }

  function openLineDetail(id: string, tab: BudgetDetailInitialTab = 'overview') {
    setSelectedLineId(id);
    setSheetTab(tab);
    setSheetOpen(true);
  }

  const deleteLineCb = useCallback(
    async (id: string) => {
      if (!confirm('Supprimer cette ligne budget ?')) return;
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/budget/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) {
        toast.error('Suppression impossible');
        return;
      }
      toast.success('Ligne supprimée');
      if (selectedLineId === id) {
        setSheetOpen(false);
        setSelectedLineId(null);
      }
      void qc.invalidateQueries({ queryKey: ['finance-budget'] });
    },
    [qc, selectedLineId],
  );

  const columns = useMemo<ColumnDef<BudgetRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Libellé" column={column} />,
        cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <DataGridColumnHeader title="Catégorie" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold uppercase">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'plannedAmount',
        header: ({ column }) => <DataGridColumnHeader title="Prévu" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">{fmtMoney(row.original.plannedAmount)}</span>
        ),
      },
      {
        accessorKey: 'actualAmount',
        header: ({ column }) => <DataGridColumnHeader title="Réalisé" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{fmtMoney(row.original.actualAmount)}</span>
        ),
      },
      {
        id: 'consumption',
        header: ({ column }) => <DataGridColumnHeader title="Conso." column={column} />,
        cell: ({ row }) => {
          const pct =
            row.original.plannedAmount > 0
              ? Math.round((row.original.actualAmount / row.original.plannedAmount) * 100)
              : 0;
          return (
            <div className="flex min-w-[140px] items-center gap-2">
              <Progress value={Math.min(pct, 100)} className="h-2 flex-1" />
              <span className="w-9 text-xs tabular-nums text-muted-foreground">{pct}%</span>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            <Button type="button" size="sm" variant="ghost" onClick={() => openLineDetail(row.original.id)} title="Voir le détail">
              <Eye className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" size="sm" variant="ghost">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openLineDetail(row.original.id)}>
                  <Eye className="size-4" />
                  Voir le détail
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openLineDetail(row.original.id, 'tranches')}>
                  Tranches mensuelles
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openLineDetail(row.original.id, 'poles')}>
                  Dépenses par pôle
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openLineDetail(row.original.id, 'edit')}>
                  <Pencil className="size-4" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => deleteLineCb(row.original.id)}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
        size: 100,
        enableSorting: false,
      },
    ],
    [deleteLineCb],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
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
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4" />
              Ajouter une ligne
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <ModuleKpiStatsRow items={kpiCards} />

        <Card className="mb-5 border-border/80 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-dashed sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Lignes budgétaires</p>
              <p className="text-xs text-muted-foreground">Exercice {year} — catégories FORMATION, EQUIPEMENT, RH…</p>
            </div>
            <div className="flex max-w-md flex-1 gap-2 sm:ms-auto">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearch(q);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }
                }}
                placeholder="Rechercher…"
                className="flex-1"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch(q);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <Search className="size-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        <FinanceModuleDataGrid
          table={table}
          recordCount={data?.pagination.total ?? 0}
          isLoading={isLoading || isFetching}
          emptyMessage="Aucune ligne budget"
          onRowClick={(row) => openLineDetail(row.id)}
        />
      </Container>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle ligne budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Libellé</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Catégorie</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="FORMATION, EQUIPEMENT, RH…"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Prévu (€)</Label>
                <Input
                  type="number"
                  value={form.plannedAmount}
                  onChange={(e) => setForm((f) => ({ ...f, plannedAmount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Réalisé (€)</Label>
                <Input
                  type="number"
                  value={form.actualAmount}
                  onChange={(e) => setForm((f) => ({ ...f, actualAmount: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Annuler
            </Button>
            <Button onClick={createLine}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BudgetDetailSheet
        lineId={selectedLineId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        initialTab={sheetTab}
        onDeleted={() => {
          setSelectedLineId(null);
          void qc.invalidateQueries({ queryKey: ['finance-budget'] });
        }}
      />
    </>
  );
}