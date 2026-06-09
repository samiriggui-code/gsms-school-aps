export type FinanceDevisDocumentKind = 'devis' | 'facture';

export type FinanceDevisPdfRow = {
  id: string;
  referenceCode: string;
  title: string;
  clientSnapshot: unknown;
  lines: unknown;
  subtotalHt: unknown;
  vatTotal: unknown;
  totalTtc: unknown;
  currency: string;
  notes: string | null;
  lead: { firstName: string; lastName: string; email: string } | null;
  formation: { name: string } | null;
};

export type FinancePdfCategory = 'quote-pdf' | 'invoice-pdf';
