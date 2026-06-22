'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_SESSION } from '../../../constants/sheet-shell-classes';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Pencil, Users } from 'lucide-react';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { Upload } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/upload';
import { FormationSessionOverviewMetrics } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-overview-metrics';
import { FormationSessionVitrineOverviewCards } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-vitrine-overview-cards';
import {
  EXAMEN_FINAL_BADGE_LABEL,
  formationParcoursHasExamenFinal,
} from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';
import { FormationSessionSidebarSessionMeta } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-sidebar-session-meta';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';
import { FormationSessionPlanningTimeline } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-planning-timeline';
import { FormationSessionVenueRoomSummary } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-venue-room-summary';
import { FormationSessionTrainerSummary } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-trainer-summary';
import { FormationSessionDetailEquipmentGrid } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-detail-equipment-grid';
import { FormationSessionDetailParticipantsGrid } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-detail-participants-grid';
import { cn } from '@/lib/utils';

export interface FormationSessionSheetCustomerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: FormationSessionApiRow | null;
  onEditClick?: () => void;
  /** Après mise à jour session côté API (ex. retrait équipement), garde le sheet à jour. */
  onSessionRefreshed?: (session: FormationSessionApiRow) => void;
}

export function FormationSessionSheetCustomer({
  open,
  onOpenChange,
  session,
  onEditClick,
  onSessionRefreshed,
}: FormationSessionSheetCustomerProps) {
  const row = session;

  const title =
    row && typeof row.formationName === 'string' && row.formationName.trim()
      ? row.formationName
      : 'Session formation';

  const durationLabel = row?.formationDuration ?? '—';
  const voletLabel = row ? FORMATION_TRACK_LABELS[row.formationTrack] : '—';
  const typeLabel = row?.formationTag ?? '—';
  const parcoursPedago =
    row && row.formationParcours ? FORMATION_PARCOURS_LABELS[row.formationParcours] : '—';

  const overviewMetrics = row
    ? {
        durationDisplay: durationLabel,
        enrolledCount: row.participants.length,
        capacityHint:
          row.traineesMin != null && row.traineesMax != null
            ? `Capacité session ${row.traineesMin}–${row.traineesMax}`
            : null,
        roomName: row.venueRoom?.name ?? null,
        trainer:
          row.trainerName || row.trainerEmail
            ? {
                name: row.trainerName,
                email: row.trainerEmail ?? '',
                avatar: row.trainerAvatar,
              }
            : null,
      }
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_SESSION}>
        <SheetHeader className="shrink-0 border-b border-border px-5 py-3">
          <SheetTitle className="font-medium">Session formation</SheetTitle>
        </SheetHeader>

        <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
          {!row ? (
            <div className="p-5 text-sm text-muted-foreground">Aucune session sélectionnée.</div>
          ) : (
            <>
              <div className="shrink-0 space-y-2 border-b border-border px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold leading-tight text-foreground sm:text-lg lg:text-[20px]">
                    {title}
                  </span>
                  {formationParcoursHasExamenFinal(row.formationParcours) ? (
                    <Badge size="sm" variant="outline" appearance="light">
                      {EXAMEN_FINAL_BADGE_LABEL}
                    </Badge>
                  ) : null}
                  <Badge size="sm" variant="secondary" appearance="light">
                    Catalogue actif
                  </Badge>
                  {row.participants.length > 0 ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/20 px-1.5 py-0.5 text-[11px] text-muted-foreground">
                      <span className="flex -space-x-1">
                        {row.participants.slice(0, 3).map((p) => (
                          <SessionUserAvatar
                            key={p.userId}
                            name={p.name}
                            email={p.email}
                            avatar={p.avatar}
                            sizeClassName="size-5 ring-2 ring-background"
                          />
                        ))}
                      </span>
                      <span className="font-medium tabular-nums text-foreground">{row.participants.length}</span>
                    </span>
                  ) : null}
                  {row.traineesMin != null && row.traineesMax != null ? (
                    <Badge size="sm" variant="secondary" appearance="light">
                      Eff. {row.traineesMin}–{row.traineesMax}
                    </Badge>
                  ) : null}
                </div>

                <div className="text-2sm flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="font-normal text-muted-foreground">Filière</span>
                  <span className="font-medium text-foreground">{voletLabel}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Type</span>
                  <span className="font-medium text-foreground">{typeLabel}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Durée</span>
                  <span className="font-medium text-foreground">{durationLabel}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Parcours pédago.</span>
                  <span className="font-medium text-foreground">{parcoursPedago}</span>
                </div>

                <div className="text-2sm flex flex-wrap items-center gap-x-1.5 gap-y-1">
                  <span className="font-normal text-muted-foreground">Période vitrine</span>
                  <span className="font-medium text-foreground">{row.dateDisplayLabel?.trim() || '—'}</span>
                  <BadgeDot className="size-1 bg-muted-foreground" />
                  <span className="font-normal text-muted-foreground">Lieu</span>
                  <span className="min-w-0 font-medium text-foreground">{row.location?.trim() || '—'}</span>
                </div>

                <p className="text-[11px] leading-none text-muted-foreground">
                  Slug{' '}
                  <span className="font-mono font-medium text-foreground">{row.formationSlug}</span>
                </p>
              </div>

              <ScrollArea className="min-h-0 flex-1" viewportClassName="[&>div]:!block">
                <div className="flex flex-wrap px-3.5 lg:flex-nowrap">
                  <div className="w-full shrink-0 space-y-3 py-4 lg:w-[260px] lg:pe-4">
                    <Upload
                      allowDemoLogoFallback={false}
                      logoUrl={row.formationVitrineOverview.logoUrl}
                      companyName={row.formationProviderName}
                      email={row.formationProviderEmail}
                      phone={row.formationProviderPhone}
                      address={row.formationProviderAddress}
                      sessionLabel={
                        row.dateDisplayLabel?.trim() || row.formationNextSessionLabel || null
                      }
                    />
                    <FormationSessionSidebarSessionMeta row={row} />
                  </div>
                  <div className="grow space-y-4 border-border py-4 pb-6 lg:border-s lg:ps-4">
                    <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                      <TabsList className="mb-2 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                        <TabsTrigger value="planning">Planning</TabsTrigger>
                        <TabsTrigger value="means">Moyens</TabsTrigger>
                        <TabsTrigger value="students">Stagiaires</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="space-y-5">
                          {overviewMetrics ? (
                            <FormationSessionOverviewMetrics {...overviewMetrics} />
                          ) : null}
                          <FormationSessionVitrineOverviewCards overview={row.formationVitrineOverview} />
                        </div>
                      </TabsContent>

                      <TabsContent value="planning" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="space-y-4">
                          <Separator />
                          <FormationSessionPlanningTimeline row={row} />
                        </div>
                      </TabsContent>

                      <TabsContent value="means" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="space-y-4">
                          <Separator />
                          <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 lg:items-stretch">
                            <FormationSessionTrainerSummary
                              layout="moyens"
                              trainerName={row.trainerName}
                              trainerEmail={row.trainerEmail}
                              trainerAvatar={row.trainerAvatar}
                            />
                            <div className="rounded-xl border border-border bg-muted/15 p-4 sm:min-h-[220px] sm:p-5">
                              <FormationSessionVenueRoomSummary
                                layout="moyens"
                                roomName={row.venueRoom?.name ?? null}
                                imageUrl={row.venueRoom?.imageUrl ?? null}
                              />
                              {!row.venueRoom?.name?.trim() ? (
                                <p className="mt-3 max-w-sm text-xs leading-relaxed text-muted-foreground">
                                  Renseignez une salle dans{' '}
                                  <span className="font-medium text-foreground">Modifier</span> → onglet Moyens.
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Package className="size-4 text-muted-foreground" aria-hidden />
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Équipements réservés
                              </p>
                            </div>
                            <FormationSessionDetailEquipmentGrid
                              sessionId={row.id}
                              reservedEquipmentIds={row.reservedEquipmentIds}
                              equipment={row.reservedEquipment}
                              onSessionRefreshed={onSessionRefreshed}
                            />
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="students" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          <Users className="size-4 shrink-0" aria-hidden />
                          Élèves inscrits ({row.participants.length})
                        </div>
                        <FormationSessionDetailParticipantsGrid participants={row.participants} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetBody>

        <SheetFooter
          className={cn(
            'shrink-0 border-t border-border bg-background px-5 py-3',
            row && onEditClick ? 'flex flex-row flex-wrap items-center justify-between gap-2' : 'flex justify-end gap-2',
          )}
        >
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          {row && onEditClick ? (
            <Button type="button" variant="primary" className="gap-2" onClick={onEditClick}>
              <Pencil className="size-4" />
              Modifier
            </Button>
          ) : null}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
