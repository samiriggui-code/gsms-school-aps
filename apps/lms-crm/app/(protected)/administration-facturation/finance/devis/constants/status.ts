import { UserStatus } from '@/app/models/user';
import { badgeVariants } from '@/components/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface EtudiantStatusProps {
  label: string;
  variant: BadgeVariant;
}

// Default status mapping for Etudiants
export const EtudiantStatusProps: Record<string, EtudiantStatusProps> = {
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
 * Get status properties for a Etudiant
 */
export const getEtudiantStatusProps = (status: string | UserStatus): EtudiantStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  
  // Handle old 'BLOCKED' status if it exists in DB
  if (normalizedStatus === 'BLOCKED') return EtudiantStatusProps[UserStatus.BANNED];
  
  return EtudiantStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' };
};



