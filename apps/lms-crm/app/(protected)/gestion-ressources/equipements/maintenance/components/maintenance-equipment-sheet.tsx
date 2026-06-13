'use client';

/**
 * Fiche pièce — sous-page Maintenance (copie adaptée du sheet inventaire unité).
 * Volets : Vue d'ensemble | Maintenance | Paramètres (édition).
 */
import { useEffect, useRef, useState } from 'react';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../constants/sheet-shell-classes';
import { GESTION_RESSOURCES_SHEET_TABS_LIST } from '@/lib/gestion-ressources/ui';
import { Equipment as Inventaire, type EquipmentSheetInput } from '@/app/models/equipment';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { getInventaireStatusProps } from '../../inventaire/constants/status';
import { InventaireDetailsOverview } from '../../inventaire/components/inventaire-details-overview';
import { InventaireDetailsSettings } from '../../inventaire/components/inventaire-details-settings';
import { InventaireDetailsMaintenance } from '../../inventaire/components/inventaire-details-maintenance';
import { Settings } from 'lucide-react';
import { EquipmentThumbnail } from '../../inventaire/components/equipment-thumbnail';

export type MaintenanceEquipmentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventaire: EquipmentSheetInput | null;
  defaultTab?: string;
};

export function MaintenanceEquipmentSheet({
  open,
  onOpenChange,
  inventaire: initialInventaire,
  defaultTab = 'overview',
}: MaintenanceEquipmentSheetProps) {
  const [activeTab, setActiveTab] = useState(
    defaultTab === 'settings' ? 'parametres' : defaultTab,
  );
  const [inventaire, setInventaire] = useState<Inventaire | null>(
    initialInventaire as Inventaire | null,
  );
  const settingsFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab === 'settings' ? 'parametres' : defaultTab);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (open && initialInventaire?.id) {
      setInventaire(initialInventaire as Inventaire);
      void fetchEquipment(initialInventaire.id);
    }
  }, [open, initialInventaire?.id]);

  const fetchEquipment = async (id: string) => {
    const response = await apiFetch(
      `/api/sections/gestion-ressources/equipements/inventaire/${id}`,
    );
    if (response.ok) {
      const { data } = await response.json();
      if (data?.metadata?.avatar && !data.avatar) data.avatar = data.metadata.avatar;
      setInventaire(data);
    }
  };

  if (!inventaire) return null;

  const statusProps = getInventaireStatusProps(inventaire.status ?? 'AVAILABLE');
  const showSaveFooter = activeTab === 'parametres';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Fiche pièce — Maintenance
          </SheetTitle>
          <SheetDescription className="sr-only">
            Consultez les interventions et modifiez les paramètres de la pièce.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-5 shrink-0">
            <div className="flex items-center gap-4">
              <EquipmentThumbnail
                avatar={inventaire.avatar}
                metadata={inventaire.metadata}
                label={inventaire.label}
                className="size-20 rounded-lg border border-border shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-bold text-foreground truncate">{inventaire.label}</span>
                  <Badge size="sm" variant={statusProps.variant as 'success'} appearance="light" className="text-[10px]">
                    {statusProps.label}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-1">{inventaire.serialNumber}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-2sm text-muted-foreground">
              <span>Type: <strong className="text-foreground">{inventaire.type || '—'}</strong></span>
              <BadgeDot className="size-1 bg-muted-foreground/40" />
              <span>
                MAJ:{' '}
                <strong className="text-foreground">
                  {inventaire.updatedAt
                    ? formatDateTime(new Date(inventaire.updatedAt))
                    : '—'}
                </strong>
              </span>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 mx-1.5">
            <div className="px-5 py-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={GESTION_RESSOURCES_SHEET_TABS_LIST}>
                  <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                  <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                  <TabsTrigger value="parametres" className="gap-1.5">
                    <Settings className="size-3.5" />
                    Paramètres
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <InventaireDetailsOverview
                    equipment={inventaire}
                    onTabChange={setActiveTab}
                    settingsTab="parametres"
                    quickNavTabs={[
                      { label: 'Interventions →', tab: 'maintenance' },
                      { label: 'Modifier les paramètres →', tab: 'parametres' },
                    ]}
                  />
                </TabsContent>
                <TabsContent value="maintenance">
                  <InventaireDetailsMaintenance equipment={inventaire} />
                </TabsContent>
                <TabsContent value="parametres">
                  <InventaireDetailsSettings
                    inventaire={inventaire}
                    formRef={settingsFormRef}
                    onSuccess={() => fetchEquipment(inventaire.id)}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t p-5 gap-2 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {showSaveFooter && (
            <Button
              className="ml-auto font-bold bg-foreground text-background hover:bg-foreground/90"
              onClick={() => settingsFormRef.current?.requestSubmit()}
            >
              Enregistrer les paramètres
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
