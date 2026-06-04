'use client';

import { User as Planning, UserStatus } from "@/app/models/user";
import { PlanningOverviewStats } from "./details/planning-overview-stats";
import { PlanningRecentActivity } from "./details/planning-recent-activity";
import { PlanningReliabilityTier } from "./details/planning-reliability-tier";
import { PlanningHRInfo } from "./details/planning-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";

export function PlanningDetailsOverview({ Planning }: { Planning: Planning }) {
  const isAbsent = Planning.status === UserStatus.ABSENT;

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Planning Absent</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce Planning est actuellement marquÃ© comme absent. Ses accÃ¨s et sa disponibilitÃ© dans le planning sont limitÃ©s.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <PlanningOverviewStats Planning={Planning} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <PlanningHRInfo Planning={Planning} />
        </div>
        <div>
          <PlanningReliabilityTier Planning={Planning} />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <PlanningRecentActivity Planning={Planning} />
      </div>  
    </div>
  );
}


