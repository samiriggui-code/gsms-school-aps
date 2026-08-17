import type { ReportDocumentBrand } from '@/lib/reports/document-brand';
import { FINANCE_DOC_THEME as T } from './finance-document-theme';
import type { FinanceDevisDocumentKind, FinanceDevisPdfRow } from './finance-devis-types';
import {
  buildDocumentClientBlock,
  clientVisibleDocumentNotes,
  formatDocumentDate,
} from './finance-devis-document-view';
import { decimalNum, moneyFr } from './finance-devis-html-core';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function documentTitle(kind: FinanceDevisDocumentKind): string {
  return kind === 'facture' ? 'FACTURE' : 'DEVIS';
}

function legalFooter(kind: FinanceDevisDocumentKind, validUntil: string | Date | null | undefined): string {
  if (kind === 'facture') {
    return 'Facture établie conformément aux dispositions en vigueur. TVA sur les débits sauf mention contraire. En cas de retard de paiement, pénalités au taux légal et indemnité forfaitaire de recouvrement de 40 € (art. L.441-10 C. com.).';
  }
  return `Devis non contractuel — offre valable jusqu'au ${formatDocumentDate(validUntil)} sauf rétractation. Montants exprimés en euros.`;
}

const DOCUMENT_CSS = `
  @page { size: A4; margin: 10mm 12mm 12mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: ${T.pageBg}; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: ${T.textBody}; font-size: 10pt; line-height: 1.5; }
  .page {
    max-width: 210mm; min-height: 297mm; margin: 10px auto; background: ${T.surface};
    box-shadow: 0 4px 24px rgba(2,132,199,.12); display: flex; flex-direction: column;
    border-radius: 4px; overflow: hidden;
  }
  @media print {
    html, body { background: #fff; }
    .page { margin: 0; max-width: none; min-height: 297mm; box-shadow: none; border-radius: 0; }
    .no-print { display: none !important; }
    .doc-footer { break-inside: avoid; }
  }
  .accent-bar { height: 5px; background: linear-gradient(90deg, ${T.primary} 0%, ${T.primaryMid} 50%, ${T.primaryLight} 100%); }
  .print-bar { max-width: 210mm; margin: 8px auto 0; padding: 0 8px; }
  .print-bar button {
    background: ${T.primary}; color: #fff; border: none; padding: 9px 18px;
    border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 600;
  }
  .print-bar button:hover { background: ${T.primaryDark}; }
  .top {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 28px;
    padding: 28px 36px 22px; background: linear-gradient(180deg, ${T.pageBg} 0%, ${T.surface} 100%);
    border-bottom: 1px solid ${T.border};
  }
  .issuer-row { display: flex; gap: 14px; align-items: flex-start; flex: 1; min-width: 0; }
  .issuer-row .icon { width: 44px; height: 44px; object-fit: contain; flex-shrink: 0; }
  .issuer-name { font-size: 12pt; font-weight: 700; color: ${T.text}; margin-bottom: 5px; }
  .issuer-line { margin: 0 0 3px; font-size: 8.5pt; color: ${T.textMuted}; line-height: 1.45; }
  .doc-card {
    flex-shrink: 0; width: 200px; text-align: right;
    background: ${T.surface}; border: 1px solid ${T.border}; border-radius: 10px;
    padding: 14px 16px; box-shadow: 0 2px 8px rgba(2,132,199,.08);
  }
  .doc-card .badge {
    display: inline-block; background: ${T.primary}; color: #fff;
    font-size: 9pt; font-weight: 800; letter-spacing: 0.12em;
    padding: 5px 14px; border-radius: 6px; margin-bottom: 8px;
  }
  .doc-card .ref { font-size: 14pt; font-weight: 700; font-family: ui-monospace, monospace; color: ${T.text}; margin-bottom: 10px; }
  .doc-card table { margin-left: auto; border-collapse: collapse; font-size: 8.5pt; width: 100%; }
  .doc-card td { padding: 3px 0; vertical-align: top; }
  .doc-card td.lbl { color: ${T.textMuted}; text-align: left; width: 42%; }
  .doc-card td.val { color: ${T.text}; font-weight: 600; text-align: right; }
  .client-band {
    display: flex; justify-content: flex-end; padding: 0 36px 20px;
  }
  .client-box {
    width: 200px; text-align: right;
  }
  .client-box .lbl { font-size: 7pt; font-weight: 700; letter-spacing: 0.1em; color: ${T.primary}; margin-bottom: 6px; text-transform: uppercase; }
  .client-name { font-size: 11pt; font-weight: 700; color: ${T.text}; margin-bottom: 5px; }
  .client-line { margin: 0 0 2px; font-size: 9pt; color: ${T.textMuted}; }
  .body { flex: 1; display: flex; flex-direction: column; padding: 24px 36px 20px; }
  .content-main { flex: 1; }
  table.lines { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 20px; font-size: 9.5pt; border-radius: 8px; overflow: hidden; border: 1px solid ${T.border}; }
  table.lines thead th {
    background: ${T.primary}; color: #fff; font-size: 7.5pt; font-weight: 700;
    letter-spacing: 0.05em; text-transform: uppercase; padding: 11px 12px; text-align: left;
  }
  table.lines thead th.num { text-align: right; }
  table.lines tbody td { padding: 10px 12px; border-bottom: 1px solid ${T.borderSoft}; vertical-align: top; }
  table.lines tbody tr:nth-child(even) td { background: ${T.pageBg}; }
  table.lines tbody tr:last-child td { border-bottom: none; }
  table.lines td.num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .bottom-block { display: flex; justify-content: flex-end; align-items: flex-start; gap: 24px; margin-top: 8px; }
  .totals {
    width: 250px; border: 1px solid ${T.border}; border-radius: 10px; overflow: hidden;
    box-shadow: 0 2px 10px rgba(2,132,199,.1);
  }
  .totals .row { display: flex; justify-content: space-between; padding: 9px 14px; font-size: 9.5pt; background: ${T.surface}; border-bottom: 1px solid ${T.borderSoft}; }
  .totals .row.ttc { background: ${T.primary}; color: #fff; font-size: 11pt; font-weight: 700; border-bottom: none; padding: 12px 14px; }
  .client-note {
    margin-top: 16px; padding: 12px 14px; background: ${T.pageBg};
    border: 1px solid ${T.borderSoft}; border-radius: 8px; font-size: 9pt; color: ${T.textMuted};
  }
  .client-note strong { display: block; font-size: 7pt; letter-spacing: 0.08em; color: ${T.primary}; margin-bottom: 4px; }
  .doc-footer {
    margin-top: auto; border-top: 1px solid ${T.border}; padding: 18px 36px 22px;
    background: linear-gradient(180deg, ${T.surface} 0%, ${T.pageBg} 100%);
  }
  .doc-footer .row { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; }
  .doc-footer .brand { display: flex; gap: 12px; align-items: flex-start; max-width: 70%; }
  .doc-footer .brand img { width: 30px; height: 30px; object-fit: contain; }
  .doc-footer .brand .fn { font-size: 9pt; font-weight: 700; color: ${T.text}; margin: 0 0 4px; }
  .doc-footer .brand p { margin: 0 0 2px; font-size: 7.5pt; color: ${T.textMuted}; line-height: 1.45; }
  .doc-footer .qualiopi img { height: 44px; width: auto; }
  .doc-footer .legal { margin-top: 12px; padding-top: 10px; border-top: 1px solid ${T.borderSoft}; font-size: 7pt; color: ${T.textLight}; text-align: center; line-height: 1.55; }
`;

