'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState, useCallback } from 'react';
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
import { apiFetch } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { useSupportTicketsQuery, type SupportTicketRow } from './hooks/use-support-tickets-query';
import { TicketWorkspaceSheet } from './components/ticket-workspace-sheet';

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_CLIENT: 'Attente client',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

const PRIORITY_LABEL: Record<string, string> = {
  LOW: 'Basse',
  MEDIUM: 'Normale',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

export default function SupportTicketsPage() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const { title, description } = usePageToolbarMeta('/support-qualite/support/tickets');
  const qc = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    description: '',
    requesterName: '',
    requesterEmail: '',
    priority: 'MEDIUM',
  });

  const { data, isLoading, refetch, isFetching } = useSupportTicketsQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    q: search,
    status: statusFilter,
  });

  const patchTicket = useCallback(
    async (id: string, payload: Record<string, unknown>) => {
      const res = await apiFetch(`/api/sections/support-qualite/support/tickets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error('Mise à jour impossible');
        return;
      }
      qc.invalidateQueries({ queryKey: ['support-tickets'] });
    },
    [qc],
  );

  const columns = useMemo<ColumnDef<SupportTicketRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referenceCode}</span>,
      },
      {
        accessorKey: 'subject',
        header: ({ column }) => <DataGridColumnHeader title="Sujet" column={column} />,
        cell: ({ row }) => <span className="font-medium">{row.original.subject}</span>,
      },
      {
        id: 'requester',
        header: ({ column }) => <DataGridColumnHeader title="Demandeur" column={column} />,
        cell: ({ row }) => (
          <div>
            <div>{row.original.requesterName}</div>
            <div className="text-xs text-muted-foreground">{row.original.requesterEmail}</div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'priority',
        header: ({ column }) => <DataGridColumnHeader title="Priorité" column={column} />,
        cell: ({ row }) => PRIORITY_LABEL[row.original.priority] ?? row.original.priority,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary">{STATUS_LABEL[row.original.status] ?? row.original.status}</Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
            {row.original.status === 'OPEN' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  patchTicket(row.original.id, {
                    status: 'IN_PROGRESS',
                    assignedToId: session?.user?.id ?? null,
                  })
                }
              >
                Prendre en charge
              </Button>
            )}
            {row.original.status === 'IN_PROGRESS' && (
              <Button size="sm" variant="outline" onClick={() => patchTicket(row.original.id, { status: 'RESOLVED' })}>
                Résoudre
              </Button>
            )}
          </div>
        ),
        enableSorting: false,
        size: 160,
      },
    ],
    [patchTicket, session?.user?.id],
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

  async function createTicket() {
    const res = await apiFetch('/api/sections/support-qualite/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: { message?: string } }).error?.message ?? 'Échec création');
      return;
    }
    toast.success(t('support.ticketCreated'));
    setOpenCreate(false);
    setForm({ subject: '', description: '', requesterName: '', requesterEmail: '', priority: 'MEDIUM' });
    qc.invalidateQueries({ queryKey: ['support-tickets'] });
  }

  const stats = [
    { label: 'Total', value: data?.stats.total ?? 0, subtitle: 'Tickets' },
    { label: 'Ouverts', value: data?.stats.open ?? 0, subtitle: 'À traiter' },
    { label: 'En cours', value: data?.stats.inProgress ?? 0, subtitle: 'Assignés' },
    { label: 'Résolus', value: data?.stats.resolved ?? 0, subtitle: 'Clôturés' },
    { label: 'Priorité haute', value: data?.stats.urgent ?? 0, subtitle: 'Urgent / haute' },
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
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              Actualiser
            </Button>
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4" />
              Nouveau ticket
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {stats.map((s, i) => {
            const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
            return (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
            );
          })}
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
                  <SelectItem key={k} value={k}>
                    {v}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex max-w-md flex-1 gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('datagrid.search.generic')}
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
          <div className="p-0">
            <ModuleDataGridShell
              table={table}
              recordCount={data?.pagination.total ?? 0}
              isLoading={isLoading}
              emptyMessage="Aucun ticket"
              cardClassName="border-0 shadow-none rounded-none"
              onRowClick={(row) => {
                setDetailId(row.id);
                setDetailOpen(true);
              }}
            />
          </div>
        </Card>
      </Container>
<Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Saisie manuelle d&apos;une demande (téléphone, e-mail, accueil). Les demandes peuvent aussi être créées automatiquement via les workflows CRM.
            </p>
          </DialogHeader>
          <div className="grid gap-3">
            <div><Label>Sujet</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nom</Label><Input value={form.requesterName} onChange={(e) => setForm({ ...form, requesterName: e.target.value })} /></div>
              <div><Label>E-mail</Label><Input type="email" value={form.requesterEmail} onChange={(e) => setForm({ ...form, requesterEmail: e.target.value })} /></div>
            </div>
            <div>
              <Label>Priorité</Label>
              <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABEL).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>Annuler</Button>
            <Button onClick={createTicket}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TicketWorkspaceSheet
        ticketId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['support-tickets'] })}
      />
    </>
  );
}
