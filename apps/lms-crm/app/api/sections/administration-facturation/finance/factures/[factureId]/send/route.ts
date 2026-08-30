import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FinanceInvoiceStatus } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { createWorkflowEngine } from '@repo/api-core';
import { sendFinanceFactureEmail } from '@repo/mail';
import { loadFinanceDevisPdfRow } from '@/lib/finance/load-finance-devis-pdf-row';
import { buildFinanceDevisPdfBuffer } from '@/lib/finance/finance-devis-pdf';
import { resolveDevisClientContact } from '@/lib/finance/resolve-devis-client-contact';

type Ctx = { params: Promise<{ factureId: string }> };

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

function moneyFr(value: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

type Body = { message?: string };

/** Envoie la facture (PDF joint) au client — id = FinanceInvoice. */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;

  let body: Body = {};
  try {
    if (request.headers.get('content-length') && Number(request.headers.get('content-length')) > 0) {
      body = (await request.json()) as Body;
    }
  } catch {
    body = {};
  }

  try {
    const invoice = await prisma.financeInvoice.findUnique({
      where: { id: factureId },
      select: { id: true, devisId: true, number: true, status: true, totalTtc: true, currency: true },
    });
    if (!invoice) return fail('Facture introuvable.', 404);
    if (invoice.status === FinanceInvoiceStatus.CANCELLED) {
      return fail('Facture annulée : envoi impossible.', 409);
    }

    const row = await loadFinanceDevisPdfRow(invoice.devisId);
    if (!row) return fail('Devis lié introuvable.', 404);
    const rowForDoc = { ...row, referenceCode: invoice.number };

    const contact = resolveDevisClientContact({
      lead: row.lead,
      clientSnapshot: row.clientSnapshot,
    });
    if (!contact.email) {
      return fail(
        'Aucun e-mail destinataire : renseignez le contact lead ou l’e-mail dans le contexte client du dossier.',
        400,
      );
    }

    const { buffer, filename } = await buildFinanceDevisPdfBuffer(rowForDoc, 'facture');

    const recipientName =
      [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || 'Madame, Monsieur';
    const message = (body.message ?? '').trim() || null;

    await sendFinanceFactureEmail({
      to: contact.email,
      recipientName,
      referenceCode: invoice.number,
      title: row.title,
      totalTtc: moneyFr(decimalNum(invoice.totalTtc), invoice.currency),
      message,
      pdfBuffer: buffer,
      pdfFilename: filename,
    });

    await prisma.financeInvoice.update({
      where: { id: invoice.id },
      data: { status: FinanceInvoiceStatus.SENT },
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.finance.facture.sent',
        {
          factureId: invoice.id,
          referenceCode: invoice.number,
          recipientEmail: contact.email,
        },
        { dedupeKey: `workflow:facture-sent:${invoice.id}:${Date.now()}` },
      );
    } catch (e) {
      console.error('[finance-factures send] workflow', e);
    }

    return ok({
      sent: true,
      recipientEmail: contact.email,
    });
  } catch (e) {
    console.error('[finance-factures send]', e);
    return fail('Envoi impossible.', 500, e);
  }
}
