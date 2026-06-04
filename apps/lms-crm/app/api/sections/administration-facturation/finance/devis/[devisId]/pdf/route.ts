import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';

type Ctx = { params: Promise<{ devisId: string }> };

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

function moneyFr(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

/** Aperçu imprimable (HTML) du devis — impression navigateur « Enregistrer au format PDF ». */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { devisId } = await context.params;

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      include: {
        lead: { select: { firstName: true, lastName: true, email: true } },
        formation: { select: { name: true } },
      },
    });
    if (!row) return new NextResponse('Devis introuvable', { status: 404 });

    const lines = Array.isArray(row.lines) ? (row.lines as Record<string, unknown>[]) : [];
    const snap = row.clientSnapshot && typeof row.clientSnapshot === 'object' && !Array.isArray(row.clientSnapshot)
      ? (row.clientSnapshot as Record<string, unknown>)
      : {};

    const lineRows = lines
      .map((l) => {
        const label = typeof l.label === 'string' ? l.label : '';
        const qty = Number(l.quantity ?? 1) || 0;
        const unit = Number(l.unitPriceHt ?? 0) || 0;
        const vat = Number(l.vatRate ?? 0) || 0;
        const ht = qty * unit;
        return `<tr><td>${esc(label)}</td><td style="text-align:right">${qty}</td><td style="text-align:right">${moneyFr(unit, row.currency)}</td><td style="text-align:right">${vat}%</td><td style="text-align:right">${moneyFr(ht, row.currency)}</td></tr>`;
      })
      .join('');

    const snapRows = Object.entries(snap)
      .filter(([, v]) => v != null && String(v).trim() !== '')
      .map(([k, v]) => `<tr><td style="font-weight:600">${esc(k)}</td><td>${esc(String(v))}</td></tr>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Devis ${esc(row.referenceCode)}</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; color: #111; }
    h1 { font-size: 1.25rem; margin-bottom: 4px; }
    .muted { color: #555; font-size: 0.875rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ccc; padding: 8px; font-size: 0.875rem; }
    th { background: #f4f4f4; text-align: left; }
    .totals { margin-top: 16px; max-width: 320px; margin-left: auto; }
    .totals td { border: none; padding: 4px 0; }
    @media print { body { margin: 12mm; } }
  </style>
</head>
<body>
  <h1>Devis ${esc(row.referenceCode)}</h1>
  <p class="muted">${esc(row.title)}</p>
  ${row.lead ? `<p><strong>Client :</strong> ${esc(row.lead.firstName)} ${esc(row.lead.lastName)} — ${esc(row.lead.email)}</p>` : ''}
  ${row.formation ? `<p><strong>Formation :</strong> ${esc(row.formation.name)}</p>` : ''}
  <h2 style="font-size:1rem;margin-top:20px">Lignes</h2>
  <table>
    <thead><tr><th>Libellé</th><th style="text-align:right">Qté</th><th style="text-align:right">PU HT</th><th style="text-align:right">TVA</th><th style="text-align:right">Montant HT</th></tr></thead>
    <tbody>${lineRows || '<tr><td colspan="5">Aucune ligne</td></tr>'}</tbody>
  </table>
  ${snapRows ? `<h2 style="font-size:1rem;margin-top:20px">Contexte client</h2><table>${snapRows}</table>` : ''}
  <table class="totals">
    <tr><td>Sous-total HT</td><td style="text-align:right">${moneyFr(decimalNum(row.subtotalHt), row.currency)}</td></tr>
    <tr><td>TVA</td><td style="text-align:right">${moneyFr(decimalNum(row.vatTotal), row.currency)}</td></tr>
    <tr><td><strong>Total TTC</strong></td><td style="text-align:right"><strong>${moneyFr(decimalNum(row.totalTtc), row.currency)}</strong></td></tr>
  </table>
  ${row.notes ? `<h2 style="font-size:1rem;margin-top:20px">Notes</h2><pre style="white-space:pre-wrap;font-family:inherit">${esc(row.notes)}</pre>` : ''}
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="devis-${row.referenceCode}.html"`,
      },
    });
  } catch (e) {
    console.error('[finance-devis pdf]', e);
    return new NextResponse('Erreur', { status: 500 });
  }
}
