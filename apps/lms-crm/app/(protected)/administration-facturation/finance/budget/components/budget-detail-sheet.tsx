'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BarChart3,
  Building2,
  CalendarRange,
  Loader2,
  Pencil,
  PiggyBank,
  Target,
  Trash2,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { VIE_SCOLAIRE_SHEET_LARGE } from '@/app/(protected)/gestion-academique/vie-scolaire/constants/sheet-shell-classes';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@repo/ui/chart';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Progress } from '@repo/ui/progress';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Textarea } from '@repo/ui/textarea';
import { apiFetch } from '@/lib/api';
import { PILOTAGE_CHART_COLORS } from '@/lib/pilotage/chart-colors';
import { cn } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { useFinanceBudgetDetailQuery } from '../hooks/use-finance-budget-detail-query';

export type BudgetDetailInitialTab = 'overview' | 'tranches' | 'poles' | 'movements' | 'edit';

type Props = {
  lineId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: BudgetDetailInitialTab;
  onDeleted?: () => void;
};

function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

const CATEGORY_ICONS: Record<string, typeof Wallet> = {
  FORMATION: Target,
  RH: Building2,
  EQUIPEMENT: BarChart3,
};

export function BudgetDetailSheet({
  lineId,
  open,
  onOpenChange,
  initialTab = 'overview',
  onDeleted,
}: Props) {
  const qc = useQueryClient();
  const { data: detail, isLoading, refetch } = useFinanceBudgetDetailQuery(lineId, open && !!lineId);
  const [tab, setTab] = useState<BudgetDetailInitialTab>(initialTab);
  const [editForm, setEditForm] = useState({ label: '', plannedAmount: '', notes: '' });

  useEffect(() => {
    if (open) setTab(initialTab);
  }, [open, lineId, initialTab]);

  useEffect(() => {
    if (!detail) return;
    setEditForm({
      label: detail.line.label,
      plannedAmount: String(detail.line.plannedAmount),
      notes: detail.line.notes ?? '',
    });
  }, [detail]);

  const monthlyChart = useMemo(
    () =>
      detail?.monthlySlices.map((s) => ({
        label: s.label.slice(0, 3),
        planned: s.planned,
        actual: s.actual,
      })) ?? [],
    [detail?.monthlySlices],
  );

  const chartConfig = {
    planned: { label: 'Prévu', color: PILOTAGE_CHART_COLORS[1] },
    actual: { label: 'Réalisé', color: PILOTAGE_CHART_COLORS[0] },
  } satisfies ChartConfig;

  const patchMutation = useMutation({
    mutationFn: async () => {
      if (!lineId) throw new Error('Ligne introuvable');
      const plannedAmount = Number(editForm.plannedAmount);
      if (!editForm.label.trim() || !Number.isFinite(plannedAmount)) {
        throw new Error('Libellé et montant prévu requis');
      }
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/budget/${encodeURIComponent(lineId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: editForm.label.trim(),
            plannedAmount,
            notes: editForm.notes.trim() || null,
          }),
        },
      );
      if (!res.ok) throw new Error('Enregistrement impossible');
    },
    onSuccess: async () => {
      toast.success('Ligne budget mise à jour');
      await refetch();
      void qc.invalidateQueries({ queryKey: ['finance-budget'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!lineId) throw new Error('Ligne introuvable');
      const res = await apiFetch(
        `/api/sections/administration-facturation/finance/budget/${encodeURIComponent(lineId)}`,
        { method: 'DELETE' },
      );
      if (!res.ok) throw new Error('Suppression impossible');
    },
    onSuccess: () => {
      toast.success('Ligne supprimée');
      onOpenChange(false);
      onDeleted?.();
      void qc.invalidateQueries({ queryKey: ['finance-budget'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const CategoryIcon = CATEGORY_ICONS[detail?.line.category ?? ''] ?? PiggyBank;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={cn(VIE_SCOLAIRE_SHEET_LARGE, 'p-0')} side="right">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3 pe-8">
            <div className="space-y-1.5 min-w-0">
              <SheetTitle className="text-lg font-bold leading-tight">
                {isLoading ? 'Chargement…' : detail?.line.label ?? 'Ligne budget'}
              </SheetTitle>
              {detail ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="uppercase text-[10px] font-bold">
                    {detail.line.category}
                  </Badge>
                  <span>{detail.line.periodLabel}</span>
                  <span>·</span>
                  <span>Maj. {format(new Date(detail.line.updatedAt), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
              ) : null}
            </div>
            {detail ? (
              <Badge
                variant={detail.line.consumptionPct > 90 ? 'destructive' : detail.line.consumptionPct > 70 ? 'warning' : 'success'}
                appearance="light"
              >
                {detail.line.consumptionPct} % consommé
              </Badge>
            ) : null}
          </div>
        </SheetHeader>

        <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          {isLoading || !detail ? (
            <div className="flex flex-1 items-center justify-center p-8">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-border bg-muted/10 px-5 py-3 sm:grid-cols-4">
                {[
                  { label: 'Prévu', value: fmtEuro(detail.line.plannedAmount), icon: Target },
                  { label: 'Réalisé', value: fmtEuro(detail.line.actualAmount), icon: Wallet },
                  { label: 'Écart', value: fmtEuro(detail.line.ecart), icon: TrendingDown },
                  { label: 'Pôles', value: detail.summary.poleCount, icon: Building2 },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-lg border border-border/60 bg-background px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{kpi.label}</p>
                    <p className="mt-0.5 text-base font-bold tabular-nums">{kpi.value}</p>
                  </div>
                ))}
              </div>

              <ScrollArea className="min-h-0 flex-1" viewportClassName="max-h-[calc(100dvh-13rem)]">
                <div className="flex flex-col gap-0 px-3.5 lg:flex-row">
                  <aside className="w-full shrink-0 space-y-4 border-border py-5 lg:w-[240px] lg:border-e lg:pe-5">
                    <Card className="border-border/70 shadow-none">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CategoryIcon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <CardTitle className="text-sm leading-tight">{detail.line.label}</CardTitle>
                            <p className="text-xs text-muted-foreground">{detail.line.periodLabel}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Consommation</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Progress value={Math.min(detail.line.consumptionPct, 100)} className="h-2 flex-1" />
                            <span className="text-xs font-semibold tabular-nums">{detail.line.consumptionPct}%</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md bg-muted/40 px-2 py-1.5">
                            <p className="text-muted-foreground">Mouvements</p>
                            <p className="font-semibold">{detail.summary.movementCount}</p>
                          </div>
                          <div className="rounded-md bg-muted/40 px-2 py-1.5">
                            <p className="text-muted-foreground">Tranches liées</p>
                            <p className="font-semibold">{detail.summary.siblingLines}</p>
                          </div>
                        </div>
                        {detail.line.notes ? (
                          <p className="rounded-md border border-dashed border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
                            {detail.line.notes}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  </aside>

                  <div className="min-w-0 flex-1 py-5 lg:ps-5">
                    <Tabs value={tab} onValueChange={(v) => setTab(v as BudgetDetailInitialTab)}>
                      <TabsList className="mb-4 inline-flex w-auto flex-wrap gap-1">
                        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                        <TabsTrigger value="tranches" className="gap-1.5">
                          <CalendarRange className="size-3.5 opacity-70" />
                          Tranches
                        </TabsTrigger>
                        <TabsTrigger value="poles">Par pôle</TabsTrigger>
                        <TabsTrigger value="movements">Mouvements</TabsTrigger>
                        <TabsTrigger value="edit" className="gap-1.5">
                          <Pencil className="size-3.5 opacity-70" />
                          Modifier
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="space-y-5">
                        <Card className="shadow-none border border-border/60">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Évolution mensuelle</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
                              <BarChart data={monthlyChart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.4} />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10 }} width={42} />
                                <ChartTooltip />
                                <Bar dataKey="planned" fill="var(--color-planned)" radius={[3, 3, 0, 0]} />
                                <Bar dataKey="actual" fill="var(--color-actual)" radius={[3, 3, 0, 0]} />
                              </BarChart>
                            </ChartContainer>
                          </CardContent>
                        </Card>

                        <Card className="shadow-none border border-border/60">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Répartition par pôle / site</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {detail.poleSlices.map((pole) => (
                              <div key={pole.poleId} className="space-y-1">
                                <div className="flex items-center justify-between gap-2 text-sm">
                                  <span className="font-medium truncate">{pole.label}</span>
                                  <span className="tabular-nums text-muted-foreground">
                                    {fmtEuro(pole.actual)} / {fmtEuro(pole.planned)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={pole.planned > 0 ? Math.min((pole.actual / pole.planned) * 100, 100) : 0}
                                    className="h-1.5 flex-1"
                                  />
                                  <span className="w-8 text-end text-xs tabular-nums">{pole.sharePct}%</span>
                                </div>
                                {pole.detail ? <p className="text-[11px] text-muted-foreground">{pole.detail}</p> : null}
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="tranches">
                        <Card className="shadow-none border border-border/60">
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Mois</TableHead>
                                  <TableHead className="text-right">Prévu</TableHead>
                                  <TableHead className="text-right">Réalisé</TableHead>
                                  <TableHead className="text-right">Conso.</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detail.monthlySlices.map((slice) => (
                                  <TableRow key={slice.month}>
                                    <TableCell className="font-medium">{slice.label}</TableCell>
                                    <TableCell className="text-right tabular-nums">{fmtEuro(slice.planned)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{fmtEuro(slice.actual)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{slice.consumptionPct} %</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                        {detail.relatedLines.length > 0 ? (
                          <Card className="mt-4 shadow-none border border-border/60">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Autres lignes {detail.line.category}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Libellé</TableHead>
                                    <TableHead>Période</TableHead>
                                    <TableHead className="text-right">Prévu</TableHead>
                                    <TableHead className="text-right">Réalisé</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detail.relatedLines.map((r) => (
                                    <TableRow key={r.id}>
                                      <TableCell>{r.label}</TableCell>
                                      <TableCell>
                                        {r.periodMonth != null
                                          ? format(new Date(detail.line.periodYear, r.periodMonth - 1, 1), 'MMMM', {
                                              locale: fr,
                                            })
                                          : 'Annuel'}
                                      </TableCell>
                                      <TableCell className="text-right tabular-nums">{fmtEuro(r.plannedAmount)}</TableCell>
                                      <TableCell className="text-right tabular-nums">{fmtEuro(r.actualAmount)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ) : null}
                      </TabsContent>

                      <TabsContent value="poles">
                        <Card className="shadow-none border border-border/60">
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Pôle / site</TableHead>
                                  <TableHead className="text-right">Prévu</TableHead>
                                  <TableHead className="text-right">Réalisé</TableHead>
                                  <TableHead className="text-right">Part</TableHead>
                                  <TableHead className="text-right">Effectif</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detail.poleSlices.map((pole) => (
                                  <TableRow key={pole.poleId}>
                                    <TableCell>
                                      <p className="font-medium">{pole.label}</p>
                                      {pole.detail ? (
                                        <p className="text-xs text-muted-foreground">{pole.detail}</p>
                                      ) : null}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{fmtEuro(pole.planned)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{fmtEuro(pole.actual)}</TableCell>
                                    <TableCell className="text-right tabular-nums">{pole.sharePct} %</TableCell>
                                    <TableCell className="text-right tabular-nums">{pole.headcount ?? '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="movements">
                        <Card className="shadow-none border border-border/60">
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Réf.</TableHead>
                                  <TableHead>Libellé</TableHead>
                                  <TableHead className="text-right">Montant</TableHead>
                                  <TableHead>Statut</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detail.movements.length === 0 ? (
                                  <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                      Aucun mouvement lié pour cette catégorie
                                    </TableCell>
                                  </TableRow>
                                ) : (
                                  detail.movements.map((m) => (
                                    <TableRow key={m.id}>
                                      <TableCell className="font-mono text-xs">{m.reference}</TableCell>
                                      <TableCell>{m.label}</TableCell>
                                      <TableCell className="text-right tabular-nums font-medium">
                                        {m.amount > 0 ? fmtEuro(m.amount) : '—'}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className="text-[10px] uppercase">
                                          {m.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground text-xs">
                                        {m.date ? format(new Date(m.date), 'dd/MM/yyyy', { locale: fr }) : '—'}
                                      </TableCell>
                                    </TableRow>
                                  ))
                                )}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="edit" className="space-y-4 max-w-lg">
                        <div className="space-y-1.5">
                          <Label>Libellé</Label>
                          <Input
                            value={editForm.label}
                            onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Montant prévu (€)</Label>
                          <Input
                            type="number"
                            value={editForm.plannedAmount}
                            onChange={(e) => setEditForm((f) => ({ ...f, plannedAmount: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Notes internes</Label>
                          <Textarea
                            value={editForm.notes}
                            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                            rows={4}
                          />
                        </div>
                        <Button disabled={patchMutation.isPending} onClick={() => patchMutation.mutate()}>
                          {patchMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                          Enregistrer
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetBody>

        {detail ? (
          <SheetFooter className="border-t border-border px-5 py-3 sm:justify-between">
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive"
              disabled={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Supprimer cette ligne budget ?')) deleteMutation.mutate();
              }}
            >
              <Trash2 className="size-4" />
              Supprimer
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
