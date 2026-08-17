import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { invalidateAllActiveFormationCaches } from '@/lib/catalog-public-cache';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { FormationLifecycleStatus } from '@repo/database';
import { createWorkflowEngine } from '@repo/api-core';

/** Republie le catalogue formations sur le landing (purge cache Redis public). */
export async function POST(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.communicationEdit)) {
    return fail('Accès refusé.', 403);
  }

  try {
    const published = await prisma.formationCatalogOffer.count({
      where: {
        catalogStatus: FormationLifecycleStatus.ACTIVE,
        formation: { status: FormationLifecycleStatus.ACTIVE },
      },
    });

    await invalidateAllActiveFormationCaches(prisma);

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.cms.catalog.synced',
        { publishedCount: published },
        { dedupeKey: `cms-catalog-sync:${new Date().toISOString().slice(0, 16)}` },
      );
    } catch (e) {
      console.error('[cms/sync-from-crm] workflow', e);
    }

    return ok({ published });
  } catch (error) {
    return fail('Synchronisation catalogue impossible.', 500, error);
  }
}
