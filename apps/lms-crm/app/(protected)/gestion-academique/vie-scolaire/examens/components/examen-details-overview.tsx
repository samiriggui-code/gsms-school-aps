'use client';

import { User as Examen, UserStatus } from "@/app/models/user";
import { ExamenOverviewStats } from "./details/examen-overview-stats";
import { ExamenRecentActivity } from "./details/examen-recent-activity";
import { ExamenReliabilityTier } from "./details/examen-reliability-tier";
import { ExamenHRInfo } from "./details/examen-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";

export function ExamenDetailsOverview({ Examen }: { Examen: Examen }) {
  const isAbsent = Examen.status === UserStatus.ABSENT;

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Examen Absent</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce Examen est actuellement marquÃ© comme absent. Ses accÃ¨s et sa disponibilitÃ© dans le planning sont limitÃ©s.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <ExamenOverviewStats Examen={Examen} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <ExamenHRInfo Examen={Examen} />
        </div>
        <div>
          <ExamenReliabilityTier Examen={Examen} />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <ExamenRecentActivity Examen={Examen} />
      </div>  
    </div>
  );
}


