import { CandidatureStatus, type PrismaClient } from '@repo/database';
import { prisma } from '@/lib/prisma';

export type EligibleSessionLearnerRow = {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
  candidatureId: string;
};

/** Apprenants inscriptibles : dossier CRM validé par l'administration pour cette formation. */
export async function listEligibleSessionLearners(
  db: PrismaClient,
  formationId: string,
  extraUserIds: string[] = [],
): Promise<EligibleSessionLearnerRow[]> {
  const candidatures = await db.candidature.findMany({
    where: {
      formationId,
      status: CandidatureStatus.VALIDATED,
      user: {
        status: 'ACTIVE',
        isTrashed: false,
        role: { slug: { in: ['eleve', 'candidat'] }, isTrashed: false },
      },
    },
    select: {
      id: true,
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: [{ user: { name: 'asc' } }, { user: { email: 'asc' } }],
  });

  const byUserId = new Map<string, EligibleSessionLearnerRow>();
  for (const row of candidatures) {
    if (!byUserId.has(row.user.id)) {
      byUserId.set(row.user.id, {
        id: row.user.id,
        name: row.user.name,
        email: row.user.email,
        avatar: row.user.avatar,
        candidatureId: row.id,
      });
    }
  }

  const missingIds = extraUserIds.filter((id) => id && !byUserId.has(id));
  if (missingIds.length > 0) {
    const extras = await db.user.findMany({
      where: { id: { in: missingIds }, isTrashed: false, status: 'ACTIVE' },
      select: { id: true, name: true, email: true, avatar: true },
    });
    for (const u of extras) {
      if (!byUserId.has(u.id)) {
        byUserId.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar,
          candidatureId: '',
        });
      }
    }
  }

  return Array.from(byUserId.values()).sort((a, b) => {
    const na = (a.name?.trim() || a.email).toLocaleLowerCase();
    const nb = (b.name?.trim() || b.email).toLocaleLowerCase();
    return na.localeCompare(nb, 'fr');
  });
}

export async function assertSessionParticipantUserIds(
  formationId: string,
  userIds: string[],
  options?: { sessionId?: string },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (userIds.length === 0) return { ok: true };

  const eligible = await listEligibleSessionLearners(prisma, formationId);
  const eligibleIds = new Set(eligible.map((r) => r.id));

  let retainedIds = new Set<string>();
  if (options?.sessionId?.trim()) {
    const existing = await prisma.formationSessionParticipant.findMany({
      where: { sessionId: options.sessionId.trim() },
      select: { userId: true },
    });
    retainedIds = new Set(existing.map((r) => r.userId));
  }

  const invalid = userIds.filter((id) => !eligibleIds.has(id) && !retainedIds.has(id));
  if (invalid.length > 0) {
    return {
      ok: false,
      message:
        'Un ou plusieurs apprenants ne peuvent pas être inscrits : dossier non validé par l\'administration ou formation différente.',
    };
  }

  return { ok: true };
}
