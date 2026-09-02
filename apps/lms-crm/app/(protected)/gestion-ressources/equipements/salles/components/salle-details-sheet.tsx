'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge, BadgeDot } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { ScrollArea } from '@repo/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../constants/sheet-shell-classes';
import { GESTION_RESSOURCES_SHEET_TABS_LIST } from '@/lib/gestion-ressources/ui';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { getSalleStatusProps } from '../constants/status';
import { SalleDetailsOverview } from './salle-details-overview';
import { SalleDetailsSessions } from './salle-details-sessions';
import { SalleDetailsSettings } from './salle-details-settings';
import type { VenueRoomRow } from '../types';
import { Settings, Theater, Package } from 'lucide-react';
import { SalleDetailsFixedInventory } from '../page/components/details/salle-details-fixed-inventory';

export type SalleDetailsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: VenueRoomRow | null;
  defaultTab?: string;
};

export function SalleDetailsSheet({
  open,
  onOpenChange,
  room: initialRoom,
  defaultTab = 'overview',
}: SalleDetailsSheetProps) {
  const [activeTab, setActiveTab] = useState(
    defaultTab === 'settings' ? 'parametres' : defaultTab,
  );
  const [room, setRoom] = useState<VenueRoomRow | null>(initialRoom);
  const settingsFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab === 'settings' ? 'parametres' : defaultTab);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (open && initialRoom?.id) {
      setRoom(initialRoom);
      void fetchRoom(initialRoom.id);
    }
  }, [open, initialRoom?.id]);

  const fetchRoom = async (id: string) => {
    const response = await apiFetch(
      `/api/sections/gestion-ressources/equipements/salles/${id}`,
    );
    if (response.ok) {
      const { data } = await response.json();
      if (data?.item) setRoom(data.item as VenueRoomRow);
    }
  };

  if (!room) return null;

  const statusProps = getSalleStatusProps(room.status);
  const showSaveFooter = activeTab === 'parametres';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_AUTO}>
        <SheetHeader className="border-b py-3.5 px-5 border-border bg-background shrink-0">
          <SheetTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
            Fiche salle
          </SheetTitle>
          <SheetDescription className="sr-only">
            Consultez les sessions et modifiez les paramètres de la salle.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          <div className="flex flex-col gap-3 border-b border-border px-5 py-5 shrink-0">
            <div className="flex items-center gap-4">
              <div className="size-20 rounded-lg border border-border bg-primary/5 flex items-center justify-center shrink-0">
                <Theater className="size-9 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xl font-bold text-foreground truncate">{room.name}</span>
                  <Badge
                    size="sm"
                    variant={statusProps.variant as 'success'}
                    appearance="light"
                    className="text-[10px]"
                  >
                    {statusProps.label}
                  </Badge>
                </div>
                {room.shortCode ? (
                  <p className="text-xs font-mono text-muted-foreground mt-1">{room.shortCode}</p>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-2sm text-muted-foreground">
              <span>
                Capacité :{' '}
                <strong className="text-foreground">{room.capacity ?? '—'}</strong>
              </span>
              <BadgeDot className="size-1 bg-muted-foreground/40" />
              <span>
                Zone : <strong className="text-foreground">{room.floorLabel || '—'}</strong>
              </span>
              {room.updatedAt ? (
                <>
                  <BadgeDot className="size-1 bg-muted-foreground/40" />
                  <span>
                    MAJ :{' '}
                    <strong className="text-foreground">
                      {formatDateTime(new Date(room.updatedAt))}
                    </strong>
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 mx-1.5">
            <div className="px-5 py-5">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className={GESTION_RESSOURCES_SHEET_TABS_LIST}>
                  <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                  <TabsTrigger value="sessions">Sessions</TabsTrigger>
                  <TabsTrigger value="inventaire-fixe" className="gap-1.5">
                    <Package className="size-3.5" />
                    Inventaire fixe
                  </TabsTrigger>
                  <TabsTrigger value="parametres" className="gap-1.5">
                    <Settings className="size-3.5" />
                    Paramètres
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <SalleDetailsOverview room={room} onTabChange={setActiveTab} />
                </TabsContent>
                <TabsContent value="sessions">
                  <SalleDetailsSessions roomId={room.id} />
                </TabsContent>
                <TabsContent value="inventaire-fixe">
                  <SalleDetailsFixedInventory roomId={room.id} roomCapacity={room.capacity} />
                </TabsContent>
                <TabsContent value="parametres">
                  <SalleDetailsSettings
                    room={room}
                    formRef={settingsFormRef}
                    onSuccess={() => fetchRoom(room.id)}
                    onOpenFixedInventory={() => setActiveTab('inventaire-fixe')}
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
