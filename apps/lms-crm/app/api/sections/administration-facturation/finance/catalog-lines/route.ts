import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { listFinanceCatalogLinesForApi } from '@/lib/finance-catalog-line-sync';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const items = await listFinanceCatalogLinesForApi();
    return ok({ items });
  } catch (e) {
    console.error('[finance catalog-lines GET]', e);
    return fail('Impossible de charger le catalogue des lignes devis.', 500, e);
  }
}
