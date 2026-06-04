'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Banknote } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export function PaymentMethods() {
  const { t } = useTranslation();

  const paymentMethods = [
    {
      logo: '/images/certifications/logo-mon-compte-formation.png',
      key: 'cpfMethod' as const,
      isPrimary: true,
    },
    {
      logo: '/images/certifications/logo-france-travail.png',
      key: 'poleEmploi' as const,
      isPrimary: false,
    },
    {
      logo: '/images/certifications/logo-opco.png',
      key: 'opco' as const,
      isPrimary: false,
    },
    {
      logo: null as string | null,
      key: 'selfFunded' as const,
      isPrimary: false,
      icon: <Banknote className="size-6 text-primary" />,
    },
  ];

  return (
    <Card className="bg-accent/70 rounded-md shadow-none">
      <CardContent className="p-0">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">
          {t('landing.sheets.financing.methodsTitle')}
        </h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-1 px-3.5">
          {paymentMethods.map((method, index) => {
            const name = t(`landing.sheets.financing.${method.key}.name`);
            return (
              <div key={method.key}>
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-md bg-background border border-border size-10 shrink-0 overflow-hidden">
                      <div className="flex items-center justify-center bg-white rounded-md size-full">
                        {method.logo ? (
                          <img
                            src={method.logo}
                            alt={name}
                            className="max-w-full max-h-full object-contain p-1"
                          />
                        ) : (
                          method.icon
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <Link href="#" className="font-medium text-foreground text-sm hover:text-primary">
                          {name}
                        </Link>
                        {method.isPrimary ? (
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                            {t('landing.sheets.financing.recommended')}
                          </Badge>
                        ) : null}
                      </div>
                      <span className="text-2sm font-normal text-secondary-foreground/70">
                        {t(`landing.sheets.financing.${method.key}.details`)}
                      </span>
                    </div>
                  </div>
                </div>
                {index < paymentMethods.length - 1 ? <Separator /> : null}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
