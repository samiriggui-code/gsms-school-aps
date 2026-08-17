import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { NotificationService, createWorkflowEngine } from '@repo/api-core';
import { Prisma, SupportTicketPriority, SupportTicketStatus } from '@repo/database';
import { requireSupportEdit, requireSupportView } from '../../_lib/require-support-auth';
import { nextTicketReference } from '../../_lib/ticket-reference';

export async function GET(request: NextRequest) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim();
  const status = (sp.get('status') ?? '').trim();
  const page = Math.max(Number(sp.get('page')) || 1, 1);
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 15, 1), 100);
  const skip = (page - 1) * limit;

  const where: Prisma.SupportTicketWhereInput = {
    ...(status && status !== 'all' ? { status: status as SupportTicketStatus } : {}),
    ...(q
      ? {
          OR: [
            { subject: { contains: q, mode: 'insensitive' } },
            { requesterEmail: { contains: q, mode: 'insensitive' } },
            { requesterName: { contains: q, mode: 'insensitive' } },
            { referenceCode: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    const [total, open, inProgress, resolved, urgent, rows] = await Promise.all([
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: { in: ['RESOLVED', 'CLOSED'] } } }),
      prisma.supportTicket.count({
        where: {
          priority: { in: ['HIGH', 'URGENT'] },
          status: { notIn: ['RESOLVED', 'CLOSED'] },
        },
      }),
      prisma.supportTicket.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          referenceCode: true,
          subject: true,
          status: true,
          priority: true,
          requesterName: true,
          requesterEmail: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
          assignedTo: { select: { id: true, name: true, email: true } },
          _count: { select: { comments: true, attachments: true } },
        },
      }),
    ]);

    return ok({
      stats: { total, open, inProgress, resolved, urgent },
      items: rows.map((r) => ({
        id: r.id,
        referenceCode: r.referenceCode,
        subject: r.subject,
        status: r.status,
        priority: r.priority,
        requesterName: r.requesterName,
        requesterEmail: r.requesterEmail,
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        assignedTo: r.assignedTo,
        commentCount: r._count.comments,
        attachmentCount: r._count.attachments,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[support-tickets GET]', e);
    return fail('Impossible de charger les tickets.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const subject = String(body.subject ?? '').trim();
  const description = String(body.description ?? '').trim();
  const requesterName = String(body.requesterName ?? '').trim();
  const requesterEmail = String(body.requesterEmail ?? '').trim().toLowerCase();
  const priority = String(body.priority ?? 'MEDIUM').trim() as SupportTicketPriority;

  if (!subject || !description || !requesterName || !requesterEmail) {
    return fail('Sujet, description, nom et e-mail requis.', 400);
  }

  try {
    const count = await prisma.supportTicket.count();
    const row = await prisma.supportTicket.create({
      data: {
        referenceCode: await nextTicketReference(count),
        subject,
        description,
        requesterName,
        requesterEmail,
        priority: Object.values(SupportTicketPriority).includes(priority)
          ? priority
          : SupportTicketPriority.MEDIUM,
        createdById: auth.userId,
      },
    });

    await prisma.ticketComment.create({
      data: {
        ticketId: row.id,
        authorId: auth.userId,
        body: description,
        isInternal: false,
      },
    });

    const notifier = new NotificationService(prisma);
    const adminIds = (
      await prisma.user.findMany({
        where: {
          isTrashed: false,
          status: 'ACTIVE',
          role: {
            isTrashed: false,
            permissions: {
              some: { permission: { slug: 'crm.support.view' } },
            },
          },
        },
        select: { id: true },
        take: 30,
      })
    ).map((u) => u.id);

    const ticketHref = `/support-qualite/support/tickets?ticket=${row.id}`;
    const payload = {
      category: 'TICKET' as const,
      title: `Ticket ${row.referenceCode}`,
      body: subject,
      href: ticketHref,
      dedupeKey: `ticket:${row.id}`,
    };

    if (adminIds.length > 0) {
      await notifier.emitMany(adminIds, payload);
    } else {
      await notifier.emit({ ...payload, userId: auth.userId });
    }

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.support.ticket.created',
        {
          ticketId: row.id,
          referenceCode: row.referenceCode,
          subject,
          requesterName,
          requesterEmail,
          priority: row.priority,
        },
        { dedupeKey: `ticket:${row.id}` },
      );
    } catch (e) {
      console.error('[support-tickets] workflow', e);
    }

    return ok({ id: row.id, referenceCode: row.referenceCode }, 201);
  } catch (e) {
    console.error('[support-tickets POST]', e);
    return fail('Création impossible.', 500, e);
  }
}
