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
import { BookOpen, CalendarDays, GraduationCap, Search, Users } from 'lucide-react';
import { FormationLogoThumb } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/formation-logo-thumb';
import { FORMATION_TRACK_LABELS } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { apiFetch } from '@/lib/api';
import type { InstructorFormationRow } from '@/lib/instructor/instructor-types';
import { INSTRUCTOR_FORMATIONS_API } from '@/lib/instructor/instructor-paths';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { Input } from '@repo/ui/input';
import {
  INSTRUCTOR_DATAGRID_PAGE_SIZE,
  PortalDataGrid,
} from '@/components/instructor/datagrid/portal-data-grid';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { instructorFormationsKpis } from '@/lib/instructor/instructor-kpi-stats';
import { cn } from '@/lib/utils';

export function InstructorFormationsDatagridPage() {
  const searchParams = useSearchParams();
  const slugFilter = searchParams.get('formation')?.trim() ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: INSTRUCTOR_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  useEffect(() => {
    if (slugFilter) setSearchQuery(slugFilter);
  }, [slugFilter]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['instructor-formations'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_FORMATIONS_API);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { items: InstructorFormationRow[] };
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
    if (!q) return rows;
    return rows.filter((row) => {
      const blob = `${row.name} ${row.slug} ${row.tag} ${row.duration} ${FORMATION_TRACK_LABELS[row.track]}`.toLowerCase();
      return blob.includes(q);
    });
  }, [rows, searchQuery]);

  const columns = useMemo<ColumnDef<InstructorFormationRow>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-center gap-3 py-0.5">
            <FormationLogoThumb
              name={row.original.name}
              slug={row.original.slug}
              logoUrl={row.original.logoUrl}
              className="size-9 shrink-0 rounded-lg"
            />
            <div className="min-w-0">
              <p className={cn('truncate font-medium', portalSectionTitle)}>{row.original.name}</p>
              <p className={cn('truncate', portalMuted)}>{row.original.tag}</p>
            </div>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: 'track',
        id: 'track',
        header: ({ column }) => <DataGridColumnHeader title="Filière" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="light" size="sm" className="text-[10px]">
            {FORMATION_TRACK_LABELS[row.original.track]}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: 'duration',
        header: ({ column }) => <DataGridColumnHeader title="Durée" column={column} />,
        cell: ({ row }) => <span className={portalMuted}>{row.original.duration}</span>,
        size: 120,
      },
      {
        accessorKey: 'assignedSessionCount',
        id: 'sessions',
        header: ({ column }) => <DataGridColumnHeader title="Sessions" column={column} />,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-[13px]">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            {row.original.assignedSessionCount}
            {row.original.upcomingSessionCount > 0 ? (
              <span className="text-muted-foreground">
                ({row.original.upcomingSessionCount} actives)
              </span>
            ) : null}
          </span>
        ),
        size: 130,
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
        id: 'nextSession',
        header: ({ column }) => <DataGridColumnHeader title="Prochaine session" column={column} />,
        cell: ({ row }) => (
          <span className={cn('line-clamp-2', portalMuted)}>
            {row.original.nextSessionLabel ?? '—'}
          </span>
        ),
        enableSorting: false,
        size: 180,
      },
      {
        id: 'lms',
        header: ({ column }) => <DataGridColumnHeader title="E-formation" column={column} />,
        cell: ({ row }) =>
          row.original.courseTitle ? (
            <span className="inline-flex items-center gap-1 text-[13px] text-emerald-700 dark:text-emerald-400">
              <BookOpen className="size-3.5 shrink-0" />
              <span className="truncate max-w-[140px]" title={row.original.courseTitle}>
                {row.original.courseTitle}
              </span>
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">—</span>
          ),
        enableSorting: false,
        size: 160,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-8 text-[12px]" asChild>
              <Link href={`/formateur/sessions?formation=${encodeURIComponent(row.original.slug)}`}>
                Sessions
              </Link>
            </Button>
          </div>
        ),
        size: 100,
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
        title="Mes formations"
        description="Formations du catalogue école où vous êtes affecté comme formateur référent (assignation depuis le CRM admin → Sessions)."
        badge="Catalogue assigné"
      />

      <div className="mt-6">
        <ModuleKpiStatsRow items={instructorFormationsKpis(rows)} />
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative max-w-sm flex-1">
                  <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                    placeholder="Rechercher une formation…"
                    className="h-9 ps-9 text-[13px]"
                  />
                </div>
                <p className={cn('flex items-center gap-1.5', portalMuted)}>
                  <GraduationCap className="size-4" />
                  {filteredRows.length} formation{filteredRows.length > 1 ? 's' : ''}
                </p>
              </div>
            }
          />
        </div>
      )}

      {!isLoading && filteredRows.length === 0 && !error ? (
        <p className={cn('mt-4', portalMuted)}>
          Aucune formation assignée. L’administration vous affecte via{' '}
          <strong className="text-foreground">Gestion académique → Sessions</strong> en choisissant un
          formateur référent.
        </p>
      ) : null}
    </PortalPageShell>
  );
}
