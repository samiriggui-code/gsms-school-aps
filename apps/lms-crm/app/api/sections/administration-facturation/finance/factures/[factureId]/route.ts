import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus, Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { parseLinesJson, totalsFromLines } from '@/lib/finance-devis-totals';

/**
 * Détail / mise à jour d’un dossier **accepté** à facturer (`FinanceDevis` avec statut ACCEPTED).
 * Même schéma JSON que `GET …/finance/devis/[id]` mais réservé au périmètre facturation (sans messages plaquette).
 */

type Ctx = { params: Promise<{ factureId: string }> };

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: factureId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            notes: true,
            source: true,
          },
        },
        formation: {
          select: { id: true, name: true, slug: true },
        },
        candidature: {
          select: { id: true, status: true, userId: true },
        },
        formationSession: {
          select: { id: true, dateDisplayLabel: true, location: true },
        },
      },
    });

    if (!row) return fail('Dossier introuvable.', 404);
    if (row.status !== FinanceDevisStatus.ACCEPTED) {
      return fail('Ce dossier ne figure pas dans les propositions acceptées à facturer.', 404);
    }

    return ok({
      id: row.id,
      referenceCode: row.referenceCode,
      title: row.title,
      status: row.status,
      clientSnapshot: row.clientSnapshot,
      lines: row.lines,
      subtotalHt: decimalNum(row.subtotalHt),
      vatTotal: decimalNum(row.vatTotal),
      totalTtc: decimalNum(row.totalTtc),
      currency: row.currency,
      validUntil: row.validUntil?.toISOString() ?? null,
      notes: row.notes,
      internalNotes: row.internalNotes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      leadId: row.leadId,
      formationId: row.formationId,
      candidatureId: row.candidatureId,
      formationSessionId: row.formationSessionId,
      lead: row.lead,
      formation: row.formation,
      candidature: row.candidature,
      formationSession: row.formationSession,
    });
  } catch (e) {
    console.error('[finance-factures GET one]', e);
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === 'P2022') {
      return fail(
        'Base de données non migrée : la table FinanceDevis attend des colonnes optionnelles (liens dossier). Exécutez les migrations Prisma.',
        500,
        e,
      );
    }
    return fail('Lecture impossible.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  try {
    const existing = await prisma.financeDevis.findUnique({
      where: { id: factureId },
      select: { id: true, status: true },
    });
    if (!existing) return fail('Dossier introuvable.', 404);
    if (existing.status !== FinanceDevisStatus.ACCEPTED) {
      return fail('La mise à jour via la facturation est réservée aux propositions acceptées.', 409);
    }

    const data: Prisma.FinanceDevisUpdateInput = {};

    if (typeof body.title === 'string') data.title = body.title;
    if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes;
    if (typeof body.internalNotes === 'string' || body.internalNotes === null)
      data.internalNotes = body.internalNotes;

    if ('status' in body && typeof body.status === 'string') {
      const allowed = new Set(Object.values(FinanceDevisStatus) as string[]);
      if (!allowed.has(body.status)) return fail('Statut invalide.', 400);
      data.status = body.status as FinanceDevisStatus;
    }

    if ('validUntil' in body) {
      if (body.validUntil === null || body.validUntil === '') data.validUntil = null;
      else if (typeof body.validUntil === 'string') {
        const d = new Date(body.validUntil);
        if (!Number.isNaN(d.getTime())) data.validUntil = d;
      }
    }

    // Cette route n’accepte que les dossiers AC — jamais en brouillon ici.
    const isDraft = false;

    if ('lines' in body && body.lines !== undefined) {
      if (!isDraft) return fail('Seuls les dossiers en brouillon peuvent modifier les lignes.', 409);
      const parsed = parseLinesJson(body.lines);
      if (!parsed) return fail('Format des lignes invalide (tableau attendu).', 400);
      data.lines = parsed as unknown as Prisma.InputJsonValue;
      const t = totalsFromLines(parsed);
      data.subtotalHt = t.subtotalHt;
      data.vatTotal = t.vatTotal;
      data.totalTtc = t.totalTtc;
    }

    if ('clientSnapshot' in body && body.clientSnapshot !== undefined) {
      if (!isDraft) return fail('Seuls les dossiers en brouillon peuvent modifier le contexte client.', 409);
      if (body.clientSnapshot === null) {
        data.clientSnapshot = {} as Prisma.InputJsonValue;
      } else if (typeof body.clientSnapshot === 'object' && !Array.isArray(body.clientSnapshot)) {
        data.clientSnapshot = body.clientSnapshot as Prisma.InputJsonValue;
      } else {
        return fail('clientSnapshot doit être un objet JSON.', 400);
      }
    }

    if (typeof body.currency === 'string' && body.currency.trim().length === 3) {
      if (!isDraft) return fail('Seuls les dossiers en brouillon peuvent modifier la devise.', 409);
      data.currency = body.currency.trim().toUpperCase();
    }

    const updated = await prisma.financeDevis.update({
      where: { id: factureId },
      data,
      select: {
        id: true,
        referenceCode: true,
        title: true,
        status: true,
        notes: true,
        internalNotes: true,
        validUntil: true,
        updatedAt: true,
        lines: true,
        clientSnapshot: true,
        subtotalHt: true,
        vatTotal: true,
        totalTtc: true,
        currency: true,
      },
    });

    return ok({
      id: updated.id,
      referenceCode: updated.referenceCode,
      title: updated.title,
      status: updated.status,
      notes: updated.notes,
      internalNotes: updated.internalNotes,
      validUntil: updated.validUntil?.toISOString() ?? null,
      updatedAt: updated.updatedAt.toISOString(),
      lines: updated.lines,
      clientSnapshot: updated.clientSnapshot,
      subtotalHt: decimalNum(updated.subtotalHt),
      vatTotal: decimalNum(updated.vatTotal),
      totalTtc: decimalNum(updated.totalTtc),
      currency: updated.currency,
    });
  } catch (e) {
    console.error('[finance-factures PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { factureId } = await context.params;

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: factureId },
      select: { id: true, status: true },
    });
    if (!row) return fail('Dossier introuvable.', 404);
    if (row.status !== FinanceDevisStatus.DRAFT) {
      return fail('Seuls les dossiers en brouillon peuvent être supprimés.', 409);
    }

    await prisma.financeDevis.delete({ where: { id: factureId } });
    return ok({ deleted: true });
  } catch (e) {
    console.error('[finance-factures DELETE]', e);
    return fail('Suppression impossible.', 500, e);
  }
}
