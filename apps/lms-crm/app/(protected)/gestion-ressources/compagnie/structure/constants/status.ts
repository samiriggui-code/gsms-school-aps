import { UserStatus } from '@/app/models/user';
import { badgeVariants } from '@repo/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface CollaborateurStatusProps {
  label: string;
  variant: BadgeVariant;
}

// Default status mapping for collaborateurs
export const CollaborateurStatusProps: Record<string, CollaborateurStatusProps> = {
  [UserStatus.ACTIVE]: {
    label: 'Actif',
    variant: 'success',
  },
  [UserStatus.INACTIVE]: {
    label: 'Inactif',
    variant: 'secondary',
  },
  [UserStatus.PENDING]: {
    label: 'En attente',
    variant: 'warning',
  },
  [UserStatus.ABSENT]: {
    label: 'Absent',
    variant: 'destructive',
  },
  [UserStatus.BANNED]: {
    label: 'Banni',
    variant: 'destructive',
  },
};

/**
 * Get status properties for a collaborateur
 */
export const getCollaborateurStatusProps = (status: string | UserStatus): CollaborateurStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  
  // Handle old 'BLOCKED' status if it exists in DB
  if (normalizedStatus === 'BLOCKED') return CollaborateurStatusProps[UserStatus.BANNED];
  
  return CollaborateurStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' };
};
