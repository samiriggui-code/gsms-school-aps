import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { fail } from '@/app/api/_shared/http/response';
import { buildBpfAggregates } from '@/lib/finance/bpf-aggregates';
import { buildBpfCerfaPdfBuffer } from '@/lib/finance/bpf-cerfa-pdf';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

/** GET — PDF synthèse BPF (OF-07). `?year=2025` */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  try {
    const url = new URL(request.url);
    const raw = url.searchParams.get('year');
    const current = new Date().getUTCFullYear();
    const year = raw ? Number(raw) : current - 1;
    if (!Number.isInteger(year) || year < 2000 || year > current + 1) {
      return fail('Invalid year', 400);
    }

    const aggregates = await buildBpfAggregates(prisma, year);
    const { buffer, filename } = await buildBpfCerfaPdfBuffer(aggregates);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  } catch (e) {
    console.error('[finance/bpf/pdf] GET', e);
    return fail('Failed to generate BPF PDF', 500);
  }
}
