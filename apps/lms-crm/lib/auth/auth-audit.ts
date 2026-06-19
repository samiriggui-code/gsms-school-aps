import type { Prisma } from '@repo/database';
import prisma from '@/lib/prisma';
import { systemLog } from '@/services/system-log';

export const AUTH_EVENTS = {
  SIGN_IN: 'auth.sign_in',
  SIGN_IN_FAILED: 'auth.sign_in_failed',
  SIGN_OUT: 'auth.sign_out',
} as const;

export type LogCategory = 'connexion' | 'iam' | 'conformite' | 'documents';

let cachedAuditActorId: string | null = null;

async function resolveAuditActorUserId(preferredUserId?: string): Promise<string | null> {
  if (preferredUserId) return preferredUserId;
  if (cachedAuditActorId) return cachedAuditActorId;

  const user = await prisma.user.findFirst({
    where: { role: { slug: { in: ['superadmin', 'admin'] } } },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });

  cachedAuditActorId = user?.id ?? null;
  return cachedAuditActorId;
}

export async function logAuthSignInFailed(params: {
  email: string;
  reason: string;
  code: string | number;
  ipAddress?: string;
  userId?: string;
}): Promise<void> {
  const actorId = await resolveAuditActorUserId(params.userId);
  if (!actorId) return;

  await systemLog({
    event: AUTH_EVENTS.SIGN_IN_FAILED,
    userId: actorId,
    entityId: params.email,
    entityType: 'auth.attempt',
    description: `Échec de connexion : ${params.reason}`,
    ipAddress: params.ipAddress,
    meta: JSON.stringify({
      email: params.email,
      code: params.code,
      reason: params.reason,
    }),
  });
}

export async function logAuthSignIn(params: {
  userId: string;
  provider: string;
  ipAddress?: string;
}): Promise<void> {
  await systemLog({
    event: AUTH_EVENTS.SIGN_IN,
    userId: params.userId,
    entityId: params.userId,
    entityType: 'auth.session',
    description: `Connexion réussie (${params.provider})`,
    ipAddress: params.ipAddress,
    meta: JSON.stringify({ provider: params.provider }),
  });
}

export async function logAuthSignOut(params: {
  userId: string;
  ipAddress?: string;
}): Promise<void> {
  await systemLog({
    event: AUTH_EVENTS.SIGN_OUT,
    userId: params.userId,
    entityId: params.userId,
    entityType: 'auth.session',
    description: 'Déconnexion',
    ipAddress: params.ipAddress,
  });
}

export function resolveLogCategory(log: {
  event?: string | null;
  entityType?: string | null;
}): LogCategory | 'other' {
  const event = (log.event || '').toLowerCase();
  const entityType = (log.entityType || '').toLowerCase();

  if (event.startsWith('auth.')) return 'connexion';

  if (
    entityType.includes('compliance') ||
    entityType.includes('conformite') ||
    entityType.includes('governance')
  ) {
    return 'conformite';
  }

  if (entityType.includes('document') || entityType.includes('file')) {
    return 'documents';
  }

  if (
    entityType.includes('user') ||
    entityType.includes('role') ||
    entityType.includes('permission') ||
    entityType.includes('setting') ||
    entityType.includes('account') ||
    entityType.includes('tenant') ||
    event === 'create' ||
    event === 'update' ||
    event === 'delete'
  ) {
    return 'iam';
  }

  return 'other';
}

export function buildLogCategoryWhere(
  category: LogCategory,
): Prisma.SystemLogWhereInput {
  switch (category) {
    case 'connexion':
      return {
        event: {
          in: [
            AUTH_EVENTS.SIGN_IN,
            AUTH_EVENTS.SIGN_IN_FAILED,
            AUTH_EVENTS.SIGN_OUT,
          ],
        },
      };
    case 'conformite':
      return {
        OR: [
          { entityType: { contains: 'compliance', mode: 'insensitive' } },
          { entityType: { contains: 'conformite', mode: 'insensitive' } },
          { entityType: { contains: 'governance', mode: 'insensitive' } },
        ],
      };
    case 'documents':
      return {
        OR: [
          { entityType: { contains: 'document', mode: 'insensitive' } },
          { entityType: { contains: 'file', mode: 'insensitive' } },
        ],
      };
    case 'iam':
      return {
        AND: [
          { NOT: { event: { startsWith: 'auth.' } } },
          { NOT: { event: 'SEED' } },
          {
            OR: [
              { entityType: { contains: 'user', mode: 'insensitive' } },
              { entityType: { contains: 'role', mode: 'insensitive' } },
              { entityType: { contains: 'permission', mode: 'insensitive' } },
              { entityType: { contains: 'setting', mode: 'insensitive' } },
              { entityType: { contains: 'account', mode: 'insensitive' } },
              { entityType: { contains: 'tenant', mode: 'insensitive' } },
              { event: { in: ['create', 'update', 'delete'] } },
            ],
          },
        ],
      };
  }
}
