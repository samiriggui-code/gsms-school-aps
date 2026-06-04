import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { NotificationService } from '@repo/api-core';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { SupportTicketPriority, SupportTicketStatus } from '@repo/database';

type Ctx = { params: Promise<{ ticketId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { ticketId } = await context.params;

  try {
    const row = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        lead: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!row) return fail('Ticket introuvable.', 404);
    return ok({
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    });
  } catch (e) {
    return fail('Lecture impossible.', 500, e);
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { ticketId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};

  if (body.status !== undefined) {
    const status = String(body.status).trim() as SupportTicketStatus;
    if (!Object.values(SupportTicketStatus).includes(status)) {
      return fail('Statut invalide.', 400);
    }
    data.status = status;
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
  }
  if (body.subject !== undefined) data.subject = String(body.subject).trim();
  if (body.description !== undefined) data.description = String(body.description).trim();
  if (body.assignedToId !== undefined) {
    const id = String(body.assignedToId).trim();
    data.assignedToId = id || null;
  }

  try {
    const prev = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { referenceCode: true, subject: true, assignedToId: true },
    });
    if (!prev) return fail('Ticket introuvable.', 404);

    const row = await prisma.supportTicket.update({
      where: { id: ticketId },
      data,
    });

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
        href: '/support-qualite/support/tickets',
        dedupeKey: `ticket-assigned:${row.id}:${assigneeId}`,
      });
    }

    return ok({ id: row.id, status: row.status });
  } catch (e) {
    console.error('[support-tickets PATCH]', e);
    return fail('Mise à jour impossible.', 500, e);
  }
}
