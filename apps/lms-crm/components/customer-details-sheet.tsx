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
import { CustomerDetailsOverviews } from './customers/customer-details-overviews';
import { CustomerDetailsOrders } from './customers/customer-details-orders';
import { CustomerDetailsInvoice } from './customers/customer-details-invoice';
import { CustomerDetailsBilling } from './customers/customer-details-billing';
import { CustomerDetailsReviews } from './customers/customer-details-reviews';
import { CustomerDetailsActivity } from './customers/customer-details-active';
import { Upload } from './customers/components/upload';

export function CustomerDetailsSheet({
  open,
  onOpenChange,
  onEditClick,
  formationName = 'TFP APS',
  catalogSlug = 'tfp-aps',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: () => void;
  formationName?: string;
  /** Slug Prisma `Formation.slug` pour charger les KPI depuis le catalogue CRM */
  catalogSlug?: string | null;
}) {
  const labels = useFormationSheetLabels();
  const { t } = useTranslation();
  const tfpName = t('landing.pricing.formations.tfp-aps.name');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 w-[calc(100vw-1rem)] max-w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-2rem)] lg:w-[1160px] inset-2 sm:inset-5 border start-auto h-[calc(100dvh-1rem)] sm:h-auto max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] rounded-lg p-0 [&_[data-slot=sheet-close]]:top-3 sm:[&_[data-slot=sheet-close]]:top-4.5 [&_[data-slot=sheet-close]]:end-3 sm:[&_[data-slot=sheet-close]]:end-5">
        <SheetHeader className="border-b py-3.5 px-5 border-border">
          <SheetTitle className="font-medium">{labels.detailsTitle(formationName)}</SheetTitle>
          <SheetDescription className="sr-only">
            {labels.detailsDescription(formationName)}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="p-0 grow">
          <div className="flex justify-between flex-wrap gap-2 border-b border-border px-5 py-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <span className="lg:text-[22px] font-semibold text-foreground leading-none">
                  {t('landing.sheets.overview.tfpTitle')}
                </span>
                <Badge size="sm" variant="success" appearance="light">
                  {labels.active}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-2 text-2sm">
                <span className="font-normal text-muted-foreground">{labels.parcours}</span>
                <span className="font-medium text-foreground">Securite privee</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.type}</span>
                <span className="font-medium text-foreground">CNAPS / ADEF</span>
                <BadgeDot className="bg-muted-foreground size-1" />
                <span className="font-normal text-muted-foreground">{labels.duration}</span>
                <span className="font-medium text-foreground">175h minimum</span>
              </div>
            </div>
          </div>
          <ScrollArea
            className="flex flex-col h-[calc(100dvh-13.8rem)] sm:h-[calc(100dvh-15.8rem)] mx-1.5"
            viewportClassName="[&>div]:h-full [&>div>div]:h-full"
          >
            <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow">
              <div className="w-full shrink-0 lg:w-[230px] py-5 lg:pe-5 space-y-4">
                <Upload logoAlt={`${tfpName} logo`} />
              </div>

              <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5">
                <Tabs defaultValue="overview" className="w-auto text-sm text-muted-foreground">
                  <FormationSheetTabsList className="inline-flex w-auto grow-0 mb-2.5 flex-wrap gap-y-1 max-w-full" />
                  <TabsContent value="overview">
                    <CustomerDetailsOverviews catalogSlug={catalogSlug} />
                  </TabsContent>
                  <TabsContent value="program">
                    <CustomerDetailsOrders />
                  </TabsContent>
                  <TabsContent value="prerequisites">
                    <CustomerDetailsInvoice />
                  </TabsContent>
                  <TabsContent value="financing">
                    <CustomerDetailsBilling />
                  </TabsContent>
                  <TabsContent value="sessions">
                    <CustomerDetailsReviews />
                  </TabsContent>
                  <TabsContent value="certification">
                    <CustomerDetailsActivity />
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
