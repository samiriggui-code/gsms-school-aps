'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Search } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import {
  formationExamOutcomeBadgeVariant,
  formationExamOutcomeLabelI18n,
} from '@/lib/vie-scolaire/formation-exam-labels';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

type ExamRow = {
  id: string;
  examOutcome: string;
  examDate: string | null;
  certifiedAt: string | null;
  user: { id: string; name: string | null; email: string };
  session: {
    id: string;
    dateDisplayLabel: string;
    formation: { id: string; name: string } | null;
  };
  candidature: { id: string; status: string } | null;
};

const OUTCOME_OPTIONS = ['PENDING', 'PASSED', 'FAILED', 'ABSENT'] as const;

export function ParcoursSessionExamensPanel({
  sessionId = null,
  embedded = false,
}: {
  sessionId?: string | null;
  embedded?: boolean;
} = {}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [listSearch, setListSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: [
      'vie-scolaire',
      'examens',
      sessionId ?? 'all',
      pagination.pageIndex,
      pagination.pageSize,
      listSearch,
      outcomeFilter,
    ],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        ...(listSearch.trim() ? { q: listSearch.trim() } : {}),
        ...(outcomeFilter !== 'all' ? { outcome: outcomeFilter } : {}),
        ...(sessionId ? { sessionId } : {}),
      });
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/examens?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data as { items: ExamRow[]; pagination: { total: number } };
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, examOutcome }: { id: string; examOutcome: string }) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/examens/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examOutcome, examDate: new Date().toISOString() }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Mise à jour impossible');
      return body.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.examOutcome === 'PASSED'
          ? t('vieScolaire.examens.examResultPassedAuto')
          : t('academic.examResultSaved'),
      );
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens', 'stats'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'certifications'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens', 'stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<ExamRow>[]>(() => {
    const all: ColumnDef<ExamRow>[] = [
      {
        id: 'user',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.trainee')} column={column} />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{row.original.user.name || '—'}</p>
            <p className="text-xs text-muted-foreground truncate">{row.original.user.email}</p>
          </div>
        ),
        size: 180,
      },
      {
        id: 'formation',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.formation')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm">{row.original.session.formation?.name ?? '—'}</span>
        ),
        size: 160,
      },
      {
        id: 'session',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.session')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.session.dateDisplayLabel}</span>
        ),
        size: 140,
      },
      {
        id: 'outcome',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.examens.columnOutcome')} column={column} />
        ),
        cell: ({ row }) => (
          <Badge
            variant={formationExamOutcomeBadgeVariant(row.original.examOutcome)}
            appearance="outline"
            size="sm"
          >
            {formationExamOutcomeLabelI18n(t, row.original.examOutcome)}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'examDate',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.examens.columnExamDate')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-xs whitespace-nowrap">
            {row.original.examDate ? formatDateTime(row.original.examDate) : '—'}
          </span>
        ),
        size: 130,
      },
      {
        id: 'action',
        header: t('vieScolaire.examens.columnEntry'),
        cell: ({ row }) => (
          <Select
            value={row.original.examOutcome}
            onValueChange={(value) => patchMutation.mutate({ id: row.original.id, examOutcome: value })}
          >
            <SelectTrigger className="h-8 w-full min-w-[120px] max-w-[140px]">
              <SelectValue placeholder={t('vieScolaire.examens.outcomePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {OUTCOME_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {formationExamOutcomeLabelI18n(t, value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ),
        size: 150,
      },
    ];
    if (embedded && sessionId) {
      return all.filter((col) => col.id !== 'formation' && col.id !== 'session');
    }
    return all;
  }, [embedded, patchMutation, sessionId, t]);

  const table = useReactTable({
    columns,
    data: data?.items ?? [],
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    getRowId: (r) => r.id,
  });

  return (
    <Card className={embedded ? 'border-0 shadow-none' : 'border-border shadow-none'}>
      <CardHeader className="space-y-3 py-4">
        <div>
          <CardTitle className="text-base">{t('vieScolaire.examens.resultsTitle')}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{t('vieScolaire.examens.resultsDesc')}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('vieScolaire.common.searchTrainee')}
              className="h-9 ps-9"
              value={listSearch}
              onChange={(e) => {
                setListSearch(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            />
          </div>
          <Select
            value={outcomeFilter}
            onValueChange={(v) => {
              setOutcomeFilter(v);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          >
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder={t('vieScolaire.examens.filterOutcomePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('vieScolaire.examens.filterAllOutcomes')}</SelectItem>
              {OUTCOME_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {formationExamOutcomeLabelI18n(t, value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <ModuleDataGridShell
          table={table}
          recordCount={data?.pagination.total ?? 0}
          isLoading={isLoading}
          emptyMessage={t('vieScolaire.examens.emptyResults')}
          cardClassName="border-0 shadow-none rounded-none"
        />
      </CardContent>
    </Card>
  );
}
