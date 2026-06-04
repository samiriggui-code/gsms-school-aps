import { UserStatus } from '@/app/models/user';
import { badgeVariants } from '@/components/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface FormateurStatusProps {
  label: string;
  variant: BadgeVariant;
}

export const FormateurStatusPropsMap: Record<string, FormateurStatusProps> = {
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

export const getFormateurStatusProps = (status: string | UserStatus): FormateurStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();

  if (normalizedStatus === 'BLOCKED') return FormateurStatusPropsMap[UserStatus.BANNED];

  return (
    FormateurStatusPropsMap[normalizedStatus] || {
      label: normalizedStatus || 'Inconnu',
      variant: 'outline',
    }
  );
};
