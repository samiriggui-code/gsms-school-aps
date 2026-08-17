'use client';

import { TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardHeading,
  CardTitle,
  CardToolbar,
} from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import type { FinanceRapportsPayload } from '@/lib/finance/finance-rapports-build';
import { PILOTAGE_CHART_COLORS } from '@/lib/pilotage/chart-colors';
import {
  FinanceRapportsBudgetGrid,
  FinanceRapportsInvoicesGrid,
  FinanceRapportsMonthlyGrid,
  FinanceRapportsPaymentsGrid,
} from './finance-rapports-datagrids';

function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

const pieConfig = {
  s0: { label: 'Série', color: PILOTAGE_CHART_COLORS[0] },
} satisfies ChartConfig;

type Props = { data: FinanceRapportsPayload };

export function FinanceRapportsDashboard({ data }: Props) {
  const evolutionConfig = {
    ca: { label: 'CA accepté (€)', color: PILOTAGE_CHART_COLORS[0] },
    devis: { label: 'Devis créés', color: PILOTAGE_CHART_COLORS[2] },
    leads: { label: 'Leads', color: PILOTAGE_CHART_COLORS[3] },
  } satisfies ChartConfig;

  const budgetConfig = {
    planned: { label: 'Prévu', color: PILOTAGE_CHART_COLORS[1] },
    actual: { label: 'Réalisé', color: PILOTAGE_CHART_COLORS[0] },
  } satisfies ChartConfig;

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardHeading>
              <CardTitle className="text-base">{data.charts.evolutionTitle}</CardTitle>
              <p className="text-xs font-normal text-muted-foreground">
                {data.periodMonths} derniers mois
              </p>
            </CardHeading>
            <CardToolbar>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                Temps réel
              </div>
            </CardToolbar>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={evolutionConfig} className="aspect-auto h-[300px] w-full">
              <LineChart data={data.charts.evolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={48} />
                <ChartTooltip />
                <Line type="monotone" dataKey="ca" stroke="var(--color-ca)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="devis" stroke="var(--color-devis)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="leads" stroke="var(--color-leads)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">{data.charts.devisStatusTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <ChartContainer config={pieConfig} className="aspect-auto h-[220px] w-full">
              <PieChart>
                <Pie
                  data={data.charts.devisStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.charts.devisStatus.map((_, i) => (
                    <Cell key={i} fill={PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ChartContainer>
            <div className="flex w-full flex-wrap justify-center gap-2">
              {data.charts.devisStatus.map((item, i) => (
                <span
                  key={item.name}
                  className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase text-muted-foreground"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length] }}
                  />
                  {item.name}
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 text-primary">
                    {item.value}
                  </span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">{data.charts.budgetTitle}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={budgetConfig} className="aspect-auto h-[260px] w-full">
              <BarChart data={data.charts.budgetByCategory} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} strokeOpacity={0.4} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={44} />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="planned" fill="var(--color-planned)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="var(--color-actual)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">{data.charts.paymentsTitle}</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">
              {fmtEuro(data.charts.paymentsReceivedAmount)} encaissés
              {data.charts.paymentsPendingAmount > 0
                ? ` · ${fmtEuro(data.charts.paymentsPendingAmount)} en attente`
                : ''}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            {data.charts.paymentsStatus.every((p) => p.count === 0) ? (
              <p className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Aucun paiement enregistré
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <ChartContainer config={pieConfig} className="aspect-auto h-[180px] w-full">
                  <PieChart>
                    <Pie
                      data={data.charts.paymentsStatus.filter((p) => p.amount > 0)}
                      dataKey="amount"
                      nameKey="name"
                      innerRadius="52%"
                      outerRadius="78%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {data.charts.paymentsStatus
                        .filter((p) => p.amount > 0)
                        .map((_, i) => (
                          <Cell key={i} fill={PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length]} />
                        ))}
                    </Pie>
                    <ChartTooltip
                      formatter={(value, name) => [fmtEuro(Number(value)), String(name)]}
                    />
                  </PieChart>
                </ChartContainer>
                <div className="grid grid-cols-2 gap-2">
                  {data.charts.paymentsStatus.map((item, i) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <span className="inline-flex items-center gap-2 text-muted-foreground">
                        <span
                          className="size-2 rounded-full"
                          style={{
                            backgroundColor:
                              item.count > 0
                                ? PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length]
                                : 'var(--border)',
                          }}
                        />
                        {item.name}
                      </span>
                      <span className="text-right">
                        <span className="block font-semibold tabular-nums">{fmtEuro(item.amount)}</span>
                        <span className="text-2xs text-muted-foreground">{item.count} mvmt.</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2 lg:gap-8">
        <FinanceRapportsBudgetGrid rows={data.tables.budgetLines} />
        <FinanceRapportsInvoicesGrid rows={data.tables.unpaidInvoices} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 xl:grid-cols-2 lg:gap-8">
        <FinanceRapportsPaymentsGrid rows={data.tables.recentPayments} />
        <FinanceRapportsMonthlyGrid rows={data.tables.monthlySummary} />
      </div>
    </div>
  );
}
