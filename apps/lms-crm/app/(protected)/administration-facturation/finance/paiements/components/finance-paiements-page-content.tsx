'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { CheckCircle2, Clock, Plus, RefreshCw, Search, Wallet, XCircle } from 'lucide-react';
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
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceActionLabel, workspaceStatusLabel } from '@/lib/workspace-labels';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardHeader } from '@repo/ui/card';
import { Badge } from '@repo/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import { Label } from '@repo/ui/label';
import { Checkbox } from '@repo/ui/checkbox';
import { Textarea } from '@repo/ui/textarea';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { FinanceModuleDataGrid } from '../../components/finance-module-datagrid';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { cn } from '@/lib/utils';

const WORKSPACE_KEY = 'finance-paiements';
const KPI_ICONS = [Wallet, Clock, CheckCircle2, Wallet, XCircle];

function fmtMoney(v: unknown) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

type PaymentRow = {
  id: string;
  referenceCode: string;
  amount: number;
  status: string;
  method: string | null;
  devis: { referenceCode?: string; title?: string } | null;
};

type PaymentsResponse = {
  stats: Record<string, number>;
  items: PaymentRow[];
  pagination: { page: number; limit: number; total: number };
};

function statusVariant(status: string): 'success' | 'warning' | 'destructive' | 'secondary' {
  if (status === 'RECEIVED') return 'success';
  if (status === 'PENDING') return 'warning';
  if (status === 'FAILED') return 'destructive';
  return 'secondary';
}

export function FinancePaiementsPageContent() {
  const { t } = useTranslation();
  const { title, description } = usePageToolbarMeta('/administration-facturation/finance/paiements');
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ amount: '', devisId: '', method: '', notes: '' });
  const [recordReceiptOnCreate, setRecordReceiptOnCreate] = useState(true);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['finance-paiements', search, pagination] as const,
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });
      if (search.trim()) sp.set('q', search.trim());
      const res = await apiFetch(`/api/sections/administration-facturation/finance/paiements?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Erreur chargement paiements');
      return unwrapSectionApiData<PaymentsResponse>(json);
    },
  });

  const kpiCards = useMemo(() => {
    const s = data?.stats;
    if (!s) return [];
    return [
      { label: 'Total', value: s.total ?? 0, subtitle: 'Paiements', icon: KPI_ICONS[0] },
      { label: 'En attente', value: s.pending ?? 0, subtitle: 'À encaisser', icon: KPI_ICONS[1] },
      { label: 'Encaissés', value: s.received ?? 0, subtitle: 'Reçus', icon: KPI_ICONS[2] },
      { label: 'Montant dû', value: fmtMoney(s.pendingAmount), subtitle: 'Somme en attente', icon: KPI_ICONS[3] },
      { label: 'Échoués', value: s.failed ?? 0, subtitle: 'Paiements en erreur', icon: KPI_ICONS[4] },
    ];
  }, [data?.stats]);

  async function createPayment() {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Montant invalide');
      return;
    }
    const res = await apiFetch('/api/sections/administration-facturation/finance/paiements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        devisId: form.devisId.trim() || undefined,
        method: form.method.trim() || undefined,
        notes: form.notes.trim() || undefined,
        ...(recordReceiptOnCreate ? { recordReceipt: true } : {}),
      }),
    });
    if (!res.ok) {
      toast.error('Création impossible');
      return;
    }
    toast.success(
      recordReceiptOnCreate
        ? t('finance.payments.recordedAndReceived')
        : 'Paiement enregistré',
    );
    setOpenCreate(false);
    setForm({ amount: '', devisId: '', method: '', notes: '' });
    setRecordReceiptOnCreate(true);
    void qc.invalidateQueries({ queryKey: ['finance-paiements'] });
    void qc.invalidateQueries({ queryKey: ['finance-budget'] });
  }

  async function markReceived(id: string) {
    const res = await apiFetch(
      `/api/sections/administration-facturation/finance/paiements/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RECEIVED' }),
      },
    );
    if (!res.ok) {
      toast.error(workspaceActionLabel(t, WORKSPACE_KEY, 'markReceivedFailed'));
      return;
    }
    toast.success(workspaceActionLabel(t, WORKSPACE_KEY, 'markReceived'));
    void qc.invalidateQueries({ queryKey: ['finance-paiements'] });
    void qc.invalidateQueries({ queryKey: ['finance-budget'] });
  }

  const columns = useMemo<ColumnDef<PaymentRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Référence" column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referenceCode}</span>,
        size: 120,
      },
      {
        id: 'devis',
        header: ({ column }) => <DataGridColumnHeader title="Devis" column={column} />,
        cell: ({ row }) => (
          <div>
            <span className="font-medium">{row.original.devis?.referenceCode ?? '—'}</span>
            {row.original.devis?.title ? (
              <p className="max-w-[200px] truncate text-xs text-muted-foreground">{row.original.devis.title}</p>
            ) : null}
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataGridColumnHeader title="Montant" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">{fmtMoney(row.original.amount)}</span>
        ),
        size: 110,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)} appearance="light" className="text-[10px] uppercase">
            {workspaceStatusLabel(t, WORKSPACE_KEY, row.original.status, row.original.status)}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: 'method',
        header: ({ column }) => <DataGridColumnHeader title="Mode" column={column} />,
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.method ?? '—'}</span>,
        size: 100,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            {row.original.status === 'PENDING' ? (
              <Button size="sm" variant="outline" onClick={() => markReceived(row.original.id)}>
                <CheckCircle2 className="size-4" />
                {workspaceActionLabel(t, WORKSPACE_KEY, 'markReceived')}
              </Button>
            ) : null}
          </div>
        ),
        size: 160,
        enableSorting: false,
      },
    ],
    [t],
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
              Nouveau paiement
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <ModuleKpiStatsRow items={kpiCards} />

        <Card className="mb-5 border-border/80 shadow-sm">
          <CardHeader className="flex flex-col gap-3 border-b border-dashed sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Mouvements de paiement</p>
              <p className="text-xs text-muted-foreground">Encaissements liés aux devis / factures</p>
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
                placeholder="Référence, devis…"
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
          emptyMessage="Aucun paiement"
        />
      </Container>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau paiement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Montant (€)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>ID devis (optionnel)</Label>
              <Input value={form.devisId} onChange={(e) => setForm((f) => ({ ...f, devisId: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Mode</Label>
              <Input
                value={form.method}
                onChange={(e) => setForm((f) => ({ ...f, method: e.target.value }))}
                placeholder="virement, CB…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <Checkbox
                checked={recordReceiptOnCreate}
                onCheckedChange={(v) => setRecordReceiptOnCreate(v === true)}
              />
              <span className="text-muted-foreground leading-snug">
                {t('finance.payments.recordReceiptNow')}
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              Annuler
            </Button>
            <Button onClick={createPayment}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
