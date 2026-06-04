'use client';

import { User as Conformite, UserStatus } from "@/app/models/user";
import { ConformiteOverviewStats } from "./details/conformite-overview-stats";
import { ConformiteRecentActivity } from "./details/conformite-recent-activity";
import { ConformiteReliabilityTier } from "./details/conformite-reliability-tier";
import { ConformiteHRInfo } from "./details/conformite-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";

export function ConformiteDetailsOverview({ conformite }: { conformite: Conformite }) {
  const isAbsent = conformite.status === UserStatus.ABSENT;

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Conformite Absent</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce conformite est actuellement marqué comme absent. Ses accès et sa disponibilité dans le planning sont limités.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <ConformiteOverviewStats conformite={conformite} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <ConformiteHRInfo conformite={conformite} />
        </div>
        <div>
          <ConformiteReliabilityTier conformite={conformite} />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <ConformiteRecentActivity conformite={conformite} />
      </div>  
    </div>
  );
}
