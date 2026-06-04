'use client';

import { ActivityPage } from "./details/activity/activity";
import { User as Collaborateur } from "@/app/models/user";

export function FormateurDetailsActivity({ collaborateur }: { collaborateur: Collaborateur }) {
  return <ActivityPage collaborateur={collaborateur} />;
}
