'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Conformite } from "@/app/models/user";

export function ConformiteDetailsActivity({ conformite }: { conformite: Conformite }) {
  return ( 
    <ActivityPage conformite={conformite} /> 
  );
}
