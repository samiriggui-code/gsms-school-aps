import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { qualificationMetierLabel } from '@/lib/rh-qualification-metier';
import { UserStatus } from '@/app/models/user';
import { ok, fail } from '@/app/api/_shared/http/response';
import { uploadFile } from '@repo/storage';
import { mapSystemLogsToRhActivity } from '@/lib/rh-iam-activity-history';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ path?: string[] }> };

function splitName(fullName?: string | null) {
  const normalized = (fullName || '').trim();
  if (!normalized) return { firstName: '', lastName: '' };
  const parts = normalized.split(/\s+/);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

function parseDate(value: unknown) {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseBool(value: unknown, fallback = true) {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
  return fallback;
}

const USER_CATEGORY_VALUES = ['INTERNAL', 'CLIENT', 'SUBCONTRACTOR'] as const;
type AllowedUserCategory = (typeof USER_CATEGORY_VALUES)[number];

function normalizeUserCategory(
  value: unknown,
  fallback: AllowedUserCategory = 'INTERNAL',
): AllowedUserCategory {
  return USER_CATEGORY_VALUES.includes(value as AllowedUserCategory)
    ? (value as AllowedUserCategory)
    : fallback;
}

function parseFileOrValue(value: FormDataEntryValue | null): string | File | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (value instanceof File) return value.size > 0 ? value : null;
  return null;
}

async function storeCollaborateurFile(
  file: File,
  userId: string,
  createdById: string,
  category: string,
): Promise<string> {
  const uploaded = await uploadFile({
    file,
    module: 'crm',
    entityType: 'collaborateur',
    entityId: userId,
    category,
    visibility: 'private',
  });
  await prisma.fileAsset.create({
    data: {
      module: 'crm',
      entityType: 'collaborateur',
      entityId: userId,
      category,
      originalName: uploaded.originalName,
      mimeType: uploaded.mimeType,
      size: uploaded.size,
      storageKey: uploaded.key,
      url: uploaded.url,
      visibility: 'PRIVATE',
      provider: 's3',
      createdById,
    },
  });
  return uploaded.url;
}

function stringFieldFromPayload(value: string | File | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  return null;
}

async function resolveCollaborateurFilePatch(
  raw: string | File | null | undefined,
  opts: { userId: string; createdById: string; category: string },
): Promise<string | null | undefined> {
  if (raw === undefined) return undefined;
  if (raw instanceof File && raw.size > 0) {
    return storeCollaborateurFile(raw, opts.userId, opts.createdById, opts.category);
  }
  if (typeof raw === 'string') return raw.trim() || null;
  return null;
}

function dedupeSpecStrings(parts: string[]) {
  return Array.from(new Set(parts.map((s) => s.trim()).filter(Boolean)));
}

/** Étant donné brut FormData ou JSON (`string`, `string[]` ou tableau JSON sérialisé). */
function parseSpecialtiesPayload(raw: unknown): string[] {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) return dedupeSpecStrings(raw.map(String));
  const s = String(raw).trim();
  if (!s) return [];
  try {
    const j = JSON.parse(s);
    if (Array.isArray(j)) return dedupeSpecStrings(j.map(String));
  } catch {
    /* fall through */
  }
  return dedupeSpecStrings(s.split(/[,;\n]/));
}

function teachingSpecialtiesFromProfile(fp: any | null | undefined): string[] {
  if (!fp) return [];
  const arr = parseSpecialtiesPayload(fp.specialties);
  if (arr.length) return arr;
  const one = typeof fp.speciality === 'string' ? fp.speciality.trim() : '';
  return one ? [one] : [];
}

const collaborateurHydrateInclude = {
  role: true,
  formateurProfile: {
    select: {
      speciality: true,
      specialties: true,
      schoolInternalService: true,
    },
  },
  collaborateurProfile: {
    select: {
      qualification: true,
      jobFunction: true,
      schoolInternalService: true,
      managerUserId: true,
      manager: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: { select: { slug: true, name: true } },
        },
      },
    },
  },
} satisfies Parameters<typeof prisma.user.findUnique>[0]['include'];

