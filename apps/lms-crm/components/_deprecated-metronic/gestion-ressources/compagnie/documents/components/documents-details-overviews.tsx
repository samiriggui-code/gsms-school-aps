'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import { DocumentsDetailsOrders } from './documents-details-orders';
import { Statistics1 } from './details/statistics1';
import { Statistics2 } from './details/statistics2';

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

export function DocumentsDetailsOverviews({
  documents,
  overview,
  complianceStatus,
}: {
  documents: any;
  overview?: OverviewData;
  complianceStatus?: any;
}) {
  const isSub = documents?.type === 'SUBCONTRACTOR';
  const email = documents?.email || documents?.contactEmail || '-';
  const phone = documents?.phone || documents?.contactPhone || '-';
  const contactName = isSub
    ? [documents?.representativeFirstName, documents?.representativeLastName].filter(Boolean).join(' ')
    : documents?.contactName;
  const contactRole = isSub ? 'Représentant' : documents?.contactRole;

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

  const documentItems: Array<{ label: string; value: string; tone?: 'success' | 'warning' | 'muted' }> = [
    {
      label: 'Assurance',
      value: documents?.documentInsurance ? 'OK' : 'Manquante',
      tone: documents?.documentInsurance ? 'success' : 'warning',
    },
    {
      label: 'KBIS',
      value: documents?.documentKbis ? 'OK' : 'Manquant',
      tone: documents?.documentKbis ? 'success' : 'warning',
    },
    {
      label: 'Agrément',
      value: isSub ? (documents?.documentAgreement ? 'OK' : 'Manquant') : 'N/A',
      tone: isSub ? (documents?.documentAgreement ? 'success' : 'warning') : 'muted',
    },
    {
      label: 'Autorisation',
      value: isSub ? (documents?.authorizationNumber ? 'OK' : 'Manquante') : 'N/A',
      tone: isSub ? (documents?.authorizationNumber ? 'success' : 'warning') : 'muted',
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
            <InfoRow label="Service" value={documents?.service || documents?.specialty || '-'} />
            <InfoRow label="Email" value={email} />
            <InfoRow label="Contact" value={contactName || '-'} />
            <InfoRow label="Rôle" value={contactRole || '-'} />
            <InfoRow label="Adresse" value={documents?.address || '-'} />
            <InfoRow label="Ville" value={documents?.city || '-'} />
            <InfoRow label="Téléphone" value={phone} />
            <Separator />
            <InfoRow
              label="Ajouté le"
              value={documents?.createdAt ? formatDateTime(new Date(documents.createdAt)) : '-'}
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
                <InfoRow label="Agrément" value={documents?.agreementNumber || '-'} />
                <InfoRow label="Autorisation" value={documents?.authorizationNumber || '-'} />
                <InfoRow
                  label="Expiration"
                  value={documents?.expiryDate ? formatDateTime(new Date(documents.expiryDate)) : '-'}
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
        <DocumentsDetailsOrders shifts={overview?.upcomingShifts} />
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
