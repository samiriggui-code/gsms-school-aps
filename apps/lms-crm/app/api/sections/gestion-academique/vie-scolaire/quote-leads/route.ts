import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { LANDING_QUOTE_LEAD_SOURCE } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const limitRaw = request.nextUrl.searchParams.get('limit');
  const limit = Math.min(Math.max(Number(limitRaw) || 80, 1), 200);

  try {
    const rows = await prisma.lead.findMany({
      where: { source: LANDING_QUOTE_LEAD_SOURCE },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        notes: true,
        createdAt: true,
        formation: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const items = rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      status: r.status,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      formation: r.formation,
    }));

    return ok({ items });
  } catch (e) {
    console.error('[quote-leads]', e);
    return fail('Impossible de charger les demandes de devis.', 500, e);
  }
}
