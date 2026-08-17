import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireSupportEdit, requireSupportView } from '../../../../_lib/require-support-auth';

type Ctx = { params: Promise<{ ticketId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const auth = await requireSupportView();
  if (!auth.ok) return auth.response;

  const { ticketId } = await context.params;

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true },
  });
  if (!ticket) return fail('Ticket introuvable.', 404);

  const rows = await prisma.ticketComment.findMany({
    where: { ticketId },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
  });

  return ok(
    rows.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      attachments: c.attachments.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
    })),
  );
}

export async function POST(request: NextRequest, context: Ctx) {
  const auth = await requireSupportEdit();
  if (!auth.ok) return auth.response;

  const { ticketId } = await context.params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const text = String(body.body ?? '').trim();
  const isInternal = Boolean(body.isInternal);
  if (!text) return fail('Message requis.', 400);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { id: true, status: true },
  });
  if (!ticket) return fail('Ticket introuvable.', 404);

  const row = await prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: auth.userId,
      body: text,
      isInternal,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
  });

  if (ticket.status === 'OPEN' || ticket.status === 'WAITING_CLIENT') {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: isInternal ? 'IN_PROGRESS' : 'WAITING_CLIENT' },
    });
  }

  return ok(
    {
      ...row,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      attachments: [],
    },
    201,
  );
}
