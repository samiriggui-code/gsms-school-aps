'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Bolt, FolderSymlink, Radar, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useSheetContent } from '@/hooks/useSheetContent';

export function LoyaltyTier() {
  const content = useSheetContent('landing.sheetContent.tfp');
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const loyalty = content.t(`${content.path}.loyalty`, { returnObjects: true }) as {
    title: string;
    version: string;
    trackLabel: string;
    inCentre: string;
    description: string;
    tiers: string[];
    audience: { title: string; subtitle: string; value: string };
    prerequisites: { title: string; subtitle: string; value: string };
    certification: { title: string; subtitle: string; badge: string; value: string };
  };

  const tierValues = loyalty.tiers ?? [];
  const maxTier = Math.max(0, tierValues.length - 1);

  const stats = [
    {
      icon: <Bolt className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.audience.title,
      subtitle: loyalty.audience.subtitle,
      value: loyalty.audience.value,
    },
    {
      icon: <Radar className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.prerequisites.title,
      subtitle: loyalty.prerequisites.subtitle,
      value: loyalty.prerequisites.value,
    },
    {
      icon: <FolderSymlink className="w-5 h-5 text-secondary-foreground/70" />,
      title: loyalty.certification.title,
      subtitle: loyalty.certification.subtitle,
      value: (
        <div className="flex items-center gap-1">
          <Badge variant="success" size="sm" appearance="light">
            <TrendingUp className="w-3 h-3 mr-1" />
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
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">
          {content.common('complementaryDetailsTitle')}
        </h3>
        <div className="flex flex-col justify-between bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 h-full">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-white rounded-md size-[30px] overflow-hidden">
                    <img
                      src="/images/certifications/logo-titre-aps.png"
                      alt="image"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <h3 className="text-2xl font-semibold text-foreground leading-6">{loyalty.title}</h3>
                  <span className="text-xs text-muted-foreground font-normal">{loyalty.version}</span>
                </div>
              </div>
              <Button variant="outline" size="sm">
                {loyalty.inCentre}
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">{loyalty.trackLabel}</p>
              <p className="text-sm text-muted-foreground">{loyalty.description}</p>
              <div className="relative">
                <Slider
                  value={[currentTierIndex]}
                  onValueChange={(value) => setCurrentTierIndex(Math.min(value[0], maxTier))}
                  max={maxTier}
                  min={0}
                  step={1}
                  className="relative w-full h-1.5 flex items-center"
                >
                  <div className="absolute w-full h-1.5 rounded-sm bg-gradient-to-r from-pink-500 via-indigo-500 via-green-400 via-yellow-400 to-orange-500" />
                  <SliderThumb className="bg-primary" />
                </Slider>
              </div>

              <div className="flex justify-between text-sm">
                {tierValues.map((value, index) => (
                  <span
                    key={`${value}-${index}`}
                    className={`${index === currentTierIndex ? 'font-medium' : 'text-muted-foreground'}`}
                  >
                    {value}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
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
                  <div className="text-sm font-medium text-foreground">{stat.value}</div>
                </div>
                {index < stats.length - 1 ? <Separator className="my-3.5" /> : null}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
