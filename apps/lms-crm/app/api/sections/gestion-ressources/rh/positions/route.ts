import { prisma } from '@/lib/prisma';
import { dedupeRhPositionOptions } from '@/lib/rh-metier-referential';
import {
  requireGestionRessourcesView,
} from '../../_lib/require-gestion-ressources-auth';
import { ok } from '@/app/api/_shared/http/response';
import type { SchoolInternalService } from '@repo/database';

const VALID_SERVICES = new Set(['DIRECTION', 'PEDAGOGICAL', 'HR_ADMIN', 'TRAINER_POOL']);

export async function GET(req: Request) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const serviceParam = searchParams.get('schoolInternalService');
  const service =
    serviceParam && VALID_SERVICES.has(serviceParam)
      ? (serviceParam as SchoolInternalService)
      : undefined;

  const rows = await prisma.rhPosition.findMany({
    where: service ? { schoolInternalService: service } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    select: {
      id: true,
      label: true,
      code: true,
      schoolInternalService: true,
      sortOrder: true,
    },
  });

  return ok(dedupeRhPositionOptions(rows));
}
