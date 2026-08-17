import { NextRequest } from 'next/server';
import { NotificationService } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { SupportTicketPriority, SupportTicketStatus } from '@repo/database';
import { requireSupportEdit, requireSupportView } from '../../../_lib/require-support-auth';

type Ctx = { params: Promise<{ ticketId: string }> };

function serializeTicket(row: Awaited<ReturnType<typeof loadTicket>>) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    resolvedAt: row.resolvedAt?.toISOString() ?? null,
    comments: row.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    attachments: row.attachments.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
    incidents: row.incidents.map((i) => ({
      ...i,
      createdAt: i.createdAt.toISOString(),
      updatedAt: i.updatedAt.toISOString(),
      resolvedAt: i.resolvedAt?.toISOString() ?? null,
    })),
  };
}

async function loadTicket(ticketId: string) {
  return prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      lead: { select: { id: true, firstName: true, lastName: true, email: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: { select: { id: true, name: true, email: true } },
          attachments: true,
        },
      },
      attachments: {
        where: { commentId: null },
        orderBy: { createdAt: 'desc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true } },
        },
      },
      incidents: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          referenceCode: true,
          title: true,
          status: true,
          severity: true,
          createdAt: true,
          updatedAt: true,
          resolvedAt: true,
        },
      },
    },
  });
}

export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const { ticketId } = await context.params;

  try {
    const row = await loadTicket(ticketId);
    if (!row) return fail('Ticket introuvable.', 404);
    return ok(serializeTicket(row));
  } catch (e) {
    return fail('Lecture impossible.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  const { ticketId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};
  const auditLines: string[] = [];

  if (body.status !== undefined) {
    const status = String(body.status).trim() as SupportTicketStatus;
    if (!Object.values(SupportTicketStatus).includes(status)) {
      return fail('Statut invalide.', 400);
    }
    data.status = status;
    auditLines.push(`Statut → ${status}`);
    if (status === 'RESOLVED' || status === 'CLOSED') {
      data.resolvedAt = new Date();
    }
  }
  if (body.priority !== undefined) {
    const priority = String(body.priority).trim() as SupportTicketPriority;
    if (!Object.values(SupportTicketPriority).includes(priority)) {
      return fail('Priorité invalide.', 400);
    }
    data.priority = priority;
    auditLines.push(`Priorité → ${priority}`);
  }
  if (body.subject !== undefined) data.subject = String(body.subject).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.assignedToId !== undefined) {
    const id = String(body.assignedToId).trim();
    data.assignedToId = id || null;
    auditLines.push(id ? `Assigné à un agent` : `Assignation retirée`);
  }

  try {
    const prev = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { referenceCode: true, subject: true, assignedToId: true, status: true },
    });
    if (!prev) return fail('Ticket introuvable.', 404);

    const row = await prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });

    if (auditLines.length > 0) {
      await prisma.ticketComment.create({
        data: {
          ticketId,
          authorId: auth.userId,
          body: auditLines.join(' · '),
          isInternal: true,
        },
      });
    }

    const assigneeId =
      body.assignedToId !== undefined
        ? String(body.assignedToId).trim() || null
        : undefined;
    if (assigneeId && assigneeId !== prev.assignedToId) {
      const notifier = new NotificationService(prisma);
      await notifier.emit({
        userId: assigneeId,
        category: 'TICKET',
        title: `Ticket assigné — ${row.referenceCode}`,
        body: prev.subject,
        href: `/support-qualite/support/tickets?ticket=${row.id}`,
        dedupeKey: `ticket-assigned:${row.id}:${assigneeId}`,
      });
    }

    const full = await loadTicket(ticketId);
    return ok(serializeTicket(full));
  } catch (e) {
    console.error('[support-tickets PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}
