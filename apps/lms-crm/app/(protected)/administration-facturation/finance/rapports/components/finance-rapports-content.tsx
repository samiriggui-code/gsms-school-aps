'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  RefreshCw,
  TrendingUp,
  Wallet,
} from 'lucide-react';
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
import { Skeleton } from '@repo/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { FinanceRapportsPayload } from '@/lib/finance/finance-rapports-build';
import { cn } from '@/lib/utils';
import { FinanceRapportsDashboard } from './finance-rapports-dashboard';

const KPI_ICONS = [FileText, CheckCircle2, TrendingUp, AlertTriangle, Wallet, Wallet];

async function fetchRapports(months: number): Promise<FinanceRapportsPayload> {
  const res = await apiFetch(
    `/api/sections/administration-facturation/finance/rapports?months=${months}`,
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible',
    );
  }
  const data = unwrapSectionApiData<FinanceRapportsPayload>(json);
  if (!data) throw new Error('Réponse vide');
  return data;
}

export function FinanceRapportsContent() {
  const { title, description } = usePageToolbarMeta('/administration-facturation/finance/rapports');
  const [months, setMonths] = useState('12');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['finance-rapports', months] as const,
    queryFn: () => fetchRapports(Number(months)),
    staleTime: 60_000,
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

  const exportCsv = useCallback(async () => {
    try {
      const res = await apiFetch('/api/sections/administration-facturation/finance/rapports/export');
      if (!res.ok) {
        toast.error('Export impossible');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rapports-finance.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export CSV téléchargé');
    } catch {
      toast.error('Export impossible');
    }
  }, []);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex flex-wrap gap-2">
            <Select value={months} onValueChange={setMonths}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 mois</SelectItem>
                <SelectItem value="12">12 mois</SelectItem>
                <SelectItem value="18">18 mois</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              Actualiser
            </Button>
            <Button variant="outline" onClick={exportCsv}>
              <Download className="size-4" />
              Export CSV
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <ModuleKpiStatsRow items={kpiCards} />
        )}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : data ? (
          <FinanceRapportsDashboard data={data} />
        ) : null}
      </Container>
    </>
  );
}
