import { UserStatus } from '@/app/models/user';
import { badgeVariants } from '@/components/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface ExamenStatusProps {
  label: string;
  variant: BadgeVariant;
}

// Default status mapping for Examens
export const ExamenStatusProps: Record<string, ExamenStatusProps> = {
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
 * Get status properties for a Examen
 */
export const getExamenStatusProps = (status: string | UserStatus): ExamenStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  
  // Handle old 'BLOCKED' status if it exists in DB
  if (normalizedStatus === 'BLOCKED') return ExamenStatusProps[UserStatus.BANNED];
  
  return ExamenStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' };
};

