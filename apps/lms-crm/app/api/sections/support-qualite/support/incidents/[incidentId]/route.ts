import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { QualityIncidentSeverity, QualityIncidentStatus } from '@repo/database';
import { requireSupportEdit, requireSupportView } from '../../../_lib/require-support-auth';

type Ctx = { params: Promise<{ incidentId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const { incidentId } = await context.params;

  const row = await prisma.qualityIncident.findUnique({
    where: { id: incidentId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      reportedBy: { select: { id: true, name: true, email: true } },
      ticket: { select: { id: true, referenceCode: true, subject: true, status: true } },
      equipment: { select: { id: true, label: true, serialNumber: true, status: true } },
    },
  });
  if (!row) return fail('Incident introuvable.', 404);

  return ok({
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
  });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  const { incidentId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};

  if (body.title !== undefined) data.title = String(body.title).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.category !== undefined) data.category = String(body.category).trim() || null;
  if (body.rootCause !== undefined) data.rootCause = String(body.rootCause).trim() || null;
  if (body.correctiveAction !== undefined) {
    data.correctiveAction = String(body.correctiveAction).trim() || null;
  }
  if (body.ticketId !== undefined) {
    data.ticketId = String(body.ticketId).trim() || null;
  }
  if (body.equipmentId !== undefined) {
    data.equipmentId = String(body.equipmentId).trim() || null;
  }
  if (body.assignedToId !== undefined) {
    data.assignedToId = String(body.assignedToId).trim() || null;
  }
  if (body.severity !== undefined) {
    const severity = String(body.severity).trim() as QualityIncidentSeverity;
    if (!Object.values(QualityIncidentSeverity).includes(severity)) {
      return fail('Gravité invalide.', 400);
    }
    data.severity = severity;
  }
  if (body.status !== undefined) {
    const status = String(body.status).trim() as QualityIncidentStatus;
    if (!Object.values(QualityIncidentStatus).includes(status)) {
      return fail('Statut invalide.', 400);
    }
    data.status = status;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      data.resolvedAt = new Date();
    }
  }

  try {
    const row = await prisma.qualityIncident.update({
      where: { id: incidentId },
      data,
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        ticket: { select: { id: true, referenceCode: true, subject: true } },
        equipment: { select: { id: true, label: true, serialNumber: true } },
      },
    });

    return ok({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  const { incidentId } = await context.params;

  try {
    await prisma.qualityIncident.delete({ where: { id: incidentId } });
    return ok({ deleted: true });
  } catch {
    return fail('Suppression impossible.', 404);
  }
}
