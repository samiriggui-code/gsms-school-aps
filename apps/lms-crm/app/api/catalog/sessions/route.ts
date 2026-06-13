import { NextRequest, NextResponse } from 'next/server';
import { CandidatureStatus, FormationSessionEnrollmentStatus } from '@repo/database';
import prisma from '@/lib/prisma';
import { getCache, setCache } from '@repo/redis';

export const dynamic = 'force-dynamic';

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')?.trim();
  if (!slug) {
    return NextResponse.json({ message: 'Paramètre slug requis.' }, { status: 400 });
  }

  try {
    const cacheKey = `sessions:${slug}`;
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const formation = await prisma.formation.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        catalogOffer: {
          select: { catalogStatus: true },
        },
      },
    });

    if (!formation) {
      return NextResponse.json({
        formation: null,
        sessions: [],
        catalogInactive: false,
      });
    }

    if (formation.catalogOffer && formation.catalogOffer.catalogStatus !== 'ACTIVE') {
      return NextResponse.json({
        formation: { id: formation.id, name: formation.name, slug: formation.slug },
        sessions: [],
        catalogInactive: true,
      });
    }

    const today = startOfToday();

    const sessions = await prisma.formationSession.findMany({
      where: {
        formationId: formation.id,
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      orderBy: [{ sortOrder: 'asc' }, { startDate: 'asc' }],
      select: {
        id: true,
        dateDisplayLabel: true,
        location: true,
        registrationClosesAt: true,
        traineesMax: true,
        traineesMin: true,
        sessionKind: true,
        sessionSubtitle: true,
        startDate: true,
        endDate: true,
        bookingEnabled: true,
      },
    });

    const sessionIds = sessions.map((s) => s.id);
    if (sessionIds.length === 0) {
      return NextResponse.json({
        formation: { id: formation.id, name: formation.name, slug: formation.slug },
        sessions: [],
        catalogInactive: false,
      });
    }

    const [enrolledGroups, pipelineGroups] = await Promise.all([
      prisma.formationSessionParticipant.groupBy({
        by: ['sessionId'],
        where: {
          sessionId: { in: sessionIds },
          enrollmentStatus: FormationSessionEnrollmentStatus.CONFIRMED,
        },
        _count: { _all: true },
      }),
      prisma.candidature.groupBy({
        by: ['interestedSessionId'],
        where: {
          interestedSessionId: { in: sessionIds },
          status: { not: CandidatureStatus.ARCHIVED },
        },
        _count: { _all: true },
      }),
    ]);

    const enrolledMap = Object.fromEntries(
      enrolledGroups.map((g) => [g.sessionId, g._count._all]),
    );
    const pipelineMap = Object.fromEntries(
      pipelineGroups
        .filter((g): g is typeof g & { interestedSessionId: string } => g.interestedSessionId != null)
        .map((g) => [g.interestedSessionId, g._count._all]),
    );

    const now = new Date();

    const payload = sessions.map((s) => {
      const enrolledConfirmed = enrolledMap[s.id] ?? 0;
      const pipelineInterested = pipelineMap[s.id] ?? 0;
      const cap = s.traineesMax;
      const isFull = cap != null && cap > 0 && enrolledConfirmed >= cap;
      const closesAt = s.registrationClosesAt;
      const registrationClosed = closesAt != null && closesAt < now;

      return {
        id: s.id,
        dateDisplayLabel: s.dateDisplayLabel,
        location: s.location,
        registrationClosesAt: closesAt?.toISOString() ?? null,
        traineesMax: cap,
        traineesMin: s.traineesMin,
        sessionKind: s.sessionKind,
        sessionSubtitle: s.sessionSubtitle,
        startDate: s.startDate?.toISOString() ?? null,
        endDate: s.endDate?.toISOString() ?? null,
        bookingEnabled: s.bookingEnabled,
        enrolledConfirmed,
        pipelineInterested,
        isFull,
        registrationClosed,
      };
    });

    const result = {
      formation: { id: formation.id, name: formation.name, slug: formation.slug },
      sessions: payload,
      catalogInactive: false,
    };

    // Cache pour 5 minutes (300 secondes) pour les sessions (plus volatil)
    await setCache(cacheKey, result, 300);

    return NextResponse.json(result);
  } catch (e) {
    console.error('[catalog/sessions]', e);
    return NextResponse.json({ message: 'Erreur serveur lors du chargement des sessions.' }, { status: 500 });
  }
}
