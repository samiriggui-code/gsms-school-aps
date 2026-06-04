'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Examen } from "@/app/models/user";

export function ExamenDetailsActivity({ Examen }: { Examen: Examen }) {
  return ( 
    <ActivityPage Examen={Examen} /> 
  );
}

