import { NextRequest, NextResponse } from 'next/server';
import {
  CandidatureSource,
  CandidatureStatus,
  Prisma,
} from '@repo/database';
import bcrypt from 'bcrypt';
import { applyCandidatureStatusChange, NotificationService, createWorkflowEngine } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { UserStatus } from '@/app/models/user';
import {
  mapFormEtudiantUserCategory,
  parseOptDateInput,
} from './rh-learners-shared';

export async function assertCandidatureSessionCoherence(
  formationId: string | null | undefined,
  interestedSessionId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!interestedSessionId) return { ok: true };
  const s = await prisma.formationSession.findUnique({
    where: { id: interestedSessionId },
    select: { id: true, formationId: true },
  });
  if (!s) return { ok: false, message: 'Session CRM introuvable.' };
  if (formationId && s.formationId !== formationId) {
    return {
      ok: false,
      message: 'La session indiquée n’appartient pas à la formation sélectionnée.',
    };
  }
  return { ok: true };
}

const STATUS_LABEL_FR: Partial<Record<CandidatureStatus, string>> = {
  VALIDATED: 'Dossier validé',
  REJECTED: 'Dossier refusé',
  PENDING_CNAPS: 'CNAPS en cours',
  COMPLETED: 'Parcours terminé',
  ARCHIVED: 'Dossier archivé',
};

