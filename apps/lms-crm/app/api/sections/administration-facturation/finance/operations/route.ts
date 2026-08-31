import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildFinanceOperationsFeed } from '@/lib/finance/finance-operations-feed';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit')) || 20, 1), 50);

  try {
    const items = await buildFinanceOperationsFeed(prisma, limit);
    return ok({ items });
  } catch (e) {
    return fail('Impossible de charger le flux financier.', 500, e);
  }
}
