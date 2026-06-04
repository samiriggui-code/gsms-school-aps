'use client';

import { User as Certification, UserStatus } from "@/app/models/user";
import { CertificationOverviewStats } from "./details/certification-overview-stats";
import { CertificationRecentActivity } from "./details/certification-recent-activity";
import { CertificationReliabilityTier } from "./details/certification-reliability-tier";
import { CertificationHRInfo } from "./details/certification-hr-info";
import { Alert, AlertIcon, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CalendarX2 } from "lucide-react";

export function CertificationDetailsOverview({ Certification }: { Certification: Certification }) {
  const isAbsent = Certification.status === UserStatus.ABSENT;

  return (
    <div className="space-y-5">
      {isAbsent && (
        <Alert variant="secondary" appearance="outline" className="border-border bg-background shadow-none animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertIcon>
            <CalendarX2 className="size-4 text-foreground/70" />
          </AlertIcon>
          <div className="flex flex-col gap-1">
            <AlertTitle className="text-foreground font-bold uppercase text-[11px] tracking-wider">Certification Absent</AlertTitle>
            <AlertDescription className="text-muted-foreground text-sm">
              Ce Certification est actuellement marquÃ© comme absent. Ses accÃ¨s et sa disponibilitÃ© dans le planning sont limitÃ©s.
            </AlertDescription>
          </div>
        </Alert>
      )}

      <CertificationOverviewStats Certification={Certification} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <CertificationHRInfo Certification={Certification} />
        </div>
        <div>
          <CertificationReliabilityTier Certification={Certification} />
        </div>
      </div>

      <div className="grid lg:grid-cols-1 gap-5">
        <CertificationRecentActivity Certification={Certification} />
      </div>  
    </div>
  );
}


