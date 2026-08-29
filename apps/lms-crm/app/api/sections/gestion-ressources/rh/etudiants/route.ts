import { NextRequest, NextResponse } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import {
  CandidatureSource,
  CandidatureStatus,
  Prisma,
} from '@repo/database';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import {
  assertUserMailboxesAvailable,
  resolveCreateUserEmails,
} from '@/lib/user-email-routing';
import { qualificationMetierLabel } from '@/lib/rh-qualification-metier';
import { UserStatus } from '@/app/models/user';
import { fail } from '@/app/api/_shared/http/response';
import { attachActiveAbsencesToUsers } from '@repo/api-core';
import { afterCandidatureCreated } from '@/lib/of/candidature-assessment-bootstrap';
import {
  getLearnerScopedWhere,
  mapFormEtudiantUserCategory,
  parseLearnerRoleSlug,
  parseOptDateInput,
} from '../../_lib/rh-learners-shared';

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
  const query = (searchParams.get('query') || '').trim();
  const sortField = searchParams.get('sort') || 'createdAt';
  const sortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const userCategoryParam = searchParams.get('userCategory');
  const statusRaw = searchParams.get('status');
  const statusVals = Object.values(UserStatus);
  const statusWhere: Prisma.UserWhereInput =
    statusRaw && statusRaw !== 'all' && statusVals.includes(statusRaw as UserStatus)
      ? { status: statusRaw as UserStatus }
      : {};

  const categoryWhere =
    userCategoryParam && userCategoryParam !== 'all'
      ? { userCategory: userCategoryParam as 'INTERNAL' | 'CLIENT' | 'SUBCONTRACTOR' }
      : {};

  const roleSlug = parseLearnerRoleSlug(searchParams.get('roleSlug'));

  const where: Prisma.UserWhereInput = getLearnerScopedWhere(roleSlug, {
    ...statusWhere,
    ...categoryWhere,
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  });

  const totalCount = await prisma.user.count({ where });

  const sortMap: Record<string, Prisma.UserOrderByWithRelationInput> = {
    name: { name: sortDirection },
    role_name: { role: { name: sortDirection } },
    status: { status: sortDirection },
    createdAt: { createdAt: sortDirection },
    lastSignInAt: { lastSignInAt: sortDirection },
  };
  const orderBy = sortMap[sortField] ?? { createdAt: sortDirection };

  const users = await prisma.user.findMany({
    where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy,
    select: {
      id: true,
      isTrashed: true,
      avatar: true,
      name: true,
      email: true,
      status: true,
      createdAt: true,
      lastSignInAt: true,
      userCategory: true,
      qualification: true,
      jobFunction: true,
      collaborateurProfile: { select: { qualification: true, jobFunction: true } },
      formateurProfile: { select: { speciality: true, specialties: true } },
      role: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({
    data: await attachActiveAbsencesToUsers(
      prisma,
      users.map((u) => ({
        ...u,
        qualification:
          qualificationMetierLabel({
            qualification: u.qualification,
            jobFunction: u.jobFunction,
            roleSlug: u.role?.slug,
            collaborateurProfile: u.collaborateurProfile ?? null,
            formateurProfile: u.formateurProfile ?? null,
          }) || null,
      })),
    ),
    pagination: { total: totalCount, page, limit },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json(
      { message: "Content-Type multipart/form-data attendu pour la création d'un étudiant." },
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
  const personalEmail = getStr('email').toLowerCase();
  const password = String(fd.get('password') ?? '');

  if (!personalEmail || !password || password.length < 8) {
    return NextResponse.json(
      { message: 'E-mail personnel et mot de passe (8 caractères minimum) requis.' },
      { status: 400 },
    );
  }

  let mailboxes: { email: string; proEmail: string };
  try {
    mailboxes = resolveCreateUserEmails({
      email: personalEmail,
      proEmail: getStr('proEmail') || null,
      firstName,
      lastName,
    });
  } catch (e) {
    return NextResponse.json(
      { message: e instanceof Error ? e.message : 'Emails invalides.' },
      { status: 400 },
    );
  }

  const availability = await assertUserMailboxesAvailable(prisma, mailboxes);
  if (!availability.ok) {
    return NextResponse.json({ message: availability.message }, { status: 409 });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const name = [firstName, lastName].filter(Boolean).join(' ') || mailboxes.email;
  const userCategory = mapFormEtudiantUserCategory(getStr('userCategory') || 'INTERNAL');
  const subcontractorId =
    userCategory === 'SUBCONTRACTOR' ? getStr('subcontractorId') || null : null;

  const roleIdRequested = getStr('roleId');
  const learnerRole = roleIdRequested
    ? await prisma.userRole.findFirst({
        where: {
          id: roleIdRequested,
          isTrashed: false,
          slug: { in: ['eleve', 'candidat'] },
        },
      })
    : null;

  if (!learnerRole) {
    return NextResponse.json(
      { message: 'Rôle élève ou candidat requis (roleId).' },
      { status: 400 },
    );
  }

  const slug = learnerRole.slug;

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: mailboxes.email,
        password: hashedPassword,
        name,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: getStr('phone') || null,
        proEmail: mailboxes.proEmail,
        status: UserStatus.ACTIVE,
        roleId: learnerRole.id,
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

    if (slug === 'candidat') {
      await tx.candidature.create({
        data: {
          userId: u.id,
          source: CandidatureSource.MANUAL,
          status: CandidatureStatus.DRAFT,
        },
      });
    }

    return u;
  });

  if (slug === 'candidat') {
    const draft = await prisma.candidature.findFirst({
      where: { userId: user.id, source: CandidatureSource.MANUAL, status: CandidatureStatus.DRAFT },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (draft) await afterCandidatureCreated(prisma, draft.id, request);
  }

  return NextResponse.json(
    {
      message: slug === 'candidat' ? 'Candidat créé avec dossier brouillon.' : 'Élève créé.',
      userId: user.id,
    },
    { status: 200 },
  );
}
