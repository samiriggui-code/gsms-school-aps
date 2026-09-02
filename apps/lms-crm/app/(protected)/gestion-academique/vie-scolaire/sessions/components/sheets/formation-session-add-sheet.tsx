'use client';

import { Badge, BadgeDot } from '@repo/ui/badge';
import { Separator } from '@repo/ui/separator';
import { LoaderCircleIcon, UserPlus } from 'lucide-react';
import { Button } from '@repo/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@repo/ui/form';
import { Input } from '@repo/ui/input';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { VIE_SCOLAIRE_SHEET_SESSION } from '../../../constants/sheet-shell-classes';
import { FORMATION_TRACK_LABELS } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { LoyaltyTier } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/loyalty-tier';
import { RecentOrders } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/resent-order';
import { Upload } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/upload';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import { FormationSessionEquipmentPickGrid } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-equipment-pick-grid';
import { SessionEquipmentDispatchGuide } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-equipment-dispatch-guide';
import { FormationSessionParticipantPickGrid } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-participant-pick-grid';
import { FormationSessionOverviewMetrics } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/formation-session-overview-metrics';
import {
  EMPTY_EQUIPMENT_INVENTORY,
  useFormationSessionAddSheet,
  type FormationSessionAddSheetValues,
} from './use-formation-session-add-sheet';

export type { FormationSessionAddSheetValues };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: FormationSessionApiRow | null;
};

