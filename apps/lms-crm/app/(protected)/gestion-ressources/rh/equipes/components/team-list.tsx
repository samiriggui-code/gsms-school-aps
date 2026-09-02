'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { 
  Search, 
  Eye, 
  SquarePen, 
  Trash, 
  LayoutGrid,
  List,
  Users,
  RefreshCw,
  Info,
  ChevronDown,
  Clock,
  ShieldCheck,
  UserPlus,
  MapPin,
} from 'lucide-react';

import { RiCheckboxCircleFill } from '@remixicon/react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { formatDateTime, getAvatarUrl, getInitials } from '@/lib/helpers';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@repo/ui/data-grid-table';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { Tabs, TabsContent } from '@repo/ui/tabs';
import { Team } from '@/app/models/team';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { cn } from '@/lib/utils';
import TeamDetailsSheet from './team-details-sheet';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar';
import { Badge } from '@repo/ui/badge';
import {
  resolveTeamLeader,
  resolveTeamSectorMeta,
  resolveTeamTypeMeta,
  resolveTeamSiteLabel,
  teamLeaderLabel,
  isSessionPedagogicalTeam,
  sessionTeamSubtitle,
  resolveTeamLifecycleMeta,
  countSessionTeamMembersByRole,
  permanentTeamKindLabel,
} from '../lib/team-display';
import type { RhSessionTeamPhase, RhTeamListScope } from '@/lib/rh-team-list-scope';
import { RH_TEAM_LIST_SCOPE_HINTS } from '@/lib/rh-team-list-scope';
import { TeamPhoto } from './team-photo';

interface TeamListProps {
  teamScope: RhTeamListScope;
  sessionPhase?: RhSessionTeamPhase;
  /** @deprecated CTA création — utiliser la toolbar page. */
  onAddClick?: () => void;
}

function normalizeTeamsResponse(payload: unknown, pageSize: number, pageIndex: number): DataGridApiResponse<Team> {
  const fallback: DataGridApiResponse<Team> = {
    data: [],
    empty: true,
    pagination: {
      total: 0,
      page: pageIndex + 1,
    },
  };

  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, any>;
  const rootData = record.data;

  const dataArray = Array.isArray(rootData)
    ? rootData
    : (rootData && typeof rootData === 'object' && Array.isArray(rootData.items))
      ? rootData.items
      : Array.isArray(record.items)
        ? record.items
        : [];

  const total =
    Number(record.total) ||
    Number(rootData?.pagination?.total) ||
    Number(record.pagination?.total) ||
    dataArray.length;

  const page =
    Number(record.page) ||
    Number(rootData?.pagination?.page) ||
    Number(record.pagination?.page) ||
    (pageIndex + 1);

  return {
    data: dataArray as Team[],
    empty: dataArray.length === 0,
    pagination: { total, page },
  };
}

