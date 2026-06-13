'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, Search, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import type { InstructorSessionRow, InstructorTraineeRow } from '@/lib/instructor/instructor-types';
import {
  INSTRUCTOR_SESSIONS_API,
  INSTRUCTOR_STAGIAIRES_API,
} from '@/lib/instructor/instructor-paths';
import { UserAvatar } from '@/components/common/user-avatar';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  INSTRUCTOR_DATAGRID_PAGE_SIZE,
  PortalDataGrid,
} from '@/components/instructor/datagrid/portal-data-grid';
import { InstructorAttendancePanel } from '@/components/instructor/stagiaires/instructor-attendance-panel';
import { InstructorCohortActivityChart } from '@/components/instructor/stagiaires/instructor-cohort-activity-chart';
import { InstructorStagiaireDetailSheet } from '@/components/instructor/stagiaires/instructor-stagiaire-detail-sheet';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { instructorStagiairesKpis } from '@/lib/instructor/instructor-kpi-stats';
import { cn } from '@/lib/utils';
import { formatPortalDate } from '@/lib/portal/format-portal-date';

export function InstructorStagiairesPage() {
  const searchParams = useSearchParams();
  const sessionFromUrl = searchParams.get('session')?.trim() ?? '';

  const [sessionFilter, setSessionFilter] = useState<string>(sessionFromUrl || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: INSTRUCTOR_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [detail, setDetail] = useState<{ sessionId: string; userId: string } | null>(null);

  useEffect(() => {
    if (sessionFromUrl) setSessionFilter(sessionFromUrl);
  }, [sessionFromUrl]);

  const sessionsQuery = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_SESSIONS_API);
      const json = (await res.json()) as { success?: boolean; data?: { items: InstructorSessionRow[] } };
      if (!res.ok || !json.success) throw new Error('Sessions indisponibles');
      return json.data?.items ?? [];
    },
  });

  const activeSessionId = sessionFilter === 'all' ? null : sessionFilter;

  const traineesQuery = useQuery({
    queryKey: ['instructor-stagiaires', activeSessionId],
    queryFn: async () => {
      const qs = activeSessionId ? `?sessionId=${activeSessionId}` : '';
      const res = await apiFetch(`${INSTRUCTOR_STAGIAIRES_API}${qs}`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { items: InstructorTraineeRow[] };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
      return json.data?.items ?? [];
    },
  });

  const rows = traineesQuery.data ?? [];

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const blob = `${row.name} ${row.email} ${row.formationName} ${row.sessionLabel}`.toLowerCase();
      return blob.includes(q);
    });
  }, [rows, searchQuery]);

  const columns = useMemo<ColumnDef<InstructorTraineeRow>[]>(
    () => {
      const cols: ColumnDef<InstructorTraineeRow>[] = [
        {
          id: 'name',
          accessorFn: (row) => row.name ?? row.email,
          header: ({ column }) => <DataGridColumnHeader title="Stagiaire" column={column} />,
          cell: ({ row }) => (
            <div className="flex min-w-0 items-center gap-2.5 py-0.5">
              <UserAvatar
                avatar={row.original.avatar}
                className="size-8 shrink-0 rounded-full border"
                fallback="/media/avatars/300-2.png"
              />
              <div className="min-w-0">
                <p className={cn('truncate font-medium', portalSectionTitle)}>
                  {row.original.name ?? row.original.email}
                </p>
                <p className={cn('truncate', portalMuted)}>{row.original.email}</p>
              </div>
            </div>
          ),
          size: 220,
        },
      ];

      if (!activeSessionId) {
        cols.push({
          accessorKey: 'formationName',
          header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
          cell: ({ row }) => (
            <span className={cn('line-clamp-2', portalMuted)}>{row.original.formationName}</span>
          ),
          size: 160,
        });
        cols.push({
          accessorKey: 'sessionLabel',
          header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
          cell: ({ row }) => (
            <span className={cn('line-clamp-2', portalMuted)}>{row.original.sessionLabel}</span>
          ),
          size: 150,
        });
      }

      cols.push(
        {
          id: 'progress',
          accessorFn: (row) => row.progressPercent,
          header: ({ column }) => <DataGridColumnHeader title="Progression UV" column={column} />,
          cell: ({ row }) => (
            <div className="min-w-[120px] space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span>{row.original.progressPercent} %</span>
                <span className="text-muted-foreground">
                  {row.original.completedChapters}/{row.original.totalChapters}
                </span>
              </div>
              <Progress value={row.original.progressPercent} className="h-1.5" />
            </div>
          ),
          size: 150,
        },
        {
          id: 'quiz',
          header: ({ column }) => <DataGridColumnHeader title="Quiz" column={column} />,
          cell: ({ row }) => (
            <Badge variant="secondary" appearance="light" size="sm" className="text-[10px]">
              {row.original.quizPassed}/{row.original.quizTotal}
            </Badge>
          ),
          enableSorting: false,
          size: 80,
        },
        {
          accessorKey: 'lastActivityAt',
          header: ({ column }) => <DataGridColumnHeader title="Dernière activité" column={column} />,
          cell: ({ row }) => (
            <span className={portalMuted}>
              {row.original.lastActivityAt
                ? formatPortalDate(row.original.lastActivityAt)
                : '—'}
            </span>
          ),
          size: 120,
        },
        {
          id: 'actions',
          header: () => <span className="sr-only">Actions</span>,
          cell: ({ row }) => (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-[12px]"
              onClick={() =>
                setDetail({ sessionId: row.original.sessionId, userId: row.original.userId })
              }
            >
              <Eye className="me-1 size-3.5" />
              Détail
            </Button>
          ),
          size: 90,
          enableSorting: false,
        },
      );

      return cols;
    },
    [activeSessionId],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    pageCount: Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize)),
    getRowId: (row) => row.participantId,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const chartSessionId =
    activeSessionId ?? (sessionsQuery.data?.[0]?.id ?? null);

  return (
    <PortalPageShell width="full">
      <PortalPageHero
        title="Mes stagiaires"
        description="Participants CRM de vos sessions. La session présentielle est la source de vérité ; l’e-formation accompagne la révision des modules vus en classe."
        badge="Phase 1b"
      />

      <div className="mt-6">
        <ModuleKpiStatsRow items={instructorStagiairesKpis(rows)} />
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="h-9 w-full sm:w-[280px] text-[13px]">
                <SelectValue placeholder="Filtrer par session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes mes sessions</SelectItem>
                {(sessionsQuery.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.formation.name} — {s.dateDisplayLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative max-w-sm flex-1">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                placeholder="Nom, email, formation…"
                className="h-9 ps-9 text-[13px]"
              />
            </div>
          </div>
          <p className={cn('flex items-center gap-1.5', portalMuted)}>
            <Users className="size-4" />
            {filteredRows.length} stagiaire{filteredRows.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <InstructorCohortActivityChart sessionId={chartSessionId} />
          <InstructorAttendancePanel sessionId={chartSessionId} />
        </div>

        <PortalDataGrid
          table={table}
          recordCount={filteredRows.length}
          isLoading={traineesQuery.isLoading}
        />

        {!traineesQuery.isLoading && filteredRows.length === 0 ? (
          <p className={portalMuted}>
            Aucun stagiaire inscrit sur vos sessions. Les participants sont gérés depuis le CRM
            (inscriptions session).
          </p>
        ) : null}
      </div>

      <InstructorStagiaireDetailSheet
        open={detail != null}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
        sessionId={detail?.sessionId ?? null}
        userId={detail?.userId ?? null}
      />
    </PortalPageShell>
  );
}