async function upsertFormateurProfileFromPayload(
  userId: string,
  roleSlug: string,
  opts: {
    userCategory?: string | null;
    specialties?: string[] | undefined;
  },
) {
  if (roleSlug !== 'formateur') {
    await prisma.formateurProfile.deleteMany({ where: { userId } });
    return;
  }

  const isInternal =
    opts.userCategory == null ||
    opts.userCategory === '' ||
    opts.userCategory === 'INTERNAL';

  const existingFp = await prisma.formateurProfile.findUnique({
    where: { userId },
    select: { specialties: true, speciality: true },
  });

  const specs =
    opts.specialties !== undefined
      ? dedupeSpecStrings(opts.specialties)
      : teachingSpecialtiesFromProfile(existingFp);

  await prisma.formateurProfile.upsert({
    where: { userId },
    create: {
      userId,
      isInternal,
      speciality: specs[0] ?? null,
      specialties: specs,
    },
    update: {
      isInternal,
      ...(opts.specialties !== undefined
        ? {
            speciality: specs[0] ?? null,
            specialties: specs,
          }
        : {}),
    },
  });
}

function toCollaborateur(user: any) {
  const names = splitName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  const teachingSpecialties = teachingSpecialtiesFromProfile(user.formateurProfile);
  const qualificationMetier =
    qualificationMetierLabel({
      qualification: user.qualification,
      jobFunction: user.jobFunction,
      roleSlug: user.role?.slug,
      collaborateurProfile: user.collaborateurProfile ?? null,
      formateurProfile: user.formateurProfile ?? null,
    }) || null;
  return {
    ...user,
    firstName: user.firstName || names.firstName,
    lastName: user.lastName || names.lastName,
    userCategory: user.userCategory || 'INTERNAL',
    qualification: qualificationMetier,
    jobFunction: user.jobFunction || null,
    teachingSpecialties,
  };
}

function listFallback(req: NextRequest) {
  const url = new URL(req.url);
  const page = Number(url.searchParams.get('page') || 1);
  const limit = Number(url.searchParams.get('limit') || 10);
  return ok({
    items: [],
    pagination: { page, limit, total: 0 },
  });
}

const SCHOOL_INTERNAL_SERVICE_VALUES = ['TRAINER_POOL', 'PEDAGOGICAL', 'HR_ADMIN'] as const;
type SchoolInternalServiceValue = (typeof SCHOOL_INTERNAL_SERVICE_VALUES)[number];

function parseSchoolInternalService(
  raw: string | null | undefined,
): SchoolInternalServiceValue | null {
  if (raw == null) return null;
  const v = String(raw).trim();
  if (!v) return null;
  return (SCHOOL_INTERNAL_SERVICE_VALUES as readonly string[]).includes(v)
    ? (v as SchoolInternalServiceValue)
    : null;
}

/** Champs « Structure » : N+1 + pôle (profil collaborateur) ou pôle seul (profil formateur). */
async function syncStructureProfileFields(
  userId: string,
  roleSlug: string,
  opts: { managerUserId?: string | null; schoolInternalService?: string | null },
) {
  const hasMgr = opts.managerUserId !== undefined;
  const hasSvc = opts.schoolInternalService !== undefined;
  if (!hasMgr && !hasSvc) return;

  const svc = hasSvc ? parseSchoolInternalService(opts.schoolInternalService ?? '') : undefined;

  if (roleSlug === 'formateur') {
    if (!hasSvc) return;
    await prisma.formateurProfile.upsert({
      where: { userId },
      create: {
        userId,
        isInternal: true,
        specialties: [],
        schoolInternalService: svc ?? null,
      },
      update: { schoolInternalService: svc ?? null },
    });
    return;
  }

  let managerUserId: string | null | undefined = undefined;
  if (hasMgr) {
    const raw = opts.managerUserId;
    const candidate = raw && raw !== userId ? raw : null;
    if (candidate) {
      const ok = await prisma.user.findFirst({
        where: { id: candidate, isTrashed: false },
        select: { id: true },
      });
      managerUserId = ok ? candidate : null;
    } else {
      managerUserId = null;
    }
  }

  await prisma.collaborateurProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...(hasMgr ? { managerUserId: managerUserId ?? null } : {}),
      ...(hasSvc ? { schoolInternalService: svc ?? null } : {}),
    },
    update: {
      ...(hasMgr ? { managerUserId: managerUserId ?? null } : {}),
      ...(hasSvc ? { schoolInternalService: svc ?? null } : {}),
    },
  });
}

