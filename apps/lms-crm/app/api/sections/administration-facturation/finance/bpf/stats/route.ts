import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { buildBpfAggregates } from '@/lib/finance/bpf-aggregates';

/** GET — agrégats BPF déterministes (G11). `?year=2025` */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const raw = url.searchParams.get('year');
    const current = new Date().getUTCFullYear();
    const year = raw ? Number(raw) : current - 1;
    if (!Number.isInteger(year) || year < 2000 || year > current + 1) {
      return fail('Invalid year', 400);
    }

    const aggregates = await buildBpfAggregates(prisma, year);
    return ok(aggregates);
  } catch (e) {
    console.error('[finance/bpf/stats] GET', e);
    return fail('Failed to compute BPF aggregates', 500);
  }
}
