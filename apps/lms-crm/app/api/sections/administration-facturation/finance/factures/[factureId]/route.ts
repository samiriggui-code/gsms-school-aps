import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FinanceInvoiceStatus, Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { getStoredFinancePdf } from '@/lib/finance/store-finance-pdf-asset';
import { summarizePayments } from '@/lib/finance/finance-payment-summary';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

/**
 * OF-06 — détail d’une `FinanceInvoice` (pas de lazy-create : 404 si absente).
 */

type Ctx = { params: Promise<{ factureId: string }> };

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const { factureId } = await context.params;

  try {
    const invoice = await prisma.financeInvoice.findUnique({
      where: { id: factureId },
      include: {
        devis: {
          include: {
            lead: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                notes: true,
                source: true,
              },
            },
            formation: {
              select: { id: true, name: true, slug: true },
            },
            candidature: {
              select: { id: true, status: true, userId: true },
            },
            formationSession: {
              select: { id: true, dateDisplayLabel: true, location: true },
            },
          },
        },
      },
    });

    if (!invoice) return fail('Facture introuvable.', 404);

    const devis = invoice.devis;
    const invoicePdfAsset = await getStoredFinancePdf(invoice.id, 'invoice-pdf');
    const payments = await prisma.financePayment.findMany({
      where: { devisId: devis.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        referenceCode: true,
        amount: true,
        currency: true,
        status: true,
        method: true,
        paidAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const totalTtc = decimalNum(invoice.totalTtc);
    const paymentSummary = summarizePayments(
      totalTtc,
      payments.map((p) => ({ amount: p.amount, status: p.status })),
    );

    return ok({
      id: invoice.id,
      invoiceId: invoice.id,
      devisId: devis.id,
      referenceCode: invoice.number,
      number: invoice.number,
      kind: invoice.kind,
      title: devis.title,
      status: invoice.status,
      devisStatus: devis.status,
      devisReferenceCode: devis.referenceCode,
      clientSnapshot: devis.clientSnapshot,
      lines: invoice.lines,
      subtotalHt: decimalNum(invoice.subtotalHt),
      vatTotal: decimalNum(invoice.vatTotal),
      totalTtc,
      currency: invoice.currency,
      validUntil: devis.validUntil?.toISOString() ?? null,
      notes: invoice.notes ?? devis.notes,
      internalNotes: devis.internalNotes,
      issuedAt: invoice.issuedAt.toISOString(),
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      leadId: devis.leadId,
      formationId: devis.formationId,
      candidatureId: devis.candidatureId,
      formationSessionId: devis.formationSessionId,
      lead: devis.lead,
      formation: devis.formation,
      candidature: devis.candidature,
      formationSession: devis.formationSession,
      einvoiceStatus: invoice.einvoiceStatus,
      einvoiceProfile: invoice.einvoiceProfile,
      einvoiceGeneratedAt: invoice.einvoiceGeneratedAt?.toISOString() ?? null,
      einvoicePdpMessageId: invoice.einvoicePdpMessageId,
      einvoiceLastError: invoice.einvoiceLastError,
      invoicePdf: invoicePdfAsset
        ? {
            id: invoicePdfAsset.id,
            url: invoicePdfAsset.url,
            originalName: invoicePdfAsset.originalName,
            size: invoicePdfAsset.size,
            createdAt: invoicePdfAsset.createdAt.toISOString(),
          }
        : null,
      paymentSummary,
      payments: payments.map((p) => ({
        id: p.id,
        referenceCode: p.referenceCode,
        amount: decimalNum(p.amount),
        currency: p.currency,
        status: p.status,
        method: p.method,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[finance-factures GET one]', e);
    return fail('Lecture impossible.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { factureId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  try {
    const existing = await prisma.financeInvoice.findUnique({
      where: { id: factureId },
      select: { id: true, status: true },
    });
    if (!existing) return fail('Facture introuvable.', 404);

    const data: Prisma.FinanceInvoiceUpdateInput = {};

    if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes as string | null;

    if ('status' in body && typeof body.status === 'string') {
      const allowed = new Set(Object.values(FinanceInvoiceStatus) as string[]);
      if (!allowed.has(body.status)) return fail('Statut facture invalide.', 400);
      data.status = body.status as FinanceInvoiceStatus;
    }

    const updated = await prisma.financeInvoice.update({
      where: { id: factureId },
      data,
      select: {
        id: true,
        number: true,
        status: true,
        notes: true,
        updatedAt: true,
      },
    });

    return ok({
      id: updated.id,
      referenceCode: updated.number,
      number: updated.number,
      status: updated.status,
      notes: updated.notes,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error('[finance-factures PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { factureId } = await context.params;

  try {
    const row = await prisma.financeInvoice.findUnique({
      where: { id: factureId },
      select: { id: true, number: true },
    });
    if (!row) return fail('Facture introuvable.', 404);

    return fail(
      `La facture ${row.number} ne peut pas être supprimée (numérotation légale). Passez-la en CANCELLED si besoin.`,
      409,
    );
  } catch (e) {
    console.error('[finance-factures DELETE]', e);
    return fail('Suppression impossible.', 500, e);
  }
}