/** Document HTML A4 — charte sky landing, mise en page aérée. */
export function buildFinanceDevisBrandedHtml(
  row: FinanceDevisPdfRow,
  kind: FinanceDevisDocumentKind,
  brand: ReportDocumentBrand,
): string {
  const docType = documentTitle(kind);
  const client = buildDocumentClientBlock(row);
  const visibleNotes = clientVisibleDocumentNotes(row.notes);
  const lines = Array.isArray(row.lines) ? (row.lines as Record<string, unknown>[]) : [];

  const lineRows = lines
    .map((l) => {
      const lineLabel = typeof l.label === 'string' ? l.label : '';
      const qty = Number(l.quantity ?? 1) || 0;
      const unit = Number(l.unitPriceHt ?? 0) || 0;
      const vat = Number(l.vatRate ?? 0) || 0;
      const ht = qty * unit;
      return `<tr>
        <td>${esc(lineLabel)}</td>
        <td class="num">${qty}</td>
        <td class="num">${moneyFr(unit, row.currency)}</td>
        <td class="num">${vat}&nbsp;%</td>
        <td class="num">${moneyFr(ht, row.currency)}</td>
      </tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${docType} ${esc(row.referenceCode)}</title>
  <style>${DOCUMENT_CSS}</style>
</head>
<body>
  <div class="print-bar no-print">
    <button type="button" onclick="window.print()">Imprimer ou enregistrer en PDF</button>
  </div>
  <article class="page">
    <div class="accent-bar" aria-hidden="true"></div>
    <header class="top">
      <div class="issuer-row">
        <img class="icon" src="${esc(brand.iconUrl)}" alt="${esc(brand.companyName)}" />
        <div>
          <div class="issuer-name">${esc(brand.companyName)}</div>
          ${brand.addressLine ? `<p class="issuer-line">${esc(brand.addressLine)}</p>` : ''}
        </div>
      </div>
      <div class="doc-card">
        <div class="badge">${docType}</div>
        <div class="ref">${esc(row.referenceCode)}</div>
        <table>
          <tr><td class="lbl">Date</td><td class="val">${esc(formatDocumentDate(row.updatedAt))}</td></tr>
          ${kind === 'devis' ? `<tr><td class="lbl">Validité</td><td class="val">${esc(formatDocumentDate(row.validUntil))}</td></tr>` : ''}
        </table>
      </div>
    </header>

    <div class="client-band">
      <div class="client-box">
        <div class="lbl">Client</div>
        <div class="client-name">${esc(client.title)}</div>
        ${client.lines.map((l) => `<p class="client-line">${esc(l)}</p>`).join('')}
      </div>
    </div>

    <div class="body">
      <div class="content-main">
        <table class="lines">
          <thead>
            <tr>
              <th style="width:44%">Désignation</th>
              <th class="num" style="width:8%">Qté</th>
              <th class="num" style="width:16%">P.U. HT</th>
              <th class="num" style="width:10%">TVA</th>
              <th class="num" style="width:18%">Montant HT</th>
            </tr>
          </thead>
          <tbody>
            ${lineRows || '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:28px">Aucune ligne</td></tr>'}
          </tbody>
        </table>

        <div class="bottom-block">
          <div class="totals">
            <div class="row"><span>Total HT</span><span>${moneyFr(decimalNum(row.subtotalHt), row.currency)}</span></div>
            <div class="row"><span>TVA</span><span>${moneyFr(decimalNum(row.vatTotal), row.currency)}</span></div>
            <div class="row ttc"><span>Total TTC</span><span>${moneyFr(decimalNum(row.totalTtc), row.currency)}</span></div>
          </div>
        </div>

        ${visibleNotes ? `<div class="client-note"><strong>Mentions</strong>${esc(visibleNotes)}</div>` : ''}
      </div>
    </div>

    <footer class="doc-footer">
      <div class="row">
        <div class="brand">
          <img src="${esc(brand.iconUrl)}" alt="" />
          <div>
            <p class="fn">${esc(brand.companyName)}</p>
            ${brand.addressLine ? `<p>${esc(brand.addressLine)}</p>` : ''}
            ${brand.legalLine ? `<p>${esc(brand.legalLine)}</p>` : ''}
            ${brand.contactLine ? `<p>${esc(brand.contactLine)}</p>` : ''}
          </div>
        </div>
        ${brand.qualiopiLogoUrl ? `<div class="qualiopi"><img src="${esc(brand.qualiopiLogoUrl)}" alt="Certification Qualiopi" /></div>` : ''}
      </div>
      <p class="legal">${esc(legalFooter(kind, row.validUntil))}</p>
    </footer>
  </article>
</body>
</html>`;
}
