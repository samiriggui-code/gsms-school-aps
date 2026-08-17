'use client';

import { useEffect, useState } from 'react';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { FormationSheetTabsList } from '@/components/formation-sheet-tabs';
import { useFormationSheetLabels } from '@/hooks/useFormationSheetLabels';
import { useTranslation } from '@/hooks/useTranslation';
import {
  FORMATION_TRACK_LABELS,
  type FormationVitrineTrack,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { CustomerDetailsOrders } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/customer-details-orders';
import { CustomerDetailsInvoice } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/customer-details-invoice';
import { CustomerDetailsBilling } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/customer-details-billing';
import { CustomerDetailsActivity } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/customer-details-active';
import { CustomerDetailsOverviews } from './customers/customer-details-overviews';
import { CustomerDetailsReviews } from './customers/customer-details-reviews';
import { Upload } from './customers/components/upload';
import { FormationCatalogSheetFooter } from '@/components/formation-catalog-sheet-footer';

type CatalogFormationHeader = {
  name: string;
  track: string;
  tag: string;
  duration: string;
  nextSessionLabel?: string | null;
};

type CatalogFormationStats = {
  hoursDisplay: string;
  traineesDisplay: string;
  priceAmountText: string;
  priceFormatted: string;
  successDisplay: string;
  currency: string;
};

type CatalogPayload = {
  formation?: CatalogFormationHeader | null;
  stats?: CatalogFormationStats | null;
  sheet?: FormationSheetViewModel | null;
  catalogInactive?: boolean;
  requiresQuote?: boolean;
};

export function CustomerDetailsSheet({
  open,
  onOpenChange,
  formationName = 'Formation',
  catalogSlug = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formationName?: string;
  catalogSlug?: string | null;
}) {
  const labels = useFormationSheetLabels();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<CatalogPayload | null>(null);

  useEffect(() => {
    if (!open || !catalogSlug?.trim()) {
      setPayload(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetch(`/api/catalog/formation?slug=${encodeURIComponent(catalogSlug.trim())}`, {
      cache: 'no-store',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: CatalogPayload) => {
        if (!cancelled) setPayload(json ?? null);
      })
      .catch(() => {
        if (!cancelled) setPayload(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, catalogSlug]);

  const header = payload?.formation;
  const sheetModel = payload?.sheet ?? null;
  const stats = payload?.stats ?? null;

  const displayName = header?.name ?? formationName;
  const trackLabel =
    header?.track && header.track in FORMATION_TRACK_LABELS
      ? FORMATION_TRACK_LABELS[header.track as FormationVitrineTrack]
      : header?.track ?? '—';
  const typeLabel = header?.tag?.trim() || '—';
  const durationLabel = header?.duration?.trim() || '—';
  const nextSession = header?.nextSessionLabel?.trim();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="font-medium">{labels.detailsTitle(displayName)}</SheetTitle>
          <SheetDescription className="sr-only">
            {labels.detailsDescription(displayName)}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[22px] font-semibold text-foreground leading-none">
                  {displayName}
                </span>
                <Badge size="sm" variant="success" appearance="light">
                  {labels.active}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <span className="font-normal text-muted-foreground">{labels.parcours}</span>
                <span className="font-medium text-foreground">{trackLabel}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.type}</span>
                <span className="font-medium text-foreground">{typeLabel}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.duration}</span>
                <span className="font-medium text-foreground">{durationLabel}</span>
                {nextSession ? (
                  <>
                    <BadgeDot className="bg-muted-foreground size-1" />
                    <span className="font-normal text-muted-foreground">Prochaine session</span>
                    <span className="font-medium text-foreground">{nextSession}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <ScrollArea
            className="flex flex-col h-[calc(100dvh-13.8rem)] sm:h-[calc(100dvh-15.8rem)] mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            {loading ? (
              <div className="flex justify-center py-20 text-muted-foreground">
                <Loader2 className="size-8 animate-spin" />
              </div>
            ) : (
              <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
                <div className="w-full shrink-0 lg:w-[230px] py-5 lg:pe-5 space-y-4">
                  <Upload
                    logoSrc={sheetModel?.loyalty?.logoUrl ?? undefined}
                    logoAlt={`${displayName} logo`}
                    sessionLabel={nextSession ?? undefined}
                  />
                </div>

                <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                  <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                    <FormationSheetTabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap gap-y-1 max-w-full" />
                    <TabsContent value="overview">
                      <CustomerDetailsOverviews
                        catalogSlug={catalogSlug}
                        preloadedStats={stats}
                        presentation={sheetModel?.presentation}
                        loyalty={sheetModel?.loyalty}
                      />
                    </TabsContent>
                    <TabsContent value="program">
                      {sheetModel ? (
                        <CustomerDetailsOrders sheetModel={sheetModel} />
                      ) : (
                        <p className="text-sm text-muted-foreground py-6">
                          {t('landing.sheets.unavailable', { defaultValue: 'Contenu indisponible.' })}
                        </p>
                      )}
                    </TabsContent>
                    <TabsContent value="prerequisites">
                      {sheetModel ? (
                        <CustomerDetailsInvoice sheetModel={sheetModel} />
                      ) : (
                        <p className="text-sm text-muted-foreground py-6">Contenu indisponible.</p>
                      )}
                    </TabsContent>
                    <TabsContent value="financing">
                      {sheetModel ? (
                        <CustomerDetailsBilling sheetModel={sheetModel} />
                      ) : (
                        <p className="text-sm text-muted-foreground py-6">Contenu indisponible.</p>
                      )}
                    </TabsContent>
                    <TabsContent value="sessions">
                      <CustomerDetailsReviews
                        catalogSlug={catalogSlug}
                        formationSubtitle={displayName}
                      />
                    </TabsContent>
                    <TabsContent value="certification">
                      {sheetModel ? (
                        <CustomerDetailsActivity certificationSteps={sheetModel.certificationSteps} />
                      ) : (
                        <p className="text-sm text-muted-foreground py-6">Contenu indisponible.</p>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row flex-wrap border-t pb-4 p-4 sm:p-5 border-border gap-2.5 justify-end">
          {catalogSlug && !payload?.catalogInactive ? (
            <FormationCatalogSheetFooter
              catalogSlug={catalogSlug}
              formationDisplayName={displayName}
              requiresQuote={payload?.requiresQuote ?? null}
            />
          ) : null}
          <Button variant="mono" onClick={() => onOpenChange(false)}>
            {labels.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
