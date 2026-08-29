import type { NextRequest } from 'next/server';
import type { CandidatureAssessmentKind, PrismaClient } from '@repo/database';
import { isEmailConfigured, sendEmail, getSupportEmail } from '@repo/mail';
import { signCandidatureAssessmentPublicToken } from '@/lib/of/candidature-assessment-public-token';
import { absolutePublicCandidatureAssessmentUrl } from '@/lib/of/candidature-assessment-public-url';
import {
  parseAdaptationRequired,
  questionsForAssessmentKind,
} from '@/lib/of/candidature-assessment-template';
import { recordStatusEvidence } from '@/lib/evidence/record-status-evidence';

const LINK_TTL_MS = 90 * 24 * 60 * 60 * 1000;

export class CandidatureAssessmentValidationError extends Error {}

function kindLabel(kind: CandidatureAssessmentKind): string {
  return kind === 'NEEDS_ANALYSIS' ? 'analyse du besoin' : 'positionnement initial';
}

export async function ensureAssessment(
  prisma: PrismaClient,
  candidatureId: string,
  kind: CandidatureAssessmentKind,
): Promise<{ id: string; created: boolean }> {
  const existing = await prisma.candidatureAssessment.findUnique({
    where: { candidatureId_kind: { candidatureId, kind } },
    select: { id: true },
  });
  if (existing) return { id: existing.id, created: false };
  const created = await prisma.candidatureAssessment.create({
    data: { candidatureId, kind },
    select: { id: true },
  });
  return { id: created.id, created: true };
}

export type SendAssessmentInviteResult = {
  sent: boolean;
  skippedReason?: string;
  assessmentUrl?: string;
};

export async function sendAssessmentInvite(
  prisma: PrismaClient,
  assessmentId: string,
  request: Pick<NextRequest, 'headers'>,
): Promise<SendAssessmentInviteResult> {
  const row = await prisma.candidatureAssessment.findUnique({
    where: { id: assessmentId },
    include: {
      candidature: {
        include: {
          user: { select: { email: true, name: true, firstName: true, lastName: true } },
          formation: { select: { name: true } },
        },
      },
    },
  });
  if (!row) throw new Error('Assessment introuvable.');
  if (row.status === 'COMPLETED') {
    return { sent: false, skippedReason: 'Questionnaire déjà complété.' };
  }

  const email = row.candidature.user.email?.trim();
  if (!email) return { sent: false, skippedReason: 'Candidat sans e-mail.' };
  if (!isEmailConfigured()) {
    return { sent: false, skippedReason: 'Canal e-mail non configuré.' };
  }

  const name =
    row.candidature.user.name?.trim() ||
    [row.candidature.user.firstName, row.candidature.user.lastName].filter(Boolean).join(' ').trim() ||
    'Candidat';
  const formationName = row.candidature.formation?.name ?? 'Formation';
  const token = signCandidatureAssessmentPublicToken(assessmentId, Date.now() + LINK_TTL_MS);
  const assessmentUrl = absolutePublicCandidatureAssessmentUrl(request, assessmentId, token);
  const label = kindLabel(row.kind);

  await sendEmail({
    to: email,
    subject: `[FORM'SSI] Questionnaire — ${label} — ${formationName}`,
    html: `<p>Bonjour ${name},</p><p>Merci de compléter le questionnaire d’${label} pour « ${formationName} ».</p><p><a href="${assessmentUrl}">Ouvrir le questionnaire</a></p><p>Contact : ${getSupportEmail()}</p>`,
    text: `Bonjour ${name}, questionnaire ${label} : ${assessmentUrl}`,
  });

  await prisma.candidatureAssessment.update({
    where: { id: assessmentId },
    data: { status: 'SENT', sentAt: new Date() },
  });

  return { sent: true, assessmentUrl };
}

/** Crée + invite WF-02 (analyse du besoin) pour une candidature fraîche. */
export async function bootstrapNeedsAnalysisForCandidature(
  prisma: PrismaClient,
  candidatureId: string,
  request: Pick<NextRequest, 'headers'>,
): Promise<SendAssessmentInviteResult & { assessmentId: string }> {
  const { id } = await ensureAssessment(prisma, candidatureId, 'NEEDS_ANALYSIS');
  const result = await sendAssessmentInvite(prisma, id, request);
  return { ...result, assessmentId: id };
}

export type SubmitAssessmentResult = {
  alreadyCompleted: boolean;
  adaptationRequired: boolean | null;
  positioningStarted?: boolean;
};

export async function submitAssessmentAnswers(
  prisma: PrismaClient,
  assessmentId: string,
  answers: Record<string, string>,
  request: Pick<NextRequest, 'headers'>,
): Promise<SubmitAssessmentResult> {
  const row = await prisma.candidatureAssessment.findUnique({
    where: { id: assessmentId },
    select: {
      id: true,
      kind: true,
      status: true,
      candidatureId: true,
      candidature: { select: { userId: true } },
    },
  });
  if (!row) throw new Error('Assessment introuvable.');
  if (row.status === 'COMPLETED') {
    return { alreadyCompleted: true, adaptationRequired: null };
  }

  const questions = questionsForAssessmentKind(row.kind);
  const missing = questions.filter((q) => q.required && !answers[q.code]?.toString().trim());
  if (missing.length > 0) {
    throw new CandidatureAssessmentValidationError(
      `Réponses manquantes : ${missing.map((q) => q.label).join(', ')}.`,
    );
  }

  const adaptationRequired =
    row.kind === 'NEEDS_ANALYSIS' ? parseAdaptationRequired(answers) : null;
  const level = row.kind === 'POSITIONING' ? answers['PO-LEVEL']?.trim() || null : null;
  const prerequisitesStatus =
    row.kind === 'POSITIONING' ? answers['PO-PREREQ']?.trim() || null : null;

  const eventName =
    row.kind === 'NEEDS_ANALYSIS' ? 'NEEDS_ANALYSIS_COMPLETED' : 'POSITIONING_COMPLETED';

  await prisma.$transaction(async (tx) => {
    await tx.candidatureAssessment.update({
      where: { id: assessmentId },
      data: {
        answers,
        status: 'COMPLETED',
        completedAt: new Date(),
        adaptationRequired: adaptationRequired ?? undefined,
        level,
        prerequisitesStatus,
      },
    });
    await recordStatusEvidence(tx, {
      category: 'candidature_assessment',
      sourceType: 'QUESTIONNAIRE',
      sourceId: assessmentId,
      eventName,
      fromStatus: row.status,
      toStatus: 'COMPLETED',
      learnerUserId: row.candidature.userId,
      metadata: {
        kind: row.kind,
        candidatureId: row.candidatureId,
        adaptationRequired,
        level,
        prerequisitesStatus,
      },
    });
  });

  let positioningStarted = false;
  if (row.kind === 'NEEDS_ANALYSIS') {
    const pos = await ensureAssessment(prisma, row.candidatureId, 'POSITIONING');
    await sendAssessmentInvite(prisma, pos.id, request);
    positioningStarted = true;
  }

  return { alreadyCompleted: false, adaptationRequired, positioningStarted };
}
