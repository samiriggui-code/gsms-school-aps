import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus, Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { parseLinesJson, totalsFromLines } from '@/lib/finance-devis-totals';
import { listPlaquetteMessagesForDevis } from '@/lib/devis-plaquette-messages-query';
import { expireOverdueSentDevis } from '@/lib/finance/devis-workflow-settings-server';

type Ctx = { params: Promise<{ devisId: string }> };

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeView)) {
    return fail('Forbidden', 403);
  }

  const { devisId } = await context.params;

  try {
    await expireOverdueSentDevis(prisma);

    const row = await prisma.financeDevis.findUnique({
      where: { id: devisId },
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

    if (!row) return fail('Devis introuvable.', 404);

    const plaquetteMessages = (await listPlaquetteMessagesForDevis(devisId, { order: 'desc', take: 50 })).map((m) => ({
      id: m.id,
      authorKind: m.authorKind,
      body: m.body,
      authorLabel: m.authorLabel,
      createdAt: m.createdAt.toISOString(),
    }));

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
      plaquetteMessages,
    });
  } catch (e) {
    console.error('[finance-devis GET one]', e);
    const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: string }).code) : '';
    if (code === 'P2022') {
      return fail(
        'Base de données non migrée : la table FinanceDevis attend les colonnes candidatureId et formationSessionId. Exécutez « pnpm exec prisma migrate deploy » depuis packages/database (avec DATABASE_URL et DIRECT_URL), ou le script SQL prisma/scripts/apply-finance-devis-link-columns.sql sur votre PostgreSQL.',
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
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { devisId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  try {
    const existing = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      select: { id: true, status: true },
    });
    if (!existing) return fail('Devis introuvable.', 404);

    const data: Prisma.FinanceDevisUpdateInput = {};

    if (typeof body.title === 'string') data.title = body.title;
    if (typeof body.notes === 'string' || body.notes === null) data.notes = body.notes;
    if (typeof body.internalNotes === 'string' || body.internalNotes === null)
      data.internalNotes = body.internalNotes;

    if ('status' in body && typeof body.status === 'string') {
      const allowed = new Set(Object.values(FinanceDevisStatus) as string[]);
      if (!allowed.has(body.status)) return fail('Statut devis invalide.', 400);
      data.status = body.status as FinanceDevisStatus;
    }

    if ('validUntil' in body) {
      if (body.validUntil === null || body.validUntil === '') data.validUntil = null;
      else if (typeof body.validUntil === 'string') {
        const d = new Date(body.validUntil);
        if (!Number.isNaN(d.getTime())) data.validUntil = d;
      }
    }

    const isDraft = existing.status === FinanceDevisStatus.DRAFT;

    if ('lines' in body && body.lines !== undefined) {
      if (!isDraft) return fail('Seuls les devis en brouillon peuvent modifier les lignes.', 409);
      const parsed = parseLinesJson(body.lines);
      if (!parsed) return fail('Format des lignes invalide (tableau attendu).', 400);
      data.lines = parsed as unknown as Prisma.InputJsonValue;
      const t = totalsFromLines(parsed);
      data.subtotalHt = t.subtotalHt;
      data.vatTotal = t.vatTotal;
      data.totalTtc = t.totalTtc;
    }

    if ('clientSnapshot' in body && body.clientSnapshot !== undefined) {
      if (!isDraft) return fail('Seuls les devis en brouillon peuvent modifier le contexte client.', 409);
      if (body.clientSnapshot === null) {
        data.clientSnapshot = {} as Prisma.InputJsonValue;
      } else if (typeof body.clientSnapshot === 'object' && !Array.isArray(body.clientSnapshot)) {
        data.clientSnapshot = body.clientSnapshot as Prisma.InputJsonValue;
      } else {
        return fail('clientSnapshot doit être un objet JSON.', 400);
      }
    }

    if (typeof body.currency === 'string' && body.currency.trim().length === 3) {
      if (!isDraft) return fail('Seuls les devis en brouillon peuvent modifier la devise.', 409);
      data.currency = body.currency.trim().toUpperCase();
    }

    const updated = await prisma.financeDevis.update({
      where: { id: devisId },
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
    console.error('[finance-devis PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.financeEdit)) {
    return fail('Forbidden', 403);
  }

  const { devisId } = await context.params;

  try {
    const row = await prisma.financeDevis.findUnique({
      where: { id: devisId },
      select: { id: true, status: true },
    });
    if (!row) return fail('Devis introuvable.', 404);
    if (row.status !== FinanceDevisStatus.DRAFT) {
      return fail('Seuls les devis en brouillon peuvent être supprimés.', 409);
    }

    await prisma.financeDevis.delete({ where: { id: devisId } });
    return ok({ deleted: true });
  } catch (e) {
    console.error('[finance-devis DELETE]', e);
    return fail('Suppression impossible.', 500, e);
  }
}
