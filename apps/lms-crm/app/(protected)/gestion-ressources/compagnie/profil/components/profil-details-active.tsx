'use client';

import { ActivityPage } from "./details/activity/activity";

export function ProfilDetailsActivity({
  profil,
  overview,
  complianceStatus,
}: {
  profil: any;
  overview?: any;
  complianceStatus?: any;
}) {
  return ( 
    <ActivityPage profil={profil} overview={overview} complianceStatus={complianceStatus} /> 
  );
}
