'use client';

import { Calendar, FileText, ShieldAlert, ShieldCheck, UserPlus, History, ClipboardList } from 'lucide-react';
import { TimelineItem } from './timeline-item';
import { formatDateTime } from '@/lib/helpers';

type OverviewData = {
  billingSummary?: {
    lastInvoiceDate?: string | null;
  };
  upcomingShifts?: Array<{
    startAt: string;
    endAt: string;
    siteName: string;
    agentName: string;
  }>;
  metrics?: {
    complianceAlerts?: number;
  };
};

export function ActivityPage({
  documents,
  overview,
  complianceStatus,
}: {
  documents: any;
  overview?: OverviewData;
  complianceStatus?: any;
}) {
  const createdAt = documents?.createdAt ? formatDateTime(new Date(documents.createdAt)) : null;
  const updatedAt = documents?.updatedAt ? formatDateTime(new Date(documents.updatedAt)) : null;
  const statusLabel = documents?.status === 'ACTIVE' ? 'Actif' : 'Inactif';
  const complianceLabel =
    complianceStatus?.status === 'COMPLIANT'
      ? 'Conforme'
      : complianceStatus?.status === 'WARNING'
      ? 'Alerte'
      : complianceStatus?.status === 'NON_COMPLIANT'
      ? 'Non conforme'
      : null;

  const docList = [
    documents?.documentInsurance,
    documents?.documentKbis,
    ...(documents?.type === 'SUBCONTRACTOR' ? [documents?.documentAgreement] : []),
  ];
  const missingDocsCount = docList.filter((doc) => !doc).length;

  const lastInvoiceDate = overview?.billingSummary?.lastInvoiceDate
    ? formatDateTime(new Date(overview.billingSummary.lastInvoiceDate))
    : null;

  const nextShift = overview?.upcomingShifts?.[0];
  const nextShiftDate = nextShift?.startAt ? formatDateTime(new Date(nextShift.startAt)) : null;

  const items = [
    {
      show: !!updatedAt,
      icon: History,
      className: 'text-blue-500',
      title: 'Derniere mise a jour du partenaire',
      subtitle: updatedAt ? `${updatedAt}` : '',
    },
    {
      show: !!createdAt,
      icon: UserPlus,
      className: 'text-emerald-500',
      title: 'Compte partenaire cree',
      subtitle: createdAt ? `${createdAt}` : '',
    },
    {
      show: true,
      icon: ClipboardList,
      className: documents?.status === 'ACTIVE' ? 'text-emerald-500' : 'text-amber-500',
      title: 'Statut du compte',
      subtitle: `Statut actuel: ${statusLabel}`,
    },
    {
      show: !!complianceLabel,
      icon: complianceStatus?.status === 'COMPLIANT' ? ShieldCheck : ShieldAlert,
      className: complianceStatus?.status === 'COMPLIANT' ? 'text-emerald-500' : 'text-amber-500',
      title: 'Conformite',
      subtitle: complianceLabel ? `Etat: ${complianceLabel}` : '',
    },
    {
      show: true,
      icon: FileText,
      className: missingDocsCount > 0 ? 'text-amber-500' : 'text-emerald-500',
      title: 'Documents administratifs',
      subtitle: missingDocsCount > 0 ? `${missingDocsCount} document(s) manquant(s)` : 'Documents complets',
    },
    {
      show: !!lastInvoiceDate,
      icon: FileText,
      className: 'text-blue-500',
      title: 'Derniere facture',
      subtitle: lastInvoiceDate || '',
    },
    {
      show: !!nextShiftDate,
      icon: Calendar,
      className: 'text-purple-500',
      title: 'Prochaine mission',
      subtitle: nextShiftDate ? `${nextShiftDate} • ${nextShift?.siteName || '-'}` : '',
    },
  ].filter((item) => item.show);

  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucune activite recente pour ce partenaire.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <TimelineItem
          key={`${item.title}-${index}`}
          icon={item.icon}
          className={item.className}
          line={index < items.length - 1}
        >
          <div className="flex flex-col gap-1">
            <div className="text-sm font-semibold text-gray-900">{item.title}</div>
            {item.subtitle ? (
              <div className="text-xs text-muted-foreground">{item.subtitle}</div>
            ) : null}
          </div>
        </TimelineItem>
      ))}
    </div>
  );
}
