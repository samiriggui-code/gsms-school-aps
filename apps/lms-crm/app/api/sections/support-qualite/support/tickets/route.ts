import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { NotificationService } from '@repo/api-core';
import { Prisma, SupportTicketPriority, SupportTicketStatus } from '@repo/database';

async function nextReference(prefix: string, count: number) {
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

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
        },
      }),
    ]);

    return ok({
      stats: { total, open, inProgress, resolved, urgent },
      items: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        resolvedAt: r.resolvedAt?.toISOString() ?? null,
      })),
      pagination: { page, limit, total },
    });
  } catch (e) {
    console.error('[support-tickets GET]', e);
    return fail('Impossible de charger les tickets.', 500, e);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

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
        referenceCode: await nextReference('TKT', count),
        subject,
        description,
        requesterName,
        requesterEmail,
        priority: Object.values(SupportTicketPriority).includes(priority)
          ? priority
          : SupportTicketPriority.MEDIUM,
        createdById: session.user?.id ?? null,
      },
    });

    const notifier = new NotificationService(prisma);
    const adminIds = (
      await prisma.user.findMany({
        where: {
          isTrashed: false,
          status: 'ACTIVE',
          role: { slug: 'admin', isTrashed: false },
        },
        select: { id: true },
        take: 20,
      })
    ).map((u) => u.id);

    const ticketHref = '/support-qualite/support/tickets';
    const payload = {
      category: 'TICKET' as const,
      title: `Ticket ${row.referenceCode}`,
      body: subject,
      href: ticketHref,
      dedupeKey: `ticket:${row.id}`,
    };

    if (adminIds.length > 0) {
      await notifier.emitMany(adminIds, payload);
    } else if (session.user?.id) {
      await notifier.emit({ ...payload, userId: session.user.id });
    }

    return ok({ id: row.id, referenceCode: row.referenceCode }, 201);
  } catch (e) {
    console.error('[support-tickets POST]', e);
    return fail('Création impossible.', 500, e);
  }
}
