'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ProfilDetailsInvoices } from './profil-details-invoice';
import { Statistics4 } from './details/statistics4';

type BillingSummary = {
  totalInvoices?: number;
  openInvoices?: number;
  paidInvoices?: number;
  overdueInvoices?: number;
  amountThisMonth?: number;
  currency?: string | null;
  lastInvoiceDate?: string | null;
};

type OverviewData = {
  billingSummary?: BillingSummary;
  recentInvoices?: Array<{
    id: string;
    invoiceNumber: string;
    amount?: number;
    total?: number;
    currency?: string | null;
    status?: string | null;
    invoiceDate: string;
    dueDate?: string | null;
    customerName?: string | null;
  }>;
};

export function ProfilDetailsBilling({
  overview,
}: {
  overview?: OverviewData;
}) {
  const summary = overview?.billingSummary || {
    totalInvoices: 0,
    openInvoices: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    amountThisMonth: 0,
    currency: 'EUR',
    lastInvoiceDate: null,
  };

  const invoices = overview?.recentInvoices || [];

  return (
    <div className="space-y-5">
      <Statistics4
        total={summary.totalInvoices}
        paid={summary.paidInvoices}
        open={summary.openInvoices}
        overdue={summary.overdueInvoices}
      />
      <ProfilDetailsInvoices invoices={invoices} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/administration-facturation/finance/factures">Voir le module facturation</Link>
        </Button>
      </div>
    </div>
  );
}
