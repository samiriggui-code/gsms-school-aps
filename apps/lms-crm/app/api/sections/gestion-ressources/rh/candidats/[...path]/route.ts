import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { UserStatus } from '@/app/models/user';
import { ok, fail } from '@/app/api/_shared/http/response';
import { uploadFile } from '@repo/storage';

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

function parseFileOrValue(value: FormDataEntryValue | null): string | File | null {
  if (value == null) return null;
  if (typeof value === 'string') return value.trim() || null;
  if (value instanceof File) return value.size > 0 ? value : null;
  return null;
}

async function storeCandidatFile(
  file: File,
  userId: string,
  createdById: string,
  category: string,
): Promise<string> {
  const uploaded = await uploadFile({
    file,
    module: 'crm',
    entityType: 'candidat',
    entityId: userId,
    category,
    visibility: 'private',
  });
  await prisma.fileAsset.create({
    data: {
      module: 'crm',
      entityType: 'candidat',
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

async function resolveCandidatFilePatch(
  raw: string | File | null | undefined,
  opts: { userId: string; createdById: string; category: string },
): Promise<string | null | undefined> {
  if (raw === undefined) return undefined;
  if (raw instanceof File && raw.size > 0) {
    return storeCandidatFile(raw, opts.userId, opts.createdById, opts.category);
  }
  if (typeof raw === 'string') return raw.trim() || null;
  return null;
}

function toCandidat(user: any) {
  const names = splitName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  return {
    ...user,
    firstName: user.firstName || names.firstName,
    lastName: user.lastName || names.lastName,
    userCategory: user.userCategory || 'CANDIDAT',
    qualification: user.qualification || null,
    jobFunction: user.jobFunction || null,
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

async function parseBody(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
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
      userCategory: String(form.get('userCategory') || 'CANDIDAT').trim().toUpperCase(),
      subcontractorId: String(form.get('subcontractorId') || '').trim(),
      jobFunction: String(form.get('jobFunction') || '').trim(),
      qualification: String(form.get('qualification') || '').trim(),
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
    userCategory: String((json as any).userCategory || 'CANDIDAT').trim().toUpperCase(),
    subcontractorId: String((json as any).subcontractorId || '').trim(),
    jobFunction: String((json as any).jobFunction || '').trim(),
    qualification: String((json as any).qualification || '').trim(),
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
  };
}

async function handler(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return fail('Unauthorized request', 401);
  }

  const parts = (await params).path || [];
  const method = request.method.toUpperCase();

  if (parts.length === 0) {
    if (method === 'GET') {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') || 1);
      const limit = Number(url.searchParams.get('limit') || 10);
      const sort = (url.searchParams.get('sort') || 'createdAt').trim();
      const dir = (url.searchParams.get('dir') || 'desc').trim() === 'asc' ? 'asc' : 'desc';
      const query = (url.searchParams.get('query') || '').trim();

      const where: any = {
        isTrashed: false,
        role: { slug: 'candidat' },
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const orderBy: any = {};
      if (sort === 'createdAt') orderBy.createdAt = dir;
      else if (sort === 'name') orderBy.name = dir;
      else if (sort === 'email') orderBy.email = dir;
      else orderBy.createdAt = 'desc';

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          include: { role: true },
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
        }),
      ]);

      return NextResponse.json({
        data: users.map(toCandidat),
        pagination: { page, limit, total, sort, dir },
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

      const allowedUserCategories = ['INTERNAL', 'CLIENT', 'SUBCONTRACTOR'] as const;
      type AllowedUserCategory = (typeof allowedUserCategories)[number];
      const normalizedUserCategory: AllowedUserCategory = allowedUserCategories.includes(
        payload.userCategory as AllowedUserCategory,
      )
        ? (payload.userCategory as AllowedUserCategory)
        : 'CLIENT';

      const created = await prisma.user.create({
        data: {
          email: payload.email,
          firstName: payload.firstName || null,
          lastName: payload.lastName || null,
          name: payload.name || payload.email.split('@')[0],
          phone: payload.phone || null,
          proEmail: payload.proEmail || null,
          roleId: payload.roleId,
          status: payload.status && payload.status in UserStatus ? (payload.status as any) : UserStatus.ACTIVE,
          userCategory: normalizedUserCategory,
          subcontractorId: payload.subcontractorId || null,
          jobFunction: payload.jobFunction || null,
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
        fileUpdates.avatar = await storeCandidatFile(
          payload.avatar,
          created.id,
          createdById,
          'avatar',
        );
      }
      if (payload.documentCni instanceof File && payload.documentCni.size > 0) {
        fileUpdates.documentCni = await storeCandidatFile(
          payload.documentCni,
          created.id,
          createdById,
          'document_cni',
        );
      }
      if (payload.documentAssurance instanceof File && payload.documentAssurance.size > 0) {
        fileUpdates.documentAssurance = await storeCandidatFile(
          payload.documentAssurance,
          created.id,
          createdById,
          'document_assurance',
        );
      }
      if (payload.documentResidencePermit instanceof File && payload.documentResidencePermit.size > 0) {
        fileUpdates.documentResidencePermit = await storeCandidatFile(
          payload.documentResidencePermit,
          created.id,
          createdById,
          'document_residence_permit',
        );
      }
      if (payload.documentCartePro instanceof File && payload.documentCartePro.size > 0) {
        fileUpdates.documentCartePro = await storeCandidatFile(
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

      return NextResponse.json(toCandidat(finalUser), { status: 201 });
    }

    return fail('Method not allowed.', 405);
  }

  if (parts[0] === 'stats') {
    if (method === 'GET') {
      const url = new URL(request.url);
      const months = Math.max(1, Math.min(24, Number(url.searchParams.get('months') || 12)));

      const where = {
        isTrashed: false,
        role: { slug: 'candidat' },
      };

      const now = new Date();
      const timelineStart = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

      const [
        totalCandidats,
        activeCandidats,
        pendingCandidats,
      ] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, status: UserStatus.ACTIVE } }),
        prisma.user.count({ where: { ...where, status: UserStatus.PENDING } }),
      ]);

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
        const roleLabel = role?.name || role?.slug || 'Candidats';
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
        totalCandidats,
        activeCandidats,
        pendingCandidats,
        conversionRate: 0,
        categoryDistribution,
        monthlyEvolution,
      });
    }

    return fail('Method not allowed.', 405);
  }

  const id = parts[0];
  const suffix = parts.slice(1).join('/');

  if (id && suffix === 'history') {
    return listFallback(request);
  }
  if (!id) {
    return listFallback(request);
  }

  if (method === 'GET') {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user || user.isTrashed) return fail('Candidat introuvable.', 404);
    return NextResponse.json(toCandidat(user));
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
    if (payload.userCategory) data.userCategory = payload.userCategory;
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
    if (payload.contractType !== undefined) data.contractType = payload.contractType || null;
    if (payload.workTimeType !== undefined) data.workTimeType = payload.workTimeType || null;
    if (payload.contractStartDate !== undefined) data.contractStartDate = payload.contractStartDate || null;
    if (payload.contractEndDate !== undefined) data.contractEndDate = payload.contractEndDate || null;
    if (payload.address !== undefined) data.address = payload.address || null;
    if (payload.city !== undefined) data.city = payload.city || null;
    if (payload.postalCode !== undefined) data.postalCode = payload.postalCode || null;
    if (payload.carteProNumber !== undefined) data.carteProNumber = payload.carteProNumber || null;
    if (payload.carteProExpiry !== undefined) data.carteProExpiry = payload.carteProExpiry || null;
    if (payload.isSchedulable !== undefined) data.isSchedulable = payload.isSchedulable;
    const docCni = await resolveCandidatFilePatch(payload.documentCni, {
      userId: id,
      createdById,
      category: 'document_cni',
    });
    if (docCni !== undefined) data.documentCni = docCni;
    const docAss = await resolveCandidatFilePatch(payload.documentAssurance, {
      userId: id,
      createdById,
      category: 'document_assurance',
    });
    if (docAss !== undefined) data.documentAssurance = docAss;
    const docRp = await resolveCandidatFilePatch(payload.documentResidencePermit, {
      userId: id,
      createdById,
      category: 'document_residence_permit',
    });
    if (docRp !== undefined) data.documentResidencePermit = docRp;
    const docCp = await resolveCandidatFilePatch(payload.documentCartePro, {
      userId: id,
      createdById,
      category: 'document_carte_pro',
    });
    if (docCp !== undefined) data.documentCartePro = docCp;
    const av = await resolveCandidatFilePatch(payload.avatar, {
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
    return NextResponse.json(toCandidat(updated));
  }

  if (method === 'DELETE') {
    await prisma.user.update({
      where: { id },
      data: { isTrashed: true, status: UserStatus.INACTIVE },
    });
    return NextResponse.json({ success: true, deleted: true, id });
  }

  if (method === 'POST') {
    const restored = await prisma.user.update({
      where: { id },
      data: { isTrashed: false, status: UserStatus.ACTIVE },
      include: { role: true },
    });
    return NextResponse.json(toCandidat(restored));
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
