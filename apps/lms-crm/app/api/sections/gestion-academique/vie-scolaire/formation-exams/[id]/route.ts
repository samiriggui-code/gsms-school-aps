import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamStatus, Prisma } from '@repo/database';
import { parseJuryMemberNames } from '@repo/api-core';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  formationExamDetailInclude,
} from '../_serialize-formation-exam';
import { loadFormationExamDetail } from '@/lib/vie-scolaire/formation-exam-detail-loader';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await context.params;
  const item = await loadFormationExamDetail(id);
  if (!item) return fail('Examen introuvable.', 404);
  return ok({ item });
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return fail('Corps JSON attendu.', 400);

  const data: Prisma.FormationExamUpdateInput = {};

  if (body.status && (Object.values(FormationExamStatus) as string[]).includes(body.status)) {
    data.status = body.status as FormationExamStatus;
  }
  if (body.juryPresidentName !== undefined) {
    data.juryPresidentName =
      typeof body.juryPresidentName === 'string' && body.juryPresidentName.trim()
        ? body.juryPresidentName.trim()
        : null;
  }
  if (body.juryMemberNames !== undefined) {
    data.juryMemberNames = parseJuryMemberNames(body.juryMemberNames);
  }
  if (body.notes !== undefined) {
    data.notes = typeof body.notes === 'string' ? body.notes.trim() || null : null;
  }
  if (body.scheduledAt !== undefined) {
    if (body.scheduledAt === null || body.scheduledAt === '') {
      data.scheduledAt = null;
    } else if (typeof body.scheduledAt === 'string') {
      const d = new Date(body.scheduledAt);
      if (Number.isNaN(d.getTime())) return fail('Date examen invalide.', 400);
      data.scheduledAt = d;
    }
  }
  if (body.venueRoomId !== undefined) {
    if (body.venueRoomId === null || body.venueRoomId === '') {
      data.venueRoom = { disconnect: true };
    } else if (typeof body.venueRoomId === 'string') {
      const room = await prisma.formationVenueRoom.findFirst({
        where: { id: body.venueRoomId, isActive: true },
        select: { id: true },
      });
      if (!room) return fail('Salle introuvable.', 422);
      data.venueRoom = { connect: { id: room.id } };
    }
  }

  if (Object.keys(data).length === 0) return fail('Aucune modification.', 400);

  try {
    await prisma.formationExam.update({
      where: { id },
      data,
      include: formationExamDetailInclude,
    });
    const item = await loadFormationExamDetail(id);
    if (!item) return fail('Examen introuvable.', 404);
    return ok({ item });
  } catch {
    return fail('Examen introuvable ou mise à jour impossible.', 404);
  }
}
