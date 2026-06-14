'use client';

/**
 * Fiche salle — même coque que inventaire-details-sheet (catalogue).
 * Sidebar avatar + onglets à droite.
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
import { VIE_SCOLAIRE_SHEET_AUTO } from '../../../../constants/sheet-shell-classes';
import { GESTION_RESSOURCES_SHEET_TABS_LIST } from '@/lib/gestion-ressources/ui';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { getSalleStatusProps } from '../constants/status';
import { SalleDetailsSidebar } from './details/salle-details-sidebar';
import { SalleDetailsOverview } from './details/salle-details-overview';
import { SalleDetailsSessions } from './details/salle-details-sessions';
import { SalleDetailsSettings } from './details/salle-details-settings';
import { SalleActiveToggle } from './salle-active-toggle';
import type { VenueRoomRow, VenueRoomSheetInput } from '../types';
import { Settings } from 'lucide-react';

export type SalleEquipmentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: VenueRoomSheetInput | null;
  defaultTab?: string;
};

export function SalleEquipmentSheet({
  open,
  onOpenChange,
  room: initialRoom,
  defaultTab = 'overview',
}: SalleEquipmentSheetProps) {
  const [activeTab, setActiveTab] = useState(
    defaultTab === 'settings' ? 'parametres' : defaultTab,
  );
  const [room, setRoom] = useState<VenueRoomRow | null>(initialRoom as VenueRoomRow | null);
  const settingsFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab === 'settings' ? 'parametres' : defaultTab);
    }
  }, [open, defaultTab]);

  useEffect(() => {
    if (open && initialRoom?.id) {
      setRoom(initialRoom as VenueRoomRow);
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
            Fiche salle — Référentiel
          </SheetTitle>
          <SheetDescription className="sr-only">
            Consultez les sessions planifiées et modifiez les paramètres de la salle.
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
          <div className="flex justify-between flex-wrap gap-4 border-b border-border px-5 py-5 bg-background shrink-0">
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[24px] font-bold text-foreground tracking-tight leading-none">
                  {room.name}
                </span>
                <Badge
                  size="sm"
                  variant={statusProps.variant as 'success'}
                  appearance="light"
                  className="font-bold uppercase text-[10px] px-2"
                >
                  {statusProps.label}
                </Badge>
                {room.capacity != null ? (
                  <Badge
                    size="sm"
                    variant="outline"
                    appearance="light"
                    className="font-bold uppercase text-[10px] px-2"
                  >
                    {room.capacity} places
                  </Badge>
                ) : null}
              </div>

              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <div className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md border border-border/50">
                  <span className="font-semibold text-muted-foreground text-[10px] uppercase tracking-wider">
                    Code
                  </span>
                  <span className="font-bold text-foreground/80">{room.shortCode || '—'}</span>
                </div>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">Zone:</span>
                <span className="font-bold text-primary tracking-wide">
                  {room.floorLabel || '—'}
                </span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">Capacité:</span>
                <span className="font-bold text-foreground/80">{room.capacity ?? '—'}</span>
                <BadgeDot className="bg-muted-foreground/30 size-1" />
                <span className="font-normal text-muted-foreground">Dernière mise à jour:</span>
                <span className="font-semibold text-foreground/80">
                  {room.updatedAt && !Number.isNaN(new Date(room.updatedAt).getTime())
                    ? formatDateTime(new Date(room.updatedAt))
                    : '—'}
                </span>
              </div>
            </div>

            <SalleActiveToggle room={room} onUpdated={(item) => setRoom(item)} />
          </div>

          <ScrollArea
            className="flex-1 min-h-0 mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <SalleDetailsSidebar room={room} onTabChange={setActiveTab} />

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto text-sm text-muted-foreground">
                  <TabsList className={GESTION_RESSOURCES_SHEET_TABS_LIST}>
                    <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                    <TabsTrigger value="sessions">Sessions</TabsTrigger>
                    <TabsTrigger value="parametres" className="gap-1.5">
                      <Settings className="size-3.5" />
                      Paramètres
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview">
                    <SalleDetailsOverview
                      room={room}
                      onTabChange={setActiveTab}
                      quickNavTabs={[
                        { label: 'Sessions planifiées →', tab: 'sessions' },
                        { label: 'Modifier les paramètres →', tab: 'parametres' },
                      ]}
                    />
                  </TabsContent>
                  <TabsContent value="sessions">
                    <SalleDetailsSessions room={room} />
                  </TabsContent>
                  <TabsContent value="parametres">
                    <SalleDetailsSettings
                      room={room}
                      formRef={settingsFormRef}
                      onSuccess={() => fetchRoom(room.id)}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row border-t pb-4 p-5 border-border gap-2.5 lg:gap-0 bg-background shrink-0">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {showSaveFooter ? (
            <Button
              variant="outline"
              className="ml-auto font-bold bg-foreground text-background hover:bg-foreground/90 border-none"
              onClick={() => settingsFormRef.current?.requestSubmit()}
            >
              Enregistrer la salle
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