async function parseBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const formKeys = new Set(form.keys());
    const avatarAction = String(form.get('avatarAction') || '').trim().toLowerCase();
    const avatarInput = parseFileOrValue(form.get('avatar') ?? form.get('avatarFile'));
    const avatar = avatarAction === 'remove' ? '' : avatarInput;
    const firstName = String(form.get('firstName') || '').trim();
    const lastName = String(form.get('lastName') || '').trim();

    return {
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email: String(form.get('email') || '').trim().toLowerCase(),
      phone: String(form.get('phone') || '').trim(),
      proEmail: String(form.get('proEmail') || '').trim(),
      roleId: String(form.get('roleId') || '').trim(),
      status: String(form.get('status') || '').trim().toUpperCase(),
      userCategory: String(form.get('userCategory') || 'INTERNAL').trim().toUpperCase(),
      subcontractorId: String(form.get('subcontractorId') || '').trim(),
      jobFunction: String(form.get('jobFunction') || '').trim(),
      qualification: String(form.get('qualification') || '').trim(),
      specialties: formKeys.has('specialties')
        ? parseSpecialtiesPayload(form.get('specialties'))
        : undefined,
      birthDate: parseDate(form.get('birthDate')),
      birthPlace: String(form.get('birthPlace') || '').trim(),
      nationality: String(form.get('nationality') || '').trim(),
      socialSecurityNumber: String(form.get('socialSecurityNumber') || '').trim(),
      cniNumber: String(form.get('cniNumber') || '').trim(),
      residencePermitNumber: String(form.get('residencePermitNumber') || '').trim(),
      residencePermitExpiry: parseDate(form.get('residencePermitExpiry')),
      contractType: String(form.get('contractType') || '').trim().toUpperCase(),
      workTimeType: String(form.get('workTimeType') || '').trim().toUpperCase(),
      contractStartDate: parseDate(form.get('contractStartDate')),
      contractEndDate: parseDate(form.get('contractEndDate')),
      address: String(form.get('address') || '').trim(),
      city: String(form.get('city') || '').trim(),
      postalCode: String(form.get('postalCode') || '').trim(),
      carteProNumber: String(form.get('carteProNumber') || '').trim(),
      carteProExpiry: parseDate(form.get('carteProExpiry')),
      isSchedulable: parseBool(form.get('isSchedulable')),
      documentCni: parseFileOrValue(form.get('documentCni')),
      documentAssurance: parseFileOrValue(form.get('documentAssurance')),
      documentResidencePermit: parseFileOrValue(form.get('documentResidencePermit')),
      documentCartePro: parseFileOrValue(form.get('documentCartePro')),
      avatar,
      managerUserId: formKeys.has('managerUserId')
        ? String(form.get('managerUserId') || '').trim() || null
        : undefined,
      schoolInternalService: formKeys.has('schoolInternalService')
        ? String(form.get('schoolInternalService') || '').trim() || null
        : undefined,
    };
  }

  const json = await request.json().catch(() => ({}));
  const jsonAvatarAction = String((json as any).avatarAction || '')
    .trim()
    .toLowerCase();
  const jsonAvatarRaw = String(
    (json as any).avatar ?? (json as any).avatarFile ?? '',
  ).trim();
  const jsonAvatar = jsonAvatarAction === 'remove' ? '' : jsonAvatarRaw;
  const firstName = String((json as any).firstName || '').trim();
  const lastName = String((json as any).lastName || '').trim();
  return {
    firstName,
    lastName,
    name: String((json as any).name || `${firstName} ${lastName}`).trim(),
    email: String((json as any).email || '').trim().toLowerCase(),
    phone: String((json as any).phone || '').trim(),
    proEmail: String((json as any).proEmail || '').trim(),
    roleId: String((json as any).roleId || '').trim(),
    status: String((json as any).status || '').trim().toUpperCase(),
    userCategory: String((json as any).userCategory || 'INTERNAL').trim().toUpperCase(),
    subcontractorId: String((json as any).subcontractorId || '').trim(),
    jobFunction: String((json as any).jobFunction || '').trim(),
    qualification: String((json as any).qualification || '').trim(),
    specialties:
      Object.prototype.hasOwnProperty.call(json, 'specialties')
        ? parseSpecialtiesPayload((json as any).specialties)
        : undefined,
    birthDate: parseDate((json as any).birthDate),
    birthPlace: String((json as any).birthPlace || '').trim(),
    nationality: String((json as any).nationality || '').trim(),
    socialSecurityNumber: String((json as any).socialSecurityNumber || '').trim(),
    cniNumber: String((json as any).cniNumber || '').trim(),
    residencePermitNumber: String((json as any).residencePermitNumber || '').trim(),
    residencePermitExpiry: parseDate((json as any).residencePermitExpiry),
    contractType: String((json as any).contractType || '').trim().toUpperCase(),
    workTimeType: String((json as any).workTimeType || '').trim().toUpperCase(),
    contractStartDate: parseDate((json as any).contractStartDate),
    contractEndDate: parseDate((json as any).contractEndDate),
    address: String((json as any).address || '').trim(),
    city: String((json as any).city || '').trim(),
    postalCode: String((json as any).postalCode || '').trim(),
    carteProNumber: String((json as any).carteProNumber || '').trim(),
    carteProExpiry: parseDate((json as any).carteProExpiry),
    isSchedulable: parseBool((json as any).isSchedulable),
    documentCni: String((json as any).documentCni || '').trim(),
    documentAssurance: String((json as any).documentAssurance || '').trim(),
    documentResidencePermit: String((json as any).documentResidencePermit || '').trim(),
    documentCartePro: String((json as any).documentCartePro || '').trim(),
    avatar: jsonAvatar,
    managerUserId: Object.prototype.hasOwnProperty.call(json, 'managerUserId')
      ? String((json as any).managerUserId ?? '').trim() || null
      : undefined,
    schoolInternalService: Object.prototype.hasOwnProperty.call(json, 'schoolInternalService')
      ? String((json as any).schoolInternalService ?? '').trim() || null
      : undefined,
  };
}

