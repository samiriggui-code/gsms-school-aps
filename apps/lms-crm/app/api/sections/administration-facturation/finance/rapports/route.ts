import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildFinanceRapports } from '@/lib/finance/finance-rapports-build';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const months = Math.min(
    Math.max(Number(request.nextUrl.searchParams.get('months')) || 12, 3),
    24,
  );

  try {
    const data = await buildFinanceRapports(prisma, months);
    return ok(data);
  } catch (e) {
    return fail('Impossible de charger les rapports finance.', 500, e);
  }
}
