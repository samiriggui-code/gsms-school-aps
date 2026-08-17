/** Libellés statut proposition commerciale / dossier finance (alignés sur `FinanceDevisStatus`). */
export const FACTURE_STATUS_LABEL_FR: Record<string, string> = {
  DRAFT: 'Brouillon',
  SENT: 'Envoyé',
  ACCEPTED: 'Accepté',
  REJECTED: 'Refusé',
  EXPIRED: 'Expiré',
};

export const INVOICE_PAYMENT_STATUS_LABEL_FR: Record<string, string> = {
  PAID: 'Payée',
  PARTIAL: 'Partiellement payée',
  UNPAID: 'À encaisser',
};

export function invoicePaymentBadgeVariant(
  status: string,
): 'success' | 'warning' | 'secondary' {
  if (status === 'PAID') return 'success';
  if (status === 'PARTIAL') return 'warning';
  return 'secondary';
}
