import { UserStatus } from '@/app/models/user';

export const UserStatusProps: Record<
  UserStatus,
  { label: string; variant: string; description?: string }
> = {
  [UserStatus.ACTIVE]: {
    label: 'Actif',
    variant: 'success',
    description: 'Compte opérationnel',
  },
  [UserStatus.INACTIVE]: {
    label: 'Inactif',
    variant: 'warning',
    description: 'Compte désactivé ou archivé',
  },
  [UserStatus.BLOCKED]: {
    label: 'Suspendu',
    variant: 'destructive',
    description: 'Accès bloqué par un administrateur',
  },
  [UserStatus.PENDING]: {
    label: 'En attente',
    variant: 'warning',
    description: 'Invitation ou validation en cours',
  },
  [UserStatus.BANNED]: {
    label: 'Banni',
    variant: 'destructive',
    description: 'Accès définitivement refusé',
  },
  [UserStatus.ABSENT]: {
    label: 'Absent',
    variant: 'mono',
    description: 'Statut RH automatique (absence approuvée)',
  },
};

export const getUserStatusProps = (status: UserStatus) => {
  return UserStatusProps[status] || { label: 'Inconnu', variant: 'outline' };
};

/** Statuts modifiables manuellement depuis l’admin IAM. */
export const USER_IAM_EDITABLE_STATUSES: UserStatus[] = [
  UserStatus.ACTIVE,
  UserStatus.INACTIVE,
  UserStatus.BLOCKED,
  UserStatus.PENDING,
  UserStatus.BANNED,
];
