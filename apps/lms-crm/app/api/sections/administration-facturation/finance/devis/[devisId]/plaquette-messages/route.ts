import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { createPlaquetteMessageRow } from '@/lib/devis-plaquette-messages-query';

type Ctx = { params: Promise<{ devisId: string }> };

const MAX_LEN = 8000;

type PostBody = { body?: string };

/** Réponse commerciale enregistrée dans le même fil que les messages client (plaquette publique). */
export async function POST(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { devisId } = await context.params;

  let json: PostBody = {};
  try {
    json = (await request.json()) as PostBody;
  } catch {
    json = {};
  }
  const body = typeof json.body === 'string' ? json.body.trim() : '';
  if (!body) return fail('Message vide.', 400);
  if (body.length > MAX_LEN) return fail(`Message trop long (max ${MAX_LEN} caractères).`, 400);

  try {
    const devis = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      select: { id: true },
    });
    if (!devis) return fail('Devis introuvable.', 404);

    const u = session.user as { name?: string | null; email?: string | null };
    const authorLabel =
      (typeof u.name === 'string' && u.name.trim()) ||
      (typeof u.email === 'string' && u.email.trim()) ||
      'Équipe commerciale';

    const row = await createPlaquetteMessageRow({
      devisId,
      authorKind: 'STAFF',
      body,
      authorLabel,
    });
    if (!row) {
      return fail(
        'Messagerie plaquette indisponible : exécutez la migration SQL puis `pnpm db:generate` et redémarrez le serveur de dev.',
        503,
      );
    }

    return ok({
      message: {
        id: row.id,
        authorKind: row.authorKind,
        body: row.body,
        authorLabel: row.authorLabel,
        createdAt: row.createdAt.toISOString(),
      },
    });
  } catch (e) {
    console.error('[plaquette-messages CRM POST]', e);
    return fail('Enregistrement impossible.', 500, e);
  }
}
