import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import { ok, fail } from '@/app/api/_shared/http/response';
import { serializeCatalogOfferMerged } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_serialize';
import { FormationCatalogOfferPatchSchema } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/forms/formation-catalog-api-schemas';
import { invalidateFormationCatalogCaches } from '@/lib/catalog-public-cache';
import { nextSessionLabelForFormation } from '@/lib/formation-session-dates';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { slug } = await context.params;
  if (!slug?.trim()) return fail('Slug manquant.', 400);

  try {
    const formation = await prisma.formation.findUnique({
      where: { slug: slug.trim() },
    });
    if (!formation) return fail('Formation introuvable.', 404);

    const offer = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: formation.id },
    });
    if (!offer) return fail('Formation non incluse dans le catalogue.', 404);

    const merged = serializeCatalogOfferMerged(offer, formation);
    const computedNext = await nextSessionLabelForFormation(prisma, formation.id);

    return ok({
      item: {
        ...merged,
        nextSessionLabel: computedNext ?? null,
      },
      templates: {
        fundingBlocks: formation.fundingBlocks ?? [],
        prerequisitesTable: formation.prerequisitesTable ?? [],
        parcoursSpecialite: formation.parcoursSpecialite,
      },
    });
  } catch (error) {
    return fail('Impossible de charger la formation.', 500, error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Forbidden', 403);
  }

  const { slug } = await context.params;
  if (!slug?.trim()) return fail('Slug manquant.', 400);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = FormationCatalogOfferPatchSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation mise à jour offre catalogue.', 422, parsed.error.flatten());
  }

  const d = parsed.data;
  const updateData: Prisma.FormationCatalogOfferUpdateInput = {};

  if (d.catalogStatus !== undefined) updateData.catalogStatus = d.catalogStatus;
  if (d.priceFrom !== undefined) {
    updateData.priceFromOverride = d.priceFrom === null ? null : d.priceFrom;
  }
  if (d.currency !== undefined) {
    updateData.currencyOverride = d.currency === null || d.currency === '' ? null : d.currency;
  }
  if (d.fundingBlocks !== undefined) {
    updateData.fundingBlocksOverride =
      d.fundingBlocks === null
        ? Prisma.JsonNull
        : (d.fundingBlocks as Prisma.InputJsonValue);
  }
  if (d.fundingChannels !== undefined) {
    updateData.fundingChannelsOverride =
      d.fundingChannels === null
        ? Prisma.JsonNull
        : (d.fundingChannels as Prisma.InputJsonValue);
  }
  if (d.prerequisitesTable !== undefined) {
    updateData.prerequisitesTableOverride =
      d.prerequisitesTable === null
        ? Prisma.JsonNull
        : (d.prerequisitesTable as Prisma.InputJsonValue);
  }

  try {
    const formationRef = await prisma.formation.findUnique({
      where: { slug: slug.trim() },
      select: { id: true, parcoursSpecialite: true },
    });
    if (!formationRef) return fail('Formation introuvable.', 404);

    if (d.parcoursSpecialite !== undefined) {
      updateData.parcoursSpecialiteOverride =
        d.parcoursSpecialite === null || d.parcoursSpecialite === formationRef.parcoursSpecialite
          ? null
          : d.parcoursSpecialite;
    }

    if (Object.keys(updateData).length === 0) {
      return fail('Aucun champ à mettre à jour.', 400);
    }

    await prisma.formationCatalogOffer.update({
      where: { formationId: formationRef.id },
      data: updateData,
    });

    const fullFormation = await prisma.formation.findUnique({
      where: { slug: slug.trim() },
    });
    const offer = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: formationRef.id },
    });

    if (!fullFormation || !offer) return fail('Offre catalogue introuvable.', 404);

    void invalidateFormationCatalogCaches(slug.trim()).catch((e) => {
      console.error('[formations/catalog] invalidation cache', e);
    });

    return ok({
      item: serializeCatalogOfferMerged(offer, fullFormation),
    });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : '';
    if (code === 'P2025') return fail('Offre catalogue introuvable.', 404);
    return fail('Impossible de mettre à jour l’offre catalogue.', 500, error);
  }
}
