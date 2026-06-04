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
import { Statistics3 } from './customers/components/statistics3';
import { BillingDetails } from './customers/components/billing-details';
import { PaymentMethods } from './customers/components/payment-methods';
import { SsiapStatistics1 } from './ssiap/components/statistics1';
import { SsiapRecentOrders } from './ssiap/components/resent-order';
import { SsiapLoyaltyTier } from './ssiap/components/loyalty-tier';
import { SsiapStatistics2 } from './ssiap/components/statistics2';
import { SsiapProgramAccordion } from './ssiap/tables/program-accordion';
import { SsiapStatistics4 } from './ssiap/components/statistics4';
import { SsiapPrerequisitesTable } from './ssiap/tables/prerequisites-table';
import { SsiapSessionsGrid } from './ssiap/components/sessions-grid';
import { SsiapCertificationInfo } from './ssiap/components/certification-info';
import { formationLogos } from '@/lib/certification-logos';

export type SsiapLevel = 1 | 2 | 3;
export type SsiapType = 'initial' | 'recyclage' | 'ran';

interface SsiapDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  level: SsiapLevel;
  type: SsiapType;
}

const ssiapData = {
  1: {
    initial: { title: 'SSIAP 1 Initial', duration: '67h minimum', price: '990 €' },
    recyclage: { title: 'SSIAP 1 Recyclage', duration: '14h', price: '450 €' },
    ran: { title: 'SSIAP 1 Remise à Niveau', duration: '21h', price: '590 €' },
  },
  2: {
    initial: { title: 'SSIAP 2 Initial', duration: '70h minimum', price: '1290 €' },
    recyclage: { title: 'SSIAP 2 Recyclage', duration: '14h', price: '550 €' },
    ran: { title: 'SSIAP 2 Remise à Niveau', duration: '21h', price: '690 €' },
  },
  3: {
    initial: { title: 'SSIAP 3 Initial', duration: '216h', price: '2890 €' },
    recyclage: { title: 'SSIAP 3 Recyclage', duration: '21h', price: '750 €' },
    ran: { title: 'SSIAP 3 Remise à Niveau', duration: '35h', price: '990 €' },
  },
};

function ssiapPricingSlug(level: SsiapLevel, type: SsiapType): string {
  return `ssiap-${level}-${type}`;
}

export function SsiapDetailsSheet({ open, onOpenChange, level, type }: SsiapDetailsSheetProps) {
  const labels = useFormationSheetLabels();
  const { t } = useTranslation();
  const fallback = ssiapData[level][type];
  const pricingBase = `landing.pricing.formations.${ssiapPricingSlug(level, type)}`;
  const title = t(`${pricingBase}.name`, { defaultValue: fallback.title });
  const duration = t(`${pricingBase}.duration`, { defaultValue: fallback.duration });
  const price = t(`${pricingBase}.price`, { defaultValue: fallback.price });
  const typeLabel = t(`landing.sheets.ssiap.typeLabels.${type}`);
  const track = t('landing.sheets.ssiap.track');
  const suffix = t('landing.sheets.ssiap.suffix');

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
                <span className="lg:text-[22px] font-semibold text-foreground leading-none">
                  {title}
                  {suffix}
                </span>
                <Badge size="sm" variant="success" appearance="light">
                  {labels.active}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <span className="font-normal text-muted-foreground">{labels.parcours}</span>
                <span className="font-medium text-foreground">{track}</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.type}</span>
                <span className="font-medium text-foreground">{typeLabel}</span>
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
                <Upload logoSrc={formationLogos.ssiap1} logoAlt={title} />
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                  <FormationSheetTabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap gap-y-1 max-w-full" />

                  <TabsContent value="overview">
                    <div className="space-y-5">
                      <SsiapStatistics1 level={level} type={type} />
                      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
                        <SsiapRecentOrders level={level} type={type} />
                        <SsiapLoyaltyTier level={level} type={type} />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="program">
                    <div className="space-y-5">
                      <SsiapStatistics2 level={level} type={type} />
                      <SsiapProgramAccordion level={level} type={type} />
                    </div>
                  </TabsContent>

                  <TabsContent value="prerequisites">
                    <div className="space-y-5">
                      <SsiapStatistics4 level={level} type={type} />
                      <SsiapPrerequisitesTable level={level} type={type} />
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
                    <SsiapSessionsGrid level={level} type={type} />
                  </TabsContent>

                  <TabsContent value="certification">
                    <SsiapCertificationInfo level={level} type={type} />
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
