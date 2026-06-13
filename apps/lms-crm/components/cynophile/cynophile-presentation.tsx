'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, RefreshCw, TrendingUp } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useCynophileSheetContent } from './content';

export function CynophilePresentation() {
  const content = useCynophileSheetContent();
  const presentation = content.presentation;
  if (!presentation) return null;
  const meta = content.t(`${content.path}.meta`, { returnObjects: true }) as { centerNote?: string };

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
                    <RefreshCw className="w-5 h-5 fill-indigo-600 text-indigo-600" />
                  </div>
                </div>
                <span className="text-base font-semibold text-foreground">{presentation.title}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {presentation.intro}
              </p>
              <div className="rounded-md border border-border bg-accent/20 px-3 py-2.5 flex gap-2 text-sm text-muted-foreground">
                <MapPin className="size-4 shrink-0 mt-0.5 text-primary" />
                <span>{meta.centerNote}</span>
              </div>
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
