import { NextRequest } from 'next/server';
import type { Prisma, RhOrgUnitType } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { nullishId } from '../../_lib/rh-teams-serialize';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';

type Params = { params: Promise<{ path?: string[] }> };

const RH_ORG_UNIT_TYPE_VALUES: RhOrgUnitType[] = ['DIRECTION', 'SERVICE', 'POLE', 'CAMPUS'];

const LEGACY_ORG_UNIT_TYPE_MAP: Record<string, RhOrgUnitType> = {
  AGENCE: 'CAMPUS',
  SIEGE: 'DIRECTION',
};

function parseRhOrgUnitType(value: unknown): RhOrgUnitType {
  const raw = String(value ?? 'SERVICE').trim().toUpperCase();
  if (LEGACY_ORG_UNIT_TYPE_MAP[raw]) return LEGACY_ORG_UNIT_TYPE_MAP[raw];
  return RH_ORG_UNIT_TYPE_VALUES.includes(raw as RhOrgUnitType)
    ? (raw as RhOrgUnitType)
    : 'SERVICE';
}

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
  manager?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  } | null;
  teams?: Array<{
    id: string;
    name: string;
    type: string;
    sector: string;
    image: string | null;
    site: { name: string } | null;
    leader: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatar: string | null;
    } | null;
    _count: { members: number };
  }>;
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
    Memberships: row.manager
      ? [
          {
            id: row.manager.id,
            TenantUser: {
              firstName: row.manager.firstName,
              lastName: row.manager.lastName,
              email: row.manager.email,
              avatar: row.manager.avatar,
            },
          },
        ]
      : [],
    Teams:
      row.teams?.map((team) => ({
        id: team.id,
        name: team.name,
        type: team.type,
        sector: team.sector,
        image: team.image,
        Site: team.site,
        leader: team.leader,
        _count: { members: team._count.members },
      })) ?? [],
  };
}

const orgUnitInclude = {
  parent: { select: { name: true } },
  manager: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  },
  teams: {
    where: {
      formationSessionId: null,
      type: { in: ['DIRECTION', 'PEDAGOGICAL', 'TRAINER_POOL', 'HR_ADMIN'] },
    },
    select: {
      id: true,
      name: true,
      type: true,
      sector: true,
      image: true,
      site: { select: { name: true } },
      leader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      _count: { select: { members: true } },
    },
    orderBy: { name: 'asc' as const },
  },
  _count: {
    select: {
      children: true,
      teams: { where: { formationSessionId: null, type: { in: ['DIRECTION', 'PEDAGOGICAL', 'TRAINER_POOL', 'HR_ADMIN'] } } },
    },
  },
} satisfies Prisma.RhOrgUnitInclude;

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const parts = (await params).path ?? [];
  if (parts.length === 1 && parts[0]) {
    const row = await prisma.rhOrgUnit.findUnique({
      where: { id: parts[0] },
      include: orgUnitInclude,
    });
    if (!row) return fail('Unité introuvable', 404);
    return ok(serializeOrgUnit(row));
  }

  const rows = await prisma.rhOrgUnit.findMany({
    orderBy: { name: 'asc' },
    include: orgUnitInclude,
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
        type: parseRhOrgUnitType(body.type),
        parentId: nullishId(body.parentId),
        managerId: nullishId(body.managerId),
        positionId: nullishId(body.positionId),
      },
      include: orgUnitInclude,
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
        ...(body.type !== undefined ? { type: parseRhOrgUnitType(body.type) } : {}),
        ...(body.parentId !== undefined ? { parentId: nullishId(body.parentId) } : {}),
        ...(body.managerId !== undefined ? { managerId: nullishId(body.managerId) } : {}),
        ...(body.positionId !== undefined ? { positionId: nullishId(body.positionId) } : {}),
      },
      include: orgUnitInclude,
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
