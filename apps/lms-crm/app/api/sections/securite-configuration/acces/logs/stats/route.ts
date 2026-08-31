import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { IAM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import {
  AUTH_EVENTS,
  buildLogCategoryWhere,
} from '@/lib/auth/auth-audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return fail('Unauthorized request', 401);
    if (!sessionHasPermission(session, IAM_PERMISSION.logsView)) {
      return fail('Forbidden', 403);
    }

    const [
      total,
      signIn,
      signInFailed,
      iam,
      conformite,
      documents,
    ] = await Promise.all([
      prisma.systemLog.count(),
      prisma.systemLog.count({ where: { event: AUTH_EVENTS.SIGN_IN } }),
      prisma.systemLog.count({ where: { event: AUTH_EVENTS.SIGN_IN_FAILED } }),
      prisma.systemLog.count({ where: buildLogCategoryWhere('iam') }),
      prisma.systemLog.count({ where: buildLogCategoryWhere('conformite') }),
      prisma.systemLog.count({ where: buildLogCategoryWhere('documents') }),
    ]);

    return ok({
      total,
      signIn,
      signInFailed,
      iam,
      conformite,
      documents,
    });
  } catch {
    return fail('Oops! Something went wrong. Please try again in a moment.', 500);
  }
}
