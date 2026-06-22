import type { PrismaClient } from '@repo/database';

/** Début de journée locale (filtres sessions à venir / expirées). */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Session considérée expirée si date de fin (ou début) strictement avant aujourd'hui. */
export function isSessionExpired(endDate: Date | null, startDate: Date | null): boolean {
  const ref = endDate ?? startDate;
  if (!ref) return false;
  return ref < startOfToday();
}

/** Prochaine session catalogue par formation (libellé affiché). */
export async function nextSessionLabelByFormationIds(
  prisma: PrismaClient,
  formationIds: string[],
): Promise<Map<string, string>> {
  if (!formationIds.length) return new Map();

  const today = startOfToday();
  const sessions = await prisma.formationSession.findMany({
    where: {
      formationId: { in: formationIds },
      OR: [
        { endDate: { gte: today } },
        { startDate: { gte: today } },
        { AND: [{ endDate: null }, { startDate: null }] },
      ],
    },
    select: {
      formationId: true,
      dateDisplayLabel: true,
      startDate: true,
      sortOrder: true,
    },
    orderBy: [{ startDate: 'asc' }, { sortOrder: 'asc' }],
  });

  const map = new Map<string, string>();
  for (const s of sessions) {
    if (!map.has(s.formationId)) {
      map.set(s.formationId, s.dateDisplayLabel);
    }
  }
  return map;
}

export async function nextSessionLabelForFormation(
  prisma: PrismaClient,
  formationId: string,
): Promise<string | null> {
  const map = await nextSessionLabelByFormationIds(prisma, [formationId]);
  return map.get(formationId) ?? null;
}
