import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@repo/database';
import { getServerSession } from 'next-auth/next';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  UserAddSchema,
  UserAddSchemaType,
} from '@/app/(protected)/securite-configuration/acces/users/forms/user-add-schema';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { UserStatus } from '@/app/models/user';
import { ensureUserStoragePrefix, provisionStoragePrefixSafe } from '@/lib/entity-storage';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const query = searchParams.get('query') || '';
  const sortField = searchParams.get('sort') || 'name';
  const sortDirection = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const status = searchParams.get('status') || null;
  const roleId = searchParams.get('roleId') || null;
  const sourceFlow = req.headers.get('x-lms-source-flow');
  const profileType = searchParams.get('profileType') || 'all';

  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    // Map status query to enum type, fallback to null if invalid
    const statusFilter =
      status && status !== 'all' ? (status as UserStatus) : undefined;

    const flowFilters: Prisma.UserWhereInput[] = [];
    if (sourceFlow === 'collaborateur') {
      // RH Collaborateurs page: exclude eleve/candidat records.
      flowFilters.push({
        NOT: [{ role: { slug: { in: ['candidat', 'eleve'] } } }],
      });

      if (profileType === 'collaborateur') {
        flowFilters.push({ role: { slug: 'collaborateur' } });
      } else if (profileType === 'formateur') {
        flowFilters.push({ role: { slug: 'formateur' } });
      } else if (profileType === 'interne') {
        flowFilters.push({
          NOT: [
            { role: { slug: { in: ['collaborateur', 'formateur', 'candidat', 'eleve'] } } },
          ],
        });
      }
    }

    const where: Prisma.UserWhereInput = {
      AND: [
        ...(statusFilter ? [{ status: statusFilter }] : []),
        ...(roleId && roleId !== 'all' ? [{ roleId }] : []),
        ...flowFilters,
        {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      ],
    };

    // Count total users with filters
    const totalCount = await prisma.user.count({
      where,
    });

    // Set order logic
    const sortMap: Record<string, object> = {
      name: { name: sortDirection as 'asc' | 'desc' },
      role_name: { role: { name: sortDirection as 'asc' | 'desc' } },
      status: { status: sortDirection as 'asc' | 'desc' },
      createdAt: { createdAt: sortDirection as 'asc' | 'desc' },
      lastSignInAt: { lastSignInAt: sortDirection as 'asc' | 'desc' },
    };

    // Default to createdAt sorting if no valid field is found
    const orderBy = sortMap[sortField] ?? {
      createdAt: sortDirection as 'asc' | 'desc',
    };

    // Fetch users with filters
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
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: users,
      pagination: {
        total: totalCount,
        page,
        limit,
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    const sourceFlow = request.headers.get('x-lms-source-flow');
    const isBusinessFlow =
      sourceFlow === 'collaborateur' || sourceFlow === 'formateur';

    if (!isBusinessFlow) {
      return NextResponse.json(
        {
          message:
            "Creation directe d'utilisateur desactivee. Creez d'abord un collaborateur ou un formateur.",
        },
        { status: 403 },
      );
    }

    const clientIp = getClientIP(request);
    const body = await request.json();
    const parsedData = UserAddSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: 'Invalid input.' },
        { status: 400 }, // Bad request
      );
    }

    const { name, email, roleId }: UserAddSchemaType = parsedData.data;

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email is already registered.' },
        { status: 409 }, // Conflict
      );
    }

    // Check if the role exists
    const existingRole = await prisma.userRole.findUnique({
      where: { id: roleId },
    });

    if (!existingRole) {
      return NextResponse.json(
        {
          message:
            'Selected role does not exist. Someone might have deleted it already.',
        },
        { status: 404 }, // Not found
      );
    }

    // Use a transaction to insert multiple records atomically
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create a user
      const user = await tx.user.create({
        data: {
          name,
          email,
          status: UserStatus.ACTIVE,
          roleId,
        },
      });

      // Log the event
      await systemLog(
        {
          event: 'create',
          userId: session.user.id,
          entityId: user.id,
          entityType: 'user',
          description: `User added by ${sourceFlow} flow.`,
          ipAddress: clientIp,
        },
        tx,
      );

      return user;
    });

    void provisionStoragePrefixSafe(`user:${result.id}`, () =>
      ensureUserStoragePrefix(result.id),
    );

    return NextResponse.json(
      {
        message: 'User successfully added.',
        user: result,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
