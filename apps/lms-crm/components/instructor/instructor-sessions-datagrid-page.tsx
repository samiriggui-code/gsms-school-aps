'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { BookOpen, CalendarDays, MapPin, Search, Users } from 'lucide-react';
import { FormationLogoThumb } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/formation-logo-thumb';
import { apiFetch } from '@/lib/api';
import type { InstructorSessionRow, InstructorSessionStatus } from '@/lib/instructor/instructor-types';
import { INSTRUCTOR_SESSIONS_API } from '@/lib/instructor/instructor-paths';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { Input } from '@repo/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import {
  INSTRUCTOR_DATAGRID_PAGE_SIZE,
  PortalDataGrid,
} from '@/components/instructor/datagrid/portal-data-grid';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { instructorSessionsKpis } from '@/lib/instructor/instructor-kpi-stats';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<InstructorSessionStatus, string> = {
  upcoming: 'À venir',
  ongoing: 'En cours',
  past: 'Terminée',
  unknown: 'Planifiée',
};

const STATUS_VARIANT: Record<
  InstructorSessionStatus,
  'default' | 'success' | 'secondary' | 'warning'
> = {
  upcoming: 'default',
  ongoing: 'success',
  past: 'secondary',
  unknown: 'warning',
};

export function InstructorSessionsDatagridPage() {
  const searchParams = useSearchParams();
  const formationSlug = searchParams.get('formation')?.trim() ?? '';
  const highlightId = searchParams.get('highlight')?.trim() ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InstructorSessionStatus | 'all'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: INSTRUCTOR_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startDate', desc: false }]);

  useEffect(() => {
    if (formationSlug) setSearchQuery(formationSlug);
  }, [formationSlug]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_SESSIONS_API);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { items: InstructorSessionRow[] };
        error?: { message?: string };
      };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Chargement impossible.');
      return json.data?.items ?? [];
    },
    staleTime: 30_000,
  });

  const rows = data ?? [];

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!q) return true;
      const blob =
        `${row.formation.name} ${row.formation.slug} ${row.dateDisplayLabel} ${row.location} ${row.formation.tag}`.toLowerCase();
      return blob.includes(q);
    });
  }, [rows, searchQuery, statusFilter]);

  const columns = useMemo<ColumnDef<InstructorSessionRow>[]>(
    () => [
      {
        id: 'formation',
        accessorFn: (row) => row.formation.name,
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3 py-0.5">
            <FormationLogoThumb
              name={row.original.formation.name}
              slug={row.original.formation.slug}
              logoUrl={row.original.formation.logoUrl}
              className="size-9 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <p className={cn('truncate font-medium', portalSectionTitle)}>
                {row.original.formation.name}
              </p>
              <p className={cn('truncate', portalMuted)}>{row.original.formation.tag}</p>
            </div>
          </div>
        ),
        size: 240,
      },
      {
        accessorKey: 'startDate',
        id: 'startDate',
        header: ({ column }) => <DataGridColumnHeader title="Début" column={column} />,
        cell: ({ row }) => (
          <span className={portalMuted}>
            {row.original.startDate
              ? new Date(row.original.startDate).toLocaleDateString('fr-FR')
              : '—'}
          </span>
        ),
        sortingFn: 'datetime',
        size: 110,
      },
      {
        accessorKey: 'dateDisplayLabel',
        id: 'dateDisplayLabel',
        header: ({ column }) => <DataGridColumnHeader title="Dates" column={column} />,
        cell: ({ row }) => (
          <span className={cn('line-clamp-2', portalMuted)}>{row.original.dateDisplayLabel}</span>
        ),
        size: 180,
      },
      {
        accessorKey: 'location',
        header: ({ column }) => <DataGridColumnHeader title="Lieu" column={column} />,
        cell: ({ row }) => (
          <span className={cn('inline-flex items-center gap-1 line-clamp-2', portalMuted)}>
            <MapPin className="size-3.5 shrink-0" />
            {row.original.location}
          </span>
        ),
        size: 140,
      },
      {
        accessorKey: 'participantCount',
        header: ({ column }) => <DataGridColumnHeader title="Stagiaires" column={column} />,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-[13px]">
            <Users className="size-3.5 text-muted-foreground" />
            {row.original.participantCount}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]} appearance="light" size="sm">
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'lms',
        header: ({ column }) => <DataGridColumnHeader title="E-formation" column={column} />,
        cell: ({ row }) =>
          row.original.formation.courseTitle ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-emerald-700 dark:text-emerald-400">
              <BookOpen className="size-3.5" />
              Oui
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">Non</span>
          ),
        enableSorting: false,
        size: 100,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" className="h-8 text-[12px]" asChild>
            <Link href={`/formateur/stagiaires?session=${row.original.id}`}>Stagiaires</Link>
          </Button>
        ),
        size: 110,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: filteredRows,
    columns,
    pageCount: Math.max(1, Math.ceil(filteredRows.length / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <PortalPageShell>
      <PortalPageHero
        title="Mes sessions"
        description="Sessions catalogue où vous êtes formateur référent — affectation par l’administration CRM."
        badge="Dispatch admin"
      />

      <div className="mt-6">
        <ModuleKpiStatsRow items={instructorSessionsKpis(rows)} />
      </div>

      {error ? (
        <p className="mt-6 text-[13px] text-destructive">{(error as Error).message}</p>
      ) : (
        <div className="mt-6">
          <PortalDataGrid
            table={table}
            recordCount={filteredRows.length}
            isLoading={isLoading}
            toolbar={
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative max-w-sm flex-1">
                    <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPagination((p) => ({ ...p, pageIndex: 0 }));
                      }}
                      placeholder="Formation, dates, lieu…"
                      className="h-9 ps-9 text-[13px]"
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v as InstructorSessionStatus | 'all');
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger className="h-9 w-full sm:w-[160px] text-[13px]">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="upcoming">À venir</SelectItem>
                      <SelectItem value="ongoing">En cours</SelectItem>
                      <SelectItem value="past">Terminées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className={cn('flex items-center gap-1.5', portalMuted)}>
                  <CalendarDays className="size-4" />
                  {filteredRows.length} session{filteredRows.length > 1 ? 's' : ''}
                </p>
              </div>
            }
          />
        </div>
      )}

      {highlightId && !isLoading ? (
        <p className={cn('mt-3', portalMuted)}>
          Session sélectionnée depuis le tableau de bord.
        </p>
      ) : null}

      {!isLoading && filteredRows.length === 0 && !error ? (
        <p className={cn('mt-4', portalMuted)}>
          Aucune session assignée. Contactez le secrétariat pédagogique ou vérifiez votre affectation
          dans le CRM.
        </p>
      ) : null}
    </PortalPageShell>
  );
}
