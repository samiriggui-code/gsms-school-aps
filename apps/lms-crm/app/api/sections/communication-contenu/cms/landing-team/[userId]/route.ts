import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { serializeLandingTeamOfferForCrm } from '@/lib/catalog-team-serialize';
import { invalidateCatalogTeamListCache } from '@/lib/catalog-public-cache';
import { landingTeamUserSelect } from '../_user-select';

const PatchSchema = z.object({
  catalogStatus: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  volet: z.enum(['direction', 'formateur', 'pedagogique', 'rh']).optional(),
  sortOrder: z.number().int().optional(),
  titleOverride: z.string().nullable().optional(),
  certificationsLabelOverride: z.string().nullable().optional(),
  bioOverride: z.string().nullable().optional(),
  statAOverride: z.number().int().nullable().optional(),
  statBOverride: z.number().int().nullable().optional(),
  ratingOverride: z.number().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional().or(z.literal('').transform(() => null)),
  websiteUrl: z.string().url().nullable().optional().or(z.literal('').transform(() => null)),
});

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { userId } = await context.params;
  if (!userId?.trim()) return fail('Identifiant manquant.', 400);

  try {
    const offer = await prisma.landingTeamOffer.findUnique({
      where: { userId: userId.trim() },
      include: { user: { select: landingTeamUserSelect } },
    });
    if (!offer) return fail('Membre catalogue introuvable.', 404);
    return ok({ item: serializeLandingTeamOfferForCrm(offer) });
  } catch (error) {
    return fail('Impossible de charger le membre.', 500, error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { userId } = await context.params;
  if (!userId?.trim()) return fail('Identifiant manquant.', 400);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation mise à jour équipe landing.', 422, parsed.error.flatten());
  }

  const d = parsed.data;
  const updateData: Prisma.LandingTeamOfferUpdateInput = {};
  if (d.catalogStatus !== undefined) updateData.catalogStatus = d.catalogStatus;
  if (d.volet !== undefined) updateData.volet = d.volet;
  if (d.sortOrder !== undefined) updateData.sortOrder = d.sortOrder;
  if (d.titleOverride !== undefined) updateData.titleOverride = d.titleOverride;
  if (d.certificationsLabelOverride !== undefined) {
    updateData.certificationsLabelOverride = d.certificationsLabelOverride;
  }
  if (d.bioOverride !== undefined) updateData.bioOverride = d.bioOverride;
  if (d.statAOverride !== undefined) updateData.statAOverride = d.statAOverride;
  if (d.statBOverride !== undefined) updateData.statBOverride = d.statBOverride;
  if (d.ratingOverride !== undefined) updateData.ratingOverride = d.ratingOverride;
  if (d.linkedinUrl !== undefined) updateData.linkedinUrl = d.linkedinUrl;
  if (d.websiteUrl !== undefined) updateData.websiteUrl = d.websiteUrl;

  if (!Object.keys(updateData).length) return fail('Aucun champ à mettre à jour.', 400);

  try {
    const updated = await prisma.landingTeamOffer.update({
      where: { userId: userId.trim() },
      data: updateData,
      include: { user: { select: landingTeamUserSelect } },
    });

    void invalidateCatalogTeamListCache().catch((e) => {
      console.error('[landing-team] cache invalidation', e);
    });

    return ok({ item: serializeLandingTeamOfferForCrm(updated) });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : '';
    if (code === 'P2025') return fail('Membre catalogue introuvable.', 404);
    return fail('Impossible de mettre à jour le membre.', 500, error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { userId } = await context.params;
  if (!userId?.trim()) return fail('Identifiant manquant.', 400);

  try {
    await prisma.landingTeamOffer.delete({ where: { userId: userId.trim() } });
    void invalidateCatalogTeamListCache().catch((e) => {
      console.error('[landing-team] cache invalidation', e);
    });
    return ok({ deleted: true });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : '';
    if (code === 'P2025') return fail('Membre catalogue introuvable.', 404);
    return fail('Impossible de retirer le membre.', 500, error);
  }
}
