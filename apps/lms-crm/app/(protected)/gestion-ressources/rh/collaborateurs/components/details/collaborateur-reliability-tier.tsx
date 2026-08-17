'use client';

import { User as Collaborateur } from '@/app/models/user';
import { RhReliabilityTier } from '@/components/rh/rh-reliability-tier';

export function CollaborateurReliabilityTier({ collaborateur }: { collaborateur: Collaborateur }) {
  return <RhReliabilityTier collaborateur={collaborateur} />;
}
