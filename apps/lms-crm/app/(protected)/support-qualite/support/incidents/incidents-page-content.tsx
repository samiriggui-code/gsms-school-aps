'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader } from '@/components/ui/card';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { IncidentDetailSheet } from './incident-detail-sheet';
import { IncidentDistributionChart, IncidentEvolutionChart } from './incident-charts';
import { SupportEntityCombobox } from '../../components/support-entity-combobox';

const API_BASE = '/api/sections/support-qualite/support/incidents';

const STATUS_LABEL: Record<string, string> = {
  REPORTED: 'Signalé',
  UNDER_ANALYSIS: 'Analyse',
  ACTION_IN_PROGRESS: 'Action en cours',
  AWAITING_VERIFICATION: 'Vérification',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

const SEVERITY_LABEL: Record<string, string> = {
  LOW: 'Faible',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  CRITICAL: 'Critique',
};

type IncidentRow = {
  id: string;
  referenceCode: string;
  title: string;
  status: string;
  severity: string;
  category: string | null;
  createdAt: string;
  ticket: { id: string; referenceCode: string; subject: string } | null;
  equipment: { id: string; label: string; serialNumber: string } | null;
};

export default function IncidentsPageContent() {
  const { title, description } = usePageToolbarMeta('/support-qualite/support/incidents');
  const qc = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'MEDIUM',
    category: '',
    ticketId: '',
    equipmentId: '',
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['quality-incidents', pagination.pageIndex, pagination.pageSize, search, statusFilter],
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });
      if (search.trim()) sp.set('q', search.trim());
      if (statusFilter !== 'all') sp.set('status', statusFilter);
      const res = await apiFetch(`${API_BASE}?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Erreur');
      return unwrapSectionApiData<{
        stats: { total: number; reported: number; inProgress: number; resolved: number; critical: number; resolved7d: number };
        items: IncidentRow[];
        pagination: { total: number };
      }>(json);
    },
    staleTime: 30_000,
  });

  const columns = useMemo<ColumnDef<IncidentRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referenceCode}</span>,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => <DataGridColumnHeader title="Incident" column={column} />,
        cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
      },
      {
        accessorKey: 'severity',
        header: ({ column }) => <DataGridColumnHeader title="Gravité" column={column} />,
        cell: ({ row }) => SEVERITY_LABEL[row.original.severity] ?? row.original.severity,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary">{STATUS_LABEL[row.original.status] ?? row.original.status}</Badge>
        ),
      },
      {
        id: 'links',
        header: () => 'Liens',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground">
            {row.original.ticket && <div>Ticket {row.original.ticket.referenceCode}</div>}
            {row.original.equipment && <div>{row.original.equipment.label}</div>}
          </div>
        ),
        enableSorting: false,
      },
    ],
    [],
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

  async function createIncident() {
    const res = await apiFetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        ticketId: form.ticketId || null,
        equipmentId: form.equipmentId || null,
      }),
    });
    if (!res.ok) {
      toast.error('Création impossible');
      return;
    }
    toast.success('Incident créé');
    setOpenCreate(false);
    setForm({ title: '', description: '', severity: 'MEDIUM', category: '', ticketId: '', equipmentId: '' });
    qc.invalidateQueries({ queryKey: ['quality-incidents'] });
  }

  const stats = [
    { label: 'Total', value: data?.stats.total ?? 0 },
    { label: 'Signalés', value: data?.stats.reported ?? 0 },
    { label: 'En traitement', value: data?.stats.inProgress ?? 0 },
    { label: 'Résolus 7j', value: data?.stats.resolved7d ?? 0 },
    { label: 'Critiques', value: data?.stats.critical ?? 0 },
  ];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>Actualiser</Button>
            <Button onClick={() => setOpenCreate(true)}><Plus className="size-4" />Nouvel incident</Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {stats.map((s, i) => {
            const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
            return (
              <div key={s.label} className={cn('relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4')}>
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 gap-5 lg:gap-8">
          <IncidentDistributionChart />
          <IncidentEvolutionChart />
        </div>

        <Card className="border-border shadow-none overflow-hidden">
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous statuts</SelectItem>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex max-w-md flex-1 gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Rechercher…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setSearch(q)}
                />
              </div>
              <Button variant="secondary" onClick={() => { setSearch(q); setPagination((p) => ({ ...p, pageIndex: 0 })); }}>
                Filtrer
              </Button>
            </div>
          </CardHeader>
          <div className="p-0">
            <ModuleDataGridShell
              table={table as never}
              isLoading={isLoading}
              recordCount={data?.pagination.total ?? 0}
              cardClassName="border-0 shadow-none rounded-none"
              onRowClick={(row) => {
                setDetailId((row as IncidentRow).id);
                setDetailOpen(true);
              }}
            />
          </div>
        </Card>
      </Container>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel incident qualité</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre</Label><Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} /></div>
            <div><Label>Catégorie</Label><Input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="Matériel, processus…" /></div>
            <div>
              <Label>Gravité</Label>
              <Select value={form.severity} onValueChange={(v) => setForm((f) => ({ ...f, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SEVERITY_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <SupportEntityCombobox
              type="tickets"
              label="Ticket lié (optionnel)"
              value={form.ticketId}
              onChange={(id) => setForm((f) => ({ ...f, ticketId: id }))}
            />
            <SupportEntityCombobox
              type="equipment"
              label="Équipement lié (optionnel)"
              value={form.equipmentId}
              onChange={(id) => setForm((f) => ({ ...f, equipmentId: id }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Annuler</Button>
            <Button onClick={createIncident}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IncidentDetailSheet
        incidentId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['quality-incidents'] })}
      />
    </>
  );
}