export async function postRhCandidature(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { message: "Content-Type multipart/form-data attendu pour la création d'une candidature." },
      { status: 415 },
    );
  }

  const fd = await request.formData();
  const getStr = (k: string) => {
    const v = fd.get(k);
    return typeof v === 'string' ? v.trim() : '';
  };

  const firstName = getStr('firstName');
  const lastName = getStr('lastName');
  const email = getStr('email').toLowerCase();
  const password = String(fd.get('password') ?? '');

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { message: 'Email et mot de passe (8 caractères minimum) requis.' },
      { status: 400 },
    );
  }

  const dup = await prisma.user.findUnique({ where: { email } });
  if (dup) {
    return NextResponse.json({ message: 'Cet email est déjà enregistré.' }, { status: 409 });
  }

  const candidatRole = await prisma.userRole.findFirst({
    where: { slug: 'candidat', isTrashed: false },
  });
  if (!candidatRole) {
    return NextResponse.json({ message: 'Rôle « candidat » introuvable en base.' }, { status: 500 });
  }

  const formationId = getStr('formationId') || null;
  const interestedSessionId = getStr('interestedSessionId') || null;
  const leadId = getStr('leadId') || null;
  const coherence = await assertCandidatureSessionCoherence(formationId, interestedSessionId);
  if (!coherence.ok) {
    return NextResponse.json({ message: coherence.message }, { status: 400 });
  }

  const sourceRaw = getStr('source');
  let source: (typeof CandidatureSource)[keyof typeof CandidatureSource] =
    CandidatureSource.MANUAL;
  if (sourceRaw === 'LEAD') source = CandidatureSource.LEAD;
  else if (sourceRaw === 'LANDING_SESSION') source = CandidatureSource.LANDING_SESSION;

  const hashedPassword = await bcrypt.hash(password, 10);
  const name = [firstName, lastName].filter(Boolean).join(' ') || email;
  const userCategory = mapFormEtudiantUserCategory(getStr('userCategory') || 'INTERNAL');
  const subcontractorId =
    userCategory === 'SUBCONTRACTOR' ? getStr('subcontractorId') || null : null;

  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: getStr('phone') || null,
          proEmail: getStr('proEmail') || null,
          status: UserStatus.ACTIVE,
          roleId: candidatRole.id,
          userCategory,
          subcontractorId,
          jobFunction: getStr('jobFunction') || null,
          qualification: getStr('qualification') || null,
          birthPlace: getStr('birthPlace') || null,
          nationality: getStr('nationality') || null,
          socialSecurityNumber: getStr('socialSecurityNumber') || null,
          cniNumber: getStr('cniNumber') || null,
          residencePermitNumber: getStr('residencePermitNumber') || null,
          residencePermitExpiry: parseOptDateInput(getStr('residencePermitExpiry')),
          carteProNumber: getStr('carteProNumber') || null,
          carteProExpiry: parseOptDateInput(getStr('carteProExpiry')),
          birthDate: parseOptDateInput(getStr('birthDate')),
          address: getStr('address') || null,
          city: getStr('city') || null,
          postalCode: getStr('postalCode') || null,
          isSchedulable: getStr('isSchedulable') !== 'false',
        },
      });

      if (leadId) {
        const leadExists = await tx.lead.findUnique({
          where: { id: leadId },
          select: { id: true },
        });
        if (!leadExists) throw new Error('LEAD_NOT_FOUND');
        const linked = await tx.candidature.findUnique({
          where: { leadId },
          select: { id: true },
        });
        if (linked) throw new Error('LEAD_ALREADY_LINKED');
      }

      const candidature = await tx.candidature.create({
        data: {
          userId: user.id,
          formationId,
          interestedSessionId,
          leadId,
          source:
            interestedSessionId && source === CandidatureSource.MANUAL
              ? CandidatureSource.LANDING_SESSION
              : source,
          status: CandidatureStatus.DRAFT,
          notes: getStr('notes') || null,
        },
      });

      return { user, candidature };
    });
  } catch (e) {
    if (e instanceof Error) {
      if (e.message === 'LEAD_NOT_FOUND') {
        return NextResponse.json({ message: 'Lead introuvable.' }, { status: 400 });
      }
      if (e.message === 'LEAD_ALREADY_LINKED') {
        return NextResponse.json(
          { message: 'Ce lead est déjà lié à une candidature.' },
          { status: 409 },
        );
      }
    }
    throw e;
  }

  const notifier = new NotificationService(prisma);
  await notifier.emit({
    userId: created.user.id,
    category: 'ACADEMIC',
    title: 'Dossier candidature créé',
    body: 'Votre dossier est en brouillon. Complétez les pièces pour avancer.',
    href: '/gestion-academique/vie-scolaire/etudiants',
    dedupeKey: `candidature-created:${created.candidature.id}`,
  });

  try {
    const workflows = createWorkflowEngine(prisma);
    await workflows.emit(
      'crm.candidature.created',
      {
        candidatureId: created.candidature.id,
        userId: created.user.id,
        candidateName: `${firstName} ${lastName}`.trim(),
        email,
        source: source,
        formationId,
        leadId,
      },
      { dedupeKey: `workflow:candidature-created:${created.candidature.id}` },
    );
  } catch (e) {
    console.error('[candidature] workflow create', e);
  }

  return NextResponse.json(
    {
      message: 'Candidature créée (compte candidat).',
      userId: created.user.id,
      candidatureId: created.candidature.id,
    },
    { status: 200 },
  );
}

