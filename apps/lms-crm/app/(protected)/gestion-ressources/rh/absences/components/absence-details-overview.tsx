'use client';

import { Absence } from "@/app/models/absence";
import { AbsenceOverviewStats } from "./details/absence-overview-stats";
import { AbsenceRequestInfo } from "./details/absence-request-info";
import { AbsenceReliabilityTier } from "./details/absence-reliability-tier";

export default function AbsenceDetailsOverview({ absence }: { absence: Absence }) {
  return (
    <div className="space-y-5">
      <AbsenceOverviewStats absence={absence} />
      
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        <div className="lg:col-span-2">
          <AbsenceRequestInfo absence={absence} />
        </div>
        <div>
          <AbsenceReliabilityTier absence={absence} />
        </div>
      </div>
    </div>
  );
}
