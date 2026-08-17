import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildFinanceAlerts } from '@/lib/finance/finance-alerts';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const items = await buildFinanceAlerts(prisma);
    return ok({ items });
  } catch (e) {
    return fail('Impossible de charger les alertes finance.', 500, e);
  }
}
