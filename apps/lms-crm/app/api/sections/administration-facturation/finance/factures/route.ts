import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import {
  FinanceInvoiceKind,
  FinanceInvoiceStatus,
  Prisma,
} from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  summarizePayments,
  summarizePaymentsByDevisId,
} from '@/lib/finance/finance-payment-summary';
import {
  emitInvoiceFromDevis,
  FinanceInvoiceError,
} from '@/lib/finance/finance-invoice-service';

function decimalNum(d: Prisma.Decimal | null | undefined): number {
  if (d == null) return 0;
  return typeof d === 'object' && 'toNumber' in d ? d.toNumber() : Number(d);
}

function companyFromClientSnapshot(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const c = (raw as Record<string, unknown>).company;
  if (typeof c !== 'string') return null;
  const t = c.trim();
  return t.length ? t : null;
}

/**
 * OF-06 — liste des factures émises (`FinanceInvoice`).
 * Query `view=pending` : devis ACCEPTED sans facture FULL active (à émettre).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const view = (sp.get('view') ?? 'invoices').trim();
  const leadIdFilter = (sp.get('leadId') ?? '').trim();
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page') || 1), 1);
  const limit = Math.min(Math.max(Number(sp.get('limit') || 20), 1), 100);
  const skip = (page - 1) * limit;
  const sortRaw = (sp.get('sort') ?? 'issuedAt').trim();
  const dir = sp.get('dir') === 'asc' ? 'asc' : 'desc';

  try {
    if (view === 'pending') {
      const where: Prisma.FinanceDevisWhereInput = {
        status: 'ACCEPTED',
        invoices: {
          none: {
            kind: FinanceInvoiceKind.FULL,
            status: { not: FinanceInvoiceStatus.CANCELLED },
          },
        },
        ...(leadIdFilter ? { leadId: leadIdFilter } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: 'insensitive' } },
                { referenceCode: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      };
      const [total, rows] = await Promise.all([
        prisma.financeDevis.count({ where }),
        prisma.financeDevis.findMany({
          where,
          orderBy: { updatedAt: dir },
          skip,
          take: limit,
          select: {
            id: true,
            referenceCode: true,
            title: true,
            status: true,
            totalTtc: true,
            currency: true,
            updatedAt: true,
            lead: { select: { id: true, firstName: true, lastName: true, email: true } },
            formation: { select: { id: true, name: true, slug: true } },
          },
        }),
      ]);
      return ok({
        view: 'pending',
        stats: { total, montantTtcTotal: 0, avecFormation: 0, sansFormation: 0 },
        items: rows.map((r) => ({
          id: r.id,
          devisId: r.id,
          referenceCode: r.referenceCode,
          title: r.title,
          status: r.status,
          totalTtc: decimalNum(r.totalTtc),
          currency: r.currency,
          updatedAt: r.updatedAt.toISOString(),
          lead: r.lead,
          formation: r.formation,
          invoiceId: null as string | null,
        })),
        pagination: { page, limit, total },
      });
    }

    let orderBy: Prisma.FinanceInvoiceOrderByWithRelationInput = { issuedAt: dir };
    if (sortRaw === 'number' || sortRaw === 'referenceCode') orderBy = { number: dir };
    else if (sortRaw === 'totalTtc') orderBy = { totalTtc: dir };
    else if (sortRaw === 'status') orderBy = { status: dir };
    else if (sortRaw === 'updatedAt') orderBy = { updatedAt: dir };
    else if (sortRaw === 'issuedAt') orderBy = { issuedAt: dir };

    const where: Prisma.FinanceInvoiceWhereInput = {
      ...(leadIdFilter ? { devis: { leadId: leadIdFilter } } : {}),
      ...(q
        ? {
            OR: [
              { number: { contains: q, mode: 'insensitive' } },
              { devis: { title: { contains: q, mode: 'insensitive' } } },
              { devis: { referenceCode: { contains: q, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [total, sumAgg, rows] = await Promise.all([
      prisma.financeInvoice.count({ where }),
      prisma.financeInvoice.aggregate({ where, _sum: { totalTtc: true } }),
      prisma.financeInvoice.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          number: true,
          kind: true,
          status: true,
          subtotalHt: true,
          vatTotal: true,
          totalTtc: true,
          currency: true,
          issuedAt: true,
          createdAt: true,
          updatedAt: true,
          einvoiceStatus: true,
          devisId: true,
          devis: {
            select: {
              id: true,
              referenceCode: true,
              title: true,
              status: true,
              clientSnapshot: true,
              leadId: true,
              formationId: true,
              lead: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                },
              },
              formation: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    const devisIds = rows.map((r) => r.devisId);
    const paymentRows =
      devisIds.length > 0
        ? await prisma.financePayment.findMany({
            where: { devisId: { in: devisIds } },
            select: { devisId: true, amount: true, status: true },
          })
        : [];
    const paymentsByDevis = summarizePaymentsByDevisId(paymentRows);

    const items = rows.map((r) => {
      const totalTtc = decimalNum(r.totalTtc);
      const paymentSummary = summarizePayments(totalTtc, paymentsByDevis.get(r.devisId) ?? []);
      return {
        id: r.id,
        invoiceId: r.id,
        devisId: r.devisId,
        referenceCode: r.number,
        number: r.number,
        kind: r.kind,
        title: r.devis.title,
        status: r.status,
        devisStatus: r.devis.status,
        devisReferenceCode: r.devis.referenceCode,
        subtotalHt: decimalNum(r.subtotalHt),
        vatTotal: decimalNum(r.vatTotal),
        totalTtc,
        currency: r.currency,
        issuedAt: r.issuedAt.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        validUntil: null as string | null,
        einvoiceStatus: r.einvoiceStatus,
        leadId: r.devis.leadId,
        formationId: r.devis.formationId,
        clientCompany: companyFromClientSnapshot(r.devis.clientSnapshot),
        lead: r.devis.lead,
        formation: r.devis.formation,
        paymentSummary,
      };
    });

    return ok({
      view: 'invoices',
      stats: {
        total,
        montantTtcTotal: decimalNum(sumAgg._sum.totalTtc),
        avecFormation: items.filter((i) => i.formationId).length,
        sansFormation: items.filter((i) => !i.formationId).length,
      },
      items,
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[finance-factures GET]', e);
    return fail('Impossible de charger les factures.', 500, e);
  }
}

/** Émet une facture depuis un devis ACCEPTED (acte staff explicite — jamais en side-effect GET). */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: { devisId?: string; kind?: string };
  try {
    body = (await request.json()) as { devisId?: string; kind?: string };
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const devisId = body.devisId?.trim();
  if (!devisId) return fail('devisId requis.', 400);

  let kind: FinanceInvoiceKind = FinanceInvoiceKind.FULL;
  if (body.kind) {
    if (!Object.values(FinanceInvoiceKind).includes(body.kind as FinanceInvoiceKind)) {
      return fail('kind invalide.', 400);
    }
    kind = body.kind as FinanceInvoiceKind;
  }

  try {
    const invoice = await emitInvoiceFromDevis(prisma, { devisId, kind });
    return ok(
      {
        id: invoice.id,
        number: invoice.number,
        devisId: invoice.devisId,
        kind: invoice.kind,
        status: invoice.status,
        issuedAt: invoice.issuedAt.toISOString(),
        totalTtc: decimalNum(invoice.totalTtc),
      },
      201,
    );
  } catch (e) {
    if (e instanceof FinanceInvoiceError) {
      const status =
        e.code === 'NOT_FOUND'
          ? 404
          : e.code === 'NOT_ACCEPTED' || e.code === 'CONFLICT'
            ? 409
            : 400;
      return fail(e.message, status);
    }
    console.error('[finance-factures POST emit]', e);
    return fail('Émission impossible.', 500, e);
  }
}
