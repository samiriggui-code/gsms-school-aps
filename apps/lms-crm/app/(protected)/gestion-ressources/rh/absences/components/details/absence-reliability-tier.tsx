'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, TrendingUp, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function AbsenceReliabilityTier({ absence }: { absence: any }) {
  const score = 92; // Mock score for design alignment
  
  return (
    <Card className="shadow-none border border-border bg-background h-full">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border bg-background">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground/80">
          <div className="p-2 rounded-lg bg-background border border-border">
            <ShieldCheck className="size-4 text-foreground/70" />
          </div>
          Fiabilité / Présence
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <div className="relative size-24 mb-4 flex items-center justify-center">
             <div className="absolute inset-0 rounded-full border-[6px] border-border/40" />
             <div className="absolute inset-0 rounded-full border-[6px] border-foreground/30 border-t-transparent -rotate-45" />
             <span className="text-3xl font-black text-foreground">{score}<span className="text-sm font-bold text-muted-foreground/60">%</span></span>
          </div>
          <Badge variant="outline" appearance="light" className="font-bold uppercase tracking-widest text-[10px] px-3 py-1 border-border bg-background text-foreground/70">
            Niveau Gold
          </Badge>
          <span className="text-[11px] font-medium text-muted-foreground mt-2">Rang 4 • Fiabilité élevée</span>
        </div>

        <div className="space-y-4 pt-2">
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                    <span>Taux de présence</span>
                    <span className="text-foreground/80">98%</span>
                </div>
                <Progress value={98} className="h-1.5 bg-border/30" />
            </div>
            
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">
                    <span>Respect délais</span>
                    <span className="text-foreground/80">85%</span>
                </div>
                <Progress value={85} className="h-1.5 bg-border/30" />
            </div>
        </div>

        <div className="p-3 bg-background rounded-xl border border-border flex gap-2.5">
            <Info className="size-4 text-foreground/70 shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/70 leading-normal font-medium">
              Ce collaborateur maintient un excellent taux de présence sur les 6 derniers mois.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}
