import { loadReportDocumentBrand } from '@/lib/reports/document-brand';
import { buildFinanceDevisBrandedHtml } from './finance-devis-branded-document';
import type { FinanceDevisDocumentKind, FinanceDevisPdfRow } from './finance-devis-types';

export { decimalNum, moneyFr } from './finance-devis-html-core';

/** HTML imprimable A4 avec charte école (logo, pied de page Qualiopi). */
export async function buildFinanceDevisHtml(
  row: FinanceDevisPdfRow,
  kind: FinanceDevisDocumentKind = 'devis',
  origin?: string,
): Promise<string> {
  const brand = await loadReportDocumentBrand(origin);
  return buildFinanceDevisBrandedHtml(row, kind, brand);
}
