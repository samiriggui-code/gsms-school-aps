'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Flame, TrendingUp } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { SsiapLevel, SsiapType } from '../../ssiap-details-sheet';
import { useSsiapSheetContent } from '../content';

export function SsiapRecentOrders({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
  const presentation = content.presentation;
  if (!presentation) return null;

  return (
    <TooltipProvider>
      <Card className="bg-accent/50 rounded-md shadow-none">
        <CardContent className="p-0 flex flex-col h-full">
          <h3 className="text-sm font-medium text-foreground py-2.5 ps-2 bg-accent/70 rounded-t-md border-b border-input">
            {content.common('presentationCardTitle')}
          </h3>
          <div className="bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 flex flex-col justify-between h-full">
            <div className="space-y-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-accent/50 rounded-md size-[30px]">
                    <Flame className="w-5 h-5 fill-red-600 text-red-600" />
                  </div>
                </div>
                <span className="text-base font-semibold text-foreground">{presentation.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {presentation.intro} {presentation.suffix}
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {presentation.bullets.map((bullet) => (
                  <p key={bullet}>- {bullet}</p>
                ))}
              </div>
            </div>

            <div>
              <Badge variant="success" size="sm" appearance="light">
                <TrendingUp className="w-3 h-3 mr-1" />
                {presentation.badge || content.common('qualiopiBadge')}
              </Badge>
              <Separator className="my-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
