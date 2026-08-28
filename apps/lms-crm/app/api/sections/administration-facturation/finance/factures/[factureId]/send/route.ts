import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus } from '@repo/database';
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

async function assertAcceptedFacture(factureId: string) {
  const row = await prisma.financeDevis.findUnique({
    where: { id: factureId },
    select: { id: true, status: true },
  });
  if (!row) return { ok: false as const, status: 404, message: 'Dossier introuvable.' };
  if (row.status !== FinanceDevisStatus.ACCEPTED) {
    return {
      ok: false as const,
      status: 404,
      message: 'Ce dossier ne figure pas dans les propositions acceptées à facturer.',
    };
  }
  return { ok: true as const };
}

type Body = { message?: string };

/** Envoie la facture (PDF joint) au client par e-mail — pas de plaquette (pas de portail client facture). */
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
    const check = await assertAcceptedFacture(factureId);
    if (!check.ok) return fail(check.message, check.status);

    const row = await loadFinanceDevisPdfRow(factureId);
    if (!row) return fail('Dossier introuvable.', 404);

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

    const { buffer, filename } = await buildFinanceDevisPdfBuffer(row, 'facture');

    const recipientName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || 'Madame, Monsieur';
    const message = (body.message ?? '').trim() || null;

    await sendFinanceFactureEmail({
      to: contact.email,
      recipientName,
      referenceCode: row.referenceCode,
      title: row.title,
      totalTtc: moneyFr(decimalNum(row.totalTtc), row.currency),
      message,
      pdfBuffer: buffer,
      pdfFilename: filename,
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.finance.facture.sent',
        {
          factureId,
          referenceCode: row.referenceCode,
          recipientEmail: contact.email,
        },
        { dedupeKey: `workflow:facture-sent:${factureId}:${Date.now()}` },
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
