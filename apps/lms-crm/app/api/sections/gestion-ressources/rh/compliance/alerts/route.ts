import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { buildRhComplianceAlertsFromRows } from '@/lib/gestion-ressources/rh-conformite-compliance';
import { requireGestionRessourcesView } from '../../../_lib/require-gestion-ressources-auth';

export async function GET() {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const now = new Date();
  const horizon = new Date(now);
  horizon.setDate(horizon.getDate() + 30);

  try {
    const [users, certificates] = await Promise.all([
      prisma.user.findMany({
        where: {
          isTrashed: false,
          OR: [{ carteProExpiry: { lte: horizon } }, { residencePermitExpiry: { lte: horizon } }],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          carteProExpiry: true,
          residencePermitExpiry: true,
        },
        take: 50,
      }),
      prisma.userCertificate.findMany({
        where: { expiryDate: { lte: horizon } },
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
        take: 50,
      }),
    ]);

    return ok(buildRhComplianceAlertsFromRows({ users, certificates, now }));
  } catch (error) {
    return fail('Impossible de charger les alertes conformité.', 500, error);
  }
}
