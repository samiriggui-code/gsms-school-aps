import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FinancePaymentStatus, Prisma } from '@repo/database';

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

async function nextPayRef(count: number) {
  return `PAY-${String(count + 1).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const status = (sp.get('status') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.FinancePaymentWhereInput = {
    ...(status && status !== 'all' ? { status: status as FinancePaymentStatus } : {}),
    ...(q
      ? {
          OR: [
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { devis: { referenceCode: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  try {
    const [total, pending, received, failed, sumPending, rows] = await Promise.all([
      prisma.financePayment.count({ where }),
      prisma.financePayment.count({ where: { status: 'PENDING' } }),
      prisma.financePayment.count({ where: { status: 'RECEIVED' } }),
      prisma.financePayment.count({ where: { status: 'FAILED' } }),
      prisma.financePayment.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      prisma.financePayment.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          devis: { select: { id: true, referenceCode: true, title: true } },
        },
      }),
    ]);

    return ok({
      stats: {
        total,
        pending,
        received,
        failed,
        pendingAmount: decimalNum(sumPending._sum.amount),
      },
      items: rows.map((r) => ({
        id: r.id,
        referenceCode: r.referenceCode,
        amount: decimalNum(r.amount),
        currency: r.currency,
        status: r.status,
        method: r.method,
        paidAt: r.paidAt?.toISOString() ?? null,
        devis: r.devis,
        updatedAt: r.updatedAt.toISOString(),
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger les paiements.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) return fail('Montant invalide.', 400);

  try {
    const count = await prisma.financePayment.count();
    const row = await prisma.financePayment.create({
      data: {
        referenceCode: await nextPayRef(count),
        amount,
        devisId: String(body.devisId ?? '').trim() || null,
        method: String(body.method ?? '').trim() || null,
        status: 'PENDING',
        notes: String(body.notes ?? '').trim() || null,
      },
    });
    return ok({ id: row.id, referenceCode: row.referenceCode }, 201);
  } catch (e) {
    return fail('Création impossible.', 500, e);
  }
}
