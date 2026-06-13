'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { FileText, Calendar, Info, Download, ShieldCheck } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_LARGE_1000 } from '../../../constants/sheet-shell-classes';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatDateTime } from '@/lib/helpers';

interface DocumentsDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any | null;
}

export function DocumentsDetailsSheet({
  open,
  onOpenChange,
  document,
}: DocumentsDetailsSheetProps) { 
  const [activeTab, setActiveTab] = useState('overview');
  const documentId = document?.id;

  const { data: documentDetails } = useQuery({
    queryKey: ['document-details', documentId],
    enabled: open && !!documentId,
    queryFn: async () => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/documents/${documentId}`);
      if (!response.ok) throw new Error('Erreur chargement document');
      const json = await response.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const docData = documentDetails || document;

  if (!docData) return null;

  const statusVariant = docData.status === 'VALID' ? 'success' : docData.status === 'EXPIRING_SOON' ? 'warning' : 'destructive';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE_1000}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">Détails du document officiel</SheetTitle>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-5 bg-background shrink-0">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                  {docData.type}
                </span>
                <Badge size="sm" variant={statusVariant} appearance="light" className="font-bold uppercase text-[10px] px-2">
                  {docData.status}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">REF</span>
                  <span className="font-bold text-foreground/80">{docData.number || 'N/A'}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">Expire le:</span>
                <span className="font-bold text-foreground/80">{docData.expiryDate ? formatDateTime(new Date(docData.expiryDate)) : 'Permanente'}</span>
              </div>
            </div>
          </div>

          <ScrollArea
            className="flex-1 min-h-0 mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <div className="w-full shrink-0 lg:w-[280px] py-5 lg:pe-5 space-y-4">
                <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                      <FileText className="size-10 text-primary/70" />
                    </div>
                    <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Aperçu indisponible</span>
                  </div>
                  {docData.fileUrl && (
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Button size="sm" variant="primary" className="gap-2" onClick={() => window.open(docData.fileUrl, '_blank')}>
                        <Download className="size-4" /> Voir le document
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Numéro de référence", value: docData.number },
                    { label: "Date d'émission", value: docData.issueDate ? formatDateTime(new Date(docData.issueDate)) : '-' },
                    { label: "Date d'expiration", value: docData.expiryDate ? formatDateTime(new Date(docData.expiryDate)) : 'Permanente' },
                    { label: "Vérifié par", value: docData.verifiedBy || 'Système' }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-2sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold text-foreground truncate max-w-[150px]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">   
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                  <TabsList className="inline-flex w-auto grow-0 mb-2.5">
                    <TabsTrigger value="overview">Informations</TabsTrigger>
                    <TabsTrigger value="history">Historique</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-6">
                    <div className="p-5 rounded-xl border bg-card/50 space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <Info className="size-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Notes & Observations</span>
                      </div>
                      <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                        {docData.notes || 'Aucune note particulière associée à ce document.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl border bg-muted/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Créé le</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{formatDateTime(new Date(docData.createdAt))}</p>
                      </div>
                      <div className="p-4 rounded-xl border bg-muted/5 space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-3.5 text-muted-foreground" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dernière mise à jour</span>
                        </div>
                        <p className="text-sm font-bold text-foreground">{formatDateTime(new Date(docData.updatedAt))}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history">
                    <div className="text-sm text-muted-foreground py-12 text-center border-2 border-dashed rounded-xl">
                      L'historique des modifications sera bientôt disponible.
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fermer</Button>
          <div className="ml-auto flex gap-2.5">
            {docData.fileUrl && (
              <Button variant="outline" className="gap-2" onClick={() => window.open(docData.fileUrl, '_blank')}>
                <Download className="size-4" /> Télécharger
              </Button>
            )}
            <Button 
              variant="outline" 
              className="bg-foreground text-background hover:bg-foreground/90 font-bold border-none" 
            >
              Modifier
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}


