'use client';

import { ActivityPage } from "./details/activity/activity";

export function DocumentsDetailsActivity({
  documents,
  overview,
  complianceStatus,
}: {
  documents: any;
  overview?: any;
  complianceStatus?: any;
}) {
  return ( 
    <ActivityPage documents={documents} overview={overview} complianceStatus={complianceStatus} /> 
  );
}
