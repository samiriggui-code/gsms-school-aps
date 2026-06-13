'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Briefcase, TrendingUp, Info } from "lucide-react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AutresType } from "../../autres-details-sheet";
import { useAutresSheetContent } from '../content';

export function AutresRecentOrders({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
  const presentation = content.presentation;
  if (!presentation) return null;

  return (
    <TooltipProvider>
      <Card className="bg-accent/50 rounded-md shadow-none"> 
      <CardContent className="p-0 flex flex-col h-full"> 
          <h3 className="text-sm font-medium text-foreground py-2.5 ps-2 bg-accent/70 rounded-t-md border-b border-input">
            {content.common('prestationCardTitle')}
          </h3>
          <div className="bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 flex flex-col justify-between h-full">
            <div className="space-y-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-accent/50 rounded-md size-[30px]">
                    <Briefcase className="w-5 h-5 fill-indigo-600 text-indigo-600" />
                  </div>
                </div>
                <span className="text-base font-semibold text-foreground">{presentation.title}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {presentation.intro}
              </p>
              <div className="space-y-2 text-sm text-muted-foreground">
                {presentation.bullets.map((bullet, index) => (
                  <p key={bullet} className="flex items-center gap-2">
                    {index === 0 ? <Info className="size-3" /> : <TrendingUp className="size-3" />} {bullet}
                  </p>
                ))}
              </div>
            </div>

            <div>
              <Badge variant="success" size="sm" appearance="light">
                <TrendingUp className="w-3 h-3 mr-1" />
                {presentation.badge}
              </Badge>
              <Separator className="my-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
