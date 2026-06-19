'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LayoutGrid, Plus, FolderTree, ChevronRight, ChevronDown, MoreVertical, 
  Edit2, Trash2, Building2, List, PlusSquare, MinusSquare, Users, MapPin, 
  Shield, Info, Users2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrgUnitAddSheet } from './org-unit-add-sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvatarUrl, getInitials } from '@/lib/helpers';
import { orgUnitVisualSrc, resolveTeamTypeMeta } from '../lib/team-display';
import { TeamPhoto } from './team-photo';

interface OrgUnit {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  Parent?: { name: string } | null;
  Memberships?: any[];
  Teams?: any[];
  _count: {
    Children: number;
    Teams: number;
  };
}

interface OrgUnitWithChildren extends OrgUnit {
  children: OrgUnitWithChildren[];
}

export function OrgUnitManager() {
  const queryClient = useQueryClient();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [view, setView] = useState<'tree' | 'list' | 'grid'>('tree');

  const { data: orgUnitsData, isLoading } = useQuery({
    queryKey: ['org-units-hierarchy'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/org-units');
      if (!response.ok) throw new Error('Failed to fetch org units');
      const json = await response.json();
      return unwrapSectionApiData<OrgUnit[]>(json) ?? [];
    },
  });

  const orgUnits: OrgUnit[] = Array.isArray(orgUnitsData) ? orgUnitsData : [];

  useEffect(() => {
    if (!orgUnits.length) return;
    setExpandedIds((prev) => {
      if (prev.size > 0) return prev;
      const toExpand = orgUnits
        .filter(
          (unit) =>
            !unit.parentId ||
            (unit._count?.Children ?? 0) > 0 ||
            (unit._count?.Teams ?? 0) > 0,
        )
        .map((unit) => unit.id);
      return new Set(toExpand);
    });
  }, [orgUnits]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/org-units/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete org unit');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-units-hierarchy'] });
    },
  });

  const buildTree = (parentId: string | null = null): OrgUnitWithChildren[] => {
    return orgUnits
      .filter((unit: OrgUnit) => unit.parentId === parentId)
      .map((unit: OrgUnit) => ({
        ...unit,
        children: buildTree(unit.id),
      }));
  };

  const treeData = buildTree(null);

  const UnitVisual = ({
    unit,
    className,
    imgClassName,
  }: {
    unit: OrgUnit;
    className?: string;
    imgClassName?: string;
  }) => {
    const linkedTeam = unit.Teams?.[0];
    const visualSrc = orgUnitVisualSrc(unit, orgUnits);

    if (linkedTeam) {
      return (
        <TeamPhoto
          team={linkedTeam}
          alt={unit.name}
          className={cn('rounded-xl border border-border/60 bg-muted/20', className)}
          imgClassName={cn('object-cover', imgClassName)}
          fallback={
            <div className={cn('flex items-center justify-center bg-primary/5', className)}>
              <Building2 className="size-5 text-primary/60" />
            </div>
          }
        />
      );
    }

    if (visualSrc) {
      return (
        <div className={cn('rounded-xl border border-border/60 overflow-hidden bg-muted/20', className)}>
          <img src={visualSrc} alt={unit.name} className={cn('size-full object-cover', imgClassName)} />
        </div>
      );
    }

    return (
      <div className={cn('flex items-center justify-center rounded-xl bg-primary/5 border border-border/60', className)}>
        <Building2 className="size-5 text-primary/60" />
      </div>
    );
  };

  const ActionMenu = ({ unit }: { unit: OrgUnit }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreVertical className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem 
          className="gap-2"
          onClick={() => {
            setSelectedParentId(unit.id);
            setIsAddSheetOpen(true);
          }}
        >
          <Plus className="size-3.5" /> Ajouter sous-unité
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Edit2 className="size-3.5" /> Modifier
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="gap-2 text-destructive focus:text-destructive"
          onClick={() => {
            if (confirm('Êtes-vous sûr de vouloir supprimer cette unité ?')) {
              toast.promise(deleteMutation.mutateAsync(unit.id), {
                loading: 'Suppression de l\'unité...',
                success: 'Unité supprimée avec succès',
                error: (err) => err.message,
              });
            }
          }}
        >
          <Trash2 className="size-3.5" /> Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderUnit = (unit: OrgUnitWithChildren, depth = 0) => {
    const isExpanded = expandedIds.has(unit.id);
    const hasChildren = unit.children.length > 0;
    const teamCount = unit._count?.Teams ?? unit.Teams?.length ?? 0;
    const hasTeams = teamCount > 0;
    const canExpand = hasChildren || hasTeams;
    const manager = unit.Memberships?.[0]?.TenantUser;
    const managerLabel = manager
      ? [manager.firstName, manager.lastName].filter(Boolean).join(' ').trim()
      : '';

    return (
      <div key={unit.id} className="flex flex-col">
        {/* Ligne principale (Unité) */}
        <div 
          className={cn(
            "flex items-center justify-between p-3 border-b border-border/40 hover:bg-muted/30 transition-colors group",
            depth > 0 && "ms-6 border-s-2 border-primary/10",
            isExpanded && "bg-primary/[0.02]"
          )}
        >
          <div className="flex items-center gap-3">
            <button 
              onClick={() => canExpand && toggleExpand(unit.id)}
              className={cn(
                "size-6 flex items-center justify-center rounded transition-all",
                !canExpand ? "opacity-20 cursor-default" : "hover:bg-primary/10 text-primary"
              )}
            >
              {canExpand && (
                isExpanded ? 
                  <MinusSquare className="size-4" /> : 
                  <PlusSquare className="size-4" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <UnitVisual unit={unit} className="size-9 shrink-0" />
              <span className="text-sm font-bold text-foreground/90">{unit.name}</span>
              <Badge variant="outline" size="sm" className="uppercase text-[9px] font-black opacity-60 tracking-tighter h-4 px-1">
                {unit.type}
              </Badge>
              {manager && (
                <div className="flex items-center gap-1.5 ml-2 border-l border-border pl-2">
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tight opacity-50">Responsable:</span>
                  <Avatar className="size-5">
                    {manager.avatar ? (
                      <AvatarImage src={getAvatarUrl(manager.avatar)} alt="" />
                    ) : null}
                    <AvatarFallback className="text-[8px]">
                      {getInitials(managerLabel || manager.email || '?')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] font-semibold text-foreground/70">
                    {managerLabel || manager.email}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-primary/70 uppercase leading-none">{unit._count.Teams}</span>
                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Équipes</span>
              </div>
              <div className="flex flex-col items-end border-l pl-3">
                <span className="text-[10px] font-black text-muted-foreground uppercase leading-none">{unit._count.Children}</span>
                <span className="text-[8px] text-muted-foreground uppercase font-bold tracking-tighter">Sous-unités</span>
              </div>
            </div>
            <ActionMenu unit={unit} />
          </div>
        </div>

        {/* Zone d'expansion (Détails) */}
        {isExpanded && (
          <div className={cn(
            "flex flex-col bg-muted/5 pb-2",
            depth > 0 && "ms-6 border-s-2 border-primary/10"
          )}>
            
            {/* 1. Affichage des Équipes Rattachées (Style Sub-table Metronic) */}
            {hasTeams && (
              <div className="mx-6 mt-2 mb-4 overflow-hidden rounded-lg border border-border/50 bg-background/50 dark:bg-muted/10 shadow-sm">
                <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users2 className="size-3.5 text-primary/70" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Équipes rattachées</span>
                  </div>
                  <Badge className="text-[9px] font-black h-4 bg-primary/10 text-primary border-none">
                    {teamCount} équipe{teamCount > 1 ? 's' : ''}
                  </Badge>
                </div>
                <Table>
                  <TableHeader className="bg-muted/10">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-8 text-[9px] font-black uppercase tracking-tighter">Équipe</TableHead>
                      <TableHead className="h-8 text-[9px] font-black uppercase tracking-tighter text-center">Type</TableHead>
                      <TableHead className="h-8 text-[9px] font-black uppercase tracking-tighter">Site Affecté</TableHead>
                      <TableHead className="h-8 text-[9px] font-black uppercase tracking-tighter text-right">Membres</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unit.Teams?.map((team: any) => {
                      const typeMeta = resolveTeamTypeMeta(team.type);
                      return (
                      <TableRow key={team.id} className="hover:bg-primary/[0.01] border-border/30">
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            <TeamPhoto
                              team={team}
                              alt={team.name}
                              className="size-7 rounded-lg shrink-0"
                              imgClassName="object-cover"
                              fallback={
                                <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <Users2 className="size-3.5 text-primary/70" />
                                </div>
                              }
                            />
                            <span className="text-[11px] font-bold">{team.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-center">
                          <Badge variant="outline" className="text-[8px] font-bold uppercase h-4 px-1">
                            {typeMeta.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 text-[11px] text-muted-foreground font-medium">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3 opacity-40" />
                            {team.Site?.name || 'Non affecté'}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] font-black text-primary">{team._count.members}</span>
                            <Users className="size-3 text-muted-foreground/50" />
                          </div>
                        </TableCell>
                      </TableRow>
                    );})}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 2. Affichage récursif des sous-unités */}
            {hasChildren && (
              <div className="flex flex-col">
                {unit.children.map((child: OrgUnitWithChildren) => renderUnit(child, depth + 1))}
              </div>
            )}

            {!hasChildren && !hasTeams && (
              <div className="px-10 py-4 italic text-muted-foreground text-[10px] flex items-center gap-2">
                <Info className="size-3 opacity-50" />
                Aucune équipe ou sous-unité rattachée
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => (
    <div className="p-0">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider">Nom</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider">Type</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider">Parent</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider">Responsable</TableHead>
            <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider text-center">Équipes</TableHead>
            <TableHead className="h-10 w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgUnits.map((unit) => (
            <TableRow key={unit.id} className="hover:bg-muted/20">
              <TableCell className="py-3">
                <div className="flex items-center gap-3">
                  <UnitVisual unit={unit} className="size-9 shrink-0" />
                  <span className="font-medium text-sm">{unit.name}</span>
                </div>
              </TableCell>
              <TableCell className="py-3">
                <Badge variant="outline" className="uppercase text-[9px] font-semibold">
                  {unit.type}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-xs text-muted-foreground">
                {unit.Parent?.name || <span className="italic opacity-50">-</span>}
              </TableCell>
              <TableCell className="py-3">
                {unit.Memberships?.[0] ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium">
                      {unit.Memberships[0].TenantUser.firstName} {unit.Memberships[0].TenantUser.lastName}
                    </span>
                    <Badge variant="outline" size="sm" className="text-[8px] bg-primary/5 text-primary h-3.5 px-1 py-0">
                      {unit.Memberships[0].Position?.name || 'Manager'}
                    </Badge>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic">Non assigné</span>
                )}
              </TableCell>
              <TableCell className="py-3 text-center">
                <Badge variant="secondary" className="text-[10px] font-bold px-2">
                  {unit._count.Teams}
                </Badge>
              </TableCell>
              <TableCell className="py-3 text-right">
                <ActionMenu unit={unit} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5 bg-muted/5">
      {orgUnits.map((unit) => (
        <Card key={unit.id} className="border border-border/50 hover:border-primary/30 transition-all shadow-sm hover:shadow-md bg-card group">
          <CardContent className="p-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <UnitVisual unit={unit} className="size-12 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-foreground leading-tight">{unit.name}</h4>
                  <Badge variant="outline" size="sm" className="uppercase text-[8px] font-bold h-4 tracking-tighter mt-0.5">
                    {unit.type}
                  </Badge>
                </div>
              </div>
              <ActionMenu unit={unit} />
            </div>
            
            <div className="space-y-2.5 pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Parent</span>
                <span className="text-[11px] font-medium">{unit.Parent?.name || <span className="italic opacity-50">-</span>}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Responsable</span>
                <span className="text-[11px] font-medium">
                  {unit.Memberships?.[0] ? (
                    `${unit.Memberships[0].TenantUser.firstName} ${unit.Memberships[0].TenantUser.lastName}`
                  ) : (
                    <span className="italic opacity-50">Non assigné</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Unités enfants</span>
                <Badge variant="outline" className="h-4 text-[9px] font-bold bg-muted/50">{unit._count.Children}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-tight">Équipes terrain</span>
                <Badge variant="secondary" className="h-4 text-[9px] font-black">{unit._count.Teams}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <Card className="border-border shadow-none overflow-hidden">
      <CardHeader className="border-b bg-muted/20 px-5 py-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Organigramme & RH</CardTitle>
          <p className="text-[11px] text-muted-foreground font-normal">Hiérarchie des agences, départements et services RH</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 bg-muted/50 border p-1 rounded-lg">
            <Button
              variant={view === 'tree' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2 text-[10px] font-bold uppercase", view === 'tree' && "bg-background shadow-sm")}
              onClick={() => setView('tree')}
            >
              <FolderTree className="h-3.5 w-3.5 mr-1.5" />
              Arbre
            </Button>
            <Button
              variant={view === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2 text-[10px] font-bold uppercase", view === 'list' && "bg-background shadow-sm")}
              onClick={() => setView('list')}
            >
              <List className="h-3.5 w-3.5 mr-1.5" />
              Liste
            </Button>
            <Button
              variant={view === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className={cn("h-7 px-2 text-[10px] font-bold uppercase", view === 'grid' && "bg-background shadow-sm")}
              onClick={() => setView('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
              Cartes
            </Button>
          </div>
          
          <Button 
            size="sm" 
            className="gap-2 h-8 font-bold text-[11px] uppercase"
            onClick={() => {
              setSelectedParentId(null);
              setIsAddSheetOpen(true);
            }}
          >
            <Plus className="size-3.5" /> Nouvelle Unité
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : treeData.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3">
            <div className="p-4 rounded-full bg-muted/50 text-muted-foreground/30">
              <LayoutGrid className="size-10" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold">Aucune structure définie</p>
              <p className="text-xs text-muted-foreground italic">
                Aucune unité organisationnelle. Relancez le seed ou créez une direction / pôle.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 font-bold uppercase text-[10px]"
              onClick={() => {
                setSelectedParentId(null);
                setIsAddSheetOpen(true);
              }}
            >
              Créer la première unité
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {view === 'tree' && treeData.map((unit) => renderUnit(unit))}
            {view === 'list' && renderListView()}
            {view === 'grid' && renderGridView()}
          </div>
        )}
      </CardContent>

      <OrgUnitAddSheet 
        open={isAddSheetOpen} 
        onOpenChange={setIsAddSheetOpen} 
        parentId={selectedParentId}
      />
    </Card>
  );
}
