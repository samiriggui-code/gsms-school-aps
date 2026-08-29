import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@repo/database';
import { getServerSession } from 'next-auth/next';
import { getClientIP } from '@/lib/api';
import { isUnique } from '@/lib/db';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import {
  RoleSchema,
  RoleSchemaType,
} from '@/app/(protected)/securite-configuration/acces/roles/forms/role-schema';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { createWorkflowEngine } from '@repo/api-core';
import { IAM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { principalFromSession } from '@/lib/doctype/principal';
import { getResourceService, listParamsFromRequest } from '@/lib/doctype/resource';

// GET: Fetch all roles with permissions (ResourceService + forme legacy UI)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.rolesView)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const result = await getResourceService().list(
      'role',
      principalFromSession(session),
      listParamsFromRequest(request),
    );

    const formattedRoles = result.data.map((role) => {
      const permissions = role.permissions;
      const flat = Array.isArray(permissions)
        ? permissions.map((rp) => {
            if (rp && typeof rp === 'object' && 'permission' in rp) {
              return (rp as { permission: unknown }).permission;
            }
            return rp;
          })
        : [];
      return { ...role, permissions: flat };
    });

    return NextResponse.json({
      data: formattedRoles,
      pagination: {
        total: result.pagination.total,
        page: result.pagination.page,
      },
      empty: result.pagination.total === 0,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Oops! Something went wrong. Please try again in a moment.';
    return NextResponse.json({ message }, { status: 500 });
  }
}

// POST: Add a new role
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.rolesEdit)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const clientIp = getClientIP(request);
    const body = await request.json();

    const parsedData = RoleSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 },
      );
    }

    const { name, slug, description, permissions }: RoleSchemaType =
      parsedData.data;

    const isUniqueRole = await isUnique('userRole', { slug, name });
    if (!isUniqueRole) {
      return NextResponse.json(
        { message: 'Name and slug must be unique' },
        { status: 400 },
      );
    }

    const createdRole = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const newRole = await tx.userRole.create({
          data: {
            name,
            slug,
            description,
          },
        });

        if (permissions && permissions.length > 0) {
          const rolePermissionEntries = permissions.map(
            (permissionId: string) => ({
              roleId: newRole.id,
              permissionId,
            }),
          );

          await tx.userRolePermission.createMany({
            data: rolePermissionEntries,
          });
        }

        await systemLog(
          {
            event: 'create',
            userId: session.user.id,
            entityId: newRole.id,
            entityType: 'user.role',
            description: 'User role added.',
            ipAddress: clientIp,
          },
          tx,
        );

        return await tx.userRole.findUnique({
          where: { id: newRole.id },
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        });
      },
    );

    if (createdRole) {
      try {
        const workflows = createWorkflowEngine(prisma);
        await workflows.emit(
          'crm.security.role.created',
          {
            roleId: createdRole.id,
            roleName: createdRole.name,
            roleSlug: createdRole.slug,
            permissionsCount: permissions?.length ?? 0,
          },
          { dedupeKey: `iam-role:${createdRole.id}:created` },
        );
      } catch (e) {
        console.error('[acces/roles] workflow create', e);
      }
    }

    return NextResponse.json(createdRole, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
