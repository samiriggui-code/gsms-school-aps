import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Prisma, RhAbsenceStatus, RhAbsenceType } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  absenceUserInclude,
  computeAbsenceStats,
  serializeAbsence,
} from '../../_lib/rh-absences-serialize';

type Params = { params: Promise<{ path?: string[] }> };

const TYPES = new Set<string>(Object.values(RhAbsenceType));
const STATUSES = new Set<string>(Object.values(RhAbsenceStatus));

function parseDateOnly(value: unknown): Date | null {
  const s = String(value ?? '').trim();
  if (!s) return null;
  const d = new Date(s.length <= 10 ? `${s}T12:00:00.000Z` : s);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return session;
}

export async function GET(request: NextRequest, { params }: Params) {
  if (!(await requireSession())) return fail('Unauthorized request', 401);

  const parts = (await params).path ?? [];
  const url = new URL(request.url);

  try {
    if (parts.length === 1 && parts[0]) {
      const row = await prisma.rhAbsence.findUnique({
        where: { id: parts[0] },
        include: { user: absenceUserInclude },
      });
      if (!row) return fail('Absence introuvable', 404);
      return ok(serializeAbsence(row));
    }

    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    const statusParam = url.searchParams.get('status');
    const userId = url.searchParams.get('userId')?.trim();

    const where: Prisma.RhAbsenceWhereInput = {
      ...(userId ? { userId } : {}),
      ...(statusParam && statusParam !== 'all' && STATUSES.has(statusParam)
        ? { status: statusParam as RhAbsenceStatus }
        : {}),
    };

    const [total, rows, stats] = await Promise.all([
      prisma.rhAbsence.count({ where }),
      prisma.rhAbsence.findMany({
        where,
        include: { user: absenceUserInclude },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      computeAbsenceStats(prisma),
    ]);

    return ok({
      items: rows.map(serializeAbsence),
      pagination: { page, limit, total },
      stats,
    });
  } catch (error) {
    return fail('Impossible de charger les absences.', 500, error);
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  if (!(await requireSession())) return fail('Unauthorized request', 401);
  if ((await params).path?.length) return fail('Méthode non autorisée sur ce chemin.', 405);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const userId = String(body.userId ?? '').trim();
    const typeRaw = String(body.type ?? 'CONGE_PAYE').trim();
    const type = TYPES.has(typeRaw) ? (typeRaw as RhAbsenceType) : RhAbsenceType.CONGE_PAYE;
    const startDate = parseDateOnly(body.startDate);
    const endDate = parseDateOnly(body.endDate);

    if (!userId) return fail('Le collaborateur est requis.', 400);
    if (!startDate || !endDate) return fail('Dates de début et de fin requises.', 400);
    if (endDate < startDate) return fail('La date de fin doit être après la date de début.', 400);

    const user = await prisma.user.findFirst({
      where: { id: userId, isTrashed: false },
      select: { id: true },
    });
    if (!user) return fail('Collaborateur introuvable.', 404);

    const row = await prisma.rhAbsence.create({
      data: {
        userId,
        type,
        startDate,
        endDate,
        reason: body.reason ? String(body.reason).trim() : null,
        status: RhAbsenceStatus.PENDING,
      },
      include: { user: absenceUserInclude },
    });

    return ok(serializeAbsence(row), 201);
  } catch (error) {
    return fail('Impossible de créer l’absence.', 500, error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireSession();
  if (!session) return fail('Unauthorized request', 401);

  const id = (await params).path?.[0];
  if (!id) return fail('Identifiant requis.', 400);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data: Prisma.RhAbsenceUpdateInput = {};

    if (body.status !== undefined) {
      const s = String(body.status).trim();
      if (!STATUSES.has(s)) return fail('Statut invalide.', 400);
      data.status = s as RhAbsenceStatus;
      if (s !== 'PENDING' && session.user?.id) {
        data.validatedBy = { connect: { id: session.user.id } };
      }
    }
    if (body.type !== undefined) {
      const t = String(body.type).trim();
      if (!TYPES.has(t)) return fail('Type invalide.', 400);
      data.type = t as RhAbsenceType;
    }
    if (body.reason !== undefined) data.reason = body.reason ? String(body.reason).trim() : null;
    if (body.startDate !== undefined) {
      const d = parseDateOnly(body.startDate);
      if (!d) return fail('Date de début invalide.', 400);
      data.startDate = d;
    }
    if (body.endDate !== undefined) {
      const d = parseDateOnly(body.endDate);
      if (!d) return fail('Date de fin invalide.', 400);
      data.endDate = d;
    }

    const row = await prisma.rhAbsence.update({
      where: { id },
      data,
      include: { user: absenceUserInclude },
    });

    return ok(serializeAbsence(row));
  } catch (error) {
    return fail('Impossible de mettre à jour l’absence.', 500, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await requireSession())) return fail('Unauthorized request', 401);

  const id = (await params).path?.[0];
  if (!id) return fail('Identifiant requis.', 400);

  try {
    await prisma.rhAbsence.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail('Impossible de supprimer l’absence.', 500, error);
  }
}

export async function PUT(request: NextRequest, ctx: Params) {
  return PATCH(request, ctx);
}
