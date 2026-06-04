'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bolt, Radar, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useBsBeSheetContent } from '../content';
import { formationLogos } from '@/lib/certification-logos';

export function BsBeLoyaltyTier() {
  const content = useBsBeSheetContent();
  const loyalty = content.t(`${content.path}.loyalty`, { returnObjects: true }) as {
    title: string;
    subtitle: string;
    description: string;
    audience: { title: string; subtitle: string; value: string };
    prerequisites: { title: string; subtitle: string; value: string };
    certification: { title: string; subtitle: string; badge: string; value: string };
  };

  const stats = [
    {
      icon: <Bolt className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.audience.title,
      subtitle: loyalty.audience.subtitle,
      getValue: () => loyalty.audience.value,
    },
    {
      icon: <Radar className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.prerequisites.title,
      subtitle: loyalty.prerequisites.subtitle,
      getValue: () => loyalty.prerequisites.value,
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.certification.title,
      subtitle: loyalty.certification.subtitle,
      getValue: () => (
        <div className="flex items-center gap-1">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-white rounded-md size-[30px] overflow-hidden">
                    <img src={formationLogos.h0b0} alt={loyalty.title} className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <h3 className="text-2xl font-semibold text-foreground leading-6">{loyalty.title}</h3>
                  <span className="text-xs text-muted-foreground font-normal">{loyalty.subtitle}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{loyalty.description}</p>
            </div>
          </div>

          <div className="mt-4">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[36px] w-[36px] shadow-none shrink-0">
                      {stat.icon}
                    </Card>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground text-2sm">{stat.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">{stat.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground text-right max-w-[120px] truncate">{stat.getValue()}</div>
                </div>
                {index < stats.length - 1 && <Separator className="my-3.5" />}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
