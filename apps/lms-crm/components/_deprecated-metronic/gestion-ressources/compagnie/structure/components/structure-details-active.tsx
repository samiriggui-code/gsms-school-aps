'use client';

import { ActivityPage } from "./details/activity/activity";

export function StructureDetailsActivity({
  structure,
  overview,
  complianceStatus,
}: {
  structure: any;
  overview?: any;
  complianceStatus?: any;
}) {
  return ( 
    <ActivityPage structure={structure} overview={overview} complianceStatus={complianceStatus} /> 
  );
}
