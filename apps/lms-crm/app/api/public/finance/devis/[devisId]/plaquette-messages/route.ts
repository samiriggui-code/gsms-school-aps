import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { verifyPlaquetteTokenForDevis } from '@/lib/devis-plaquette-public-request';
import { createPlaquetteMessageRow, listPlaquetteMessagesForDevis } from '@/lib/devis-plaquette-messages-query';

type Ctx = { params: Promise<{ devisId: string }> };

const MAX_LEN = 8000;

export async function GET(request: NextRequest, context: Ctx) {
  const { devisId } = await context.params;
  const gate = verifyPlaquetteTokenForDevis(request, devisId);
  if (!gate.ok) return fail(gate.message, gate.status);

  try {
    const rows = await listPlaquetteMessagesForDevis(devisId, { order: 'asc', take: 200 });
    return ok({
      items: rows.map((r) => ({
        id: r.id,
        authorKind: r.authorKind,
        body: r.body,
        authorLabel: r.authorLabel,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error('[plaquette-messages GET]', e);
    return fail('Lecture impossible.', 500, e);
  }
}

type PostBody = { body?: string };

export async function POST(request: NextRequest, context: Ctx) {
  const { devisId } = await context.params;
  const gate = verifyPlaquetteTokenForDevis(request, devisId);
  if (!gate.ok) return fail(gate.message, gate.status);

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
      select: { id: true, lead: { select: { firstName: true, lastName: true } } },
    });
    if (!devis) return fail('Devis introuvable.', 404);

    const authorLabel =
      devis.lead?.firstName || devis.lead?.lastName
        ? `${devis.lead.firstName ?? ''} ${devis.lead.lastName ?? ''}`.trim()
        : 'Client';

    const row = await createPlaquetteMessageRow({
      devisId,
      authorKind: 'CLIENT',
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
    console.error('[plaquette-messages POST]', e);
    return fail('Enregistrement impossible.', 500, e);
  }
}
