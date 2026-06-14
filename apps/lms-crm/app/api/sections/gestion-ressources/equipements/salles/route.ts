import { NextRequest } from 'next/server';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import {
  serializeVenueRooms,
  type SerializedVenueRoom,
} from './_lib/serialize-rooms';

function filterRooms(items: SerializedVenueRoom[], query: string | null) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      (r.shortCode ?? '').toLowerCase().includes(q) ||
      (r.floorLabel ?? '').toLowerCase().includes(q),
  );
}

function sortRooms(
  items: SerializedVenueRoom[],
  sort: string,
  dir: 'asc' | 'desc',
): SerializedVenueRoom[] {
  const sorted = [...items];
  const factor = dir === 'desc' ? -1 : 1;
  sorted.sort((a, b) => {
    const av = a[sort as keyof SerializedVenueRoom];
    const bv = b[sort as keyof SerializedVenueRoom];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    if (typeof av === 'boolean' && typeof bv === 'boolean') {
      return (Number(av) - Number(bv)) * factor;
    }
    return String(av).localeCompare(String(bv), 'fr') * factor;
  });
  return sorted;
}

export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const params = new URL(request.url).searchParams;
  const legacyAll = params.get('all') === '1';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.get('limit')) || 10));
  const query = params.get('query')?.trim() || null;
  const sort = params.get('sort') || 'name';
  const dir = params.get('dir') === 'desc' ? 'desc' : 'asc';

  try {
    const items = await serializeVenueRooms(true);
    if (legacyAll) {
      return ok({ items });
    }

    const filtered = sortRooms(filterRooms(items, query), sort, dir);
    const total = filtered.length;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return ok({
      data,
      pagination: { total, page, limit },
    });
  } catch (error) {
    return fail('Impossible de charger les salles.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return fail('Le nom de la salle est requis.', 400);

    const shortCodeRaw = body.shortCode ? String(body.shortCode).trim() : null;
    const capacity =
      body.capacity === null || body.capacity === undefined || body.capacity === ''
        ? null
        : Number(body.capacity);
    if (capacity !== null && (!Number.isFinite(capacity) || capacity < 0)) {
      return fail('Capacité invalide.', 400);
    }

    const row = await prisma.formationVenueRoom.create({
      data: {
        name,
        shortCode: shortCodeRaw || null,
        capacity,
        floorLabel: body.floorLabel ? String(body.floorLabel).trim() : null,
        imageUrl: body.imageUrl ? String(body.imageUrl).trim() : null,
        isActive: body.isActive !== false,
        sortOrder: Number(body.sortOrder) || 0,
      },
    });

    return ok({ item: row }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('Ce code court de salle existe déjà.', 409);
    }
    return fail('Impossible de créer la salle.', 500, error);
  }
}
