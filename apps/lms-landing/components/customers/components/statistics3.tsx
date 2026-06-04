'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

export function Statistics3({ price = '1 190 €' }: { price?: string }) {
  const { t } = useTranslation();
  const cpfEligible = t('landing.sheets.financing.cpfEligible');

  const items = [
    {
      total: price,
      label: t('landing.sheets.financing.priceFrom'),
    },
    {
      total: cpfEligible,
      label: t('landing.sheets.financing.cpfAccount'),
    },
    {
      total: t('landing.sheets.financing.qualiopi'),
      label: t('landing.sheets.financing.qualiopiLabel'),
    },
    {
      total: t('landing.sheets.financing.fundingOptions'),
      label: t('landing.sheets.financing.fundingOptionsLabel'),
    },
  ];

  return (
    <Card className="rounded-md mb-5 bg-accent/70 p-1">
      <CardContent className="rounded-md p-0 bg-background border border-border">
        <div className="grid sm:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col px-4 py-3 ${index > 0 ? 'sm:border-s border-border' : ''}`}
            >
              <div className="flex items-center flex-wrap gap-1">
                <span className="font-semibold text-foreground text-xl leading-6">{item.total}</span>
                {item.total === cpfEligible ? (
                  <Badge variant="success" appearance="light" className="text-[10px] px-1.5 py-0 h-4">
                    {t('landing.sheets.financing.accreditation')}
                  </Badge>
                ) : null}
              </div>
              <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
