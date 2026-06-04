'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Formation } from "@/app/models/user";

export function FormationDetailsActivity({ Formation }: { Formation: Formation }) {
  return ( 
    <ActivityPage Formation={Formation} /> 
  );
}

