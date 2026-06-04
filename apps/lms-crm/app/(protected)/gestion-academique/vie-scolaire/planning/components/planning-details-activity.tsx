'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Planning } from "@/app/models/user";

export function PlanningDetailsActivity({ Planning }: { Planning: Planning }) {
  return ( 
    <ActivityPage Planning={Planning} /> 
  );
}

