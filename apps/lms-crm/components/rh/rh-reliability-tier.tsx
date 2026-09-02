'use client';

import { useState } from 'react';
import { Bolt, FolderSymlink, Radar, TrendingUp } from 'lucide-react';
import { User as Collaborateur } from '@/app/models/user';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { Slider, SliderThumb } from '@repo/ui/slider';
import { Separator } from '@repo/ui/separator';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';

const tiers = [
  { name: 'Niveau 1', points: 0, nextGoal: 1000 },
  { name: 'Niveau 2', points: 1000, nextGoal: 2500 },
  { name: 'Niveau 3', points: 2500, nextGoal: 4250 },
  { name: 'Gold', points: 4250, nextGoal: 5000 },
  { name: 'VIP', points: 5000, nextGoal: null },
];

const stats = [
  {
    icon: <Bolt className="size-5 text-secondary-foreground/70" />,
    title: 'Points actuels',
    subtitle: 'Gagnés via actions',
    getValue: (currentPoints: number) => currentPoints.toLocaleString(),
  },
  {
    icon: <Radar className="size-5 text-secondary-foreground/70" />,
    title: 'Objectif suivant',
    subtitle: 'Points pour monter de grade',
    getValue: (currentPoints: number, nextGoal?: number | null) =>
      `${currentPoints.toLocaleString()}/${nextGoal?.toLocaleString() || 'Max'}`,
  },
  {
    icon: <FolderSymlink className="size-5 text-secondary-foreground/70" />,
    title: 'Croissance',
    subtitle: 'Progression mensuelle',
    getValue: (currentPoints: number, nextGoal?: number | null) => {
      const progressPercentage = nextGoal ? Math.round((currentPoints / nextGoal) * 100) : 100;
      return (
        <div className="flex flex-wrap items-center justify-end gap-1">
          <Badge variant="success" size="sm" appearance="light">
            <TrendingUp className="mr-1 size-3" />
            4%
          </Badge>
          <span className="text-sm font-medium text-foreground">{progressPercentage}%</span>
        </div>
      );
    },
  },
];

export function RhReliabilityTier({ collaborateur }: { collaborateur: Collaborateur }) {
  const [currentTierIndex, setCurrentTierIndex] = useState(collaborateur.status === 'ACTIVE' ? 3 : 1);
  const currentTier = tiers[currentTierIndex];
  const currentPoints = currentTier.points;
  const nextGoal = currentTier.nextGoal || currentTier.points;

  return (
    <Card className="h-full rounded-md border border-border/60 bg-background shadow-none">
      <CardContent className="flex h-full flex-col p-0">
        <h3 className="py-2.5 ps-2 text-sm font-medium text-foreground">Niveau de sécurité / Fiabilité</h3>
        <div className="m-1 mt-0 flex h-full flex-col justify-between rounded-md border border-input bg-background px-3 py-4 sm:px-3.5 sm:py-5">
          <div className="space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background">
                  <Bolt className="size-5 text-foreground/70" />
                </div>
                <div className="flex min-w-0 flex-wrap items-end gap-1.5">
                  <h3 className="text-xl font-semibold leading-6 text-foreground sm:text-2xl">
                    {currentTier.name}
                  </h3>
                  <span className="text-xs font-normal text-muted-foreground">Rang {currentTierIndex + 1}</span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full shrink-0 border-border sm:w-auto">
                Réviser
              </Button>
            </div>

            <div className="space-y-3">
              <Slider
                value={[currentTierIndex]}
                onValueChange={(value) => setCurrentTierIndex(value[0])}
                max={4}
                min={0}
                step={1}
                className="relative flex h-1.5 w-full items-center"
              >
                <div className="absolute h-1.5 w-full rounded-sm bg-muted/30" />
                <SliderThumb className="border-foreground bg-foreground" />
              </Slider>

              <ScrollArea className="w-full">
                <div className="flex min-w-max justify-between gap-3 px-0.5 text-[10px] sm:min-w-0 sm:text-xs">
                  {tiers.map((tier, index) => (
                    <span
                      key={tier.name}
                      className={index === currentTierIndex ? 'font-medium text-foreground' : 'text-muted-foreground'}
                    >
                      {tier.name}
                    </span>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>

          <div className="mt-5 sm:mt-6">
            {stats.map((stat, index) => (
              <div key={stat.title}>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <Card className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background shadow-none">
                      {stat.icon}
                    </Card>
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-2sm font-medium text-foreground">{stat.title}</span>
                      <span className="text-xs font-normal text-muted-foreground">{stat.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-foreground sm:text-right">
                    {index === 0 && stat.getValue(currentPoints)}
                    {index === 1 && stat.getValue(currentPoints, nextGoal)}
                    {index === 2 && stat.getValue(currentPoints, nextGoal)}
                  </div>
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
