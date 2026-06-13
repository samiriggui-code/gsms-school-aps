'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

const BILLING_KEYS = ['enterprise', 'cpf', 'individual', 'franceTravail'] as const;

export function BillingDetails() {
  const { t } = useTranslation();

  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">
          {t('landing.sheets.financing.optionsTitle')}
        </h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-6 px-3.5 space-y-5 h-full">
          {BILLING_KEYS.map((key, index) => (
            <div key={key} className="flex gap-2 lg:gap-10">
              <span className="basis-1/3 text-xs font-normal text-secondary-foreground/80 leading-6">
                {t(`landing.sheets.financing.${key}.label`)}
              </span>
              <span className="basis-2/3 text-2sm font-normal text-foreground leading-6">
                {t(`landing.sheets.financing.${key}.info`)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
