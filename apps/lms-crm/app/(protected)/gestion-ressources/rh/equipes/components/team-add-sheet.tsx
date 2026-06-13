'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../constants/sheet-shell-classes';
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
import { LoaderCircleIcon, Users, Info, FileText, LayoutGrid, Check, ChevronsUpDown, Search, UserPlus, MapPin } from 'lucide-react';
import { TeamSchema, TeamSchemaType } from '../forms/team-schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as Collaborateur } from '@/app/models/user';
import { TEAM_TYPES, TEAM_SECTORS } from '../constants';

const TeamAddSheet = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general');
  const [memberSearch, setMemberSearch] = useState('');

  const form = useForm<TeamSchemaType>({
    resolver: zodResolver(TeamSchema),
    defaultValues: {
      name: '',
      description: '',
      memberIds: [],
      leaderId: null,
      type: 'SECURITE',
      sector: 'CLIENT',
      siteId: 'none',
      orgUnitId: 'none',
      image: '1.jpg',
    },
    mode: 'onSubmit',
  });

  const { watch, setValue } = form;
  const teamName = watch('name');
  const teamImage = watch('image');
  const selectedMemberIds = watch('memberIds') || [];

  // Illustrations disponibles
  const illustrations = Array.from({ length: 35 }, (_, i) => `${i + 1}.jpg`);

  // Fetch OrgUnits
  const { data: orgUnitsData, isLoading: isLoadingOrgUnits } = useQuery({
    queryKey: ['org-units-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/org-units');
      if (!response.ok) throw new Error('Failed to fetch org units');
      return response.json();
    },
    enabled: open,
  });

  // Fetch Collaborators
  const { data: collaboratorsData, isLoading: isLoadingCollaborators } = useQuery({
    queryKey: ['collaborateurs-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs?limit=1000');
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      return response.json();
    },
    enabled: open,
  });

  // Fetch Sites
  const { data: sitesData, isLoading: isLoadingSites } = useQuery({
    queryKey: ['sites-simple'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-sites-clients/clients/sites');
      if (!response.ok) throw new Error('Failed to fetch sites');
      return response.json();
    },
    enabled: open,
  });

  const collaborators: Collaborateur[] = Array.isArray(collaboratorsData?.data) ? collaboratorsData.data : [];
  const sites = Array.isArray(sitesData) ? sitesData : [];

  const filteredCollaborators = collaborators.filter((c: Collaborateur) => 
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(memberSearch.toLowerCase()) ||
    c.email.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const mutation = useMutation({
    mutationFn: async (values: TeamSchemaType) => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/equipes', {
        method: 'POST',
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
      toast.custom(
        () => (
          <Alert variant="mono" icon="success" close={false}>
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>Équipe créée avec succès</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' }
      );

      queryClient.invalidateQueries({ queryKey: ['rh-teams'] });
      queryClient.invalidateQueries({ queryKey: ['rh-teams-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
      form.reset();
      onOpenChange(false);
      setActiveTab('general');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isProcessing = mutation.status === 'pending';

  const selectedLeader = collaborators.find((c: Collaborateur) => c.id === watch('leaderId'));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-muted/30 shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
            <Users className="size-3.5" />
            Nouvelle équipe
          </SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="grow flex flex-col min-h-0 bg-background overflow-hidden">
            <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-card shrink-0">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                    {teamName || "Nouvelle Équipe"}
                  </span>
                  <Badge variant="outline" appearance="light" size="sm" className="font-bold uppercase text-[10px] px-2 text-foreground/70 border-foreground/20">
                    Configuration
                  </Badge>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-2sm">
                  <span className="font-normal text-muted-foreground italic">
                    Définition d'un nouveau groupe de collaborateurs
                  </span>
                </div>
              </div>
            </div>

            <SheetBody className="p-0 flex-1 min-h-0 overflow-hidden">
              <ScrollArea className="h-full" viewportClassName="p-5">
                <div className="flex flex-wrap lg:flex-nowrap grow">
                  {/* Left Column: Preview */}
                  <div className="w-full shrink-0 lg:w-[280px] lg:pe-5 space-y-4">
                    <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
                       <img 
                         src={`/media/images/600x600/${teamImage || '1.jpg'}`} 
                         alt="Team illustration" 
                         className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                       />
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Type", value: TEAM_TYPES.find(t => t.id === watch('type'))?.label || "Sécurité", isHighlight: true },
                        { label: "Secteur", value: TEAM_SECTORS.find(s => s.id === watch('sector'))?.label || "Site Client", isHighlight: true },
                        { label: "Responsable", value: selectedLeader ? `${selectedLeader.firstName || ''} ${selectedLeader.lastName || ''}`.trim() || "Collaborateur" : "Aucun", isHighlight: !!watch('leaderId') && watch('leaderId') !== 'none' },
                        { label: "Unité", value: (orgUnitsData?.data as any[])?.find(u => u.id === watch('orgUnitId'))?.name || "Aucune", isHighlight: !!watch('orgUnitId') && watch('orgUnitId') !== 'none' },
                        { label: "Membres", value: selectedMemberIds.length.toString(), isHighlight: selectedMemberIds.length > 0 },
                        { label: "Site", value: sites.find(s => s.id === watch('siteId'))?.name || "Non affecté", isHighlight: !!watch('siteId') },
                        { label: "Statut", value: "Initialisation", isBadge: true }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm pb-1">
                          <span className="text-muted-foreground">{item.label}</span>
                          {item.isBadge ? (
                            <Badge variant="outline" appearance="light" size="sm" className="font-bold uppercase text-[10px] text-foreground/70 border-foreground/20">{item.value}</Badge>
                          ) : (
                            <span className={cn("font-semibold text-foreground text-right truncate max-w-[140px]", item.isHighlight && "text-foreground")}>{item.value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3 mt-6">
                      <div className="flex items-center gap-2 text-foreground font-bold text-[10px] uppercase tracking-wider">
                        <Info className="size-3.5 text-muted-foreground" />
                        Guide Rapide
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Une fois l'équipe créée, vous pourrez y affecter des membres et définir des responsables depuis l'onglet des détails.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Tabs */}
                  <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                      <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                        <TabsTrigger 
                          value="general" 
                        >
                          Informations générales
                        </TabsTrigger>
                        <TabsTrigger 
                          value="composition" 
                        >
                          Composition
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="general" className="space-y-8 mt-0">
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
                                      <SelectTrigger className="h-10 bg-muted/5 border-border focus:bg-background transition-colors">
                                        <SelectValue placeholder="Choisir un type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {TEAM_TYPES.map((type) => (
                                        <SelectItem key={type.id} value={type.id}>
                                          <div className="flex items-center gap-2">
                                            <type.icon className={cn("size-3.5", "text-muted-foreground")} />
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
                                      <SelectTrigger className="h-10 bg-muted/5 border-border focus:bg-background transition-colors">
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
                            name="name"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-2sm font-semibold text-foreground">Nom de l'équipe</FormLabel>
                                <FormControl>
                                  <Input placeholder="Ex: Équipe Intervention Nord" {...field} className="h-10 bg-muted/5 border-border focus:bg-background transition-colors font-bold" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="space-y-3">
                            <FormLabel className="text-2sm font-semibold text-foreground flex items-center gap-2">
                              Illustration de l'équipe
                              <Badge variant="outline" size="sm" className="font-normal opacity-60 italic">Identité Visuelle</Badge>
                            </FormLabel>
                            <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 p-3 border border-dashed border-border rounded-xl bg-muted/5">
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
                                    src={`/media/images/600x600/${illus}`} 
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
                                <FormLabel className="text-2sm font-semibold text-foreground">Description Opérationnelle (Optionnel)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Décrivez l'objectif stratégique ou les missions de cette équipe..." 
                                    {...field} 
                                    className="min-h-[100px] bg-muted/5 border-border focus:bg-background transition-colors resize-none italic" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="leaderId"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-2sm font-semibold text-foreground flex items-center gap-2">
                                  Chef d'Équipe / Responsable
                                  <Badge variant="outline" size="sm" className="font-normal opacity-60 italic">Hiérarchie</Badge>
                                </FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || 'none'}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 bg-muted/5 border-border focus:bg-background transition-colors">
                                      <SelectValue placeholder="Choisir un responsable" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Aucun responsable désigné</SelectItem>
                                    {collaborators.map((user: any) => (
                                      <SelectItem key={user.id} value={user.id}>
                                        <div className="flex items-center gap-2">
                                          <Avatar className="size-5">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="text-[8px]">{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                                          </Avatar>
                                          <span className="font-medium">{user.firstName} {user.lastName}</span>
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
                            name="orgUnitId"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-2sm font-semibold text-foreground flex items-center gap-2">
                                  Unité Organisationnelle
                                  <Badge variant="outline" size="sm" className="font-normal opacity-60 italic">Structure</Badge>
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 bg-muted/5 border-border focus:bg-background transition-colors">
                                      <SelectValue placeholder="Affecter à une unité" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Aucune (Indépendante)</SelectItem>
                                    {Array.isArray(orgUnitsData?.data) && orgUnitsData.data.map((unit: any) => (
                                      <SelectItem key={unit.id} value={unit.id}>
                                        <div className="flex items-center gap-2">
                                          <LayoutGrid className="size-3.5 text-muted-foreground/60" />
                                          <span className="font-medium">{unit.name}</span>
                                          <Badge variant="outline" size="sm" className="ml-2 opacity-50 uppercase text-[9px]">
                                            {unit.type}
                                          </Badge>
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
                            name="siteId"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-2sm font-semibold text-foreground flex items-center gap-2">
                                  Affectation Site Client
                                  <Badge variant="outline" size="sm" className="font-normal opacity-60 italic">Optionnel</Badge>
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 bg-muted/5 border-border focus:bg-background transition-colors">
                                      <SelectValue placeholder="Lier à un site existant" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">Aucun (Équipe interne / volante)</SelectItem>
                                    {sites.map((site: any) => (
                                      <SelectItem key={site.id} value={site.id}>
                                        <div className="flex items-center gap-2">
                                          <MapPin className="size-3.5 text-muted-foreground/60" />
                                          <span className="font-medium">{site.name}</span>
                                          <span className="text-[10px] text-muted-foreground uppercase ml-2 opacity-50">
                                            {site.Client?.name}
                                          </span>
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
                      </TabsContent>

                      <TabsContent value="composition" className="space-y-6 mt-0">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
                                <UserPlus className="size-4 text-foreground/70" />
                                Sélection des membres
                              </h3>
                              <p className="text-[11px] text-muted-foreground italic">
                                Choisissez les collaborateurs qui feront partie de cette équipe
                              </p>
                            </div>
                            <Badge variant="outline" appearance="light" className="font-bold text-foreground/70 border-foreground/20">
                              {selectedMemberIds.length} sélectionnés
                            </Badge>
                          </div>

                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input 
                              placeholder={t('datagrid.search.staffMember')} 
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              className="pl-10 h-10 bg-muted/5 border-border focus:bg-background transition-colors"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {filteredCollaborators.map((collaborator: any) => {
                              const isSelected = selectedMemberIds.includes(collaborator.id);
                              return (
                                <div 
                                  key={collaborator.id}
                                  onClick={() => {
                                    if (isSelected) {
                                      setValue('memberIds', selectedMemberIds.filter(id => id !== collaborator.id));
                                    } else {
                                      setValue('memberIds', [...selectedMemberIds, collaborator.id]);
                                    }
                                  }}
                                  className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group",
                                    isSelected 
                                      ? "bg-muted/10 border-foreground/30 ring-1 ring-foreground/20" 
                                      : "bg-card border-border hover:border-foreground/20 hover:bg-muted/5"
                                  )}
                                >
                                  <div className="relative">
                                    <Avatar className="size-10 border border-border group-hover:border-foreground/20 transition-colors">
                                      <AvatarImage src={collaborator.avatar || ''} />
                                      <AvatarFallback className="bg-muted text-foreground/70 text-xs font-bold">
                                        {collaborator.firstName[0]}{collaborator.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    {isSelected && (
                                      <div className="absolute -top-1 -right-1 size-4 bg-foreground text-background rounded-full flex items-center justify-center border-2 border-background">
                                        <Check className="size-2.5 stroke-[3]" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className={cn(
                                      "text-sm font-bold truncate transition-colors",
                                      isSelected ? "text-foreground" : "text-foreground group-hover:text-foreground"
                                    )}>
                                      {collaborator.firstName} {collaborator.lastName}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider truncate">
                                      {collaborator.email}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </TabsContent>

                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Info className="size-3.5" />
                L'équipe sera créée avec les paramètres sélectionnés.
              </div>
              <div className="flex gap-2.5 ml-auto">
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button 
                  type="submit" 
                  variant="outline" 
                  className="font-semibold shadow-sm bg-foreground text-background hover:bg-foreground/90 border-none px-8"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <LoaderCircleIcon className="animate-spin size-4 mr-2" />
                  ) : (
                    <Users className="size-4 mr-2" />
                  )}
                  Créer l'équipe
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default TeamAddSheet;
