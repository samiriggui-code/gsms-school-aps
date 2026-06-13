import { getServerSession } from 'next-auth/next';
import { CandidatureStatus } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isPortalRole } from '@/lib/auth/app-routing';
import { CNAPS_DOSSIER_SLOTS } from '@/app/(protected)/gestion-academique/vie-scolaire/etudiants/lib/cnaps-dossier-documents';
import { buildCnapsPortalSlots, PORTAL_CNAPS_MODULE } from '@/lib/portal/cnaps-portal';
import {
  CANDIDATURE_SOURCE_LABEL_FR,
  CANDIDATURE_STATUS_LABEL_FR,
  ENROLLMENT_STATUS_LABEL_FR,
  EXAM_OUTCOME_LABEL_FR,
  FINANCE_DEVIS_STATUS_LABEL_FR,
  parcoursStepIndex,
  PARCOURS_STEPS,
} from '@/lib/portal/dossier-labels';
import {
  buildPortalFormationOverviewMetrics,
  buildPortalFormationSheetModel,
  extractFundingModeFromCandidature,
  resolveDossierSubmittedAt,
} from '@/lib/portal/dossier-formation-sheet';
import { getLmsAccessTier, lmsAccessLabel } from '@/lib/portal/lms-access';
import { buildPortalRecentActivity } from '@/lib/portal/portal-activity-feed';
import { loadPortalLearningEvents } from '@/lib/portal/portal-learning-events';
import {
  listPortalAnnouncementsForLearner,
  resolveLearnerSessionIds,
} from '@/lib/portal/portal-session-announcements';
import { prisma } from '@/lib/prisma';

const formationSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  track: true,
  tag: true,
  duration: true,
  parcoursSpecialite: true,
  logoUrl: true,
  providerName: true,
  providerEmail: true,
  providerPhone: true,
  providerAddress: true,
  nextSessionLabel: true,
  cpfEligible: true,
  qualiopiCertified: true,
  rncpUrl: true,
  deliveryMode: true,
  hoursMin: true,
  hoursMax: true,
  traineesMin: true,
  traineesMax: true,
  priceFrom: true,
  currency: true,
  successRate: true,
  clientSatisfactionRate: true,
  unitsCount: true,
  volumeHoursLabel: true,
  theoryPercent: true,
  practicePercent: true,
  minAgeLabel: true,
  frenchLevel: true,
  authorizationSummary: true,
  criminalRecordRequirement: true,
  presentationTitle: true,
  longDescription: true,
  modules: true,
  presentationBullets: true,
  programModules: true,
  prerequisitesTable: true,
  fundingBlocks: true,
  fundingChannels: true,
  overviewMetrics: true,
  certificationSteps: true,
  complementaryDetails: true,
  catalogProgramConfig: true,
  courseId: true,
  catalogOffer: {
    select: {
      id: true,
      catalogStatus: true,
      priceFromOverride: true,
      currencyOverride: true,
      parcoursSpecialiteOverride: true,
      fundingBlocksOverride: true,
      fundingChannelsOverride: true,
      prerequisitesTableOverride: true,
    },
  },
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);

  const roleSlug = session.user.roleSlug ?? null;
  if (!isPortalRole(roleSlug)) {
    return fail('Espace réservé aux candidats et stagiaires.', 403);
  }

  const userId = session.user.id;

  const [user, candidature, documents, enrollments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        address: true,
        city: true,
        postalCode: true,
        birthDate: true,
        status: true,
        createdAt: true,
        role: { select: { slug: true, name: true } },
      },
    }),
    prisma.candidature.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        source: true,
        status: true,
        notes: true,
        metadata: true,
        createdAt: true,
        cnapsSubmittedAt: true,
        cnapsReference: true,
        cnapsPrefavorable: true,
        cnapsDecisionAt: true,
        validatedAt: true,
        completedAt: true,
        updatedAt: true,
        formation: { select: formationSelect },
        interestedSession: {
          select: {
            id: true,
            dateDisplayLabel: true,
            location: true,
            sessionSubtitle: true,
            startDate: true,
            endDate: true,
            registrationClosesAt: true,
            examDate: true,
          },
        },
        financeDevis: {
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            referenceCode: true,
            title: true,
            status: true,
            totalTtc: true,
            currency: true,
            validUntil: true,
            createdAt: true,
            updatedAt: true,
            clientSnapshot: true,
          },
        },
      },
    }),
    prisma.fileAsset.findMany({
      where: {
        entityType: 'User',
        entityId: userId,
        status: 'ACTIVE',
        OR: [
          { module: PORTAL_CNAPS_MODULE },
          { category: { startsWith: 'CNAPS_' } },
        ],
      },
      select: { id: true, category: true, originalName: true, url: true, mimeType: true, createdAt: true, metadata: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.formationSessionParticipant.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        enrollmentStatus: true,
        examOutcome: true,
        createdAt: true,
        session: {
          select: {
            dateDisplayLabel: true,
            location: true,
            sessionSubtitle: true,
            startDate: true,
            endDate: true,
            formation: { select: { name: true, slug: true } },
          },
        },
      },
    }),
  ]);

  if (!user) return fail('Utilisateur introuvable.', 404);

  const cnapsPortalSlots = buildCnapsPortalSlots(documents);
  const cnapsSlots = cnapsPortalSlots.map((slot) => ({
    category: slot.category,
    title: slot.title,
    description: slot.description,
    uploaded: slot.uploaded,
    verified: slot.verified,
    files: slot.files.map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      uploadedAt: f.uploadedAt,
    })),
  }));

  const cnapsUploadedCount = cnapsPortalSlots.filter((s) => s.uploaded).length;
  const cnapsVerifiedCount = cnapsPortalSlots.filter((s) => s.verified).length;

  const status = candidature?.status ?? null;
  const lmsTier = getLmsAccessTier(status ?? undefined);
  const stepIndex = parcoursStepIndex(status ?? undefined);

  const formationRow = candidature?.formation ?? null;
  const sheetModel = buildPortalFormationSheetModel(formationRow);
  const formationOverviewMetrics = buildPortalFormationOverviewMetrics(formationRow);

  const dossierSubmittedAt = candidature
    ? resolveDossierSubmittedAt({
        status: candidature.status,
        metadata: candidature.metadata,
        updatedAt: candidature.updatedAt,
        cnapsSubmittedAt: candidature.cnapsSubmittedAt,
        validatedAt: candidature.validatedAt,
      })
    : null;

  const fundingMode = candidature
    ? extractFundingModeFromCandidature(candidature.notes, candidature.metadata)
    : null;

  const courseId = formationRow?.courseId ?? null;
  const learnerSessionIds = await resolveLearnerSessionIds(
    userId,
    candidature?.interestedSession?.id ?? null,
  );

  const [learningEvents, recentAnnouncements] = await Promise.all([
    loadPortalLearningEvents(userId, courseId),
    formationRow?.id
      ? listPortalAnnouncementsForLearner({
          formationId: formationRow.id,
          sessionIds: learnerSessionIds,
          limit: 5,
        })
      : Promise.resolve([]),
  ]);

  const recentActivity = buildPortalRecentActivity({
    candidature: candidature
      ? {
          formationName: candidature.formation?.name ?? null,
          inscriptionAt: candidature.createdAt,
          dossierSubmittedAt,
          cnapsSubmittedAt: candidature.cnapsSubmittedAt,
          validatedAt: candidature.validatedAt,
          completedAt: candidature.completedAt,
        }
      : null,
    progressEvents: learningEvents.progressEvents,
    quizEvents: learningEvents.quizEvents,
    announcements: recentAnnouncements,
    limit: 10,
  });

  return ok({
    user: {
      id: user.id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      address: user.address,
      city: user.city,
      postalCode: user.postalCode,
      birthDate: user.birthDate?.toISOString().slice(0, 10) ?? null,
      userStatus: user.status,
      roleSlug: user.role.slug,
      roleName: user.role.name,
      accountCreatedAt: user.createdAt.toISOString(),
    },
    candidature: candidature
      ? {
          id: candidature.id,
          status: candidature.status,
          statusLabel: CANDIDATURE_STATUS_LABEL_FR[candidature.status],
          source: candidature.source,
          sourceLabel: CANDIDATURE_SOURCE_LABEL_FR[candidature.source],
          formationName: candidature.formation?.name ?? null,
          formationSlug: candidature.formation?.slug ?? null,
          formationTag: candidature.formation?.tag ?? null,
          formationDuration: candidature.formation?.duration ?? null,
          interestedSession: candidature.interestedSession
            ? {
                id: candidature.interestedSession.id,
                label: candidature.interestedSession.dateDisplayLabel,
                location: candidature.interestedSession.location,
                subtitle: candidature.interestedSession.sessionSubtitle,
                startDate: candidature.interestedSession.startDate?.toISOString() ?? null,
                endDate: candidature.interestedSession.endDate?.toISOString() ?? null,
                registrationClosesAt:
                  candidature.interestedSession.registrationClosesAt?.toISOString() ?? null,
                examDate: candidature.interestedSession.examDate?.toISOString() ?? null,
              }
            : null,
          fundingMode,
          inscriptionAt: candidature.createdAt.toISOString(),
          dossierSubmittedAt: dossierSubmittedAt?.toISOString() ?? null,
          cnapsSubmittedAt: candidature.cnapsSubmittedAt?.toISOString() ?? null,
          cnapsReference: candidature.cnapsReference,
          cnapsPrefavorable: candidature.cnapsPrefavorable,
          cnapsDecisionAt: candidature.cnapsDecisionAt?.toISOString() ?? null,
          validatedAt: candidature.validatedAt?.toISOString() ?? null,
          completedAt: candidature.completedAt?.toISOString() ?? null,
          updatedAt: candidature.updatedAt.toISOString(),
          isDossierSent: candidature.status !== CandidatureStatus.DRAFT,
        }
      : null,
    formationSheet: sheetModel,
    formationOverviewMetrics,
    devis: (candidature?.financeDevis ?? []).map((d) => {
      const snap =
        d.clientSnapshot != null &&
        typeof d.clientSnapshot === 'object' &&
        !Array.isArray(d.clientSnapshot)
          ? (d.clientSnapshot as Record<string, unknown>)
          : {};
      return {
        id: d.id,
        referenceCode: d.referenceCode,
        title: d.title,
        status: d.status,
        statusLabel: FINANCE_DEVIS_STATUS_LABEL_FR[d.status],
        totalTtc: Number(d.totalTtc),
        currency: d.currency,
        validUntil: d.validUntil?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
        fundingHint:
          typeof snap.fundingHint === 'string'
            ? snap.fundingHint
            : typeof snap.fundingMode === 'string'
              ? snap.fundingMode
              : null,
      };
    }),
    documents: {
      total: documents.length,
      cnapsUploaded: cnapsUploadedCount,
      cnapsVerified: cnapsVerifiedCount,
      cnapsTotal: CNAPS_DOSSIER_SLOTS.length,
    },
    parcours: {
      currentStep: stepIndex,
      steps: PARCOURS_STEPS.map((s, i) => ({
        key: s.key,
        label: s.label,
        state: i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'upcoming',
      })),
    },
    cnapsSlots,
    sessions: enrollments.map((e) => ({
      formationName: e.session.formation?.name ?? 'Formation',
      formationSlug: e.session.formation?.slug ?? null,
      sessionLabel: e.session.dateDisplayLabel,
      location: e.session.location,
      subtitle: e.session.sessionSubtitle,
      startDate: e.session.startDate?.toISOString() ?? null,
      endDate: e.session.endDate?.toISOString() ?? null,
      enrolledAt: e.createdAt.toISOString(),
      enrollmentStatus: e.enrollmentStatus,
      enrollmentStatusLabel:
        ENROLLMENT_STATUS_LABEL_FR[e.enrollmentStatus] ?? e.enrollmentStatus,
      examOutcome: e.examOutcome,
      examOutcomeLabel: EXAM_OUTCOME_LABEL_FR[e.examOutcome] ?? e.examOutcome,
    })),
    lms: {
      tier: lmsTier,
      label: lmsAccessLabel(lmsTier),
      canStart: lmsTier !== 'none',
    },
    recentActivity,
  });
}
