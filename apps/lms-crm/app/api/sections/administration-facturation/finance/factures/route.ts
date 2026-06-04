import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus, Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';

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
 * Liste des propositions **acceptées** : base pour la page Factures (émission à venir).
 * Même forme de payload que `GET …/finance/devis` pour réutiliser les tableaux CRM.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const leadIdFilter = (sp.get('leadId') ?? '').trim();
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 20, 1), 100);
  const skip = (page - 1) * limit;

  const sortRaw = (sp.get('sort') ?? 'updatedAt').trim();
  const dir = sp.get('dir') === 'asc' ? 'asc' : 'desc';

  let orderBy: Prisma.FinanceDevisOrderByWithRelationInput = { updatedAt: dir };
  if (sortRaw === 'referenceCode') orderBy = { referenceCode: dir };
  else if (sortRaw === 'title') orderBy = { title: dir };
  else if (sortRaw === 'totalTtc') orderBy = { totalTtc: dir };
  else if (sortRaw === 'status') orderBy = { status: dir };
  else if (sortRaw === 'updatedAt') orderBy = { updatedAt: dir };

  const where: Prisma.FinanceDevisWhereInput = {
    status: FinanceDevisStatus.ACCEPTED,
    ...(leadIdFilter ? { leadId: leadIdFilter } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { referenceCode: { contains: q, mode: 'insensitive' } },
            { lead: { email: { contains: q, mode: 'insensitive' } } },
            {
              lead: {
                OR: [
                  { firstName: { contains: q, mode: 'insensitive' } },
                  { lastName: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          ],
        }
      : {}),
  };

  try {
    const [total, sumAgg, withFormation, rows] = await Promise.all([
      prisma.financeDevis.count({ where }),
      prisma.financeDevis.aggregate({
        where,
        _sum: { totalTtc: true },
      }),
      prisma.financeDevis.count({
        where: { ...where, formationId: { not: null } },
      }),
      prisma.financeDevis.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          referenceCode: true,
          title: true,
          status: true,
          subtotalHt: true,
          vatTotal: true,
          totalTtc: true,
          currency: true,
          validUntil: true,
          createdAt: true,
          updatedAt: true,
          leadId: true,
          formationId: true,
          clientSnapshot: true,
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          formation: {
            select: { id: true, name: true, slug: true },
          },
        },
      }),
    ]);

    const montantTtcTotal = decimalNum(sumAgg._sum.totalTtc);
    const sansFormation = Math.max(0, total - withFormation);

    const stats = {
      total,
      /** Somme TTC des propositions acceptées (base facturation). */
      montantTtcTotal,
      avecFormation: withFormation,
      sansFormation,
    };

    const items = rows.map((r) => ({
      id: r.id,
      referenceCode: r.referenceCode,
      title: r.title,
      status: r.status,
      subtotalHt: decimalNum(r.subtotalHt),
      vatTotal: decimalNum(r.vatTotal),
      totalTtc: decimalNum(r.totalTtc),
      currency: r.currency,
      validUntil: r.validUntil?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      leadId: r.leadId,
      formationId: r.formationId,
      clientCompany: companyFromClientSnapshot(r.clientSnapshot),
      lead: r.lead,
      formation: r.formation,
    }));

    return ok({
      stats,
      items,
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[finance-factures GET]', e);
    return fail('Impossible de charger les éléments à facturer.', 500, e);
  }
}
