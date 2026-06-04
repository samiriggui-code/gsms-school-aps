'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Loader2, Building2, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../constants/sheet-shell-classes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateTime, getInitials } from '@/lib/helpers';

// Imports des composants modernisés
import { ProfilDetailsOverviews } from './profil-details-overviews'; 
import { ProfilDetailsBilling } from './profil-details-billing';
import { ProfilDetailsSettings } from './profil-details-settings';
import { ProfilDetailsActivity } from './profil-details-active';
import { ProfilDetailsEvaluation } from './profil-details-evaluation';
import { ProfilDetailsDocuments } from './profil-details-documents';

interface ProfilDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profil: any | null;
  onEditClick?: () => void;
}

export function ProfilDetailsSheet({
  open,
  onOpenChange,
  profil,
  onEditClick,
}: ProfilDetailsSheetProps) { 
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [complianceStatus, setComplianceStatus] = useState<any>(null);
  const settingsFormRef = useRef<HTMLFormElement>(null);
  const profilId = profil?.id;

  const { data: profilDetails } = useQuery({
    queryKey: ['profil-details', profilId],
    enabled: open && !!profilId,
    queryFn: async () => {
      const response = await apiFetch(`/api/sections/administration-facturation/tenant/profile`);
      if (!response.ok) throw new Error('Erreur chargement profil');
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: overviewData } = useQuery({
    queryKey: ['profil-overview', profilId],
    enabled: open && !!profilId,
    queryFn: async () => {
      const response = await apiFetch(`/api/sections/gestion-ressources/partenaires/prestataires/${profilId}/overview`);
      if (!response.ok) throw new Error('Erreur chargement vue');
      return response.json();
    },
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    if (open && profilId) {
      fetchComplianceStatus();
    }
  }, [open, profilId]);

  const fetchComplianceStatus = async () => {
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/partenaires/compliance/${profilId}`);
      if (response.ok) {
        const data = await response.json();
        setComplianceStatus(data);
      }
    } catch (error) {
      console.error("Erreur compliance:", error);
    }
  };

  const profilData = profilDetails || profil;
  const isSub = profilData?.type === 'SUBCONTRACTOR';

  useEffect(() => {
    if (!isSub && (activeTab === 'documents' || activeTab === 'billing')) {
      setActiveTab('overview');
    }
  }, [isSub, activeTab]);

  if (!profilData) return null;

  const handleSaveSettings = () => {
    if (settingsFormRef.current) {
      settingsFormRef.current.requestSubmit();
    }
  };

  const statusProps = profilData.status === 'ACTIVE' ? { label: 'Actif', variant: 'success' } : { label: 'Inactif', variant: 'warning' };

  const handleEditClick = () => {
    setActiveTab('settings');
    if (onEditClick) onEditClick();
  };

  const handleSendResetEmail = async () => {
    setIsLoadingEmail(true);
    try {
      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profilData.email }),
      });

      if (!response.ok) throw new Error('Erreur lors de l\'envoi');
      
      toast.success('Lien de réinitialisation envoyé avec succès');
    } catch (error) {
      console.error(error);
      toast.error('Échec de l\'envoi du mail de réinitialisation');
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleRestoreAccount = async () => {
    setIsLoadingRestore(true);
    try {
      const response = await apiFetch(`/api/sections/gestion-ressources/partenaires/prestataires/${profilData.id}/restore`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Erreur lors de la réactivation');
      
      toast.success('Compte prestataire réactivé avec succès');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Échec de la réactivation du compte');
    } finally {
      setIsLoadingRestore(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b py-4 px-6 border-border/70 bg-background shrink-0">
          <SheetTitle className="text-sm font-semibold text-foreground">Détails de la Compagnie</SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
            <div className="flex justify-between flex-wrap gap-2 border-b border-border/60 px-6 py-4 bg-background shrink-0">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-semibold text-foreground tracking-tight leading-none">
                  {profilData.companyName || profilData.name}
                </span>
                <Badge size="sm" variant="info" appearance="light" className="rounded-full text-[11px] font-semibold px-2">
                  Profil Institutionnel
                </Badge>
                <Badge size="sm" variant={statusProps.variant as any} appearance="light" className="rounded-full text-[11px] font-semibold px-2">
                  {statusProps.label}
                </Badge>
                {complianceStatus && (
                  <Badge 
                    size="sm" 
                    variant={
                      complianceStatus.status === 'COMPLIANT' ? 'success' : 
                      complianceStatus.status === 'WARNING' ? 'warning' : 'destructive'
                    } 
                    appearance="light" 
                    className="rounded-full text-[11px] font-semibold px-2 gap-1"
                  >
                    {complianceStatus.status === 'COMPLIANT' ? 'Conforme' : 
                     complianceStatus.status === 'WARNING' ? 'Alerte' : 'Non-Conforme'}
                  </Badge>
                )}
              </div>

              <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                <span>SIRET:</span>
                <span className="font-semibold text-foreground">{profilData.siret || 'N/A'}</span>
                <BadgeDot className="bg-muted-foreground/40 size-1" />
                <span>Métier:</span>
                <span className="font-semibold text-foreground">
                  {isSub ? 'Sécurité Privée' : (profilData.service || '-')}
                </span>
                <BadgeDot className="bg-muted-foreground/40 size-1" />
                <span>Date d'ajout:</span>
                <span className="font-semibold text-foreground">{profilData.createdAt ? formatDateTime(new Date(profilData.createdAt)) : 'N/A'}</span>
              </div>
            </div>
          </div>
          <ScrollArea
            className="flex-1 min-h-0 mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-4 grow">
              <div className="w-full shrink-0 lg:w-[300px] py-5 lg:pe-6 space-y-4">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="w-full h-[210px] bg-background border border-border/60 rounded-xl flex items-center justify-center overflow-hidden relative">
                  {profilData.avatar ? (
                    <img src={profilData.avatar} alt={profilData.name} className="size-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="size-[48px] text-muted-foreground/30" />
                      <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{getInitials(profilData.name)}</span>
                    </div>
                  )}
                </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background divide-y divide-border/60">
                  {[
                    { label: "SIRET", value: profilData.siret },
                    { label: "Email", value: profilData.email || profilData.contactEmail },
                    { label: "Téléphone", value: profilData.phone || profilData.contactPhone },
                    { label: "Ville", value: profilData.city },
                    { label: "Spécialité", value: profilData.specialty || profilData.service }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between px-4 py-3 gap-3">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-medium text-foreground truncate text-right">{item.value || '-'}</span>
                    </div>
                  ))}
                </div>

                {isSub && (
                  <div className="bg-amber-500/5 rounded-xl p-4 space-y-3 border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
                      <ShieldCheck className="size-3.5" />
                      Sécurité Privée
                    </div>
                    <div className="space-y-2 text-[11px] text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Agrément:</span>
                        <span className="font-semibold text-foreground">{profilData.agreementNumber || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Autorisation:</span>
                        <span className="font-semibold text-foreground">{profilData.authorizationNumber || '-'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grow min-w-0 lg:border-s border-border/60 space-y-5 py-5 lg:ps-6">   
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 text-sm text-muted-foreground">
                  <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                    <TabsTrigger value="overview">
                      Vue d'ensemble
                    </TabsTrigger>
                    {isSub && (
                      <TabsTrigger value="billing">
                        Facturation
                      </TabsTrigger>
                    )}
                    {isSub && (
                      <TabsTrigger value="documents">
                        Documents
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="activity">
                      Activité
                    </TabsTrigger>
                    <TabsTrigger value="evaluation">
                      Evaluation
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                      Paramètres
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <ProfilDetailsOverviews
                      profil={profilData}
                    />
                  </TabsContent>
                  {isSub && (
                    <TabsContent value="billing">
                      <ProfilDetailsBilling overview={overviewData} />
                    </TabsContent>
                  )}
                  {isSub && (
                    <TabsContent value="documents">
                      <ProfilDetailsDocuments profil={profilData} />
                    </TabsContent>
                  )}
                  <TabsContent value="activity">
                    <ProfilDetailsActivity
                      profil={profilData}
                    />
                  </TabsContent>
                  <TabsContent value="evaluation">
                    <ProfilDetailsEvaluation profil={profilData} />
                  </TabsContent>
                  <TabsContent value="settings">
                    <ProfilDetailsSettings profil={profilData} formRef={settingsFormRef} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 px-6 py-4 border-border/60 gap-2.5 lg:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          <div className="flex gap-2.5 ml-auto">
            {activeTab === 'settings' ? (
              <Button 
                variant="outline" 
                className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                onClick={handleSaveSettings}
              >
                Enregistrer les modifications
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={handleSendResetEmail} disabled={isLoadingEmail}>
                  {isLoadingEmail ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Envoyer Email
                </Button>
                <Button 
                  variant="outline" 
                  className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
                  onClick={handleEditClick}
                >
                  Modifier les détails
                </Button>
              </>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