async function handler(request: NextRequest, { params }: Params) {
  const method = request.method.toUpperCase();
  const auth =
    method === 'GET' ? await requireGestionRessourcesView() : await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;
  const session = auth.session;

  const parts = (await params).path || [];

  if (parts.length === 0) {
    if (method === 'GET') {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 10);
      const query = (url.searchParams.get('query') || '').trim();
      const profileType = (url.searchParams.get('profileType') || 'all').trim();
      const andClauses: any[] = [{ NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }] }];
      if (profileType === 'interne') {
        andClauses.push({ NOT: [{ role: { slug: { in: ['collaborateur', 'formateur'] } } }] });
      }
      const where: any = {
        isTrashed: false,
        AND: andClauses,
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      if (profileType === 'collaborateur') {
        where.role = { slug: 'collaborateur' };
      } else if (profileType === 'formateur') {
        where.role = { slug: 'formateur' };
      }

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: collaborateurHydrateInclude,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return NextResponse.json({
        data: users.map(toCollaborateur),
        pagination: { page, limit, total },
      });
    }

    if (method === 'POST') {
      const payload = await parseBody(request);
      if (!payload.email || !payload.roleId) {
        return fail('email et roleId sont requis.', 400);
      }

      const [existing, role] = await Promise.all([
        prisma.user.findUnique({ where: { email: payload.email } }),
        prisma.userRole.findUnique({ where: { id: payload.roleId } }),
      ]);
      if (existing) return fail('Email already registered.', 409);
      if (!role) return fail('Role not found.', 404);

      const created = await prisma.user.create({
        data: {
          email: payload.email,
          firstName: payload.firstName || null,
          lastName: payload.lastName || null,
          name: payload.name || payload.email.split('@')[0],
          phone: payload.phone || null,
          proEmail: payload.proEmail || null,
          roleId: payload.roleId,
          status:
            payload.status && payload.status in UserStatus
              ? (payload.status as any)
              : UserStatus.ACTIVE,
          userCategory: normalizeUserCategory(payload.userCategory, 'INTERNAL'),
          subcontractorId: payload.subcontractorId || null,
          jobFunction:
            (payload.jobFunction || '').trim() ||
            (role.slug === 'formateur' ? 'Formateur' : null),
          qualification: payload.qualification || null,
          birthDate: payload.birthDate || null,
          birthPlace: payload.birthPlace || null,
          nationality: payload.nationality || null,
          socialSecurityNumber: payload.socialSecurityNumber || null,
          cniNumber: payload.cniNumber || null,
          residencePermitNumber: payload.residencePermitNumber || null,
          residencePermitExpiry: payload.residencePermitExpiry || null,
          contractType: (payload.contractType as any) || null,
          workTimeType: (payload.workTimeType as any) || null,
          contractStartDate: payload.contractStartDate || null,
          contractEndDate: payload.contractEndDate || null,
          address: payload.address || null,
          city: payload.city || null,
          postalCode: payload.postalCode || null,
          carteProNumber: payload.carteProNumber || null,
          carteProExpiry: payload.carteProExpiry || null,
          isSchedulable: payload.isSchedulable,
          documentCni: stringFieldFromPayload(payload.documentCni),
          documentAssurance: stringFieldFromPayload(payload.documentAssurance),
          documentResidencePermit: stringFieldFromPayload(payload.documentResidencePermit),
          documentCartePro: stringFieldFromPayload(payload.documentCartePro),
          avatar: stringFieldFromPayload(payload.avatar),
        },
        include: { role: true },
      });

      const createdById = session.user.id;
      const fileUpdates: Record<string, string> = {};
      if (payload.avatar instanceof File && payload.avatar.size > 0) {
        fileUpdates.avatar = await storeCollaborateurFile(
          payload.avatar,
          created.id,
          createdById,
          'avatar',
        );
      }
      if (payload.documentCni instanceof File && payload.documentCni.size > 0) {
        fileUpdates.documentCni = await storeCollaborateurFile(
          payload.documentCni,
          created.id,
          createdById,
          'document_cni',
        );
      }
      if (payload.documentAssurance instanceof File && payload.documentAssurance.size > 0) {
        fileUpdates.documentAssurance = await storeCollaborateurFile(
          payload.documentAssurance,
          created.id,
          createdById,
          'document_assurance',
        );
      }
      if (payload.documentResidencePermit instanceof File && payload.documentResidencePermit.size > 0) {
        fileUpdates.documentResidencePermit = await storeCollaborateurFile(
          payload.documentResidencePermit,
          created.id,
          createdById,
          'document_residence_permit',
        );
      }
      if (payload.documentCartePro instanceof File && payload.documentCartePro.size > 0) {
        fileUpdates.documentCartePro = await storeCollaborateurFile(
          payload.documentCartePro,
          created.id,
          createdById,
          'document_carte_pro',
        );
      }

      const finalUser =
        Object.keys(fileUpdates).length > 0
          ? await prisma.user.update({
              where: { id: created.id },
              data: fileUpdates,
              include: { role: true },
            })
          : created;

      let specsForFormateur: string[] | undefined;
      if (role.slug === 'formateur') {
        specsForFormateur =
          payload.specialties !== undefined
            ? dedupeSpecStrings(payload.specialties)
            : parseSpecialtiesPayload(payload.qualification);
      }

      await upsertFormateurProfileFromPayload(finalUser.id, finalUser.role.slug, {
        userCategory: normalizeUserCategory(payload.userCategory, 'INTERNAL'),
        specialties: specsForFormateur,
      });

      const hydrated = await prisma.user.findUnique({
        where: { id: finalUser.id },
        include: collaborateurHydrateInclude,
      });

      return NextResponse.json(toCollaborateur(hydrated), { status: 201 });
    }

    return fail('Method not allowed.', 405);
  }

  /** Mise à jour partielle N+1 / pôle pour la page Structure (JSON uniquement). */
  if (parts.length === 2 && parts[1] === 'structure' && method === 'PATCH') {
    const userId = parts[0];
    const raw = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    if (raw == null || typeof raw !== 'object') {
      return fail('Corps JSON invalide.', 400);
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, isTrashed: false },
      include: { role: true },
    });
    if (!user?.role) return fail('Utilisateur introuvable.', 404);

    const mgrIn = Object.prototype.hasOwnProperty.call(raw, 'managerUserId');
    const svcIn = Object.prototype.hasOwnProperty.call(raw, 'schoolInternalService');

    const managerUserId = mgrIn
      ? raw.managerUserId == null || String(raw.managerUserId).trim() === ''
        ? null
        : String(raw.managerUserId).trim()
      : undefined;

    const schoolInternalService = svcIn
      ? raw.schoolInternalService == null || String(raw.schoolInternalService).trim() === ''
        ? null
        : String(raw.schoolInternalService).trim()
      : undefined;

    await syncStructureProfileFields(userId, user.role.slug, {
      managerUserId,
      schoolInternalService,
    });

    const hydrated = await prisma.user.findUnique({
      where: { id: userId },
      include: collaborateurHydrateInclude,
    });
    return NextResponse.json(toCollaborateur(hydrated));
  }

  if (parts[0] === 'stats') {
    const url = new URL(request.url);
    const months = Math.max(1, Math.min(24, Number(url.searchParams.get('months') || 12)));
    const profileType = (url.searchParams.get('profileType') || 'all').trim();
    const andClauses: any[] = [{ NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }] }];
    if (profileType === 'interne') {
      andClauses.push({ NOT: [{ role: { slug: { in: ['collaborateur', 'formateur'] } } }] });
    }
    const where: any = {
      isTrashed: false,
      AND: andClauses,
    };
    if (profileType === 'collaborateur') {
      where.role = { slug: 'collaborateur' };
    } else if (profileType === 'formateur') {
      where.role = { slug: 'formateur' };
    }

    const now = new Date();
    const expiringThreshold = new Date(now);
    expiringThreshold.setDate(expiringThreshold.getDate() + 30);
    const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const [
      totalCollaborators,
      activeCollaborators,
      absentCollaborators,
      documentsExpiring,
      documentsExpired,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
      prisma.user.count({ where: { ...where, status: UserStatus.ABSENT } }),
      prisma.user.count({
        where: {
          ...where,
          OR: [
            { carteProExpiry: { gt: now, lte: expiringThreshold } },
            { residencePermitExpiry: { gt: now, lte: expiringThreshold } },
          ],
        },
      }),
      prisma.user.count({
        where: {
          ...where,
          OR: [
            { carteProExpiry: { lte: now } },
            { residencePermitExpiry: { lte: now } },
          ],
        },
      }),
    ]);

    const complianceIssues = documentsExpiring + documentsExpired;
    const complianceNonCompliant = documentsExpired;
    const complianceRate =
      totalCollaborators > 0
        ? Math.max(0, Math.round(((totalCollaborators - complianceIssues) / totalCollaborators) * 100))
        : 100;

    const users = await prisma.user.findMany({
      where,
      select: {
        roleId: true,
        createdAt: true,
      },
    });

    const roleIds = Array.from(new Set(users.map((u) => u.roleId).filter(Boolean)));
    const roles = roleIds.length
      ? await prisma.userRole.findMany({
          where: { id: { in: roleIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
    const roleById = new Map(roles.map((r) => [r.id, r]));

    const categoryMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    const toMonthKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    for (const user of users) {
      const role = roleById.get(user.roleId);
      const roleLabel = role?.name || role?.slug || 'Autres';
      categoryMap.set(roleLabel, (categoryMap.get(roleLabel) || 0) + 1);

      if (user.createdAt >= timelineStart) {
        const key = toMonthKey(user.createdAt);
        monthMap.set(key, (monthMap.get(key) || 0) + 1);
      }
    }

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const monthlyEvolution: { date: string; count: number }[] = [];
    for (let i = months - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = toMonthKey(d);
      monthlyEvolution.push({
        date: d.toISOString(),
        count: monthMap.get(key) || 0,
      });
    }

    return ok({
      totalCollaborators,
      activeCollaborators,
      absentCollaborators,
      complianceRate,
      complianceIssues,
      complianceNonCompliant,
      documentsExpiring,
      documentsExpired,
      categoryDistribution,
      monthlyEvolution,
    });
  }

  const id = parts[0];
  const suffix = parts.slice(1).join('/');
  if (id && suffix === 'history') {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 100);
    const where = { OR: [{ entityId: id }, { userId: id }] };
    const [totalCount, logs] = await Promise.all([
      prisma.systemLog.count({ where }),
      prisma.systemLog.findMany({
        where,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, name: true, avatar: true } },
        },
      }),
    ]);
    const body = mapSystemLogsToRhActivity(logs, totalCount);
    return NextResponse.json(body);
  }
  if (!id) {
    return listFallback(request);
  }

  if (method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id },
      include: collaborateurHydrateInclude,
    });
    if (!user || user.isTrashed) return fail('Collaborateur introuvable.', 404);
    return NextResponse.json(toCollaborateur(user));
  }

  if (method === 'PATCH' || method === 'PUT') {
    const payload = await parseBody(request);
    const createdById = session.user.id;
    const data: any = {};
    if (payload.name) data.name = payload.name;
    if (payload.firstName !== undefined) data.firstName = payload.firstName || null;
    if (payload.lastName !== undefined) data.lastName = payload.lastName || null;
    if (payload.email) data.email = payload.email;
    if (payload.phone !== undefined) data.phone = payload.phone || null;
    if (payload.proEmail !== undefined) data.proEmail = payload.proEmail || null;
    if (payload.roleId) data.roleId = payload.roleId;
    if (payload.status && payload.status in UserStatus) data.status = payload.status;
    if (payload.userCategory !== undefined) {
      data.userCategory = normalizeUserCategory(payload.userCategory, 'INTERNAL');
    }
    if (payload.subcontractorId !== undefined) data.subcontractorId = payload.subcontractorId || null;
    if (payload.jobFunction !== undefined) data.jobFunction = payload.jobFunction || null;
    if (payload.qualification !== undefined) data.qualification = payload.qualification || null;
    if (payload.birthDate !== undefined) data.birthDate = payload.birthDate || null;
    if (payload.birthPlace !== undefined) data.birthPlace = payload.birthPlace || null;
    if (payload.nationality !== undefined) data.nationality = payload.nationality || null;
    if (payload.socialSecurityNumber !== undefined) data.socialSecurityNumber = payload.socialSecurityNumber || null;
    if (payload.cniNumber !== undefined) data.cniNumber = payload.cniNumber || null;
    if (payload.residencePermitNumber !== undefined) data.residencePermitNumber = payload.residencePermitNumber || null;
    if (payload.residencePermitExpiry !== undefined) data.residencePermitExpiry = payload.residencePermitExpiry || null;
    if (payload.contractType !== undefined) data.contractType = (payload.contractType as any) || null;
    if (payload.workTimeType !== undefined) data.workTimeType = (payload.workTimeType as any) || null;
    if (payload.contractStartDate !== undefined) data.contractStartDate = payload.contractStartDate || null;
    if (payload.contractEndDate !== undefined) data.contractEndDate = payload.contractEndDate || null;
    if (payload.address !== undefined) data.address = payload.address || null;
    if (payload.city !== undefined) data.city = payload.city || null;
    if (payload.postalCode !== undefined) data.postalCode = payload.postalCode || null;
    if (payload.carteProNumber !== undefined) data.carteProNumber = payload.carteProNumber || null;
    if (payload.carteProExpiry !== undefined) data.carteProExpiry = payload.carteProExpiry || null;
    if (payload.isSchedulable !== undefined) data.isSchedulable = payload.isSchedulable;
    const docCni = await resolveCollaborateurFilePatch(payload.documentCni, {
      userId: id,
      createdById,
      category: 'document_cni',
    });
    if (docCni !== undefined) data.documentCni = docCni;
    const docAss = await resolveCollaborateurFilePatch(payload.documentAssurance, {
      userId: id,
      createdById,
      category: 'document_assurance',
    });
    if (docAss !== undefined) data.documentAssurance = docAss;
    const docRp = await resolveCollaborateurFilePatch(payload.documentResidencePermit, {
      userId: id,
      createdById,
      category: 'document_residence_permit',
    });
    if (docRp !== undefined) data.documentResidencePermit = docRp;
    const docCp = await resolveCollaborateurFilePatch(payload.documentCartePro, {
      userId: id,
      createdById,
      category: 'document_carte_pro',
    });
    if (docCp !== undefined) data.documentCartePro = docCp;
    const av = await resolveCollaborateurFilePatch(payload.avatar, {
      userId: id,
      createdById,
      category: 'avatar',
    });
    if (av !== undefined) data.avatar = av;

    const updated = await prisma.user.update({
      where: { id },
      data,
      include: { role: true },
    });

    await upsertFormateurProfileFromPayload(updated.id, updated.role.slug, {
      userCategory: updated.userCategory,
      specialties:
        payload.specialties !== undefined && Array.isArray(payload.specialties)
          ? dedupeSpecStrings(payload.specialties)
          : undefined,
    });

    await syncStructureProfileFields(updated.id, updated.role.slug, {
      managerUserId: (payload as { managerUserId?: string | null }).managerUserId,
      schoolInternalService: (payload as { schoolInternalService?: string | null })
        .schoolInternalService,
    });

    const hydrated = await prisma.user.findUnique({
      where: { id },
      include: collaborateurHydrateInclude,
    });

    return NextResponse.json(toCollaborateur(hydrated));
  }

  if (method === 'DELETE') {
    await prisma.user.update({
      where: { id },
      data: { isTrashed: true, status: UserStatus.INACTIVE },
    });
    return NextResponse.json({ success: true, deleted: true, id });
  }

  // Existing UI uses POST on /:id for restore action.
  if (method === 'POST') {
    const restored = await prisma.user.update({
      where: { id },
      data: { isTrashed: false, status: UserStatus.ACTIVE },
      include: collaborateurHydrateInclude,
    });
    return NextResponse.json(toCollaborateur(restored));
  }

  return fail('Method not allowed.', 405);
}

export async function GET(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function POST(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function PATCH(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function PUT(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}

export async function DELETE(request: NextRequest, ctx: Params) {
  return handler(request, ctx);
}
