import { badgeVariants } from '@/components/ui/badge';
import { VariantProps } from 'class-variance-authority';

type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];

export interface EquipmentStatusProps {
  label: string;
  variant: BadgeVariant;
}

export const EquipmentStatusProps: Record<string, EquipmentStatusProps> = {
  AVAILABLE: {
    label: 'DISPONIBLE',
    variant: 'success',
  },
  IN_USE: {
    label: 'EN SERVICE',
    variant: 'primary',
  },
  MAINTENANCE: {
    label: 'MAINTENANCE',
    variant: 'warning',
  },
  OUT_OF_SERVICE: {
    label: 'HORS SERVICE',
    variant: 'destructive',
  },
  ARCHIVED: {
    label: 'ARCHIVÉ',
    variant: 'secondary',
  },
};

export const getEquipmentStatusProps = (status: string): EquipmentStatusProps => {
  const normalizedStatus = (status || '').toUpperCase();
  return EquipmentStatusProps[normalizedStatus] || { label: normalizedStatus || 'Inconnu', variant: 'outline' };
};

// Aliases for compatibility if needed during migration
export const getInventaireStatusProps = getEquipmentStatusProps;
export const getMouvementStatusProps = getEquipmentStatusProps;
export const getConformiteStatusProps = getEquipmentStatusProps;
export const getMaintenanceStatusProps = getEquipmentStatusProps;
