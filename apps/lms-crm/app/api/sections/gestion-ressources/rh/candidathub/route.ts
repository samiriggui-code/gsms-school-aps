import { NextRequest, NextResponse } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import { CandidatureStatus, Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { getLmsAccessTier } from '@/lib/portal/lms-access';
import {
  candidatHubLifecycleWhere,
  HUB_DOSSIER_LABEL_FR,
} from '../../_lib/rh-learners-shared';

const hubSelect = {
  id: true,
  name: true,
  email: true,
  proEmail: true,
  avatar: true,
  status: true,
  lastSignInAt: true,
  updatedAt: true,
  role: { select: { slug: true, name: true } },
  candidatures: {
    orderBy: { updatedAt: 'desc' as const },
    take: 1,
    select: {
      id: true,
      status: true,
      formation: { select: { id: true, name: true } },
      interestedSession: { select: { id: true, dateDisplayLabel: true } },
    },
  },
  formationSessionParticipants: {
    orderBy: { createdAt: 'desc' as const },
    take: 5,
    select: {
      enrollmentStatus: true,
      session: {
        select: {
          id: true,
          dateDisplayLabel: true,
          formation: { select: { name: true } },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type HubUserRow = Prisma.UserGetPayload<{ select: typeof hubSelect }>;

function mapHubListRow(u: HubUserRow) {
  const primary = u.candidatures[0] ?? null;
  const dossierStatus = primary?.status ?? null;
  const dossierLabel = dossierStatus
    ? HUB_DOSSIER_LABEL_FR[dossierStatus] ?? dossierStatus
    : 'Sans dossier';

  const enrolled = u.formationSessionParticipants;
  const hasEnrollment = enrolled.length > 0;
  let sessionLabel = '—';
  if (hasEnrollment) {
    const first = enrolled[0];
    const fn = first.session.formation?.name ?? 'Formation';
    sessionLabel =
      enrolled.length === 1
        ? `${first.session.dateDisplayLabel} (${fn})`
        : `${enrolled.length} sessions · ${first.session.dateDisplayLabel}…`;
  } else if (primary?.interestedSession) {
    sessionLabel = `Visée · ${primary.interestedSession.dateDisplayLabel}`;
  }

  let situation = 'parcours';
  if (hasEnrollment) situation = 'inscrit_session';
  else if (dossierStatus === CandidatureStatus.VALIDATED) situation = 'dossier_valide';
  else if (primary && dossierStatus) situation = 'dossier_en_cours';

  return {
    userId: u.id,
    name: u.name,
    email: u.email,
    personalEmail: u.email,
    proEmail: u.proEmail,
    avatar: u.avatar,
    userStatus: u.status,
    roleSlug: u.role.slug,
    roleName: u.role.name,
    lastSignInAt: u.lastSignInAt?.toISOString() ?? null,
    lmsAccessTier: getLmsAccessTier(dossierStatus),
    updatedAt: u.updatedAt.toISOString(),
    dossierStatus,
    dossierLabel,
    candidatureId: primary?.id ?? null,
    formationName: primary?.formation?.name ?? null,
    sessionLabel,
    hasEnrollment,
    enrollmentCount: enrolled.length,
    situation,
  };
}

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const query = (searchParams.get('query') || '').trim();
  const lifecycle = searchParams.get('lifecycle');
  const sortField = (searchParams.get('sort') || 'updatedAt').trim();
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

  const baseWhere: Prisma.UserWhereInput = {
    isTrashed: false,
    role: { slug: { in: ['candidat', 'eleve'] }, isTrashed: false },
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { proEmail: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const where: Prisma.UserWhereInput = {
    ...baseWhere,
    ...candidatHubLifecycleWhere(lifecycle),
  };

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sortField === 'name' ? { name: sortDir }
    : sortField === 'email' ? { email: sortDir }
    : { updatedAt: sortDir };

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy,
      select: hubSelect,
    }),
  ]);

  return NextResponse.json({
    data: users.map(mapHubListRow),
    pagination: { total: totalCount, page, limit },
  });
}
