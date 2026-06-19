'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  UserPlus, 
  Users,
  LoaderCircle, 
  Mail, 
  Trash2,
  Info,
  MapPin,
  LayoutGrid,
  TrendingUp,
  History,
  ShieldCheck,
  Activity,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { getInitials, getAvatarUrl } from '@/lib/helpers';
import { Team } from '@/app/models/team';
import { Badge } from '@/components/ui/badge';
import { TEAM_TYPES, TEAM_SECTORS } from '../constants';
import { cn } from '@/lib/utils';
import { Card, CardContent } from "@/components/ui/card";
import {
  SESSION_TEAM_ROLE_LABELS,
  groupSessionTeamMembers,
  isSessionPedagogicalTeam,
  sessionTeamSubtitle,
} from '../lib/team-display';

interface TeamDetailsOverviewProps {
  team: Team;
}

export function TeamDetailsOverview({ team }: TeamDetailsOverviewProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [memberSearch, setMemberSearch] = useState('');
  const [newMemberId, setNewMemberId] = useState('');

  const teamType = TEAM_TYPES.find(t => t.id === (team as any).type) || TEAM_TYPES[3]; // Default to SECURITE
  const teamSector = TEAM_SECTORS.find(s => s.id === (team as any).sector) || TEAM_SECTORS[2]; // Default to CLIENT
  const sessionTeam = isSessionPedagogicalTeam(team);
  const groupedMembers = useMemo(() => groupSessionTeamMembers(team), [team]);

  const { data: collaborators } = useQuery({
    queryKey: ['rh-collaborators-select'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs?limit=100');
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const availableCollaborators = useMemo(() => {
    return collaborators?.data?.filter((c: any) => 
      !team.members?.some((m: any) => m.tenantUserId === c.id)
    ) || [];
  }, [collaborators?.data, team.members]);

  const addMemberMutation = useMutation({
    mutationFn: async (tenantUserId: string) => {
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${team.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ tenantUserId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Échec de l\'ajout');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t('teams.memberAdded'));
      queryClient.invalidateQueries({ queryKey: ['rh-team', team.id] });
      queryClient.invalidateQueries({ queryKey: ['rh-teams'] });
      setNewMemberId('');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (tenantUserId: string) => {
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${team.id}/members?tenantUserId=${tenantUserId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Échec du retrait');
      return res.json();
    },
    onSuccess: () => {
      toast.success(t('teams.memberRemoved'));
      queryClient.invalidateQueries({ queryKey: ['rh-team', team.id] });
      queryClient.invalidateQueries({ queryKey: ['rh-teams'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredMembers = useMemo(() => {
    if (!team.members) return [];
    const search = memberSearch.toLowerCase();
    return team.members.filter((m: any) => {
      const firstName = m.TenantUser?.firstName?.toLowerCase() || '';
      const lastName = m.TenantUser?.lastName?.toLowerCase() || '';
      const email = m.TenantUser?.email?.toLowerCase() || '';
      return `${firstName} ${lastName}`.includes(search) || email.includes(search);
    });
  }, [team.members, memberSearch]);

  const { data: metricsResponse, isLoading: isLoadingMetrics } = useQuery({
    queryKey: ['rh-team-metrics', team.id],
    queryFn: async () => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${team.id}/metrics`);
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds stability for metrics
    gcTime: 1000 * 60 * 5,
  });

  const metrics = metricsResponse?.data;

  const renderMemberCard = (member: any, options?: { hideRemove?: boolean }) => (
    <div
      key={member.id}
      className="group flex items-center justify-between p-4 rounded-2xl border border-border bg-background hover:border-foreground/20 transition-all"
    >
      <div className="flex items-center gap-4">
        <Avatar className="size-11 border border-border shadow-sm">
          <AvatarImage
            src={
              member.TenantUser?.avatar
                ? getAvatarUrl(member.TenantUser.avatar)
                : undefined
            }
            alt=""
          />
          <AvatarFallback className="bg-background text-foreground/70 text-sm font-bold uppercase">
            {getInitials(`${member.TenantUser?.firstName} ${member.TenantUser?.lastName}`)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-foreground leading-tight">
            {member.TenantUser?.firstName} {member.TenantUser?.lastName}
          </span>
          <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
            <Mail className="size-3 text-muted-foreground/60" />
            {member.TenantUser?.email}
          </span>
        </div>
      </div>
      {!options?.hideRemove ? (
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0 text-muted-foreground hover:text-foreground hover:bg-foreground/5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => {
            if (confirm(`Retirer ${member.TenantUser?.firstName} de l'équipe ?`)) {
              removeMemberMutation.mutate(member.tenantUserId);
            }
          }}
        >
          <Trash2 className="size-4" />
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6 mt-0">
      {sessionTeam ? (
        <Card className="shadow-none border border-primary/20 bg-primary/5">
          <CardContent className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary">
              <GraduationCap className="size-3.5" />
              Équipe pédagogique · Session de formation
            </div>
            <p className="text-base font-bold text-foreground">
              {team.formationSession?.formation?.name || team.name}
            </p>
            <p className="text-sm text-muted-foreground">{sessionTeamSubtitle(team)}</p>
            <p className="text-xs text-muted-foreground italic">
              Composition synchronisée automatiquement : formateur assigné, référent pédagogique et
              apprenants inscrits à la session.
            </p>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: metrics?.members?.label || 'Membres', 
            value: metrics?.members?.value ?? (team.members?.length || 0), 
            sub: metrics?.members?.sub || 'Total actifs', 
            icon: Users, 
            color: 'text-foreground/70', 
            bg: 'bg-background' 
          },
          { 
            label: metrics?.activity?.label || 'Activité', 
            value: metrics?.activity?.value ?? '0', 
            sub: metrics?.activity?.sub || 'Actions/7j', 
            icon: Activity, 
            color: 'text-foreground/70', 
            bg: 'bg-background' 
          },
          { 
            label: metrics?.reliability?.label || 'Fiabilité', 
            value: metrics?.reliability?.value ?? '0%', 
            sub: metrics?.reliability?.sub || 'Score équipe', 
            icon: ShieldCheck, 
            color: 'text-foreground/70', 
            bg: 'bg-background' 
          },
          { 
            label: metrics?.alerts?.label || 'Alertes', 
            value: metrics?.alerts?.value ?? '0', 
            sub: metrics?.alerts?.sub || 'En attente', 
            icon: Info, 
            color: 'text-foreground/70', 
            bg: 'bg-background' 
          }
        ].map((stat, i) => (
          <Card key={i} className="shadow-none border border-border bg-background hover:border-foreground/20 transition-all">
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
                <div className={cn("p-1.5 rounded-lg border border-border", stat.bg)}>
                  {isLoadingMetrics && i > 0 ? (
                    <LoaderCircle className="size-3.5 animate-spin text-muted-foreground/40" />
                  ) : (
                    <stat.icon className={cn("size-3.5", stat.color)} />
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-foreground">{stat.value}</span>
                <span className="text-[10px] font-medium text-muted-foreground italic">{stat.sub}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-background flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <LayoutGrid className="size-3.5" />
            Type d'équipe
          </div>
          <div className="flex items-center gap-2.5">
            <div className={cn("size-8 rounded-lg flex items-center justify-center bg-background border border-border")}>
              <teamType.icon className={cn("size-4 text-foreground/70")} />
            </div>
            <span className="text-sm font-bold text-foreground">{teamType.label}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-background flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Info className="size-3.5" />
            Secteur
          </div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center">
              <teamSector.icon className="size-4 text-foreground/70" />
            </div>
            <span className="text-sm font-bold text-foreground">{teamSector.label}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-background flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <MapPin className="size-3.5" />
            Site Affecté
          </div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-background border border-border flex items-center justify-center">
              <MapPin className="size-4 text-foreground/70" />
            </div>
            <span className="text-sm font-bold text-foreground truncate">
              {(team as any).Site?.name || "Non affecté"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 text-muted-foreground/50 absolute start-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Rechercher un membre..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="ps-9 h-10 bg-background border-border focus:bg-background transition-colors"
          />
        </div>

        {!sessionTeam ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={newMemberId} onValueChange={setNewMemberId}>
              <SelectTrigger className="h-10 w-full sm:w-[250px] bg-background border-border font-medium">
                <SelectValue placeholder="Ajouter un collaborateur..." />
              </SelectTrigger>
              <SelectContent>
                {availableCollaborators.map((col: any) => (
                  <SelectItem key={col.id} value={col.id}>
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-background flex items-center justify-center text-[10px] font-bold text-foreground/70 border border-border">
                        {getInitials(`${col.firstName} ${col.lastName}`)}
                      </div>
                      <span>{col.firstName} {col.lastName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="primary"
              className="h-10 px-4 shadow-sm"
              disabled={!newMemberId || addMemberMutation.isPending}
              onClick={() => addMemberMutation.mutate(newMemberId)}
            >
              {addMemberMutation.isPending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
            </Button>
          </div>
        ) : null}
      </div>

      {sessionTeam ? (
        <div className="space-y-6">
          {(['TRAINER', 'MODERATOR', 'LEARNER'] as const).map((role) => {
            const roleMembers = groupedMembers[role].filter((m: any) => {
              if (!memberSearch.trim()) return true;
              const search = memberSearch.toLowerCase();
              const firstName = m.TenantUser?.firstName?.toLowerCase() || '';
              const lastName = m.TenantUser?.lastName?.toLowerCase() || '';
              const email = m.TenantUser?.email?.toLowerCase() || '';
              return `${firstName} ${lastName}`.includes(search) || email.includes(search);
            });

            return (
              <div key={role} className="space-y-3">
                <div className="flex items-center gap-2">
                  {role === 'TRAINER' ? (
                    <BookOpen className="size-4 text-primary" />
                  ) : role === 'MODERATOR' ? (
                    <ShieldCheck className="size-4 text-primary" />
                  ) : (
                    <Users className="size-4 text-primary" />
                  )}
                  <h4 className="text-sm font-bold text-foreground">{SESSION_TEAM_ROLE_LABELS[role]}</h4>
                  <Badge variant="outline" size="sm" className="text-[10px]">
                    {roleMembers.length}
                  </Badge>
                </div>
                {roleMembers.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {roleMembers.map((member) => renderMemberCard(member, { hideRemove: true }))}
                  </div>
                ) : (
                  <div className="py-6 px-4 rounded-xl border border-dashed border-border text-sm text-muted-foreground italic">
                    {role === 'TRAINER'
                      ? 'Aucun formateur assigné à cette session.'
                      : role === 'MODERATOR'
                        ? 'Aucun référent pédagogique assigné.'
                        : 'Aucun apprenant inscrit pour le moment.'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        {filteredMembers.length > 0 ? (
          filteredMembers.map((member: any) => renderMemberCard(member))
        ) : (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-background">
            <div className="size-12 rounded-full bg-background border border-border flex items-center justify-center mb-3">
              <Search className="size-6 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Aucun membre trouvé</p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
