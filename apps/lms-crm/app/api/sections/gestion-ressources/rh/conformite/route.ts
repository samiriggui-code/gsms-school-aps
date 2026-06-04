import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { qualificationMetierLabel } from '@/lib/rh-qualification-metier';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

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

    const skip = (page - 1) * limit;

    const where: any = {};
    if (query) {
      where.OR = [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (roleId) where.roleId = roleId;
    if (status) where.status = status;
    if (userCategory) where.userCategory = userCategory;
    if (profileType) {
      if (profileType === 'formateur') {
        where.qualification = { not: 'None' };
      } else if (profileType === 'interne') {
        // Example filter; adjust based on actual logic
        where.userCategory = 'INTERNAL';
      }
    }

    const [total, data] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sort]: dir },
        include: {
          role: true,
          accounts: true,
          formateurProfile: { select: { speciality: true, specialties: true } },
          collaborateurProfile: { select: { qualification: true, jobFunction: true } },
        },
      }),
    ]);

    return ok({
      data: data.map((u: any) => ({
        ...u,
        qualification:
          qualificationMetierLabel({
            qualification: u.qualification,
            jobFunction: u.jobFunction,
            roleSlug: u.role?.slug,
            collaborateurProfile: u.collaborateurProfile ?? null,
            formateurProfile: u.formateurProfile ?? null,
          }) ?? u.qualification ?? null,
      })),
      pagination: { total, page },
    });
  } catch (error) {
    return fail('Impossible de récupérer les conformités.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      phone,
      proEmail,
      password,
      roleId,
      userCategory,
      subcontractorId,
      jobFunction,
      qualification,
      birthDate,
      birthPlace,
      nationality,
      socialSecurityNumber,
      cniNumber,
      residencePermitNumber,
      residencePermitExpiry,
      carteProNumber,
      carteProExpiry,
      isSchedulable,
      contractType,
      workTimeType,
      address,
      city,
      postalCode,
      documentCni,
      documentAssurance,
      documentResidencePermit,
      documentCartePro,
      avatar,
    } = body;

    // Basic validation
    if (!firstName || !lastName || !email || !roleId || !userCategory) {
      return fail('Champs requis manquants', 400);
    }

    const existing = await prisma.user.findFirst({
      where: { email },
    });
    if (existing) {
      return fail('Cet email est déjà utilisé.', 409);
    }

    const userData: any = {
      firstName,
      lastName,
      email,
      phone,
      roleId,
      userCategory,
      subcontractorId,
      jobFunction,
      qualification,
      birthDate: birthDate ? new Date(birthDate) : null,
      birthPlace,
      nationality,
      socialSecurityNumber,
      cniNumber,
      residencePermitNumber,
      residencePermitExpiry: residencePermitExpiry ? new Date(residencePermitExpiry) : null,
      carteProNumber,
      carteProExpiry: carteProExpiry ? new Date(carteProExpiry) : null,
      isSchedulable: isSchedulable ?? true,
      contractType,
      workTimeType,
      address,
      city,
      postalCode,
      // Note: avatar and documents handling would require file upload logic; skipping for now
    };

    const newUser = await prisma.user.create({
      data: userData,
      include: { role: true },
    });

    return ok(newUser, 201);
  } catch (error) {
    return fail('Impossible de créer la conformité.', 500, error);
  }
}
