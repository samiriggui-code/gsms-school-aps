'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Etudiant } from "@/app/models/user";

export function EtudiantDetailsActivity({ Etudiant }: { Etudiant: Etudiant }) {
  return ( 
    <ActivityPage Etudiant={Etudiant} /> 
  );
}


