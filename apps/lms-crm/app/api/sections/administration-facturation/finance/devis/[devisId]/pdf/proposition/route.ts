import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';

type Ctx = { params: Promise<{ devisId: string }> };

/** Redirige vers la plaquette HTML structurée (impression navigateur → PDF). */
export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse('Unauthorized', { status: 401 });

  const { devisId } = await context.params;
  const u = new URL(request.url);
  const prefix = nextPublicPathPrefix();
  const path = `${prefix}/administration-facturation/finance/devis/${encodeURIComponent(devisId)}/plaquette?print=1`.replace(
    /\/{2,}/g,
    '/',
  );
  const target = new URL(path.startsWith('/') ? path : `/${path}`, `${u.protocol}//${u.host}`);
  return NextResponse.redirect(target);
}
