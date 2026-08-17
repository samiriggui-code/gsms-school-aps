import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { issueFormationAttestation, createWorkflowEngine } from '@repo/api-core';
import { Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const candidatureId = searchParams.get('candidatureId');
  const sessionId = (searchParams.get('sessionId') || '').trim();
  const q = (searchParams.get('q') || '').trim();

  const where: Prisma.FormationAttestationWhereInput = {
    ...(candidatureId ? { candidatureId } : {}),
    ...(sessionId ? { sessionId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { user: { name: { contains: q, mode: 'insensitive' } } },
            { user: { email: { contains: q, mode: 'insensitive' } } },
            { formation: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

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
    items: items.map((row) => ({
      ...row,
      issueDate: row.issueDate.toISOString(),
      expiryDate: row.expiryDate?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    })),
    pagination: { page, limit, total },
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const candidatureId = typeof body.candidatureId === 'string' ? body.candidatureId.trim() : '';
  const participantId =
    typeof body.participantId === 'string' && body.participantId.trim()
      ? body.participantId.trim()
      : null;
  let title = typeof body.title === 'string' ? body.title.trim() : '';
  let sessionId =
    typeof body.sessionId === 'string' && body.sessionId.trim() ? body.sessionId.trim() : null;
  const certificateUrl =
    typeof body.certificateUrl === 'string' && body.certificateUrl.trim()
      ? body.certificateUrl.trim()
      : null;

  let resolvedCandidatureId = candidatureId;

  if (participantId) {
    const participant = await prisma.formationSessionParticipant.findUnique({
      where: { id: participantId },
      select: {
        candidatureId: true,
        sessionId: true,
        examOutcome: true,
        candidature: {
          select: {
            formation: { select: { name: true } },
          },
        },
        session: { select: { dateDisplayLabel: true } },
      },
    });
    if (!participant?.candidatureId) {
      return fail('Inscription session sans dossier candidature.', 400);
    }
    if (participant.examOutcome !== 'PASSED') {
      return fail('L\'examen doit être au statut « Réussi » avant de délivrer une attestation.', 400);
    }
    resolvedCandidatureId = participant.candidatureId;
    sessionId = participant.sessionId;
    if (!title && participant.candidature?.formation?.name) {
      title = `Attestation ${participant.candidature.formation.name} — ${participant.session.dateDisplayLabel}`;
    }
  }

  if (!resolvedCandidatureId || !title) {
    return fail('Sélectionnez un stagiaire éligible et un intitulé d\'attestation.', 400);
  }

  const candidature = await prisma.candidature.findUnique({
    where: { id: resolvedCandidatureId },
    select: {
      id: true,
      userId: true,
      formationId: true,
      user: { select: { name: true, email: true } },
    },
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
    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.candidature.attestation.issued',
        {
          attestationId: attestation.id,
          candidatureId: candidature.id,
          userId: candidature.userId,
          candidateName: candidature.user.name ?? candidature.user.email ?? 'Élève',
          email: candidature.user.email ?? null,
          attestationTitle: title,
          sessionId,
        },
        { dedupeKey: `workflow:attestation:${attestation.id}` },
      );
    } catch (e) {
      console.error('[certifications] workflow', e);
    }
    return ok({ attestation }, 201);
  } catch (e) {
    console.error('[certifications POST]', e);
    return fail('Création attestation impossible.', 500, e);
  }
}
