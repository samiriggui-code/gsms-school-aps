import { badgeVariants } from '@/components/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface ConformiteStatusProps {
  label: string;
  variant: BadgeVariant;
}

export const ConformiteStatusProps: Record<string, ConformiteStatusProps> = {
  ACTIVE: {
    label: 'Actif',
    variant: 'success',
  },
  INACTIVE: {
    label: 'Inactif',
    variant: 'secondary',
  },
  BLOCKED: {
    label: 'Bloqué',
    variant: 'destructive',
  },
  PENDING: {
    label: 'En attente',
    variant: 'warning',
  },
  BANNED: {
    label: 'Banni',
    variant: 'destructive',
  },
  ABSENT: {
    label: 'Absent',
    variant: 'warning',
  },
};

export const getConformiteStatusProps = (status: string): ConformiteStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  return ConformiteStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' as BadgeVariant };
};
