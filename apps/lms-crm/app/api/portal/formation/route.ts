import { ok, fail } from '@/app/api/_shared/http/response';
import { canAccessChapter } from '@/lib/portal/lms-access';
import { lmsAccessLabel } from '@/lib/portal/lms-access-shared';
import {
  buildPortalFormationOverviewMetrics,
  buildPortalFormationSheetModel,
} from '@/lib/portal/dossier-formation-sheet';
import {
  loadPortalFormationInstructor,
  resolvePortalTrainerUserId,
} from '@/lib/portal/portal-formation-instructor';
import { getPortalLearnerContext } from '@/lib/portal/portal-auth';
import { buildFormationPortalDisplayMeta } from '@/lib/portal/formation-portal-display';
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
  complementaryDetails: true,
  updatedAt: true,
  modules: true,
  presentationBullets: true,
  programModules: true,
  prerequisitesTable: true,
  fundingBlocks: true,
  fundingChannels: true,
  overviewMetrics: true,
  certificationSteps: true,
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
  const auth = await getPortalLearnerContext();
  if (!auth.ok) return fail(auth.message, auth.status);

  const { userId, access, candidature } = auth.ctx;
  const formationId = candidature?.formationId;

  if (!formationId) {
    return ok({
      hasFormation: false,
      lms: { tier: access.tier, label: lmsAccessLabel(access.tier) },
    });
  }

  const formationRow = await prisma.formation.findUnique({
    where: { id: formationId },
    select: formationSelect,
  });

  if (!formationRow) {
    return ok({
      hasFormation: false,
      lms: { tier: access.tier, label: lmsAccessLabel(access.tier) },
    });
  }

  const sheet = buildPortalFormationSheetModel(formationRow);
  const { trainerUserId, sessionLabel } = await resolvePortalTrainerUserId({
    formationId,
    interestedSessionId: auth.ctx.candidature?.interestedSession?.id ?? null,
    userId,
  });
  const instructor = await loadPortalFormationInstructor(trainerUserId, sessionLabel);
  const metrics = {
    ...buildPortalFormationOverviewMetrics(formationRow),
    ...(instructor
      ? {
          sessionTrainer: {
            name: instructor.displayName,
            email: instructor.email,
            avatar: instructor.avatar,
          },
        }
      : {}),
  };

  const participantCount = await prisma.formationSessionParticipant.count({
    where: { session: { formationId } },
  });

  const catalogDisplay = buildFormationPortalDisplayMeta({
    providerName: formationRow.providerName,
    instructorName: instructor?.displayName ?? null,
    clientSatisfactionRate:
      formationRow.clientSatisfactionRate != null
        ? Number(formationRow.clientSatisfactionRate)
        : null,
    theoryPercent: formationRow.theoryPercent,
    practicePercent: formationRow.practicePercent,
    updatedAt: formationRow.updatedAt,
    complementaryDetails: formationRow.complementaryDetails,
    participantCount,
  });

  const courseId = formationRow.courseId ?? candidature?.formation?.courseId ?? null;
  let lmsProgress = {
    courseId: null as string | null,
    progressPercent: 0,
    completedChapterCount: 0,
    chapterCount: 0,
    nextChapterId: null as string | null,
    imageUrl: null as string | null,
  };

  if (courseId) {
    const course = await prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      select: {
        id: true,
        imageUrl: true,
        chapters: {
          where: { isPublished: true },
          orderBy: { position: 'asc' },
          select: { id: true, isFree: true, isPublished: true, position: true },
        },
      },
    });

    if (course) {
      const progressRows = await prisma.userProgress.findMany({
        where: {
          userId,
          chapterId: { in: course.chapters.map((c) => c.id) },
          isCompleted: true,
        },
        select: { chapterId: true },
      });
      const completedIds = new Set(progressRows.map((p) => p.chapterId));
      const completedCount = course.chapters.filter((c) => completedIds.has(c.id)).length;
      const nextChapter =
        course.chapters.find((c) => canAccessChapter(access, c) && !completedIds.has(c.id)) ??
        course.chapters.find((c) => canAccessChapter(access, c));

      lmsProgress = {
        courseId: course.id,
        progressPercent:
          course.chapters.length > 0
            ? Math.round((completedCount / course.chapters.length) * 100)
            : 0,
        completedChapterCount: completedCount,
        chapterCount: course.chapters.length,
        nextChapterId: nextChapter?.id ?? null,
        imageUrl: course.imageUrl,
      };
    }
  }

  return ok({
    hasFormation: true,
    formation: {
      id: formationRow.id,
      slug: formationRow.slug,
      name: formationRow.name,
      tag: formationRow.tag,
      duration: formationRow.duration,
      logoUrl: formationRow.logoUrl,
      deliveryMode: formationRow.deliveryMode,
      providerName: formationRow.providerName,
      providerEmail: formationRow.providerEmail,
      providerPhone: formationRow.providerPhone,
      cpfEligible: formationRow.cpfEligible,
      qualiopiCertified: formationRow.qualiopiCertified,
      clientSatisfactionRate: formationRow.clientSatisfactionRate,
    },
    sheet,
    metrics,
    instructor,
    catalogDisplay,
    lms: {
      tier: access.tier,
      label: lmsAccessLabel(access.tier),
      canStart: access.tier !== 'none',
      ...lmsProgress,
    },
    sessionStartsAt: auth.ctx.sessionStartsAt?.toISOString() ?? null,
  });
}
