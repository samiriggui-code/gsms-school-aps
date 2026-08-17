'use client';

import { Absence } from "@/app/models/absence";
import { AbsenceOverviewStats } from "./details/absence-overview-stats";
import { AbsenceRequestInfo } from "./details/absence-request-info";

export default function AbsenceDetailsOverview({ absence }: { absence: Absence }) {
  return (
    <div className="space-y-5">
      <AbsenceOverviewStats absence={absence} />

      <AbsenceRequestInfo absence={absence} />
    </div>
  );
}
