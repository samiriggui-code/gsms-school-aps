'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { Team } from '@/app/models/team';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../constants/sheet-shell-classes';
import { GESTION_RESSOURCES_SHEET_TABS_LIST } from '@/lib/gestion-ressources/ui';
import { useMaxWidthLg } from '@/hooks/use-max-width-lg';
import {
  Users,
  Info,
  LoaderCircle,
  Trash2,
  ShieldCheck,
  LayoutGrid,
  Clock,
  MapPin,
  Briefcase
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { TEAM_TYPES, TEAM_SECTORS } from '../constants';

// New components
import { TeamDetailsOverview } from './team-details-overview';
import { TeamDetailsSettings } from './team-details-settings';
import { TeamDetailsActivity } from './team-details-activity';

interface TeamDetailsSheetProps {
  teamId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TeamDetailsSheet = ({
  teamId,
  open,
  onOpenChange,
}: TeamDetailsSheetProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const settingsFormRef = useRef<any>(null);
  const hideActivityTab = useMaxWidthLg();

  const { data: team, isLoading } = useQuery({
    queryKey: ['rh-team', teamId],
    queryFn: async () => {
      if (!teamId) return null;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${teamId}`);
      if (!res.ok) throw new Error('Échec du chargement de l\'équipe');
      const json = await res.json();
      return unwrapSectionApiData<Team>(json) ?? null;
    },
    enabled: !!teamId && open,
  });

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      if (!teamId) return;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/equipes/${teamId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Échec de la suppression');
      return res.json();
    },
    onSuccess: () => {
      toast.success(t('teams.deleted'));
      queryClient.invalidateQueries({ queryKey: ['rh-teams'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSaveSettings = () => {
    if (settingsFormRef.current) {
      settingsFormRef.current.requestSubmit();
    }
  };

  if (!teamId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
            <Users className="size-3.5" />
            Détails de l'équipe
          </SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <LoaderCircle className="size-8 animate-spin text-muted-foreground/20" />
            </div>
          ) : !team ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-20">
              <Info className="size-12 mb-4 opacity-20" />
              <p>Impossible de trouver l'équipe.</p>
            </div>
          ) : (
            <>
              <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                      {team.name}
                    </span>
                    <Badge variant="outline" appearance="light" size="sm" className="font-bold uppercase text-[10px] px-2">
                       {team.members?.length || 0} Membres
                    </Badge>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-2sm">
                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                      <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
                      <span className="font-bold text-foreground/80">#{team.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <span className="font-normal text-muted-foreground ml-2 line-clamp-1 italic">
                      {team.description || "Aucune description fournie."}
                    </span>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0 mx-1.5" viewportClassName="[&>div]:h-full [&>div>div]:h-full">
                <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                  {/* Left Column: Summary */}
                  <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
                    <div className="w-full h-[240px] bg-muted/5 border border-border/60 rounded-2xl flex items-center justify-center overflow-hidden relative group transition-all duration-300 hover:bg-muted/10">
                       <img 
                         src={`/media/images/600x600/${(team as any).image || '1.jpg'}`} 
                         alt="Team illustration" 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                       />
                       <div className="absolute top-4 right-4">
                        <Badge variant="outline" className="bg-background text-[10px] font-bold uppercase">
                          ACTIVE
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Nom équipe", value: team.name },
                        { label: "Type", value: TEAM_TYPES.find(t => t.id === team.type)?.label || "Sécurité" },
                        { label: "Secteur", value: TEAM_SECTORS.find(s => s.id === team.sector)?.label || "Site Client" },
                        { label: "Site", value: (team as any).Site?.name || "Non affecté" },
                        { label: "Date création", value: formatDate(new Date(team.createdAt)) },
                        { label: "Total membres", value: team.members?.length || 0 }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm pb-1 border-b border-border/30 last:border-0">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px] text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
                       <div className="flex items-center gap-2 text-foreground font-bold text-[10px] uppercase tracking-wider">
                          <ShieldCheck className="size-3.5 text-foreground/70" />
                          Informations
                       </div>
                       <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Cette équipe regroupe des collaborateurs pour une gestion centralisée des plannings et des interventions.
                       </p>
                    </div>

                    <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      Dernière modification le {formatDate(new Date(team.updatedAt || team.createdAt))}
                    </div>
                  </div>

                  {/* Right Column: Content */}
                  <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                      <TabsList className={GESTION_RESSOURCES_SHEET_TABS_LIST}>
                        <TabsTrigger value="overview">Membres</TabsTrigger>
                        {!hideActivityTab ? <TabsTrigger value="activity">Activité</TabsTrigger> : null}
                        <TabsTrigger value="settings">Paramètres</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview">
                        <TeamDetailsOverview team={team} />
                      </TabsContent>
                      
                      <TabsContent value="activity">
                        <TeamDetailsActivity team={team} />
                      </TabsContent>

                      <TabsContent value="settings">
                        <TeamDetailsSettings team={team} formRef={settingsFormRef} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetBody>

        <SheetFooter className="flex flex-col gap-2.5 border-t pb-4 p-5 border-border sm:flex-row sm:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          <div className="flex flex-wrap gap-2.5 sm:ml-auto">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
              onClick={() => {
                if (confirm('Supprimer cette équipe définitivement ?')) {
                  deleteTeamMutation.mutate();
                }
              }}
            >
              <Trash2 className="size-4 mr-2" />
              Supprimer
            </Button>
            {activeTab === 'settings' ? (
              <Button 
                variant="outline" 
                className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                onClick={handleSaveSettings}
              >
                Enregistrer les modifications
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                onClick={() => setActiveTab('settings')}
              >
                Modifier les détails
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default TeamDetailsSheet;
