import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { issueFormationAttestation } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const candidatureId = searchParams.get('candidatureId');

  const where = candidatureId ? { candidatureId } : {};

  const [total, items] = await Promise.all([
    prisma.formationAttestation.count({ where }),
    prisma.formationAttestation.findMany({
      where,
      orderBy: { issueDate: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        formation: { select: { id: true, name: true } },
        session: { select: { id: true, dateDisplayLabel: true } },
        candidature: { select: { id: true, status: true } },
      },
    }),
  ]);

  return ok({
    items,
    pagination: { page, limit, total },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const candidatureId = typeof body.candidatureId === 'string' ? body.candidatureId.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const sessionId =
    typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : null;
  const certificateUrl =
    typeof body.certificateUrl === 'string' && body.certificateUrl.trim()
      ? body.certificateUrl.trim()
      : null;

  if (!candidatureId || !title) {
    return fail('candidatureId et title sont obligatoires.', 400);
  }

  const candidature = await prisma.candidature.findUnique({
    where: { id: candidatureId },
    select: { id: true, userId: true, formationId: true },
  });

  if (!candidature) return fail('Candidature introuvable.', 404);
  if (!candidature.formationId) {
    return fail('Rattachez une formation au dossier avant de délivrer une attestation.', 400);
  }

  try {
    const attestation = await prisma.$transaction((tx) =>
      issueFormationAttestation(tx, {
        userId: candidature.userId,
        candidatureId: candidature.id,
        formationId: candidature.formationId!,
        sessionId,
        title,
        certificateUrl,
      }),
    );
    return ok({ attestation }, 201);
  } catch (e) {
    console.error('[certifications POST]', e);
    return fail('Création attestation impossible.', 500, e);
  }
}
