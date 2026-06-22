'use client';

import { User as Collaborateur } from '@/app/models/user';
import { CollaborateurHRInfo } from '../../../collaborateurs/components/details/collaborateur-hr-info';

interface FormateurHRInfoProps {
  collaborateur: Collaborateur;
}

/** Même bloc RH que collaborateur (+ domaines dispensés via `variant`). */
export function FormateurHRInfo({ collaborateur }: FormateurHRInfoProps) {
  return <CollaborateurHRInfo collaborateur={collaborateur} variant="formateur" />;
}
