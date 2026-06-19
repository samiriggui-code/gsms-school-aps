'use client';

import { User as Conformite } from '@/app/models/user';
import { CollaborateurHRInfo } from '../../../collaborateurs/components/details/collaborateur-hr-info';

interface ConformiteHRInfoProps {
  conformite: Conformite;
}

export function ConformiteHRInfo({ conformite }: ConformiteHRInfoProps) {
  return <CollaborateurHRInfo collaborateur={conformite} />;
}
