import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { LANDING_LEAD_SOURCES, LeadStatus } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';

type Ctx = { params: Promise<{ leadId: string }> };

/** Détail d’un lead landing (deep link depuis fiche devis, etc.). */
export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { leadId } = await context.params;

  try {
    const row = await prisma.lead.findFirst({
      where: {
        id: leadId,
        source: { in: [...LANDING_LEAD_SOURCES] },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        source: true,
        status: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        formation: {
          select: { id: true, name: true, slug: true },
        },
        candidature: {
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
      },
    });
    if (!row) {
      return fail('Lead introuvable ou hors périmètre landing.', 404);
    }

    return ok({
      item: {
        id: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        phone: row.phone,
        source: row.source,
        status: row.status,
        notes: row.notes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        formation: row.formation,
        candidature: row.candidature,
      },
    });
  } catch (e) {
    console.error('[landing-leads GET one]', e);
    return fail('Lecture impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { leadId } = await context.params;

  try {
    const existing = await prisma.lead.findFirst({
      where: {
        id: leadId,
        source: { in: [...LANDING_LEAD_SOURCES] },
      },
      select: {
        id: true,
        candidature: { select: { id: true } },
      },
    });
    if (!existing) {
      return fail('Lead introuvable ou hors périmètre landing.', 404);
    }
    if (existing.candidature) {
      return fail(
        'Ce lead est lié à une candidature. Traitez le dossier dans Vie scolaire ou dissociez-le avant suppression.',
        409,
      );
    }

    await prisma.lead.delete({ where: { id: leadId } });
    return ok({ deleted: true });
  } catch (e) {
    console.error('[landing-leads DELETE]', e);
    return fail('Suppression impossible.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { leadId } = await context.params;
  let body: { status?: string };
  try {
    body = (await request.json()) as { status?: string };
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const status = body.status;
  const allowed = new Set(Object.values(LeadStatus) as string[]);
  if (!status || !allowed.has(status)) {
    return fail('Statut invalide.', 400);
  }

  try {
    const existing = await prisma.lead.findFirst({
      where: {
        id: leadId,
        source: { in: [...LANDING_LEAD_SOURCES] },
      },
      select: { id: true },
    });
    if (!existing) {
      return fail('Lead introuvable ou hors périmètre landing.', 404);
    }

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status: status as LeadStatus },
      select: {
        id: true,
        status: true,
        updatedAt: true,
      },
    });

    return ok({
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    console.error('[landing-leads PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}
