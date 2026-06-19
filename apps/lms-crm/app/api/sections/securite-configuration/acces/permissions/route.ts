import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { schoolPermissionPrismaFilter } from '@/lib/iam/school-permissions';
import { domainLabelForPermissionSlug } from '@/lib/auth/permission-domains';
// GET: Fetch all permissions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const query = searchParams.get('query') || '';
  const sortFieldRaw = searchParams.get('sort') || 'slug';
  const sortField = sortFieldRaw === 'domain' ? 'slug' : sortFieldRaw;
  const sortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const roleId = searchParams.get('roleId') || null;
  const skip = (page - 1) * limit;

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    const catalogueFilter = schoolPermissionPrismaFilter();

    const total = await prisma.userPermission.count({
      where: {
        AND: [
          catalogueFilter,
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { slug: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          ...(roleId ? [{ roles: { some: { roleId } } }] : []),
        ],
      },
    });

    let isTableEmpty = false;

    if (total === 0) {
      // Check if the entire table is empty
      const overallTotal = await prisma.userPermission.count();
      isTableEmpty = overallTotal === 0;
    }

    // Get paginated records if total > 0
    const permissions =
      total > 0
        ? await prisma.userPermission.findMany({
            skip,
            take: limit,
            where: {
              AND: [
                catalogueFilter,
                {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { slug: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                  ],
                },
                ...(roleId ? [{ roles: { some: { roleId } } }] : []),
              ],
            },
            orderBy: {
              [sortField]: sortDirection,
            },
            include: {
              roles: {
                include: {
                  role: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          })
        : [];

    const formatted = permissions.map((p) => ({
      ...p,
      domain: domainLabelForPermissionSlug(p.slug),
      roles: p.roles?.map((rp) => rp.role) ?? [],
    }));

    return NextResponse.json({
      data: formatted,
      pagination: {
        total,
        page,
      },
      empty: isTableEmpty, // Use the fallback check
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

// POST: catalogue seed-driven — création désactivée
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
  }
  return NextResponse.json(
    {
      message:
        'Le catalogue permissions est géré par le seed. Utilisez la matrice des rôles pour assigner les droits.',
    },
    { status: 403 },
  );
}
