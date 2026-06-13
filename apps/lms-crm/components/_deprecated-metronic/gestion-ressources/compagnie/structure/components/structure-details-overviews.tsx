'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import { StructureDetailsOrders } from './structure-details-orders';
import { Statistics1 } from './details/statistics1';
import { Statistics2, DocItem } from './details/statistics2';

type OverviewData = {
  metrics?: {
    agentsCount?: number;
    sitesCount?: number;
    hoursThisMonth?: number;
    complianceAlerts?: number;
  };
  upcomingShifts?: Array<{
    id: string;
    startAt: string;
    endAt: string;
    siteName: string;
    agentName: string;
  }>;
};

export function StructureDetailsOverviews({
  structure,
  overview,
  complianceStatus,
}: {
  structure: any;
  overview?: OverviewData;
  complianceStatus?: any;
}) {
  const isSub = structure?.type === 'SUBCONTRACTOR';
  const email = structure?.email || structure?.contactEmail || '-';
  const phone = structure?.phone || structure?.contactPhone || '-';
  const contactName = isSub
    ? [structure?.representativeFirstName, structure?.representativeLastName].filter(Boolean).join(' ')
    : structure?.contactName;
  const contactRole = isSub ? 'Représentant' : structure?.contactRole;

  const metrics = overview?.metrics || {
    agentsCount: 0,
    sitesCount: 0,
    hoursThisMonth: 0,
    complianceAlerts: 0,
  };

  const complianceLabel =
    complianceStatus?.status === 'COMPLIANT'
      ? 'Conforme'
      : complianceStatus?.status === 'WARNING'
      ? 'Alerte'
      : complianceStatus?.status === 'NON_COMPLIANT'
      ? 'Non conforme'
      : 'Non défini';

  const documentItems: DocItem[] = [
    {
      label: 'Assurance',
      value: structure?.documentInsurance ? 'OK' : 'Manquante',
      tone: structure?.documentInsurance ? 'success' : 'warning',
    },
    {
      label: 'KBIS',
      value: structure?.documentKbis ? 'OK' : 'Manquant',
      tone: structure?.documentKbis ? 'success' : 'warning',
    },
    {
      label: 'Agrément',
      value: isSub ? (structure?.documentAgreement ? 'OK' : 'Manquant') : 'N/A',
      tone: isSub ? (structure?.documentAgreement ? 'success' : 'warning') : 'muted',
    },
    {
      label: 'Autorisation',
      value: isSub ? (structure?.authorizationNumber ? 'OK' : 'Manquante') : 'N/A',
      tone: isSub ? (structure?.authorizationNumber ? 'success' : 'warning') : 'muted',
    },
  ];

  return (
    <div className="space-y-5">
      <Statistics1 metrics={metrics} />

      <div className="grid lg:grid-cols-2 gap-5">
        <Card className="border border-border/60 shadow-none">
          <CardHeader className="px-5 py-4 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Coordonnées & Profil</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-3">
            <InfoRow label="Type" value={isSub ? 'Sous-traitant' : 'Prestataire'} />
            <InfoRow label="Service" value={structure?.service || structure?.specialty || '-'} />
            <InfoRow label="Email" value={email} />
            <InfoRow label="Contact" value={contactName || '-'} />
            <InfoRow label="Rôle" value={contactRole || '-'} />
            <InfoRow label="Adresse" value={structure?.address || '-'} />
            <InfoRow label="Ville" value={structure?.city || '-'} />
            <InfoRow label="Téléphone" value={phone} />
            <Separator />
            <InfoRow
              label="Ajouté le"
              value={structure?.createdAt ? formatDateTime(new Date(structure.createdAt)) : '-'}
            />
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-none">
          <CardHeader className="px-5 py-4 border-b border-border/60">
            <CardTitle className="text-sm font-semibold">Conformité & Documents</CardTitle>
          </CardHeader>
          <CardContent className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Statut</div>
              <Badge
                variant={
                  complianceStatus?.status === 'COMPLIANT'
                    ? 'success'
                    : complianceStatus?.status === 'WARNING'
                    ? 'warning'
                    : complianceStatus?.status === 'NON_COMPLIANT'
                    ? 'destructive'
                    : 'secondary'
                }
                appearance="light"
                className="uppercase text-[10px] font-semibold"
              >
                {complianceLabel}
              </Badge>
            </div>

            {isSub && (
              <>
                <InfoRow label="Agrément" value={structure?.agreementNumber || '-'} />
                <InfoRow label="Autorisation" value={structure?.authorizationNumber || '-'} />
                <InfoRow
                  label="Expiration"
                  value={structure?.expiryDate ? formatDateTime(new Date(structure.expiryDate)) : '-'}
                />
              </>
            )}
            {!isSub && (
              <div className="text-xs text-muted-foreground">
                Documents principaux visibles ci-dessous.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Statistics2 items={documentItems} />

      <div className="grid gap-5 items-stretch">
        <StructureDetailsOrders shifts={overview?.upcomingShifts} />
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'success' | 'warning';
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span
        className={cn(
          'text-sm font-medium text-foreground text-right',
          tone === 'warning' && 'text-amber-600 dark:text-amber-400',
          tone === 'success' && 'text-emerald-600 dark:text-emerald-400',
        )}
      >
        {value}
      </span>
    </div>
  );
}
