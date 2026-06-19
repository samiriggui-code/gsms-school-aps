'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TeamSchema, TeamSchemaType } from '../forms/team-schema';
import { TEAM_TYPES, TEAM_SECTORS, TEAM_ILLUSTRATION_OPTIONS } from '../constants';
import { teamIllustrationSrc } from '../lib/team-display';
import { Team } from '@/app/models/team';
import { RefObject } from 'react';
import { cn } from '@/lib/utils';

interface TeamDetailsSettingsProps {
  team: Team;
  formRef: any;
}

export function TeamDetailsSettings({ team, formRef }: TeamDetailsSettingsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: sitesData } = useQuery({
    queryKey: ['sites-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-sites-clients/clients/sites');
      if (!response.ok) throw new Error('Failed to fetch sites');
      return response.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const { data: orgUnitsData } = useQuery({
    queryKey: ['rh-org-units'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/rh/org-units');
      if (!res.ok) return { data: [] };
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: staffData } = useQuery({
    queryKey: ['rh-staff-leader-pick'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs?page=1&limit=200');
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j?.data) ? j.data : [];
    },
    staleTime: 60_000,
  });

  const sites = Array.isArray(sitesData) ? sitesData : [];
  const orgUnits = (orgUnitsData?.data as any[]) ?? [];
  const staffList = staffData ?? [];

  const illustrations = TEAM_ILLUSTRATION_OPTIONS;

  const form = useForm<TeamSchemaType>({
    resolver: zodResolver(TeamSchema),
    defaultValues: {
      name: team.name,
      description: team.description || '',
      type: (team as any).type || 'PEDAGOGICAL',
      sector: (team as any).sector || 'CAMPUS',
      siteId: (team as any).siteId || 'none',
      orgUnitId: (team as any).orgUnitId || 'none',
      leaderId: (team as any).leaderId || 'none',
      memberIds: team.members?.map(m => m.tenantUserId) || [],
      image: (team as any).image || TEAM_ILLUSTRATION_OPTIONS[0],
    },
  });

  const { watch, setValue } = form;
  const teamImage = watch('image');

  const mutation = useMutation({
    mutationFn: async (values: TeamSchemaType) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${team.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(t('teams.updated'));
      queryClient.invalidateQueries({ queryKey: ['rh-team', team.id] });
      queryClient.invalidateQueries({ queryKey: ['rh-teams'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Form {...form}>
      <form 
        ref={formRef}
        onSubmit={form.handleSubmit((v) => mutation.mutate(v))} 
        className="space-y-6 mt-0"
      >
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-2sm font-semibold text-foreground">Type d'Équipe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors">
                        <SelectValue placeholder="Choisir un type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEAM_TYPES.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          <div className="flex items-center gap-2">
                            <type.icon className={cn("size-3.5", type.color)} />
                            <span>{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-2sm font-semibold text-foreground">Secteur / Structure</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors">
                        <SelectValue placeholder="Choisir un secteur" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TEAM_SECTORS.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          <div className="flex items-center gap-2">
                            <sector.icon className="size-3.5 text-muted-foreground" />
                            <span>{sector.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="siteId"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2sm font-semibold text-foreground">Site Affecté (Optionnel)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors">
                      <SelectValue placeholder="Choisir un site" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Non affecté</SelectItem>
                    {sites.map((site: any) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="orgUnitId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-2sm font-semibold text-foreground">Pôle / service</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                    value={field.value ?? 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors">
                        <SelectValue placeholder="Choisir un pôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Non rattaché</SelectItem>
                      {orgUnits.map((ou: { id: string; name: string }) => (
                        <SelectItem key={ou.id} value={ou.id}>
                          {ou.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="leaderId"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-2sm font-semibold text-foreground">Responsable d&apos;équipe</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                    value={field.value ?? 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors">
                        <SelectValue placeholder="Choisir un responsable" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Non défini</SelectItem>
                      {staffList.map((u: { id: string; name?: string; email?: string }) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2sm font-semibold text-foreground">Nom de l'équipe</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ex: Équipe Intervention Nord" 
                    {...field} 
                    className="h-10 bg-secondary/50 border-border focus:bg-background transition-colors font-bold" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-3">
            <FormLabel className="text-2sm font-semibold text-foreground">Illustration de l'équipe</FormLabel>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-2 p-3 border border-dashed border-border rounded-xl bg-secondary/20">
              {illustrations.map((illus) => (
                <div 
                  key={illus}
                  onClick={() => setValue('image', illus)}
                  className={cn(
                    "aspect-square rounded-lg border flex items-center justify-center p-0 cursor-pointer transition-all hover:scale-110 overflow-hidden",
                    teamImage === illus 
                      ? "bg-foreground/5 border-foreground shadow-sm ring-2 ring-foreground/20" 
                      : "bg-background border-border hover:border-foreground/30"
                  )}
                >
                  <img 
                    src={teamIllustrationSrc(illus)} 
                    alt={`Illustration ${illus}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-2sm font-semibold text-foreground">Description (Optionnel)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Décrivez l'objectif ou le secteur de cette équipe..." 
                    {...field} 
                    className="min-h-[120px] bg-secondary/50 border-border focus:bg-background transition-colors resize-none" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
}
