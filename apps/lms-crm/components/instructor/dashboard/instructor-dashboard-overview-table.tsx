'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, Megaphone, Users } from 'lucide-react';
import { FormationLogoThumb } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/formation-logo-thumb';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { Progress } from '@repo/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs';
import type {
  InstructorAnnouncementRow,
  InstructorDashboardPayload,
  InstructorSessionRow,
  InstructorSessionStatus,
  InstructorTraineeRow,
} from '@/lib/instructor/instructor-types';
import { formatPortalDate } from '@/lib/portal/format-portal-date';

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

const ANNOUNCEMENT_STATE_LABEL: Record<InstructorAnnouncementRow['state'], string> = {
  live: 'Publiée',
  draft: 'Brouillon',
  scheduled: 'Planifiée',
};

type OverviewTab = 'sessions' | 'trainees' | 'announcements';

type InstructorDashboardOverviewTableProps = {
  overview: InstructorDashboardPayload['overview'];
};

export function InstructorDashboardOverviewTable({
  overview,
}: InstructorDashboardOverviewTableProps) {
  const [tab, setTab] = useState<OverviewTab>('sessions');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  useEffect(() => {
    setPagination(createModuleLandingPagination());
  }, [tab]);

  const sessionColumns = useMemo<ColumnDef<InstructorSessionRow>[]>(
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
              <p className="truncate text-sm font-bold text-foreground">{row.original.formation.name}</p>
              <p className="text-2xs text-muted-foreground">{row.original.dateDisplayLabel}</p>
            </div>
          </div>
        ),
        size: 240,
      },
      {
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.status]} appearance="light" size="sm">
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'participants',
        header: ({ column }) => <DataGridColumnHeader title="Stagiaires" column={column} />,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm font-medium">
            <Users className="size-3.5 text-muted-foreground" />
            {row.original.participantCount}
          </span>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" asChild>
              <Link href={`/formateur/sessions?highlight=${row.original.id}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
          </div>
        ),
        size: 70,
        enableSorting: false,
      },
    ],
    [],
  );

  const traineeColumns = useMemo<ColumnDef<InstructorTraineeRow>[]>(
    () => [
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
              <p className="truncate text-sm font-bold">{row.original.name ?? row.original.email}</p>
              <p className="truncate text-2xs text-muted-foreground">{row.original.formationName}</p>
            </div>
          </div>
        ),
        size: 220,
      },
      {
        id: 'session',
        header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">{row.original.sessionLabel}</span>
        ),
        size: 160,
      },
      {
        id: 'progress',
        header: ({ column }) => <DataGridColumnHeader title="Progression LMS" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-[120px] space-y-1">
            <div className="flex items-center justify-between text-2xs font-bold">
              <span>{row.original.progressPercent} %</span>
              <span className="text-muted-foreground">
                {row.original.completedChapters}/{row.original.totalChapters} UV
              </span>
            </div>
            <Progress value={row.original.progressPercent} className="h-1.5" />
          </div>
        ),
        size: 160,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" asChild>
              <Link href={`/formateur/stagiaires?session=${row.original.sessionId}`}>
                <Eye className="size-4" />
              </Link>
            </Button>
          </div>
        ),
        size: 70,
        enableSorting: false,
      },
    ],
    [],
  );

  const announcementColumns = useMemo<ColumnDef<InstructorAnnouncementRow>[]>(
    () => [
      {
        id: 'title',
        accessorKey: 'title',
        header: ({ column }) => <DataGridColumnHeader title="Annonce" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0 py-0.5">
            <p className="truncate text-sm font-bold">{row.original.title}</p>
            <p className="truncate text-2xs text-muted-foreground">{row.original.formationName}</p>
          </div>
        ),
        size: 220,
      },
      {
        id: 'scope',
        header: ({ column }) => <DataGridColumnHeader title="Portée" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="light" size="sm">
            {row.original.scope === 'session' ? 'Session' : 'Formation'}
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'state',
        header: ({ column }) => <DataGridColumnHeader title="État" column={column} />,
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.state === 'live'
                ? 'success'
                : row.original.state === 'scheduled'
                  ? 'default'
                  : 'warning'
            }
            appearance="light"
            size="sm"
          >
            {ANNOUNCEMENT_STATE_LABEL[row.original.state]}
          </Badge>
        ),
        size: 110,
      },
      {
        id: 'publishedAt',
        header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatPortalDate(row.original.publishedAt)}
          </span>
        ),
        size: 120,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: () => (
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/10 hover:text-primary" asChild>
              <Link href="/formateur/annonces">
                <Megaphone className="size-4" />
              </Link>
            </Button>
          </div>
        ),
        size: 70,
        enableSorting: false,
      },
    ],
    [],
  );

  const activeData =
    tab === 'sessions'
      ? overview.sessions
      : tab === 'trainees'
        ? overview.trainees
        : overview.announcements;

  const activeColumns =
    tab === 'sessions'
      ? sessionColumns
      : tab === 'trainees'
        ? traineeColumns
        : announcementColumns;

  const table = useReactTable({
    data: activeData as InstructorSessionRow[] & InstructorTraineeRow[] & InstructorAnnouncementRow[],
    columns: activeColumns as ColumnDef<(typeof activeData)[number]>[],
    pageCount: Math.max(1, Math.ceil(activeData.length / pagination.pageSize)),
    getRowId: (row) => ('participantId' in row ? row.participantId : row.id),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const viewAllHref =
    tab === 'sessions'
      ? '/formateur/sessions'
      : tab === 'trainees'
        ? '/formateur/stagiaires'
        : '/formateur/annonces';

  return (
    <ModuleLandingDataGridShell
      title="Vue consolidée de l'espace formateur"
      viewAllHref={viewAllHref}
      table={table}
      recordCount={activeData.length}
      headerExtra={
        <Tabs value={tab} onValueChange={(v) => setTab(v as OverviewTab)}>
          <TabsList variant="line" size="sm">
            <TabsTrigger value="sessions">Sessions ({overview.sessions.length})</TabsTrigger>
            <TabsTrigger value="trainees">Stagiaires ({overview.trainees.length})</TabsTrigger>
            <TabsTrigger value="announcements">
              Annonces ({overview.announcements.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      }
    />
  );
}
