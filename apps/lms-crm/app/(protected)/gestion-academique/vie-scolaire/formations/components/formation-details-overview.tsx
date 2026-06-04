'use client';

import { User as Formation, UserStatus } from "@/app/models/user";
import { FormationOverviewStats } from "./details/formation-overview-stats";
import { FormationRecentActivity } from "./details/formation-recent-activity";
import { FormationReliabilityTier } from "./details/formation-reliability-tier";
import { FormationHRInfo } from "./details/formation-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";

export function FormationDetailsOverview({ Formation }: { Formation: Formation }) {
  const isAbsent = Formation.status === UserStatus.ABSENT;

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Formation Absent</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce Formation est actuellement marquÃ© comme absent. Ses accÃ¨s et sa disponibilitÃ© dans le planning sont limitÃ©s.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <FormationOverviewStats Formation={Formation} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <FormationHRInfo Formation={Formation} />
        </div>
        <div>
          <FormationReliabilityTier Formation={Formation} />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <FormationRecentActivity Formation={Formation} />
      </div>  
    </div>
  );
}


