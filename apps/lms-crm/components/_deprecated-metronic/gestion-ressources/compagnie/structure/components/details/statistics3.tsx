'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatDateTime } from '@/lib/helpers';

type BillingSummary = {
  totalInvoices?: number;
  openInvoices?: number;
  amountThisMonth?: number;
  currency?: string | null;
  lastInvoiceDate?: string | null;
};

export function Statistics3({ summary }: { summary?: BillingSummary }) {
  const formatCount = (value?: number) =>
    new Intl.NumberFormat('fr-FR').format(value ?? 0);

  const formatCurrency = (amount?: number, currency?: string | null) => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency || 'EUR',
      }).format(amount ?? 0);
    } catch {
      return `${(amount ?? 0).toFixed(2)} ${currency || 'EUR'}`;
    }
  };

  const items = [
    {
      value: formatCount(summary?.totalInvoices),
      label: 'Factures liées',
    },
    {
      value: formatCount(summary?.openInvoices),
      label: 'En attente',
    },
    {
      value: formatCurrency(summary?.amountThisMonth, summary?.currency),
      label: 'Montant mois',
    },
    {
      value: summary?.lastInvoiceDate ? formatDateTime(new Date(summary.lastInvoiceDate)) : '-',
      label: 'Dernière facture',
    },
  ];

  return (
    <Card className="rounded-xl border border-border/60 bg-muted/20 p-1 shadow-none">
      <CardContent className="rounded-xl p-0 bg-background border border-border/60">
        <div className="grid sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {items.map((item, index) => (
            <div key={index} className="px-5 py-4 space-y-1">
              <div className="text-xl font-semibold text-foreground">
                {item.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
