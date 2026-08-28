import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@repo/database';
import { getServerSession } from 'next-auth/next';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  UserProfileSchema,
  UserProfileSchemaType,
} from '@/app/(protected)/securite-configuration/acces/users/[id]/forms/user-profile-schema';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { UserStatus } from '@/app/models/user';
import {
  attachActiveAbsencesToUsers,
  syncUserAbsenceStatus,
  createWorkflowEngine,
} from '@repo/api-core';
import { serializeUserRoleForIam } from '@/lib/iam/serialize-user-role';
import { IAM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

const userDetailInclude = {
  role: {
    include: {
      permissions: {
        include: {
          permission: {
            select: {
              id: true,
              slug: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  },
  _count: {
    select: {
      candidatures: true,
      formationSessionParticipants: true,
      enrollments: true,
      submissions: true,
      systemLog: true,
      attendances: true,
    },
  },
} as const;

// GET: Fetch a specific user by ID, including role
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.usersView)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const { id } = await params;

    await syncUserAbsenceStatus(prisma, id);

    // Fetch the user and their associated roles
    const user = await prisma.user.findUnique({
      where: { id },
      include: userDetailInclude,
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Record not found. Someone might have deleted it already.' },
        { status: 404 },
      );
    }

    const [enriched] = await attachActiveAbsencesToUsers(prisma, [user]);
    return NextResponse.json({
      ...enriched,
      role: serializeUserRoleForIam(enriched.role),
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

// PUT: Edit a specific permission by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.usersEdit)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const { id } = await params;

    // Ensure the user ID is provided
    if (!id) {
      return NextResponse.json(
        { message: 'Invalid input.' },
        { status: 400 }, // Bad request
      );
    }

    const clientIp = getClientIP(request);
    const body = await request.json();

    const parsedData = UserProfileSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input.' },
        { status: 400 }, // Bad Request
      );
    }

    const { name, status, roleId }: UserProfileSchemaType = parsedData.data;

    const previous = await prisma.user.findUnique({
      where: { id },
      select: { name: true, status: true, roleId: true, email: true },
    });
    if (!previous) {
      return NextResponse.json({ message: 'Record not found.' }, { status: 404 });
    }

    // Check if the role exists
    const roleExists = await prisma.userRole.findUnique({
      where: { id: roleId },
    });
    if (!roleExists) {
      return NextResponse.json(
        { message: 'Role does not exist' },
        { status: 400 },
      );
    }

    // Use a transaction to insert multiple records atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.update({
        where: { id },
        data: { name, status: status as UserStatus, roleId },
      });

      // Log the event
      await systemLog(
        {
          event: 'update',
          userId: session.user.id,
          entityId: user.id,
          entityType: 'user.profile',
          description: 'User profile updated.',
          ipAddress: clientIp,
        },
        tx,
      );

      return user;
    });

    const changes: string[] = [];
    if (previous.roleId !== roleId) changes.push('rôle');
    if (previous.status !== status) changes.push('statut');
    if (previous.name !== name) changes.push('nom');

    if (changes.length > 0) {
      try {
        const workflows = createWorkflowEngine(prisma);
        await workflows.emit(
          'crm.security.user.updated',
          {
            userId: id,
            name,
            email: previous.email,
            changesSummary: changes.join(', '),
            roleId,
            status,
          },
          { dedupeKey: `iam-user:${id}:${changes.join('-')}:${roleId}:${status}` },
        );
      } catch (e) {
        console.error('[acces/users] workflow update', e);
      }
    }

    return NextResponse.json(
      { message: 'User profile successfully updated.' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Validate user session
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 }, // Unauthorized
      );
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.usersDelete)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const clientIp = getClientIP(request);
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Invalid input.' },
        { status: 400 }, // Bad request
      );
    }

    // Check if the role exists
    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (userToDelete && userToDelete.isProtected) {
      return NextResponse.json(
        { message: 'You do not have permission to delete system users.' },
        { status: 401 },
      );
    }

    // Use a transaction to insert multiple records atomically
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await prisma.user.update({
        where: { id, isProtected: false },
        data: { isTrashed: true, status: UserStatus.INACTIVE },
      });

      // Log the event
      await systemLog(
        {
          event: 'trash',
          userId: session.user.id,
          entityId: user.id,
          entityType: 'user',
          description: 'User trashed.',
          ipAddress: clientIp,
        },
        tx,
      );

      return user;
    });

    if (userToDelete) {
      try {
        const workflows = createWorkflowEngine(prisma);
        await workflows.emit(
          'crm.security.user.deactivated',
          {
            userId: userToDelete.id,
            name: userToDelete.name,
            email: userToDelete.email,
          },
          { dedupeKey: `iam-user:${userToDelete.id}:deactivated` },
        );
      } catch (e) {
        console.error('[acces/users] workflow deactivate', e);
      }
    }

    return NextResponse.json(
      { message: 'User successfully deleted.' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
