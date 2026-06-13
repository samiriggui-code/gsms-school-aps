import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { nullishId } from '../../_lib/rh-teams-serialize';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ path?: string[] }> };

function serializeOrgUnit(row: {
  id: string;
  name: string;
  type: string;
  parentId: string | null;
  managerId: string | null;
  positionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: { name: string } | null;
  manager?: { id: string; firstName: string | null; lastName: string | null; email: string } | null;
  _count?: { children: number; teams: number };
}) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    parentId: row.parentId,
    managerId: row.managerId,
    positionId: row.positionId,
    Parent: row.parent ? { name: row.parent.name } : null,
    manager: row.manager,
    _count: {
      Children: row._count?.children ?? 0,
      Teams: row._count?.teams ?? 0,
    },
    Memberships: [],
    Teams: [],
  };
}

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const parts = (await params).path ?? [];
  if (parts.length === 1 && parts[0]) {
    const row = await prisma.rhOrgUnit.findUnique({
      where: { id: parts[0] },
      include: {
        parent: { select: { name: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { children: true, teams: true } },
      },
    });
    if (!row) return fail('Unité introuvable', 404);
    return ok(serializeOrgUnit(row));
  }

  const rows = await prisma.rhOrgUnit.findMany({
    orderBy: { name: 'asc' },
    include: {
      parent: { select: { name: true } },
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: { select: { children: true, teams: true } },
    },
  });

  return ok(rows.map(serializeOrgUnit));
}

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = String(body.name ?? '').trim();
    if (name.length < 2) return fail('Le nom est requis.', 400);

    const row = await prisma.rhOrgUnit.create({
      data: {
        name,
        type: String(body.type ?? 'AGENCE').trim() || 'AGENCE',
        parentId: nullishId(body.parentId),
        managerId: nullishId(body.managerId),
        positionId: nullishId(body.positionId),
      },
      include: {
        parent: { select: { name: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { children: true, teams: true } },
      },
    });
    return ok(serializeOrgUnit(row), 201);
  } catch (error) {
    return fail('Impossible de créer l\'unité.', 500, error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const id = (await params).path?.[0];
  if (!id) return fail('Identifiant requis', 400);

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const row = await prisma.rhOrgUnit.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
        ...(body.type !== undefined ? { type: String(body.type).trim() } : {}),
        ...(body.parentId !== undefined ? { parentId: nullishId(body.parentId) } : {}),
        ...(body.managerId !== undefined ? { managerId: nullishId(body.managerId) } : {}),
        ...(body.positionId !== undefined ? { positionId: nullishId(body.positionId) } : {}),
      },
      include: {
        parent: { select: { name: true } },
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: { select: { children: true, teams: true } },
      },
    });
    return ok(serializeOrgUnit(row));
  } catch (error) {
    return fail('Impossible de mettre à jour l\'unité.', 500, error);
  }
}

export async function PUT(request: NextRequest, ctx: Params) {
  return PATCH(request, ctx);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const id = (await params).path?.[0];
  if (!id) return fail('Identifiant requis', 400);

  try {
    const children = await prisma.rhOrgUnit.count({ where: { parentId: id } });
    if (children > 0) {
      return fail('Supprimez ou réaffectez les unités enfants avant suppression.', 409);
    }
    await prisma.rhOrgUnit.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail('Impossible de supprimer l\'unité.', 500, error);
  }
}