export async function patchRhCandidature(candidatureId: string, request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ message: 'Corps JSON attendu.' }, { status: 400 });
  }

  const candidaturePrev = await prisma.candidature.findUnique({
    where: { id: candidatureId },
    select: {
      id: true,
      userId: true,
      formationId: true,
      interestedSessionId: true,
      status: true,
    },
  });
  if (!candidaturePrev) {
    return NextResponse.json({ message: 'Candidature introuvable.' }, { status: 404 });
  }

  const patch: Prisma.CandidatureUpdateInput = {};

  if ('notes' in body) patch.notes = body.notes == null ? null : String(body.notes);
  if ('cnapsReference' in body) {
    patch.cnapsReference =
      body.cnapsReference == null || body.cnapsReference === ''
        ? null
        : String(body.cnapsReference);
  }
  if ('cnapsPrefavorable' in body) {
    patch.cnapsPrefavorable =
      body.cnapsPrefavorable === null ? null : Boolean(body.cnapsPrefavorable);
  }
  if ('cnapsSubmittedAt' in body) {
    patch.cnapsSubmittedAt = body.cnapsSubmittedAt
      ? parseOptDateInput(String(body.cnapsSubmittedAt)) ?? undefined
      : null;
  }
  if ('cnapsDecisionAt' in body) {
    patch.cnapsDecisionAt = body.cnapsDecisionAt
      ? parseOptDateInput(String(body.cnapsDecisionAt)) ?? undefined
      : null;
  }
  if ('formationId' in body) {
    patch.formation =
      body.formationId == null || body.formationId === ''
        ? { disconnect: true }
        : { connect: { id: String(body.formationId) } };
  }
  if ('interestedSessionId' in body) {
    patch.interestedSession =
      body.interestedSessionId == null || body.interestedSessionId === ''
        ? { disconnect: true }
        : { connect: { id: String(body.interestedSessionId) } };
  }
  if ('source' in body && (Object.values(CandidatureSource) as string[]).includes(body.source)) {
    patch.source = body.source;
  }
  if ('status' in body && !(Object.values(CandidatureStatus) as string[]).includes(body.status)) {
    return NextResponse.json({ message: 'Statut candidature invalide.' }, { status: 400 });
  }
  if ('validatedAt' in body) {
    patch.validatedAt = body.validatedAt
      ? parseOptDateInput(String(body.validatedAt)) ?? undefined
      : null;
  }

  const nextStatus =
    'status' in body && (Object.values(CandidatureStatus) as string[]).includes(body.status)
      ? (body.status as CandidatureStatus)
      : null;

  if (nextStatus) {
    delete (patch as { status?: unknown }).status;
    delete (patch as { validatedAt?: unknown }).validatedAt;
    delete (patch as { completedAt?: unknown }).completedAt;
    delete (patch as { archivedAt?: unknown }).archivedAt;
  }

  const nextFormationId =
    body.formationId !== undefined
      ? body.formationId === '' || body.formationId === null
        ? null
        : String(body.formationId)
      : candidaturePrev.formationId;
  const nextSessionId =
    body.interestedSessionId !== undefined
      ? body.interestedSessionId === '' || body.interestedSessionId === null
        ? null
        : String(body.interestedSessionId)
      : candidaturePrev.interestedSessionId;

  const coherence = await assertCandidatureSessionCoherence(nextFormationId, nextSessionId);
  if (!coherence.ok) {
    return NextResponse.json({ message: coherence.message }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (Object.keys(patch).length > 0) {
      await tx.candidature.update({
        where: { id: candidatureId },
        data: patch,
      });
    }

    if (nextStatus) {
      return applyCandidatureStatusChange(tx, candidatureId, nextStatus, candidaturePrev);
    }

    return tx.candidature.findUniqueOrThrow({ where: { id: candidatureId } });
  });

  if (nextStatus && nextStatus !== candidaturePrev.status) {
    const label = STATUS_LABEL_FR[nextStatus] ?? nextStatus;
    const notifier = new NotificationService(prisma);
    await notifier.emit({
      userId: candidaturePrev.userId,
      category: 'ACADEMIC',
      title: 'Mise à jour de votre dossier',
      body: `Statut : ${label}.`,
      href: '/mon-profil',
      dedupeKey: `candidature-status:${candidatureId}:${nextStatus}`,
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.candidature.status_changed',
        {
          candidatureId,
          userId: candidaturePrev.userId,
          previousStatus: candidaturePrev.status,
          nextStatus,
          statusLabel: label,
        },
        {
          dedupeKey: `workflow:candidature-status:${candidatureId}:${nextStatus}`,
          severity: nextStatus === CandidatureStatus.VALIDATED ? 'WARNING' : undefined,
        },
      );
    } catch (e) {
      console.error('[candidature] workflow', e);
    }
  }

  return NextResponse.json({ data: updated }, { status: 200 });
}
