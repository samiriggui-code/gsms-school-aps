import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { FormationLifecycleStatus } from '@repo/database';
import { createWorkflowEngine } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { invalidateFormationCatalogCaches } from '@/lib/catalog-public-cache';
import { serializeCmsCatalogRow } from '@/lib/cms-catalog-serialize';

const formationSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  track: true,
  tag: true,
  duration: true,
  modules: true,
  outcomes: true,
  featured: true,
  parcoursSpecialite: true,
  catalogProgramConfig: true,
  priceFrom: true,
  traineesMin: true,
  traineesMax: true,
  currency: true,
  fundingBlocks: true,
  prerequisitesTable: true,
  logoUrl: true,
  providerName: true,
  providerEmail: true,
  providerPhone: true,
  providerAddress: true,
  nextSessionLabel: true,
  cpfEligible: true,
  qualiopiCertified: true,
  presentationTitle: true,
  longDescription: true,
  presentationBullets: true,
  programModules: true,
  certificationSteps: true,
  complementaryDetails: true,
  fundingChannels: true,
  unitsCount: true,
  volumeHoursLabel: true,
  theoryPercent: true,
  practicePercent: true,
  minAgeLabel: true,
  frenchLevel: true,
  authorizationSummary: true,
  criminalRecordRequirement: true,
  rncpUrl: true,
  status: true,
  updatedAt: true,
} as const;

const PatchSchema = z.object({
  active: z.boolean(),
});

/** Active ou désactive une formation dans le catalogue CRM et sur le landing. */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ formationId: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.communicationEdit)) {
    return fail('Accès refusé.', 403);
  }

  const { formationId } = await context.params;
  if (!formationId?.trim()) return fail('Identifiant formation manquant.', 400);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = PatchSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation statut catalogue.', 422, parsed.error.flatten());
  }

  const { active } = parsed.data;
  const catalogStatus = active
    ? FormationLifecycleStatus.ACTIVE
    : FormationLifecycleStatus.ARCHIVED;

  try {
    const existing = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: formationId.trim() },
      include: {
        formation: {
          select: {
            ...formationSelect,
            _count: { select: { sessions: true } },
          },
        },
      },
    });
    if (!existing) return fail('Offre catalogue introuvable.', 404);

    await prisma.$transaction(async (tx) => {
      await tx.formationCatalogOffer.update({
        where: { formationId: formationId.trim() },
        data: { catalogStatus },
      });
      if (active && existing.formation.status !== FormationLifecycleStatus.ACTIVE) {
        await tx.formation.update({
          where: { id: formationId.trim() },
          data: { status: FormationLifecycleStatus.ACTIVE },
        });
      }
    });

    const refreshed = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: formationId.trim() },
      include: {
        formation: {
          select: {
            ...formationSelect,
            _count: { select: { sessions: true } },
          },
        },
      },
    });
    if (!refreshed) return fail('Offre catalogue introuvable.', 404);

    void invalidateFormationCatalogCaches(refreshed.formation.slug).catch((e) => {
      console.error('[cms/contenus] cache invalidation', e);
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.cms.formation.visibility_changed',
        {
          formationId: refreshed.formationId,
          formationName: refreshed.formation.name,
          formationSlug: refreshed.formation.slug,
          active,
        },
        { dedupeKey: `cms-formation:${refreshed.formationId}:${active ? 'on' : 'off'}` },
      );
    } catch (e) {
      console.error('[cms/contenus] workflow', e);
    }

    const item = {
      ...serializeCmsCatalogRow(
        refreshed,
        refreshed.formation.status,
        refreshed.formation._count.sessions,
      ),
      updatedAt: refreshed.formation.updatedAt.toISOString(),
    };

    return ok({ item, active: item.landingVisible });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : '';
    if (code === 'P2025') return fail('Offre catalogue introuvable.', 404);
    return fail('Impossible de mettre à jour le statut.', 500, error);
  }
}