const TeamList = ({ teamScope, sessionPhase = 'running', onAddClick }: TeamListProps) => {
  const isSessionScope = teamScope === 'session';
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'rhTeams',
    queryKeys: [['rh-teams', teamScope, sessionPhase]],
  });

  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${teamId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec de la suppression de l\'équipe');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rh-teams'] });
    },
  });

  const fetchTeams = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<Team>> => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      teamScope,
      ...(teamScope === 'session' ? { sessionPhase } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/rh/equipes?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des équipes');
    const result = await response.json();
    return normalizeTeamsResponse(result, pageSize, pageIndex);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['rh-teams', teamScope, sessionPhase, pagination, sorting, searchQuery],
    queryFn: () =>
      fetchTeams({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenDetails = (id: string) => {
    setSelectedTeamId(id);
    setIsDetailsSheetOpen(true);
  };

  const handleDeleteTeam = (team: Team) => {
    if (isSessionPedagogicalTeam(team)) {
      toast.error('Les équipes session sont gérées automatiquement et ne peuvent pas être supprimées ici.');
      return;
    }
    if (confirm(t('crud.deleteTeamConfirm', { name: team.name ?? '' }))) {
      toast.promise(deleteMutation.mutateAsync(team.id), {
        loading: t('crud.loading'),
        success: t('crud.teamDeleted'),
        error: (err) => err.message,
      });
    }
  };

  const columns = useMemo<ColumnDef<Team>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Équipe" column={column} />,
        cell: ({ row }) => {
          const typeMeta = resolveTeamTypeMeta(row.original.type);
          const TypeIcon = typeMeta.icon;
          const leader = resolveTeamLeader(row.original);
          const sessionTeam = isSessionPedagogicalTeam(row.original);
          const subtitle = sessionTeamSubtitle(row.original);
          const lifecycle = resolveTeamLifecycleMeta(row.original.lifecycleStatus);

          return (
            <div className="flex items-center gap-3">
              <TeamPhoto
                team={{ image: row.original.image, leader, type: row.original.type }}
                className={cn('size-10 rounded-xl border shrink-0', typeMeta.bg, 'border-current/10')}
                imgClassName="object-cover"
                fallback={
                  <div
                    className={cn(
                      'size-10 rounded-xl flex items-center justify-center border shrink-0',
                      typeMeta.bg,
                      'border-current/10',
                    )}
                  >
                    <TypeIcon className={cn('size-5', typeMeta.color)} />
                  </div>
                }
              />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                    onClick={() => handleOpenDetails(row.original.id)}
                  >
                    {row.original.name}
                  </span>
                  {isSessionScope || sessionTeam ? (
                    <Badge
                      variant="outline"
                      appearance="light"
                      size="sm"
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider h-4 bg-transparent',
                        lifecycle.className,
                      )}
                    >
                      {lifecycle.shortLabel}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      appearance="light"
                      size="sm"
                      className="text-[9px] font-bold uppercase tracking-wider h-4 bg-indigo-500/10 text-indigo-700 border-indigo-500/20"
                    >
                      Équipe permanente
                    </Badge>
                  )}
                  {!isSessionScope && !sessionTeam ? (
                    <Badge
                      variant="outline"
                      appearance="light"
                      size="sm"
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider h-4 bg-transparent',
                        typeMeta.color,
                        'border-current/20',
                      )}
                    >
                      {permanentTeamKindLabel(row.original.type)}
                    </Badge>
                  ) : null}
                </div>
                <span className="text-muted-foreground text-xs line-clamp-1">{subtitle}</span>
              </div>
            </div>
          );
        },
        size: 300,
      },
      {
        id: 'sector',
        header: ({ column }) => (
          <DataGridColumnHeader
            title={isSessionScope ? 'Formation / cycle' : 'Structure / pôle'}
            column={column}
          />
        ),
        cell: ({ row }) => {
          if (isSessionScope || isSessionPedagogicalTeam(row.original)) {
            const lifecycle = resolveTeamLifecycleMeta(row.original.lifecycleStatus);
            return (
              <div className="flex flex-col gap-0.5">
                <span className="text-2sm font-bold text-foreground line-clamp-1">
                  {row.original.formationSession?.formation?.name ?? 'Formation catalogue'}
                </span>
                <span className={cn('text-xs font-medium', lifecycle.className.split(' ')[0])}>
                  {lifecycle.label}
                </span>
              </div>
            );
          }

          const sectorMeta = resolveTeamSectorMeta(row.original.sector);
          const SectorIcon = sectorMeta.icon;
          const orgUnitName =
            row.original.orgUnit?.name ||
            (row.original as { OrgUnit?: { name?: string } }).OrgUnit?.name;

          return (
            <div className="flex flex-col gap-0.5">
              {orgUnitName ? (
                <span className="text-2sm font-bold text-foreground">{orgUnitName}</span>
              ) : null}
              <div className="flex items-center gap-2">
                <SectorIcon className="size-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  {permanentTeamKindLabel(row.original.type)} · {sectorMeta.label}
                </span>
              </div>
            </div>
          );
        },
        size: 200,
      },
      {
        id: 'membersCount',
        header: ({ column }) => <DataGridColumnHeader title="Membres" column={column} />,
        cell: ({ row }) => {
          const counts = countSessionTeamMembersByRole(row.original);
          const total = row.original._count?.members || 0;
          return (
            <div className="flex flex-col gap-1">
              <Badge variant="default" appearance="light" className="font-bold text-[11px] px-2.5 w-fit">
                {total} {isSessionScope ? 'participant(s)' : 'collaborateur(s)'}
              </Badge>
              {isSessionScope && total > 0 ? (
                <span className="text-[10px] text-muted-foreground">
                  {counts.learners} apprenant(s) · {counts.trainers + counts.moderators} encadrement
                </span>
              ) : null}
            </div>
          );
        },
        size: 150,
      },
      {
        id: 'leader',
        header: ({ column }) => <DataGridColumnHeader title="Chef d'Équipe" column={column} />,
        cell: ({ row }) => {
          const leader = resolveTeamLeader(row.original);
          const sessionTeam = isSessionPedagogicalTeam(row.original);
          if (!leader) {
            return (
              <span className="text-xs text-muted-foreground italic">
                {sessionTeam ? 'Formateur non assigné' : 'Non assigné'}
              </span>
            );
          }

          const leaderLabel = teamLeaderLabel(leader);
          const avatarSrc = leader?.avatar ? getAvatarUrl(leader.avatar) : undefined;

          return (
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                {avatarSrc ? <AvatarImage src={avatarSrc} alt="" /> : null}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(leaderLabel)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-2sm font-bold text-foreground leading-none">
                  {leaderLabel}
                </span>
                <span className="text-[9px] text-primary uppercase font-bold tracking-tighter">
                  {sessionTeam ? 'Formateur' : "Chef d'équipe"}
                </span>
              </div>
            </div>
          );
        },
        size: 180,
      },
      {
        id: 'site',
        header: ({ column }) => <DataGridColumnHeader title="Site Affecté" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-secondary flex items-center justify-center">
              <MapPin className="size-3.5 text-muted-foreground" />
            </div>
            <span className="text-2sm font-semibold text-foreground truncate max-w-[150px]">
              {resolveTeamSiteLabel(row.original)}
            </span>
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Date de création" column={column} />,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-2sm text-foreground font-semibold">
              {formatDateTime(new Date(info.getValue() as string))}
            </span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Géré par RH</span>
          </div>
        ),
        size: 200,
      },
      {
        id: 'actions',
        header: '',
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center justify-end pr-2">
             <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                <DropdownMenuItem onClick={() => handleOpenDetails(row.original.id)}>
                  <Eye className="size-4 mr-2" /> Voir détails
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenDetails(row.original.id)}
                  disabled={isSessionScope || isSessionPedagogicalTeam(row.original)}
                >
                  <SquarePen className="size-4 mr-2" /> Modifier
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive" 
                  onClick={() => handleDeleteTeam(row.original)}
                  disabled={isSessionScope || isSessionPedagogicalTeam(row.original)}
                >
                  <Trash className="size-4 mr-2" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [isSessionScope, t],
  );

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: data?.pagination ? Math.ceil(data.pagination.total / pagination.pageSize) : 1,
    getRowId: (row: Team) => row.id,
    state: { pagination, sorting, rowSelection },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <>
      <Card className="mb-5">
        <CardHeader className="py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            <div>
              <h3 className="text-base font-semibold text-foreground">
                {isSessionScope ? 'Équipes session (formations)' : 'Équipes permanentes de l’école'}
              </h3>
              <p className="text-xs text-muted-foreground">{RH_TEAM_LIST_SCOPE_HINTS[teamScope]}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t('datagrid.search.team')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-10"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={isSyncing}
                className="h-10 gap-2 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all duration-300 shadow-sm"
              >
                <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
                <span className="font-bold uppercase tracking-wider text-[11px]">{t('datagrid.sync')}</span>
              </Button>
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border h-10 shadow-sm">
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setView('table')}
                >
                  <List className="size-4" />
                  {t('datagrid.listView')}
                </Button>
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid className="size-4" />
                  {t('datagrid.gridView')}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <AnimatePresence mode="wait">
        <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'grid')} className="w-full">
          <TabsContent value="table" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DataGrid
                table={table}
                recordCount={data?.pagination?.total || 0}
                isLoading={isLoading}
              >
                <Card className="border-border shadow-sm overflow-hidden">
                  <CardTable>
                    <ScrollArea>
                      <DataGridTable />
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </CardTable>
                  <DataGridPagination />
                </Card>
              </DataGrid>
            </motion.div>
          </TabsContent>

          <TabsContent value="grid" className="mt-0">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse h-52 bg-muted/20 border-border" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data?.data.map((team: Team, index: number) => {
                    const sessionTeam = isSessionPedagogicalTeam(team);
                    const typeMeta = resolveTeamTypeMeta(team.type);
                    const TypeIcon = typeMeta.icon;
                    const sectorMeta = resolveTeamSectorMeta(team.sector);
                    const SectorIcon = sectorMeta.icon;
                    const leader = resolveTeamLeader(team);
                    const lifecycle = resolveTeamLifecycleMeta(team.lifecycleStatus);
                    const roleCounts = countSessionTeamMembersByRole(team);

                    return (
                      <motion.div
                        key={team.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md h-full flex flex-col relative overflow-hidden">
                          <div className={cn("absolute top-0 right-0 p-2 opacity-[0.03] transition-transform duration-700 group-hover:scale-125 group-hover:rotate-6", typeMeta.color)}>
                             <TeamPhoto
                               team={team}
                               className="size-24"
                               imgClassName="object-cover grayscale"
                               fallback={<TypeIcon className="size-16" />}
                             />
                          </div>

                          <CardContent className="p-6 grow relative">
                            <div className="flex justify-between items-start mb-5">
                              <TeamPhoto
                                team={team}
                                className="size-12 rounded-2xl border border-border bg-background overflow-hidden transition-all duration-500 group-hover:scale-110 shadow-sm"
                                imgClassName="object-cover"
                                fallback={
                                  <div className={cn("size-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 shadow-sm", typeMeta.bg, "border-current/10")}>
                                    <TypeIcon className={cn("size-6", typeMeta.color)} />
                                  </div>
                                }
                              />
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="size-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/5" 
                                  onClick={() => handleOpenDetails(team.id)}
                                >
                                  <SquarePen className="size-4" />
                                </Button>
                                {!sessionTeam && !isSessionScope ? (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5" 
                                    onClick={() => handleDeleteTeam(team)}
                                  >
                                    <Trash className="size-4" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                            
                            <div className="space-y-1 mb-4">
                              <div className="flex items-center gap-2">
                                <h4 
                                  className="font-bold text-lg group-hover:text-primary transition-colors cursor-pointer truncate" 
                                  onClick={() => handleOpenDetails(team.id)}
                                >
                                  {team.name}
                                </h4>
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {sessionTeam || isSessionScope ? (
                                  <>
                                    <Badge
                                      variant="outline"
                                      className={cn('text-[9px] font-bold uppercase tracking-wider py-0 px-2 h-5', lifecycle.className)}
                                    >
                                      {lifecycle.shortLabel}
                                    </Badge>
                                    <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 h-5 border-none">
                                      Équipe session
                                    </Badge>
                                  </>
                                ) : (
                                  <>
                                    <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider py-0 px-2 h-5 border-none bg-indigo-500/10 text-indigo-700">
                                      Équipe permanente
                                    </Badge>
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50">
                                      <SectorIcon className="size-2.5 text-muted-foreground" />
                                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                                        {permanentTeamKindLabel(team.type)}
                                      </span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10 italic">
                              {sessionTeam
                                ? sessionTeamSubtitle(team)
                                : team.description || 'Équipe permanente de l’établissement.'}
                            </p>
                            
                            <div className="flex items-center justify-between pt-5 border-t border-dashed border-border/60">
                              <div className="flex flex-col gap-2">
                                 <div className="flex items-center gap-1.5">
                                   <MapPin className="size-3 text-primary/60" />
                                   <span className="text-[11px] font-bold text-foreground/80 truncate max-w-[120px]">
                                     {resolveTeamSiteLabel(team)}
                                   </span>
                                 </div>
                               <div className="flex items-center gap-2">
                                  <div className="flex -space-x-2 overflow-hidden">
                                     {team.members?.slice(0, 3).map((m: any) => {
                                       const memberLabel =
                                         [m.TenantUser?.firstName, m.TenantUser?.lastName]
                                           .filter(Boolean)
                                           .join(' ')
                                           .trim() ||
                                         m.TenantUser?.email ||
                                         '—';
                                       const memberAvatar = m.TenantUser?.avatar
                                         ? getAvatarUrl(m.TenantUser.avatar)
                                         : undefined;
                                       return (
                                       <Avatar key={m.id} className="size-7 border-2 border-background">
                                         {memberAvatar ? (
                                           <AvatarImage src={memberAvatar} alt="" />
                                         ) : null}
                                         <AvatarFallback className="bg-primary/5 text-primary text-[10px] font-bold">
                                           {getInitials(memberLabel)}
                                         </AvatarFallback>
                                       </Avatar>
                                       );
                                     })}
                                     {(team.members?.length || 0) > 3 && (
                                       <div className="size-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                         +{(team.members?.length || 0) - 3}
                                       </div>
                                     )}
                                  </div>
                                  <span className="text-xs font-bold text-foreground/70">
                                    {team._count?.members || 0}{' '}
                                    {sessionTeam ? 'participant(s)' : 'membres'}
                                  </span>
                                  {sessionTeam && (team._count?.members || 0) > 0 ? (
                                    <span className="text-[10px] text-muted-foreground">
                                      · {roleCounts.learners} apprenant(s)
                                    </span>
                                  ) : null}
                               </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                Créé le
                              </span>
                              <span className="text-[10px] text-foreground font-bold">
                                {new Date(team.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </AnimatePresence>

      <TeamDetailsSheet 
        teamId={selectedTeamId}
        open={isDetailsSheetOpen}
        onOpenChange={setIsDetailsSheetOpen}
      />
    </>
  );
};

export default TeamList;
