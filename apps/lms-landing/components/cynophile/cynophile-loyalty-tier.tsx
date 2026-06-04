'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bolt, Dog, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useCynophileSheetContent } from './content';
import { formationLogos } from '@/lib/certification-logos';

export function CynophileLoyaltyTier() {
  const content = useCynophileSheetContent();
  const loyalty = content.t(`${content.path}.loyalty`, { returnObjects: true }) as {
    title: string;
    subtitle: string;
    description: string;
    audience: { title: string; subtitle: string; value: string };
    dog: { title: string; subtitle: string; value: string };
    certification: { title: string; subtitle: string; badge: string; value: string };
    contact?: string;
  };

  const stats = [
    {
      icon: <Bolt className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.audience.title,
      subtitle: loyalty.audience.subtitle,
      value: loyalty.audience.value,
    },
    {
      icon: <Dog className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.dog.title,
      subtitle: loyalty.dog.subtitle,
      value: loyalty.dog.value,
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.certification.title,
      subtitle: loyalty.certification.subtitle,
      value: (
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="success" size="sm" appearance="light">
            {loyalty.certification.badge}
          </Badge>
          <span className="text-sm font-medium text-foreground">{loyalty.certification.value}</span>
        </div>
      ),
    },
  ];

  return (
    <Card className="bg-accent/50 rounded-md shadow-none h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">{content.common('complementaryDetailsTitle')}</h3>
        <div className="flex flex-col justify-between bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 h-full">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-white rounded-md size-[30px] overflow-hidden">
                    <img src={formationLogos.cynophile} alt={loyalty.title} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
                <div className="flex flex-col min-w-0">
                  <h3 className="text-xl font-semibold text-foreground leading-6 truncate">{loyalty.title}</h3>
                  <span className="text-xs text-muted-foreground font-normal">{loyalty.subtitle}</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">{loyalty.description}</p>
          </div>

          <div className="mt-4 space-y-4">
            {stats.map((s, i) => (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5">{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-tight">{s.title}</p>
                  <p className="text-xs text-muted-foreground/80">{s.subtitle}</p>
                  <div className="text-sm text-foreground mt-1">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />
          {loyalty.contact ? <p className="text-xs text-muted-foreground">{loyalty.contact}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
