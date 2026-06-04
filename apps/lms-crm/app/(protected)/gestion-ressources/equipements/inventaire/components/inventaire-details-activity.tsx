'use client';

import { ActivityPage } from "./details/activity/activity";
import { Equipment } from "@/app/models/equipment";

export function InventaireDetailsActivity({ equipment }: { equipment: Equipment }) {
  return ( 
    <ActivityPage equipment={equipment} /> 
  );
}
