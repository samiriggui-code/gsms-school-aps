import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { signPlaquettePublicToken, isPlaquettePublicLinkConfigured } from '@/lib/devis-plaquette-public-token';
import { absolutePublicPlaquetteUrl } from '@/lib/devis-plaquette-public-url';

type Ctx = { params: Promise<{ devisId: string }> };

type Body = { ttlDays?: number };

/** Génère un lien public signé (consultation plaquette + rail interactif) pour le client. */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  if (!isPlaquettePublicLinkConfigured()) {
    return fail(
      'Lien client désactivé : définissez DEVIS_PLAQUETTE_LINK_SECRET (recommandé en prod) ou NEXTAUTH_SECRET pour signer les URLs.',
      503,
    );
  }

  const { devisId } = await context.params;

  let ttlDays = 60;
  try {
    if (request.headers.get('content-length') && Number(request.headers.get('content-length')) > 0) {
      const body = (await request.json()) as Body;
      if (typeof body?.ttlDays === 'number' && Number.isFinite(body.ttlDays)) {
        ttlDays = Math.min(365, Math.max(1, Math.floor(body.ttlDays)));
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      select: { id: true, formationId: true },
    });
    if (!row) return fail('Devis introuvable.', 404);
    if (!row.formationId) return fail('Plaquette impossible sans formation liée.', 400);

    const expiresAtMs = Date.now() + ttlDays * 86400000;
    const token = signPlaquettePublicToken(devisId, expiresAtMs);
    const url = absolutePublicPlaquetteUrl(request, devisId, token);

    return ok({ url, expiresAt: new Date(expiresAtMs).toISOString() });
  } catch (e) {
    console.error('[plaquette-public-link]', e);
    const msg = e instanceof Error ? e.message : 'Erreur serveur.';
    return fail(msg, 500);
  }
}