export default function FormationSessionAddSheet({ open, onOpenChange, draft }: Props) {
  const {
    form,
    editingId,
    activeTab,
    setActiveTab,
    participantIds,
    equipmentIds,
    examEquipmentIds,
    formationId,
    catalogQuery,
    elevesQuery,
    formateursQuery,
    equipmentQuery,
    venueRoomsQuery,
    sessionsForEquipmentQuery,
    catalogActive,
    selectedFormation,
    sessionAddOverviewModel,
    venueRoomPickMeta,
    selectedVenueRoomConflicts,
    equipmentSessionRange,
    venueRoomWatch,
    examVenueRoomWatch,
    examLocalWatch,
    onEquipmentPickToggle,
    onExamEquipmentToggle,
    onParticipantToggle,
    busy,
    sheetTitle,
    voletLabel,
    typeLabel,
    durationLabel,
    sessionOverviewMetrics,
    parcoursPedago,
    catalogueStatusLabel,
    dispatchSessionKind,
    traineesMaxParsed,
    selectedEquipmentIdsForDispatch,
    handleSubmitForm,
  } = useFormationSessionAddSheet({ open, onOpenChange, draft });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_SESSION}>
        <SheetHeader className="shrink-0 border-b border-border px-5 py-3.5">
          <SheetTitle className="font-medium">
            {editingId ? 'Modifier la session' : 'Programmer une session'}
          </SheetTitle>
          <p className="mt-1 max-w-[68ch] text-xs leading-relaxed text-muted-foreground">
            Planning vitrine (libellé, lieu, dates), puis{' '}
            <span className="font-medium text-foreground">clôture inscriptions</span>,{' '}
            <span className="font-medium text-foreground">examen</span>,{' '}
            <span className="font-medium text-foreground">effectif session min–max</span>,{' '}
            <span className="font-medium text-foreground">formateur</span> et{' '}
            <span className="font-medium text-foreground">équipements</span> (inventaire).
          </p>
        </SheetHeader>

        <Form {...form}>
          <form
            id="formation-session-add"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
            onSubmit={handleSubmitForm}
          >
            <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
              <div className="shrink-0 border-b border-border px-5 py-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg font-semibold leading-none text-foreground lg:text-[22px]">
                      {sheetTitle}
                    </span>
                    {!editingId ? (
                      <Badge size="sm" variant="warning" appearance="light">
                        Configuration
                      </Badge>
                    ) : (
                      <Badge size="sm" variant="secondary" appearance="light">
                        Mise à jour
                      </Badge>
                    )}
                    {selectedFormation?.status === 'ACTIVE' ? (
                      <Badge size="sm" variant="success" appearance="light">
                        Catalogue actif
                      </Badge>
                    ) : selectedFormation ? (
                      <Badge size="sm" variant="secondary" appearance="light">
                        {catalogueStatusLabel}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="text-2sm flex flex-wrap items-center gap-2">
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
                </div>
              </div>

              <ScrollArea
                className="mx-1.5 min-h-0 flex-1"
                viewportClassName="[&>div]:h-full [&>div>div]:h-full"
              >
                <div className="flex grow flex-wrap px-3.5 lg:flex-nowrap">
                  <div className="w-full shrink-0 space-y-4 py-5 lg:w-[230px] lg:pe-5">
                    <Upload
                      allowDemoLogoFallback={false}
                      logoUrl={selectedFormation?.logoUrl ?? undefined}
                      companyName={selectedFormation?.providerName ?? undefined}
                      email={selectedFormation?.providerEmail ?? undefined}
                      phone={selectedFormation?.providerPhone ?? undefined}
                      address={selectedFormation?.providerAddress ?? undefined}
                      sessionLabel={selectedFormation?.nextSessionLabel ?? undefined}
                    />
                    <Separator className="opacity-40" />
                    <FormField
                      control={form.control}
                      name="formationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Formation catalogue</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            disabled={
                              Boolean(editingId) ||
                              catalogQuery.isLoading ||
                              catalogActive.length === 0
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    catalogQuery.isLoading
                                      ? 'Chargement…'
                                      : 'Choisir une formation publiée…'
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-[min(320px,70vh)]">
                              {catalogActive.map((item) => (
                                <SelectItem
                                  key={item.id}
                                  value={item.formationId}
                                  textValue={`${item.name} ${FORMATION_TRACK_LABELS[item.track]}`}
                                >
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-muted-foreground">
                                    {' '}
                                    · {FORMATION_TRACK_LABELS[item.track]}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {!catalogQuery.isLoading && catalogActive.length === 0 ? (
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              Aucune formation active dans le catalogue. Publiez une offre ou
                              réactivez-en une depuis « Formations ».
                            </p>
                          ) : null}
                          {editingId ? (
                            <p className="text-[11px] text-muted-foreground">
                              La formation liée ne peut pas être changée après création.
                            </p>
                          ) : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-[11px] leading-snug text-muted-foreground">
                      Même principe que l&apos;ajout au catalogue : colonne média + rattachement à
                      une ligne catalogue existante et active.
                    </p>
                  </div>

                  <div className="grow space-y-5 border-border py-5 lg:border-s lg:ps-5">
                    <Tabs
                      value={activeTab}
                      onValueChange={setActiveTab}
                      className="w-auto text-sm text-muted-foreground"
                    >
                      <TabsList className="mb-2.5 inline-flex w-auto grow-0 flex-wrap gap-1">
                        <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
                        <TabsTrigger value="session" disabled={!formationId?.trim() && !editingId}>
                          Session
                        </TabsTrigger>
                        <TabsTrigger value="moyens" disabled={!formationId?.trim() && !editingId}>
                          Moyens
                        </TabsTrigger>
                        <TabsTrigger value="eleves" disabled={!formationId?.trim() && !editingId}>
                          Stagiaires
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent
                        value="overview"
                        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                      >
                        {!formationId?.trim() && !editingId ? (
                          <p className="rounded-lg border border-dashed px-3 py-12 text-center text-sm text-muted-foreground">
                            Sélectionnez une formation catalogue dans la colonne de gauche pour
                            afficher les blocs vitrine et planifier cette session.
                          </p>
                        ) : (
                          <div className="space-y-5">
                            <FormationSessionOverviewMetrics {...sessionOverviewMetrics} />
                            <div className="grid items-stretch gap-5 lg:grid-cols-2">
                              <RecentOrders presentation={sessionAddOverviewModel.presentation} />
                              <LoyaltyTier loyalty={sessionAddOverviewModel.loyalty} />
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent
                        value="session"
                        className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0"
                      >
                        <FormField
                          control={form.control}
                          name="dateDisplayLabel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Libellé dates (vitrine)</FormLabel>
                              <FormControl>
                                <Input placeholder="ex. 04 Mai – 12 Juin 2026" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Lieu</FormLabel>
                              <FormControl>
                                <Input placeholder="Adresse ou salle" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="startLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Début session</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="endLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fin session</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="registrationClosesLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Clôture des inscriptions</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <p className="text-[11px] text-muted-foreground">
                                  À partir de cette date/heure : plus de nouvelle inscription sur
                                  cette session.
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="examLocal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date / heure examen</FormLabel>
                                <FormControl>
                                  <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name="examVenueRoomId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salle d&apos;examen (PCS / plateau / ronde)</FormLabel>
                              <Select
                                value={field.value?.trim() ? field.value : '__none__'}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="PCS Orion, Plateau Phoenix…" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[min(320px,70vh)]">
                                  <SelectItem value="__none__">— Non renseignée —</SelectItem>
                                  {(venueRoomsQuery.data ?? []).map((room) => (
                                    <SelectItem key={room.id} value={room.id}>
                                      <span className="font-medium">{room.name}</span>
                                      {room.shortCode ? (
                                        <span className="text-muted-foreground">
                                          {' '}
                                          · {room.shortCode}
                                        </span>
                                      ) : null}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-[11px] text-muted-foreground">
                                Orion = PCS · Phoenix = plateau incendie SSIAP · Atlas = parcours
                                ronde. Le matériel fixe (VSS, SSI, radio…) est géré dans
                                l&apos;inventaire salle.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="traineesMin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Effectif min. (session)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    placeholder="ex. 6"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="traineesMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Effectif max. (session)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min={1}
                                    step={1}
                                    placeholder="ex. 12"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent
                        value="moyens"
                        className="mt-0 space-y-4 focus-visible:outline-none focus-visible:ring-0"
                      >
                        <FormField
                          control={form.control}
                          name="trainerUserId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Formateur référent</FormLabel>
                              <Select
                                value={field.value?.trim() ? field.value : '__none__'}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choisir un formateur…" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[min(320px,70vh)]">
                                  <SelectItem value="__none__">— Non renseigné —</SelectItem>
                                  {(formateursQuery.data ?? []).map((f) => (
                                    <SelectItem key={f.id} value={f.id}>
                                      <span className="font-medium">{f.name ?? f.email}</span>
                                      <span className="text-muted-foreground">
                                        {f.name ? ` · ${f.email}` : ''}
                                      </span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {!formateursQuery.isLoading &&
                              (formateursQuery.data ?? []).length === 0 ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Aucun compte actif avec le rôle « formateur ». Créez-en un depuis
                                  les ressources humaines.
                                </p>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="venueRoomId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salle</FormLabel>
                              <Select
                                value={field.value?.trim() ? field.value : '__none__'}
                                onValueChange={(v) => field.onChange(v === '__none__' ? '' : v)}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choisir une salle…" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="max-h-[min(320px,70vh)]">
                                  <SelectItem value="__none__">— Aucune salle —</SelectItem>
                                  {(venueRoomsQuery.data ?? []).map((room) => {
                                    const pick = venueRoomPickMeta.get(room.id);
                                    const occupied = pick?.occupied ?? false;
                                    const disabled = occupied && field.value?.trim() !== room.id;
                                    return (
                                      <SelectItem key={room.id} value={room.id} disabled={disabled}>
                                        <span className="font-medium">{room.name}</span>
                                        {disabled ? (
                                          <span className="text-muted-foreground">
                                            {' '}
                                            · occupée ({pick?.conflictLabel ?? '…'})
                                          </span>
                                        ) : null}
                                      </SelectItem>
                                    );
                                  })}
                                </SelectContent>
                              </Select>
                              {equipmentSessionRange.start == null ||
                              equipmentSessionRange.end == null ? (
                                <FormDescription>
                                  Renseignez début et fin de session pour afficher les salles déjà
                                  réservées sur la période.
                                </FormDescription>
                              ) : null}
                              {selectedVenueRoomConflicts.length > 0 ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Conflit : cette salle est déjà retenue pour{' '}
                                  {selectedVenueRoomConflicts.map((c, i) => (
                                    <span key={c.sessionId}>
                                      {i > 0 ? ' ; ' : null}« {c.formationName} » (
                                      {c.dateDisplayLabel})
                                    </span>
                                  ))}
                                  . Choisissez une autre salle ou modifiez les dates.
                                </p>
                              ) : null}
                              {!venueRoomsQuery.isLoading &&
                              (venueRoomsQuery.data ?? []).length === 0 ? (
                                <p className="text-xs text-amber-700 dark:text-amber-400">
                                  Aucune salle en base. À la racine du dépôt :{' '}
                                  <code className="font-mono">pnpm db:push</code> puis{' '}
                                  <code className="font-mono">pnpm db:seed</code> (réf.{' '}
                                  <code className="font-mono">packages/database/prisma</code>
                                  ), puis rechargez la page.
                                </p>
                              ) : null}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <SessionEquipmentDispatchGuide
                          formationId={formationId}
                          venueRoomId={venueRoomWatch?.trim() || null}
                          examVenueRoomId={examVenueRoomWatch?.trim() || null}
                          hasExamDate={Boolean(examLocalWatch?.trim())}
                          traineesMax={traineesMaxParsed}
                          sessionKind={dispatchSessionKind}
                          startAt={equipmentSessionRange.start}
                          endAt={equipmentSessionRange.end}
                          selectedEquipmentIds={selectedEquipmentIdsForDispatch}
                        />
                        <div>
                          <p className="mb-1 text-sm font-medium text-foreground">
                            Équipements mobiles réservés
                          </p>
                          <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                            Matériel emprunté pour la durée de la session (débit au début, retour en
                            stock à la fin). Le mobilier fixe de la salle sélectionnée n&apos;apparaît
                            pas ici.
                          </p>
                          <FormationSessionEquipmentPickGrid
                            inventory={equipmentQuery.data ?? EMPTY_EQUIPMENT_INVENTORY}
                            sessions={sessionsForEquipmentQuery.data ?? []}
                            selectedIds={equipmentIds}
                            onToggle={onEquipmentPickToggle}
                            rangeStart={equipmentSessionRange.start}
                            rangeEnd={equipmentSessionRange.end}
                            excludeSessionId={editingId}
                            isLoadingInventory={equipmentQuery.isLoading}
                            isLoadingSessions={sessionsForEquipmentQuery.isLoading}
                          />
                        </div>
                        {examLocalWatch?.trim() ? (
                          <div>
                            <p className="mb-1 text-sm font-medium text-foreground">
                              Matériel mobile réservé pour l&apos;examen
                            </p>
                            <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                              Magnétomètre, fumigènes, gants palpation… (hors install fixe PCS /
                              plateau).
                            </p>
                            <FormationSessionEquipmentPickGrid
                              inventory={equipmentQuery.data ?? EMPTY_EQUIPMENT_INVENTORY}
                              sessions={sessionsForEquipmentQuery.data ?? []}
                              selectedIds={examEquipmentIds}
                              onToggle={onExamEquipmentToggle}
                              rangeStart={equipmentSessionRange.start}
                              rangeEnd={equipmentSessionRange.end}
                              excludeSessionId={editingId}
                              isLoadingInventory={equipmentQuery.isLoading}
                              isLoadingSessions={sessionsForEquipmentQuery.isLoading}
                            />
                          </div>
                        ) : null}
                      </TabsContent>

                      <TabsContent
                        value="eleves"
                        className="mt-0 focus-visible:outline-none focus-visible:ring-0"
                      >
                        <div className="mb-4 space-y-2 rounded-lg border border-dashed border-border bg-muted/25 p-3 text-xs leading-relaxed text-muted-foreground">
                          <p>
                            Seuls les apprenants dont le{' '}
                            <span className="font-medium text-foreground">
                              dossier est validé par l&apos;administration
                            </span>{' '}
                            (statut « Dossier validé ») pour{' '}
                            <span className="font-medium text-foreground">cette formation</span>{' '}
                            apparaissent ici.
                          </p>
                          <p>
                            Validez le dossier depuis la fiche candidat (conformité + pièces CNAPS),
                            puis revenez inscrire le stagiaire sur la session.
                          </p>
                        </div>
                        {!formationId?.trim() ? (
                          <p className="text-sm text-muted-foreground">
                            Choisissez d&apos;abord une formation catalogue.
                          </p>
                        ) : (
                          <FormationSessionParticipantPickGrid
                            learners={elevesQuery.data ?? []}
                            selectedIds={participantIds}
                            onToggle={onParticipantToggle}
                            isLoading={elevesQuery.isLoading}
                            emptyMessage="Aucun dossier validé pour cette formation. Validez un dossier candidat avant inscription."
                          />
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>
              </ScrollArea>
            </SheetBody>

            <SheetFooter className="flex shrink-0 flex-row justify-end gap-2.5 border-t border-border bg-background p-5 pb-[max(1rem,env(safe-area-inset-bottom))] lg:gap-0">
              <Button
                type="button"
                variant="mono"
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" variant="primary" disabled={busy} className="gap-2">
                {busy ? (
                  <LoaderCircleIcon className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                {editingId ? 'Enregistrer la session' : 'Créer la session'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
