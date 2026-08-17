import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import {
  isPlaquettePublicLinkConfigured,
  signPlaquettePublicToken,
} from '@/lib/devis-plaquette-public-token';
import { absolutePublicPlaquetteUrl } from '@/lib/devis-plaquette-public-url';

type Ctx = { params: Promise<{ devisId: string }> };

/** Redirige vers la plaquette publique signée (impression navigateur → PDF, sans compte CRM). */
export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  if (!isPlaquettePublicLinkConfigured()) {
    return new NextResponse('Liens plaquette non configurés.', { status: 503 });
  }

  const { devisId } = await context.params;

  const row = await prisma.financeDevis.findUnique({
    where: { id: devisId },
    select: { id: true, formationId: true },
  });
  if (!row?.formationId) {
    return new NextResponse('Plaquette impossible sans formation liée.', { status: 400 });
  }

  const expiresAtMs = Date.now() + 7 * 86400000;
  const token = signPlaquettePublicToken(devisId, expiresAtMs);
  const target = new URL(absolutePublicPlaquetteUrl(request, devisId, token));
  target.searchParams.set('print', '1');

  return NextResponse.redirect(target);
}
