'use client';

import { Badge, BadgeDot } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { translateFormation } from '@/lib/use-landing-formation-text';
import { Statistics1 } from '@/components/customers/components/statistics1';
import { BillingDetails } from '@/components/customers/components/billing-details';
import { PaymentMethods } from '@/components/customers/components/payment-methods';
import { Upload } from '@/components/customers/components/upload';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { CynophilePresentation } from '@/components/cynophile/cynophile-presentation';
import { CynophileLoyaltyTier } from '@/components/cynophile/cynophile-loyalty-tier';
import { CynophileStatistics2 } from '@/components/cynophile/cynophile-statistics2';
import { CynophileProgramAccordion } from '@/components/cynophile/cynophile-program-accordion';
import { CynophileStatistics4 } from '@/components/cynophile/cynophile-statistics4';
import { CynophilePrerequisitesTable } from '@/components/cynophile/cynophile-prerequisites-table';
import { CynophileSessionsGrid } from '@/components/cynophile/cynophile-sessions';
import { CynophileCertification } from '@/components/cynophile/cynophile-certification';
import { CynophileFinancingStats } from '@/components/cynophile/cynophile-financing';
import { useCynophileSheetContent } from '@/components/cynophile/content';

export function CynophileDetailsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const labels = useFormationSheetLabels();
  const { t } = useTranslation();
  const content = useCynophileSheetContent();
  const meta = content.t(`${content.path}.meta`, { returnObjects: true }) as {
    headline: string;
    track: string;
    type: string;
  };
  const formation = translateFormation(t, 'asc-cynophile', meta.track);
  const formationName = formation.name;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="font-medium">{labels.detailsTitle(formationName)}</SheetTitle>
          <SheetDescription className="sr-only">{labels.detailsDescription(formationName)}</SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="lg:text-[22px] font-semibold text-foreground leading-none">{meta.headline}</span>
                <Badge size="sm" variant="success" appearance="light">
                  {labels.active}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <span className="font-normal text-muted-foreground">{labels.parcours}</span>
                <span className="font-medium text-foreground">{meta.track}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.type}</span>
                <span className="font-medium text-foreground">{meta.type}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.duration}</span>
                <span className="font-medium text-foreground">{formation.duration}</span>
              </div>
            </div>
          </div>
          <ScrollArea
            className="flex flex-col h-[calc(100dvh-13.8rem)] sm:h-[calc(100dvh-15.8rem)] mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <div className="w-full shrink-0 lg:w-[230px] py-5 lg:pe-5 space-y-4">
                <Upload />
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                  <FormationSheetTabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap gap-y-1 max-w-full" />

                  <TabsContent value="overview">
                    <div className="space-y-5">
                      <Statistics1
                        catalogSlug={CATALOG_SLUG.ASC_CYNOPHILE}
                        staticPreset="asc-cynophile"
                      />
                      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
                        <CynophilePresentation />
                        <CynophileLoyaltyTier />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="program">
                    <div className="space-y-5">
                      <CynophileStatistics2 />
                      <CynophileProgramAccordion />
                    </div>
                  </TabsContent>

                  <TabsContent value="prerequisites">
                    <div className="space-y-5">
                      <CynophileStatistics4 />
                      <CynophilePrerequisitesTable />
                    </div>
                  </TabsContent>

                  <TabsContent value="financing">
                    <div className="space-y-5">
                      <CynophileFinancingStats />
                      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
                        <BillingDetails />
                        <PaymentMethods />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions">
                    <CynophileSessionsGrid />
                  </TabsContent>

                  <TabsContent value="certification">
                    <CynophileCertification />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row flex-wrap border-t pb-4 p-4 sm:p-5 border-border gap-2.5 justify-end">
          <Button variant="mono" onClick={() => onOpenChange(false)}>
            {labels.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
