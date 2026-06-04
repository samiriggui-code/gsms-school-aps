'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Info,
  LoaderCircle,
  CheckCircle2,
  XCircle,
  Trash2,
  ChevronRight,
  Clock,
  User as UserIcon,
  History as HistoryIcon,
  LayoutGrid
} from 'lucide-react';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Absence, AbsenceStatus } from '@/app/models/absence';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { formatDate, formatDateTime, getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { ABSENCE_TYPES, ABSENCE_STATUSES } from '../constants';

// Local components
import AbsenceDetailsOverview from './absence-details-overview';
import AbsenceDetailsHistory from './absence-details-history';

interface AbsenceDetailsSheetProps {
  absenceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AbsenceDetailsSheet = ({
  absenceId,
  open,
  onOpenChange,
}: AbsenceDetailsSheetProps) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: response, isLoading } = useQuery({
    queryKey: ['rh-absence', absenceId],
    queryFn: async () => {
      if (!absenceId) return null;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/absences/${absenceId}`);
      if (!res.ok) throw new Error('Échec du chargement des détails');
      return res.json();
    },
    enabled: !!absenceId && open,
  });

  const absence = response?.data as Absence | undefined;

  const updateStatusMutation = useMutation({
    mutationFn: async (status: AbsenceStatus) => {
      if (!absenceId) return;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/absences/${absenceId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Échec de la mise à jour du statut');
      return res.json();
    },
    onSuccess: (_, status) => {
      toast.success(status === 'APPROVED' ? 'Demande approuvée' : 'Demande refusée', {
        description: `Le statut de l'absence a été mis à jour avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ['rh-absences'] });
      queryClient.invalidateQueries({ queryKey: ['rh-absence', absenceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!absenceId) return;
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/absences/${absenceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Échec de la suppression');
      return res.json();
    },
    onSuccess: () => {
      toast.success("Absence supprimée", {
        description: "La demande d'absence a été définitivement supprimée.",
      });
      queryClient.invalidateQueries({ queryKey: ['rh-absences'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  if (!absenceId) return null;

  const collaboratorName = absence?.User ? `${absence.User.firstName} ${absence.User.lastName}` : 'Chargement...';
  const typeInfo = ABSENCE_TYPES.find(t => t.id === absence?.type) || ABSENCE_TYPES[3];
  const statusInfo = ABSENCE_STATUSES.find(s => s.id === absence?.status) || ABSENCE_STATUSES[0];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className={cn(
          VIE_SCOLAIRE_SHEET_AUTO,
          'h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)] min-h-0',
        )}
      >
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Détails de l'absence</SheetTitle>
        </SheetHeader>

        <SheetBody className="flex flex-1 min-h-0 flex-col overflow-hidden p-0 bg-background">
          {isLoading ? (
              <div className="flex flex-1 min-h-0 items-center justify-center py-20">
                <LoaderCircle className="size-8 animate-spin text-muted-foreground/20" />
              </div>
          ) : !absence ? (
            <div className="flex flex-1 min-h-0 flex-col items-center justify-center text-muted-foreground py-20">
              <RiErrorWarningFill className="size-12 mb-4 opacity-20" />
              <p>Impossible de trouver les détails de l'absence.</p>
            </div>
          ) : (
            <>
              <div className="flex shrink-0 justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                      {collaboratorName}
                    </span>
                    <Badge size="sm" variant={statusInfo.variant as any} appearance="light" className="font-bold uppercase text-[10px] tracking-wider px-2">
                       {statusInfo.label}
                    </Badge>
                  </div>
                  <div className="flex items-center flex-wrap gap-2 text-2sm">
                    <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                      <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">ID</span>
                      <span className="font-bold text-foreground/80">{absence.id.substring(0, 8)}</span>
                    </div>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <span className="font-normal text-muted-foreground">Type:</span>
                    <span className="font-bold text-foreground/80">{typeInfo.label}</span>
                    <BadgeDot className="bg-muted-foreground/30 size-1" />
                    <span className="font-normal text-muted-foreground">Créée le:</span>
                    <span className="font-semibold text-foreground/80">{formatDateTime(new Date(absence.createdAt))}</span>
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
                    <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative shadow-sm">
                       {absence.User?.avatar ? (
                         <img src={absence.User.avatar} alt={collaboratorName} className="size-full object-cover" />
                       ) : (
                         <div className="flex flex-col items-center gap-2">
                           <UserIcon className="size-[40px] text-muted-foreground/40" />
                           <span className="text-xs text-muted-foreground font-medium italic">Pas d'image</span>
                         </div>
                       )}
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Collaborateur", value: collaboratorName },
                        { label: "Email", value: absence.User?.email },
                        { label: "Type", value: typeInfo.label },
                        { label: "Statut", value: statusInfo.label },
                        { label: "Date début", value: formatDate(new Date(absence.startDate)) },
                        { label: "Date fin", value: formatDate(new Date(absence.endDate)) }
                      ].map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-2sm pb-1 border-b border-border/10 last:border-0">
                          <span className="text-muted-foreground">{item.label}</span>
                          <span className="font-semibold text-foreground truncate max-w-[150px] text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
                       <div className="flex items-center gap-2 text-foreground/80 font-bold text-[10px] uppercase tracking-widest">
                          <HistoryIcon className="size-3.5 text-foreground/70" />
                          Audit log
                       </div>
                       <div className="space-y-2.5 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Création</span>
                            <span className="font-bold text-foreground/70">{formatDate(new Date(absence.createdAt))}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground font-medium">Modification</span>
                            <span className="font-bold text-foreground/70">{formatDate(new Date(absence.updatedAt))}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Right Column: Content */}
                  <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                      <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="history">Historique & Audit</TabsTrigger>
                        <TabsTrigger value="settings">Paramètres</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview">
                        <AbsenceDetailsOverview absence={absence} />
                      </TabsContent>
                      
                      <TabsContent value="history">
                        <AbsenceDetailsHistory absence={absence} />
                      </TabsContent>

                      <TabsContent value="settings">
                        <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-xl bg-muted/20 text-muted-foreground gap-3">
                           <LayoutGrid className="size-12 opacity-10" />
                           <p className="text-sm font-medium">Les paramètres de cette absence sont gérés par le système.</p>
                           <Button variant="outline" size="sm" className="font-bold uppercase text-[10px]" disabled>
                              Modifier les dates
                           </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetBody>

        <SheetFooter className="flex shrink-0 flex-row items-center gap-2 border-t border-border bg-background p-5 pb-4 sm:gap-2.5">
          <Button variant="ghost" className="shrink-0" onClick={() => onOpenChange(false)}>Fermer</Button>
          {absence && (
            <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2.5 [&::-webkit-scrollbar]:hidden">
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button 
                     variant="ghost" 
                     className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                   >
                     <Trash2 className="size-4 mr-2" />
                     Supprimer
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
                     <AlertDialogDescription>
                       Cette action est irréversible. La demande d'absence sera définitivement supprimée de la base de données.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>Annuler</AlertDialogCancel>
                     <AlertDialogAction
                       className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                       onClick={() => deleteMutation.mutate()}
                     >
                       Supprimer
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
               {absence.status === 'PENDING' ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => updateStatusMutation.mutate('REJECTED')}
                      disabled={updateStatusMutation.isPending}
                      className="shrink-0 font-semibold"
                    >
                      <XCircle className="size-4 mr-2" />
                      Refuser la demande
                    </Button>
                    <Button 
                      variant="outline" 
                      className="shrink-0 bg-foreground text-background hover:bg-foreground/90 font-bold border-none"
                      onClick={() => updateStatusMutation.mutate('APPROVED')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle2 className="size-4 mr-2" />
                      Approuver la demande
                    </Button>
                  </>
               ) : (
                  <Button 
                    variant="outline" 
                    className="shrink-0 bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                    onClick={() => setActiveTab('settings')}
                  >
                    Modifier les détails
                  </Button>
               )}
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default AbsenceDetailsSheet;
