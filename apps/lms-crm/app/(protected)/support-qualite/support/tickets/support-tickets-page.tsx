'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
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
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { useSupportTicketsQuery } from './hooks/use-support-tickets-query';
import { TicketDetailSheet } from './components/ticket-detail-sheet';

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
  const { title, description } = usePageToolbarMeta('/support-qualite/support/tickets');
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
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
    page,
    limit: 15,
    q: search,
    status: statusFilter,
  });

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / 15));

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

  async function patchStatus(id: string, status: string) {
    const res = await apiFetch(`/api/sections/support-qualite/support/tickets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      toast.error('Mise à jour impossible');
      return;
    }
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

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
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
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('datagrid.search.generic')} className="flex-1" />
              <Button variant="secondary" onClick={() => { setSearch(q); setPage(1); }}>
                <Search className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Réf.</th>
                    <th className="px-4 py-3 text-left font-medium">Sujet</th>
                    <th className="px-4 py-3 text-left font-medium">Demandeur</th>
                    <th className="px-4 py-3 text-left font-medium">Priorité</th>
                    <th className="px-4 py-3 text-left font-medium">Statut</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>
                  ) : (data?.items.length ?? 0) === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucun ticket</td></tr>
                  ) : (
                    data!.items.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b hover:bg-muted/20 cursor-pointer"
                        onClick={() => {
                          setDetailId(row.id);
                          setDetailOpen(true);
                        }}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{row.referenceCode}</td>
                        <td className="px-4 py-3">{row.subject}</td>
                        <td className="px-4 py-3">
                          <div>{row.requesterName}</div>
                          <div className="text-xs text-muted-foreground">{row.requesterEmail}</div>
                        </td>
                        <td className="px-4 py-3">{PRIORITY_LABEL[row.priority] ?? row.priority}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{STATUS_LABEL[row.status] ?? row.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          {row.status === 'OPEN' && (
                            <Button size="sm" variant="outline" onClick={() => patchStatus(row.id, 'IN_PROGRESS')}>
                              Prendre en charge
                            </Button>
                          )}
                          {row.status === 'IN_PROGRESS' && (
                            <Button size="sm" variant="outline" onClick={() => patchStatus(row.id, 'RESOLVED')}>
                              Résoudre
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(data?.pagination.total ?? 0) > 15 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">Page {page} / {totalPages}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Préc.</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Suiv.</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
<Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau ticket</DialogTitle>
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

      <TicketDetailSheet
        ticketId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={() => qc.invalidateQueries({ queryKey: ['support-tickets'] })}
      />
    </>
  );
}
