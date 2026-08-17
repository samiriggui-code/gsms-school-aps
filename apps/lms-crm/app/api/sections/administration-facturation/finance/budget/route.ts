import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { Prisma } from '@repo/database';
import { syncEquipmentBudgetFromInventory } from '@/lib/finance/finance-budget-sync';

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const year = Number(sp.get('year')) || new Date().getFullYear();
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.FinanceBudgetLineWhereInput = {
    periodYear: year,
    ...(q
      ? {
          OR: [
            { label: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [total, rows, agg, equipmentBudget] = await Promise.all([
      prisma.financeBudgetLine.count({ where }),
      prisma.financeBudgetLine.findMany({ where, orderBy: { label: 'asc' }, skip, take: limit }),
      prisma.financeBudgetLine.aggregate({
        where,
        _sum: { plannedAmount: true, actualAmount: true },
      }),
      syncEquipmentBudgetFromInventory(prisma, year).catch(() => ({ actualAmount: 0, unitCount: 0 })),
    ]);

    const planned = decimalNum(agg._sum.plannedAmount);
    const actual = decimalNum(agg._sum.actualAmount);

    return ok({
      stats: {
        total,
        planned,
        actual,
        ecart: planned - actual,
        consumptionRate: planned ? Math.round((actual / planned) * 100) : 0,
        year,
        equipmentInventory: equipmentBudget,
      },
      items: rows.map((r) => ({
        id: r.id,
        label: r.label,
        category: r.category,
        periodYear: r.periodYear,
        periodMonth: r.periodMonth,
        plannedAmount: decimalNum(r.plannedAmount),
        actualAmount: decimalNum(r.actualAmount),
        currency: r.currency,
        notes: r.notes,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger le budget.', 500, e);
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

  const label = String(body.label ?? '').trim();
  const plannedAmount = Number(body.plannedAmount);
  const periodYear = Number(body.periodYear) || new Date().getFullYear();

  if (!label || !Number.isFinite(plannedAmount)) {
    return fail('Libellé et montant prévu requis.', 400);
  }

  try {
    const row = await prisma.financeBudgetLine.create({
      data: {
        label,
        category: String(body.category ?? 'FORMATION').trim() || 'FORMATION',
        periodYear,
        periodMonth: body.periodMonth != null ? Number(body.periodMonth) : null,
        plannedAmount,
        actualAmount: Number(body.actualAmount) || 0,
        notes: String(body.notes ?? '').trim() || null,
      },
    });
    return ok({ id: row.id }, 201);
  } catch (e) {
    return fail('Création impossible.', 500, e);
  }
}
