import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  inferLandingTeamVolet,
  serializeLandingTeamOfferForCrm,
} from '@/lib/catalog-team-serialize';
import { invalidateCatalogTeamListCache } from '@/lib/catalog-public-cache';
import { landingTeamUserSelect } from './_user-select';

const CreateSchema = z.object({
  userId: z.string().uuid(),
  volet: z.enum(['direction', 'formateur', 'pedagogique', 'rh']).optional(),
  sortOrder: z.number().int().optional(),
});

function catalogOffersWhere(scope: string | null): Prisma.LandingTeamOfferWhereInput {
  const s = scope?.trim() ?? 'visible';
  if (s === 'archived') return { catalogStatus: 'ARCHIVED' };
  if (s === 'all') return {};
  return { catalogStatus: { in: ['ACTIVE', 'DRAFT'] } };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const scope = request.nextUrl.searchParams.get('scope');
    const offers = await prisma.landingTeamOffer.findMany({
      where: catalogOffersWhere(scope),
      orderBy: [{ volet: 'asc' }, { sortOrder: 'asc' }, { updatedAt: 'desc' }],
      include: { user: { select: landingTeamUserSelect } },
    });

    return ok({
      items: offers.map((row) => serializeLandingTeamOfferForCrm(row)),
    });
  } catch (error) {
    return fail('Impossible de charger l’équipe landing.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation ajout équipe landing.', 422, parsed.error.flatten());
  }

  const { userId, volet: voletInput, sortOrder } = parsed.data;

  try {
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        isTrashed: false,
        OR: [{ formateurProfile: { isNot: null } }, { collaborateurProfile: { isNot: null } }],
      },
      select: landingTeamUserSelect,
    });
    if (!user) return fail('Utilisateur introuvable ou sans profil RH / formateur.', 404);

    const existing = await prisma.landingTeamOffer.findUnique({ where: { userId } });
    if (existing) return fail('Ce membre est déjà dans le catalogue équipe.', 409);

    const volet = voletInput ?? inferLandingTeamVolet(user);
    const maxSort = await prisma.landingTeamOffer.aggregate({
      where: { volet },
      _max: { sortOrder: true },
    });

    const created = await prisma.landingTeamOffer.create({
      data: {
        userId,
        volet,
        catalogStatus: 'DRAFT',
        sortOrder: sortOrder ?? (maxSort._max.sortOrder ?? 0) + 1,
      },
      include: { user: { select: landingTeamUserSelect } },
    });

    void invalidateCatalogTeamListCache().catch((e) => {
      console.error('[landing-team] cache invalidation', e);
    });

    return ok({ item: serializeLandingTeamOfferForCrm(created) }, 201);
  } catch (error) {
    return fail('Impossible d’ajouter le membre.', 500, error);
  }
}
