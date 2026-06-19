import { Prisma } from '@repo/database';
import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { qualificationMetierLabel } from '@/lib/rh-qualification-metier';
import {
  mapRhConformiteListRow,
  type RhComplianceStatus,
} from '@/lib/gestion-ressources/rh-conformite-compliance';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import { POST as postCollaborateur } from '../collaborateurs/[[...path]]/route';

const COMPLIANCE_STATUSES = new Set<RhComplianceStatus>([
  'COMPLIANT',
  'WARNING',
  'NON_COMPLIANT',
]);

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(200, Number(url.searchParams.get('limit') || 20)));
    const sort = url.searchParams.get('sort') || 'createdAt';
    const dir = url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
    const query = url.searchParams.get('query') || '';
    const roleId = url.searchParams.get('roleId') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const userCategory = url.searchParams.get('userCategory') || undefined;
    const profileType = url.searchParams.get('profileType') || undefined;
    const complianceStatusParam = url.searchParams.get('complianceStatus') || undefined;
    const complianceStatus =
      complianceStatusParam && COMPLIANCE_STATUSES.has(complianceStatusParam as RhComplianceStatus)
        ? (complianceStatusParam as RhComplianceStatus)
        : undefined;

    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = { isTrashed: false };
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (roleId) where.roleId = roleId;
    if (status) where.status = status as Prisma.EnumUserStatusFilter['equals'];
    if (userCategory) where.userCategory = userCategory as Prisma.EnumUserCategoryFilter['equals'];
    if (profileType === 'formateur') {
      where.role = { slug: 'formateur' };
    } else if (profileType === 'interne') {
      where.userCategory = 'INTERNAL';
    }

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: complianceStatus ? 0 : skip,
        take: complianceStatus ? undefined : limit,
        orderBy: { [sort]: dir },
        include: {
          role: true,
          formateurProfile: { select: { speciality: true, specialties: true } },
          collaborateurProfile: { select: { qualification: true, jobFunction: true } },
        },
      }),
    ]);

    const mapped = data.map((u) =>
      mapRhConformiteListRow(u, {
        qualification:
          qualificationMetierLabel({
            qualification: u.qualification,
            jobFunction: u.jobFunction,
            roleSlug: u.role?.slug,
            collaborateurProfile: u.collaborateurProfile ?? null,
            formateurProfile: u.formateurProfile ?? null,
          }) ?? u.qualification ?? null,
      }),
    );

    const filtered = complianceStatus
      ? mapped.filter((row) => row.complianceStatus === complianceStatus)
      : mapped;

    const paged = complianceStatus ? filtered.slice(skip, skip + limit) : filtered;

    return ok({
      data: paged,
      pagination: {
        total: complianceStatus ? filtered.length : total,
        page,
      },
    });
  } catch (error) {
    return fail('Impossible de récupérer les conformités.', 500, error);
  }
}

/** Création via handler collaborateur (FormData + FileAsset + dossiers conformité). */
export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const res = await postCollaborateur(request, { params: Promise.resolve({ path: [] }) });
  if (!res.ok) return res;

  try {
    const body = await res.clone().json();
    const user = body?.data ?? body;
    if (user?.id) {
      return ok(mapRhConformiteListRow(user), 201);
    }
    return res;
  } catch (error) {
    return fail('Impossible de créer la conformité.', 500, error);
  }
}
