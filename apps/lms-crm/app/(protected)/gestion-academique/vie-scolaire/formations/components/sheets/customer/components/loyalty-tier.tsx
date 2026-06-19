'use client';

import { useState, startTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider, SliderThumb } from '@/components/ui/slider';
import { Bolt, FolderSymlink, Radar, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

const DEFAULT_LOYALTY: FormationSheetViewModel['loyalty'] = {
  logoUrl: null,
  shortLabel: '—',
  versionLabel: null,
  deliveryLabel: null,
  audienceTitle: 'Public concerné',
  audienceSubtitle: 'Bénéficiaires',
  audience: '—',
  prereqTitle: 'Prérequis',
  prereqSubtitle: "Conditions d'accès",
  prereq: '—',
  certBadge: 'Référentiel',
  certOutcome: '—',
  progressAxes: [],
};

type Props = {
  loyalty?: FormationSheetViewModel['loyalty'] | null;
};

export function LoyaltyTier({ loyalty }: Props) {
  const [currentTierIndex, setCurrentTierIndex] = useState(2);

  const L = loyalty ?? DEFAULT_LOYALTY;

  const axes = L.progressAxes.length ? L.progressAxes : ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];
  const trackLabels = axes.slice(0, 5);
  while (trackLabels.length < 5) {
    trackLabels.push(`Phase ${trackLabels.length + 1}`);
  }

  const handleSliderChange = (value: number[]) => {
    startTransition(() => setCurrentTierIndex(value[0]));
  };

  const imgSrc = L.logoUrl?.trim() || '/media/ui/empty-image.svg';

  return (
    <Card className="bg-accent/50 rounded-md shadow-none h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Détails complémentaires</h3>
        <div className="flex flex-col justify-between bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 h-full">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
                  <img src={imgSrc} alt="" className="size-full object-cover object-center" />
                </div>
                <div className="flex items-end gap-1.5 min-w-0">
                  <h3 className="text-xl font-semibold text-foreground leading-6 truncate">
                    {L.shortLabel}
                  </h3>
                  {L.versionLabel ? (
                    <span className="text-xs text-muted-foreground font-normal shrink-0">{L.versionLabel}</span>
                  ) : null}
                </div>
              </div>
              <Button variant="outline" size="sm" className="shrink-0">
                {L.deliveryLabel?.trim() || 'Modalité'}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Slider
                  value={[currentTierIndex]}
                  onValueChange={handleSliderChange}
                  max={4}
                  min={0}
                  step={1}
                  className="relative w-full h-1.5 flex items-center"
                >
                  <div className="absolute w-full h-1.5 rounded-sm bg-gradient-to-r from-pink-500 via-indigo-500 via-green-400 via-yellow-400 to-orange-500" />
                  <SliderThumb className="bg-primary" />
                </Slider>
              </div>
              <div className="flex justify-between gap-1 text-[10px] sm:text-xs">
                {trackLabels.map((label, index) => (
                  <span
                    key={`${label}-${index}`}
                    className={index === currentTierIndex ? 'font-medium text-foreground' : 'text-muted-foreground'}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[36px] w-[36px] shadow-none shrink-0">
                  <Bolt className="w-5 h-5 text-secondary-foreground/70" />
                </Card>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-2sm">{L.audienceTitle}</span>
                  <span className="text-xs text-muted-foreground font-normal">{L.audienceSubtitle}</span>
                </div>
              </div>
              <div className="text-sm font-medium text-foreground text-end max-w-[45%] truncate" title={L.audience}>
                {L.audience}
              </div>
            </div>
            <Separator className="my-3.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[36px] w-[36px] shadow-none shrink-0">
                  <Radar className="w-5 h-5 text-secondary-foreground/70" />
                </Card>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-2sm">{L.prereqTitle}</span>
                  <span className="text-xs text-muted-foreground font-normal">{L.prereqSubtitle}</span>
                </div>
              </div>
              <div className="text-sm font-medium text-foreground text-end max-w-[45%] truncate" title={L.prereq}>
                {L.prereq}
              </div>
            </div>
            <Separator className="my-3.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[36px] w-[36px] shadow-none shrink-0">
                  <FolderSymlink className="w-5 h-5 text-secondary-foreground/70" />
                </Card>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-2sm">Certification</span>
                  <span className="text-xs text-muted-foreground font-normal">Examen / attestation</span>
                </div>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Badge variant="success" size="sm" appearance="light">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {L.certBadge}
                </Badge>
                <span className="text-sm font-medium text-foreground">{L.certOutcome}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
