'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../constants/sheet-shell-classes';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, FileText, Info, LoaderCircle, User as UserIcon, Clock, CheckCircle2 } from 'lucide-react';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { AbsenceAddSchema, AbsenceAddSchemaType } from '../forms/absence-schema';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDate, getInitials } from '@/lib/helpers';
import { ABSENCE_TYPES } from '../constants';
import { cn } from '@/lib/utils';

const AbsenceAddSheet = ({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

  const { data: collaborators } = useQuery({
    queryKey: ['rh-collaborators-select'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/collaborateurs?limit=100');
      if (!response.ok) throw new Error('Failed to fetch collaborators');
      return response.json();
    },
  });

  const form = useForm<AbsenceAddSchemaType>({
    resolver: zodResolver(AbsenceAddSchema),
    defaultValues: {
      tenantUserId: '',
      type: 'CONGE_PAYE',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      reason: '',
    },
  });

  const { watch } = form;
  const selectedUserId = watch('tenantUserId');
  const selectedType = watch('type');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const selectedCollaborator = collaborators?.data?.find((c: any) => c.id === selectedUserId);
  const collaboratorName = selectedCollaborator ? `${selectedCollaborator.firstName} ${selectedCollaborator.lastName}` : 'Sélectionner un collaborateur';

  const mutation = useMutation({
    mutationFn: async (values: AbsenceAddSchemaType) => {
      // Map tenantUserId to userId for the API
      const payload = {
        userId: values.tenantUserId,
        type: values.type,
        startDate: values.startDate,
        endDate: values.endDate,
        reason: values.reason,
      };

      const response = await apiFetch('/api/sections/gestion-ressources/rh/absences', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("Demande enregistrée", {
        description: "La demande d'absence a été créée avec succès.",
      });

      queryClient.invalidateQueries({ queryKey: ['rh-absences'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
      onOpenChange(false);
      form.reset();
      setActiveTab('details');
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const typeData = ABSENCE_TYPES.find(t => t.id === selectedType) || ABSENCE_TYPES[3];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          VIE_SCOLAIRE_SHEET_AUTO,
          'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0',
        )}
      >
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="font-medium text-sm">Nouvelle demande d'absence</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="flex min-h-0 flex-1 flex-col">
            <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 bg-background">
              <div className="flex shrink-0 justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <h2 className="lg:text-[22px] font-semibold text-foreground leading-none">
                      Créer une demande
                    </h2>
                    <Badge variant="outline" appearance="light" size="sm" className="font-bold uppercase text-[10px] tracking-wider px-2">
                      Brouillon
                    </Badge>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-2sm">
                    <span className="font-normal text-muted-foreground">Formulaire de saisie pour</span>
                    <span className="font-medium text-foreground underline decoration-foreground/30 underline-offset-2">{collaboratorName}</span>
                  </div>
                </div>
              </div>

              <ScrollArea
                className="mx-1.5 flex min-h-0 flex-1 flex-col"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
                  {/* Left Column: Summary */}
                  <div className="w-full shrink-0 space-y-4 py-5 lg:w-[280px] lg:pe-5">
                    <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
                      {selectedCollaborator ? (
                        <Avatar className="size-full rounded-none">
                          {selectedCollaborator.avatar ? (
                            <img src={selectedCollaborator.avatar} alt={collaboratorName} className="size-full object-cover" />
                          ) : (
                            <AvatarFallback className="rounded-none bg-muted text-5xl font-bold text-muted-foreground/20">
                              {getInitials(collaboratorName)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <UserIcon className="size-[40px] text-muted-foreground/60" />
                          <span className="text-xs text-muted-foreground font-medium">En attente de sélection</span>
                        </div>
                      )}
                      {selectedCollaborator && (
                        <div className="absolute inset-x-2 bottom-2">
                          <div className="bg-card/90 backdrop-blur-md p-3 rounded-lg border border-border shadow-sm">
                             <p className="text-xs font-semibold text-foreground truncate mb-0.5">{collaboratorName}</p>
                             <p className="text-[10px] text-muted-foreground truncate">{selectedCollaborator?.email}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Type d'absence", value: typeData.label, isBadge: true, badgeBg: typeData.bg, badgeColor: typeData.color },
                        { label: "Date de début", value: startDate ? formatDate(new Date(startDate)) : '-' },
                        { label: "Date de fin", value: endDate ? formatDate(new Date(endDate)) : '-' },
                        { label: "Durée totale", value: (startDate && endDate) ? `${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} jours` : '-', isHighlight: true }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm">
                          <span className="text-muted-foreground">{item.label}</span>
                          {item.isBadge ? (
                            <Badge className={cn("font-bold uppercase text-[10px] tracking-wider px-2", item.badgeBg, item.badgeColor)} appearance="light" size="sm">{item.value}</Badge>
                          ) : (
                            <span className={cn("font-semibold text-foreground", item.isHighlight && "text-foreground")}>{item.value}</span>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/10 rounded-md p-4 space-y-3 border border-border">
                      <div className="flex items-center gap-2 text-foreground/70 font-semibold text-xs">
                        <Info className="size-4" />
                        Note importante
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        La validation finale par le service RH est requise pour que cette absence soit enregistrée.
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Tabbed Form */}
                  <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                      <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="details">Détails</TabsTrigger>
                        <TabsTrigger value="reason">Justification</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-6 mt-0">
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={form.control}
                            name="tenantUserId"
                            render={({ field }) => (
                              <FormItem className="space-y-1.5">
                                <FormLabel className="text-sm font-medium text-foreground">
                                  Sélection du collaborateur
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="h-10 bg-background border-border rounded-md px-3 text-sm">
                                      <SelectValue placeholder="Rechercher un membre de l'équipe..." />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="rounded-md border-border">
                                    <ScrollArea className="h-[280px]">
                                      {collaborators?.data?.map((col: any) => (
                                        <SelectItem key={col.id} value={col.id} className="cursor-pointer py-2 hover:bg-accent">
                                          <div className="flex items-center gap-3">
                                            <Avatar className="size-8">
                                              {col.avatar ? (
                                                <img src={col.avatar} alt={`${col.firstName} ${col.lastName}`} className="size-full object-cover rounded-full" />
                                              ) : (
                                                <AvatarFallback className="bg-muted text-foreground/50 text-[10px] font-bold">
                                                  {getInitials(`${col.firstName} ${col.lastName}`)}
                                                </AvatarFallback>
                                              )}
                                            </Avatar>
                                            <div className="flex flex-col">
                                              <span className="text-sm font-semibold text-foreground">{col.firstName} {col.lastName}</span>
                                              <span className="text-[10px] text-muted-foreground font-normal">{col.email}</span>
                                            </div>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </ScrollArea>
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="type"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-sm font-medium text-foreground">
                                    Nature de l'absence
                                  </FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="h-10 bg-background border-border rounded-md px-3 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-md border-border shadow-xl">
                                      {ABSENCE_TYPES.map((type) => (
                                        <SelectItem key={type.id} value={type.id} className="cursor-pointer py-2">
                                          <div className="flex items-center gap-2.5">
                                             <div className={cn("p-1.5 rounded-md", type.bg)}>
                                               <type.icon className={cn("size-3.5", type.color)} />
                                             </div>
                                             <span className="font-semibold text-sm">{type.label}</span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="startDate"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-sm font-medium text-foreground">
                                    Date de début
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                      <Input type="date" {...field} className="h-10 pl-10 bg-background border-border rounded-md text-sm" />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="endDate"
                              render={({ field }) => (
                                <FormItem className="space-y-1.5">
                                  <FormLabel className="text-sm font-medium text-foreground">
                                    Date de fin
                                  </FormLabel>
                                  <FormControl>
                                    <div className="relative">
                                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                      <Input type="date" {...field} className="h-10 pl-10 bg-background border-border rounded-md text-sm" />
                                    </div>
                                  </FormControl>
                                  <FormMessage className="text-xs" />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="reason" className="space-y-6 mt-0">
                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem className="space-y-1.5">
                              <FormLabel className="text-sm font-medium text-foreground">
                                Justification détaillée
                              </FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Veuillez préciser le motif de l'absence..."
                                  className="min-h-[220px] bg-background border-border rounded-md p-3 text-sm resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground italic">
                                 <Info className="size-3.5" />
                                 Optionnel, mais recommandé pour faciliter le traitement.
                              </div>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="flex shrink-0 flex-row items-center gap-2 border-t border-border bg-background p-5 pb-4 sm:gap-2.5">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground italic">
                <Info className="size-3.5 shrink-0" />
                <span className="min-w-0">
                La demande sera soumise pour validation au service RH.
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
                <Button type="button" variant="ghost" className="shrink-0" onClick={() => onOpenChange(false)}>Annuler</Button>
                <Button 
                  type="submit" 
                  variant="outline" 
                  className="shrink-0 font-semibold shadow-sm bg-foreground text-background hover:bg-foreground/90 border-none px-8"
                  disabled={mutation.isPending || !selectedUserId}
                >
                  {mutation.isPending ? (
                    <LoaderCircle className="animate-spin size-4 mr-2" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  Soumettre la demande
                </Button>
              </div>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AbsenceAddSheet;
