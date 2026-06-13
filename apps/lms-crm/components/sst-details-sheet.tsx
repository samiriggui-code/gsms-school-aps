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
import { Upload } from './customers/components/upload';
import { FormationQuoteFooter } from '@/components/formation-quote-footer';
import { sstCatalogSlug } from '@/lib/catalog-formation-slugs';
import { Statistics3 } from './customers/components/statistics3';
import { BillingDetails } from './customers/components/billing-details';
import { PaymentMethods } from './customers/components/payment-methods';
import { SstStatistics1 } from './sst/components/statistics1';
import { SstRecentOrders } from './sst/components/resent-order';
import { SstLoyaltyTier } from './sst/components/loyalty-tier';
import { SstStatistics2 } from './sst/components/statistics2';
import { SstProgramAccordion } from './sst/tables/program-accordion';
import { SstStatistics4 } from './sst/components/statistics4';
import { SstPrerequisitesTable } from './sst/tables/prerequisites-table';
import { SstSessionsGrid } from './sst/components/sessions-grid';
import { SstCertificationInfo } from './sst/components/certification-info';
import { formationLogos } from '@/lib/certification-logos';

export type SstType = 'SST Initial' | 'MAC SST' | 'STU' | 'SST Entreprise';

export const SST_TYPE_KEYS: Record<SstType, 'initial' | 'mac' | 'stu' | 'entreprise'> = {
  'SST Initial': 'initial',
  'MAC SST': 'mac',
  STU: 'stu',
  'SST Entreprise': 'entreprise',
};

interface SstDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: SstType;
}

export function SstDetailsSheet({ open, onOpenChange, type }: SstDetailsSheetProps) {
  const labels = useFormationSheetLabels();
  const { t } = useTranslation();
  const typeKey = SST_TYPE_KEYS[type];
  const base = `landing.sheets.sst.types.${typeKey}`;
  const title = t(`${base}.title`);
  const headline = t(`${base}.headline`);
  const duration = t(`${base}.duration`);
  const price = t(`${base}.price`);
  const category = t(`${base}.category`);
  const track = t('landing.sheets.sst.track');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="font-medium">{labels.detailsTitle(title)}</SheetTitle>
          <SheetDescription className="sr-only">{labels.detailsDescription(title)}</SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[22px] font-semibold text-foreground leading-none">{headline}</span>
                <Badge size="sm" variant="success" appearance="light">
                  {labels.active}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <span className="font-normal text-muted-foreground">{labels.parcours}</span>
                <span className="font-medium text-foreground">{track}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.type}</span>
                <span className="font-medium text-foreground">{category}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.duration}</span>
                <span className="font-medium text-foreground">{duration}</span>
              </div>
            </div>
          </div>
          <ScrollArea
            className="flex flex-col h-[calc(100dvh-13.8rem)] sm:h-[calc(100dvh-15.8rem)] mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <div className="w-full shrink-0 lg:w-[230px] py-5 lg:pe-5 space-y-4">
                <Upload logoSrc={formationLogos.sst} logoAlt={title} />
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                  <FormationSheetTabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap gap-y-1 max-w-full" />

                  <TabsContent value="overview">
                    <div className="space-y-5">
                      <SstStatistics1 type={type} />
                      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
                        <SstRecentOrders type={type} />
                        <SstLoyaltyTier type={type} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="program">
                    <div className="space-y-5">
                      <SstStatistics2 type={type} />
                      <SstProgramAccordion type={type} />
                    </div>
                  </TabsContent>

                  <TabsContent value="prerequisites">
                    <div className="space-y-5">
                      <SstStatistics4 type={type} />
                      <SstPrerequisitesTable type={type} />
                    </div>
                  </TabsContent>

                  <TabsContent value="financing">
                    <div className="space-y-5">
                      <Statistics3 price={price} />
                      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
                        <BillingDetails />
                        <PaymentMethods />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sessions">
                    <SstSessionsGrid type={type} />
                  </TabsContent>

                  <TabsContent value="certification">
                    <SstCertificationInfo type={type} />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </ScrollArea>
        </SheetBody>

        <SheetFooter className="flex-row flex-wrap border-t pb-4 p-4 sm:p-5 border-border gap-2.5 justify-end">
          {type === 'SST Entreprise' ? (
            <FormationQuoteFooter
              mode="devis-prestation"
              catalogSlug={sstCatalogSlug('SST Entreprise')}
              formationDisplayName={title}
            />
          ) : null}
          <Button
            variant="mono"
            onClick={() => onOpenChange(false)}
            className="bg-black text-white hover:bg-black/90"
          >
            {labels.close}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
