import { NextRequest } from 'next/server';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesForMethod,
  requireGestionRessourcesView,
} from '../_lib/require-gestion-ressources-auth';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

type CountRow = { count: bigint | number };

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === 'bigint') return Number(value);
  return Number(value || 0);
}

export async function GET(_request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  try {
    const [totalRows, availableRows, maintenanceRows, alertRows] = await Promise.all([
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as "count" FROM "Equipment"`,
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as "count" FROM "Equipment" WHERE "status" = 'AVAILABLE'`,
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as "count" FROM "Equipment" WHERE "status" = 'MAINTENANCE'`,
      prisma.$queryRaw<CountRow[]>`SELECT COUNT(*) as "count" FROM "Equipment" WHERE "status" = 'OUT_OF_SERVICE'`,
    ]);

    const totalCount = toNumber(totalRows[0]?.count);
    const inServiceCount = toNumber(availableRows[0]?.count);
    const inMaintenanceCount = toNumber(maintenanceRows[0]?.count);
    const alertsCount = toNumber(alertRows[0]?.count);

    return ok({
      totalCount,
      inServiceCount,
      inMaintenanceCount,
      alertsCount,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return fail('Impossible de recuperer les stats gestion ressources.', 500, error);
  }
}
