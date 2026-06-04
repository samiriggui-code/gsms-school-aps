'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Certification } from "@/app/models/user";

export function CertificationDetailsActivity({ Certification }: { Certification: Certification }) {
  return ( 
    <ActivityPage Certification={Certification} /> 
  );
}

