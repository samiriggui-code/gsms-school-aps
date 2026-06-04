'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator"; 
import { AutresType } from "../../autres-details-sheet";
import { useAutresSheetContent } from '../content';

export function AutresLoyaltyTier({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
  const loyalty = content.t(`${content.path}.loyalty`, { returnObjects: true }) as {
    title: string;
    subtitle: string;
    description: string;
    audience: { title: string; subtitle: string; value: string };
    certification: { title: string; subtitle: string; badge: string; value: string };
  };

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
                    <Shield className="w-5 h-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex items-end gap-1.5">
                  <h3 className="text-2xl font-semibold text-foreground leading-6">{loyalty.title}</h3>
                  <span className="text-xs text-muted-foreground font-normal">{loyalty.subtitle}</span>
                </div>
              </div> 
            </div>
            <p className="text-sm text-muted-foreground">{loyalty.description}</p>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[36px] w-[36px] shadow-none shrink-0"> 
                  <Users className="w-5 h-5 text-secondary-foreground/70" />
                </Card>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-2sm">{loyalty.audience.title}</span>
                  <span className="text-xs text-muted-foreground font-normal">{loyalty.audience.subtitle}</span>
                </div>
              </div>
            </div>
            <Separator className="my-3.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Card className="flex items-center justify-center rounded-md bg-accent/50 h-[36px] w-[36px] shadow-none shrink-0"> 
                  <TrendingUp className="w-5 h-5 text-secondary-foreground/70" />
                </Card>
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-2sm">{loyalty.certification.title}</span>
                  <Badge variant="success" size="sm" appearance="light">{loyalty.certification.badge}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div> 
      </CardContent>
    </Card>
  )
}
