import { UserStatus } from '@/app/models/user';
import { badgeVariants } from '@repo/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface FormationStatusProps {
  label: string;
  variant: BadgeVariant;
}

// Default status mapping for Formations
export const FormationStatusProps: Record<string, FormationStatusProps> = {
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
 * Get status properties for a Formation
 */
export const getFormationStatusProps = (status: string | UserStatus): FormationStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  
  // Handle old 'BLOCKED' status if it exists in DB
  if (normalizedStatus === 'BLOCKED') return FormationStatusProps[UserStatus.BANNED];
  
  return FormationStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' };
};


