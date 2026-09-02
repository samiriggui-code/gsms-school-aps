import { badgeVariants } from '@repo/ui/badge';
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

export type ComplianceDocumentStatus = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

const ComplianceDocumentStatusMap: Record<ComplianceDocumentStatus, ConformiteStatusProps> = {
  COMPLIANT: { label: 'Conforme', variant: 'success' },
  WARNING: { label: 'Alerte', variant: 'warning' },
  NON_COMPLIANT: { label: 'Non conforme', variant: 'destructive' },
};

/** Statut documentaire / agrément (API `complianceStatus`). */
export const getComplianceDocumentStatusProps = (
  status: string | null | undefined,
): ConformiteStatusProps => {
  const key = (status || '').toUpperCase() as ComplianceDocumentStatus;
  return ComplianceDocumentStatusMap[key] ?? { label: '—', variant: 'outline' };
};
