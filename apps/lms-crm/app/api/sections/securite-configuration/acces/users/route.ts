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
import { createWorkflowEngine } from '@repo/api-core';
import { IAM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { listEntity } from '@/lib/framework/engine';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.usersView)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    // Bascule liste → moteur générique (parité via déclaration `user` dans ENTITIES).
    const result = await listEntity('user', {
      searchParams: new URL(req.url).searchParams,
      headers: req.headers,
    });

    return NextResponse.json({
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Oops! Something went wrong. Please try again in a moment.';
    const status = message.includes('inconnue') || message.includes('refus') ? 403 : 500;
    return NextResponse.json({ message }, { status });
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

    if (!sessionHasPermission(session, IAM_PERMISSION.usersCreate)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
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

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.security.user.created',
        {
          userId: result.id,
          name: result.name,
          email: result.email,
          roleName: existingRole.name,
          roleId: existingRole.id,
          sourceFlow,
        },
        { dedupeKey: `iam-user:${result.id}:created` },
      );
    } catch (e) {
      console.error('[acces/users] workflow create', e);
    }

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
