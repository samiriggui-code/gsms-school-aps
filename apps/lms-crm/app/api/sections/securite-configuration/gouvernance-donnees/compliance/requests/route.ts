import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService } from '@repo/api-core';
import { GOVERNANCE_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

const REQUESTABLE_ITEM_STATUSES = ['MISSING', 'REJECTED', 'EXPIRED'] as const;

/** Liste les pièces éligibles à une demande (MISSING / REJECTED / EXPIRED). */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.conformiteView)) {
    return fail('Forbidden', 403);
  }

  const sp = request.nextUrl.searchParams;
  const candidatureId = sp.get('candidatureId');
  const dossierId = sp.get('dossierId');

  try {
    const items = await prisma.complianceDossierItem.findMany({
      where: {
        status: {
          in: [...REQUESTABLE_ITEM_STATUSES],
        },
        ...(dossierId
          ? { dossierId }
          : candidatureId
            ? { dossier: { candidatureId } }
            : {}),
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        code: true,
        label: true,
        status: true,
        dossierId: true,
        dossier: {
          select: {
            kind: true,
            candidatureId: true,
            user: {
              select: { email: true, firstName: true, lastName: true, name: true },
            },
          },
        },
      },
    });

    return ok({ items });
  } catch (e) {
    return fail('Impossible de lister les pièces.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, GOVERNANCE_PERMISSION.conformiteEdit)) {
    return fail('Forbidden', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const dossierItemId = typeof body.dossierItemId === 'string' ? body.dossierItemId.trim() : undefined;
  if (!dossierItemId || dossierItemId === '<id>') {
    return fail(
      'dossierItemId requis (UUID d’une pièce ComplianceDossierItem — voir GET …/compliance/dossiers?candidatureId=…).',
      400,
    );
  }

  const dueAtRaw = typeof body.dueAt === 'string' ? body.dueAt : undefined;
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : undefined;
  const message = typeof body.message === 'string' ? body.message : undefined;
  const sendEmail = body.sendEmail !== false;

  try {
    const service = new ComplianceService(prisma);
    const requestRow = await service.createDocumentRequest({
      dossierItemId,
      message,
      dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
      requestedById: session.user?.id ?? null,
      sendEmail,
    });
    return ok({
      request: requestRow,
      emailSent: requestRow.emailSent,
      emailError: requestRow.emailError ?? null,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('introuvable')) {
      return fail(message, 404, e);
    }
    return fail('Impossible de créer la demande de pièce.', 500, e);
  }
}
