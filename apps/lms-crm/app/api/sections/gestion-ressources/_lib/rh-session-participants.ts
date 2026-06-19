import { NextRequest, NextResponse } from 'next/server';
import {
  CandidatureStatus,
  FormationSessionEnrollmentStatus,
  Prisma,
} from '@repo/database';
import { prisma } from '@/lib/prisma';
import { createWorkflowEngine } from '@repo/api-core';
import { ensureSessionChat } from '@/lib/session-chat';

async function promoteUserToEleve(userId: string) {
  const eleveRole = await prisma.userRole.findFirst({
    where: { slug: 'eleve', isTrashed: false },
  });
  if (!eleveRole) return false;
  await prisma.user.update({
    where: { id: userId },
    data: { roleId: eleveRole.id },
  });
  return true;
}

export async function getFormationSessionParticipants(sessionId: string) {
  const formationSession = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { id: true },
  });
  if (!formationSession) {
    return NextResponse.json({ message: 'Session formation introuvable.' }, { status: 404 });
  }

  const list = await prisma.formationSessionParticipant.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { slug: true, name: true } },
        },
      },
      candidature: {
        select: {
          id: true,
          status: true,
          formationId: true,
        },
      },
    },
  });
  return NextResponse.json({ data: list });
}

export async function postFormationSessionParticipant(sessionId: string, request: NextRequest) {
  const formationSession = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, formationId: true, dateDisplayLabel: true, formation: { select: { courseId: true } } },
  });
  if (!formationSession) {
    return NextResponse.json({ message: 'Session formation introuvable.' }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Corps JSON attendu.' }, { status: 400 });
  }

  const candidatureId =
    typeof body.candidatureId === 'string' && body.candidatureId.trim()
      ? body.candidatureId.trim()
      : null;
  const userIdRaw =
    typeof body.userId === 'string' && body.userId.trim() ? body.userId.trim() : null;

  let userId: string | null = null;
  let candidatureRef: { id: string } | null = null;

  if (candidatureId) {
    const dossier = await prisma.candidature.findUnique({
      where: { id: candidatureId },
      select: { id: true, userId: true, formationId: true, status: true },
    });
    if (!dossier) {
      return NextResponse.json({ message: 'Candidature introuvable.' }, { status: 404 });
    }
    if (dossier.status !== CandidatureStatus.VALIDATED) {
      return NextResponse.json(
        { message: 'Le dossier doit être au statut « validé » pour une inscription session.' },
        { status: 400 },
      );
    }
    if (dossier.formationId && dossier.formationId !== formationSession.formationId) {
      return NextResponse.json(
        { message: 'La formation du dossier ne correspond pas à cette session.' },
        { status: 400 },
      );
    }
    userId = dossier.userId;
    candidatureRef = { id: dossier.id };
    await promoteUserToEleve(dossier.userId);
  } else if (userIdRaw) {
    const learnerRoles = await prisma.userRole.findMany({
      where: { slug: { in: ['eleve', 'candidat'] }, isTrashed: false },
      select: { id: true },
    });
    const u = await prisma.user.findFirst({
      where: {
        id: userIdRaw,
        isTrashed: false,
        status: 'ACTIVE',
        roleId: { in: learnerRoles.map((r) => r.id) },
      },
      select: { id: true },
    });
    if (!u) {
      return NextResponse.json(
        {
          message:
            'Inscription sans dossier : fournissez candidatureId, ou userId doit être un compte élève ou candidat actif.',
        },
        { status: 400 },
      );
    }
    userId = u.id;
  } else {
    return NextResponse.json(
      { message: 'Indiquez candidatureId (recommandé) ou userId (élève).' },
      { status: 400 },
    );
  }

  const enrollRaw = body.enrollmentStatus;
  let enrollmentStatus: (typeof FormationSessionEnrollmentStatus)[keyof typeof FormationSessionEnrollmentStatus] =
    FormationSessionEnrollmentStatus.CONFIRMED;
  if (
    enrollRaw &&
    (Object.values(FormationSessionEnrollmentStatus) as string[]).includes(enrollRaw)
  ) {
    enrollmentStatus = enrollRaw;
  }

  try {
    const row = await prisma.formationSessionParticipant.create({
      data: {
        sessionId,
        userId: userId!,
        candidatureId: candidatureRef?.id ?? null,
        enrollmentStatus,
      },
    });

    if (candidatureRef?.id) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId! },
          select: { name: true, email: true },
        });
        const workflows = createWorkflowEngine(prisma);
        await workflows.emit(
          'crm.candidature.session.enrolled',
          {
            participantId: row.id,
            sessionId,
            sessionLabel: formationSession.dateDisplayLabel,
            candidatureId: candidatureRef.id,
            userId: userId!,
            candidateName: user?.name ?? user?.email ?? 'Participant',
            enrollmentStatus,
          },
          { dedupeKey: `workflow:session-enroll:${row.id}` },
        );
      } catch (e) {
        console.error('[session-participant] workflow', e);
      }
    }

    const courseId = formationSession.formation?.courseId;
    if (courseId) {
      const existingLms = await prisma.enrollment.findFirst({
        where: { userId: userId!, courseId, sessionId: null },
      });
      if (!existingLms) {
        await prisma.enrollment.create({
          data: {
            userId: userId!,
            courseId,
            sessionId: null,
            status: 'VALIDATED',
            notes: `Inscription session ${formationSession.dateDisplayLabel}`,
          },
        });
      } else if (existingLms.status === 'PENDING') {
        await prisma.enrollment.update({
          where: { id: existingLms.id },
          data: { status: 'VALIDATED' },
        });
      }
    }

    void ensureSessionChat(prisma, sessionId);

    return NextResponse.json({ data: row }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { message: 'Ce participant est déjà inscrit à cette session.' },
        { status: 409 },
      );
    }
    throw e;
  }
}
