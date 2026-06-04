import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CandidatureStatus, Prisma } from '@repo/database';

const STATUS_FR: Partial<Record<CandidatureStatus, string>> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'CNAPS',
  VALIDATED: 'Validé',
  COMPLETED: 'Terminé',
  REJECTED: 'Refusé',
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.CandidatureWhereInput = {
    status: {
      in: [
        CandidatureStatus.DRAFT,
        CandidatureStatus.SUBMITTED,
        CandidatureStatus.MISSING_DOCUMENTS,
        CandidatureStatus.VALIDATION_PENDING,
      ],
    },
    ...(q
      ? {
          OR: [
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { user: { firstName: { contains: q, mode: 'insensitive' } } },
            { user: { lastName: { contains: q, mode: 'insensitive' } } },
            { formation: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  try {
    const [total, missing, pending, draft, submitted, rows] = await Promise.all([
      prisma.candidature.count({ where }),
      prisma.candidature.count({ where: { status: CandidatureStatus.MISSING_DOCUMENTS } }),
      prisma.candidature.count({ where: { status: CandidatureStatus.VALIDATION_PENDING } }),
      prisma.candidature.count({ where: { status: CandidatureStatus.DRAFT } }),
      prisma.candidature.count({ where: { status: CandidatureStatus.SUBMITTED } }),
      prisma.candidature.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          updatedAt: true,
          user: { select: { firstName: true, lastName: true, email: true } },
          formation: { select: { name: true } },
        },
      }),
    ]);

    return ok({
      stats: { total, missing, pending, draft, submitted },
      items: rows.map((r) => ({
        id: r.id,
        candidat: `${r.user.firstName} ${r.user.lastName}`.trim(),
        email: r.user.email,
        formation: r.formation?.name ?? '—',
        status: STATUS_FR[r.status] ?? r.status,
        updatedAt: r.updatedAt.toISOString(),
        editPath: `/gestion-academique/vie-scolaire/etudiants?candidatureId=${r.id}`,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    return fail('Impossible de charger les demandes.', 500, e);
  }
}
