import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import type { ComplianceDossierKind, ComplianceSubjectType, Prisma } from '@repo/database';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sp = request.nextUrl.searchParams;
  const candidatureId = sp.get('candidatureId');
  const userId = sp.get('userId');
  const kind = sp.get('kind') as ComplianceDossierKind | null;

  const where: Prisma.ComplianceDossierWhereInput = {};
  if (candidatureId) where.candidatureId = candidatureId;
  if (userId) where.userId = userId;
  if (kind) where.kind = kind;

  if (!candidatureId && !userId) {
    return fail('candidatureId ou userId requis.', 400);
  }

  try {
    const dossiers = await prisma.complianceDossier.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        items: { orderBy: { code: 'asc' } },
      },
    });
    return ok({ dossiers });
  } catch (e) {
    return fail('Impossible de lister les dossiers.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const subjectType = body.subjectType as ComplianceSubjectType | undefined;
  const subjectId = typeof body.subjectId === 'string' ? body.subjectId : undefined;

  if (!subjectType || !subjectId) {
    return fail('subjectType et subjectId sont requis.', 400);
  }

  const where: Prisma.ComplianceDossierWhereInput = { subjectType, subjectId };
  if (typeof body.kind === 'string') where.kind = body.kind as ComplianceDossierKind;
  if (typeof body.candidatureId === 'string') where.candidatureId = body.candidatureId;
  if (typeof body.userId === 'string') where.userId = body.userId;

  try {
    const dossiers = await prisma.complianceDossier.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: { items: { orderBy: { code: 'asc' } } },
    });
    return ok({ dossiers });
  } catch (e) {
    return fail('Recherche dossiers impossible.', 500, e);
  }
}
