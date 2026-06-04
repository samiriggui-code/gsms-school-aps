import { UserStatus } from '@/app/models/user';
import { badgeVariants } from '@/components/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface CertificationStatusProps {
  label: string;
  variant: BadgeVariant;
}

// Default status mapping for Certifications
export const CertificationStatusProps: Record<string, CertificationStatusProps> = {
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
 * Get status properties for a Certification
 */
export const getCertificationStatusProps = (status: string | UserStatus): CertificationStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  
  // Handle old 'BLOCKED' status if it exists in DB
  if (normalizedStatus === 'BLOCKED') return CertificationStatusProps[UserStatus.BANNED];
  
  return CertificationStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' };
};

