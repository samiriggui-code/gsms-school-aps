'use client';

import { User as Collaborateur, UserStatus } from "@/app/models/user";
import { FormateurOverviewStats } from "./details/formateur-overview-stats";
import { FormateurRecentActivity } from "./details/formateur-recent-activity";
import { FormateurReliabilityTier } from "./details/formateur-reliability-tier";
import { FormateurHRInfo } from "./details/formateur-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";

export function FormateurDetailsOverview({ collaborateur }: { collaborateur: Collaborateur }) {
  const isAbsent = collaborateur.status === UserStatus.ABSENT;

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Collaborateur Absent</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce collaborateur est actuellement marqué comme absent. Ses accès et sa disponibilité dans le planning sont limités.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <FormateurOverviewStats collaborateur={collaborateur} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <FormateurHRInfo collaborateur={collaborateur} />
        </div>
        <div>
          <FormateurReliabilityTier collaborateur={collaborateur} />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <FormateurRecentActivity collaborateur={collaborateur} />
      </div>  
    </div>
  );
}
