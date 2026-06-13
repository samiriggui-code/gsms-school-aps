import { CandidatureStatus, UserStatus } from '@repo/database';
import { applyCandidatureStatusChange } from '@repo/api-core';
import { prisma } from '@/lib/prisma';

export type AccountLifecycleAction = 'suspend' | 'archive' | 'restore';

const ACTION_DATA: Record<
  AccountLifecycleAction,
  { status: UserStatus; isTrashed: boolean }
> = {
  suspend: { status: UserStatus.BLOCKED, isTrashed: false },
  archive: { status: UserStatus.INACTIVE, isTrashed: true },
  restore: { status: UserStatus.ACTIVE, isTrashed: false },
};

export async function applyAccountLifecycle(
  userId: string,
  action: AccountLifecycleAction,
  actorUserId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, isProtected: true, email: true, name: true },
  });
  if (!user) throw new Error('Utilisateur introuvable.');
  if (user.isProtected && action !== 'restore') {
    throw new Error('Ce compte est protégé et ne peut pas être modifié.');
  }

  const patch = ACTION_DATA[action];
  const updated = await prisma.user.update({
    where: { id: userId },
    data: patch,
    include: { role: true },
  });

  await prisma.systemLog.create({
    data: {
      userId: actorUserId,
      entityId: userId,
      entityType: 'user.lifecycle',
      event: action,
      description: `Compte ${action} — ${user.email}`,
    },
  });

  return updated;
}

/** Désactive l'accès stagiaire : dossier archivé + compte suspendu. */
export async function disableLearnerAccess(
  candidatureId: string,
  actorUserId: string,
) {
  const candidature = await prisma.candidature.findUnique({
    where: { id: candidatureId },
    select: { id: true, status: true, userId: true },
  });
  if (!candidature) throw new Error('Candidature introuvable.');

  await prisma.$transaction(async (tx) => {
    if (candidature.status !== CandidatureStatus.ARCHIVED) {
      await applyCandidatureStatusChange(tx, candidature.id, CandidatureStatus.ARCHIVED, {
        userId: candidature.userId,
        status: candidature.status,
      });
    }
    await tx.user.update({
      where: { id: candidature.userId },
      data: { status: UserStatus.BLOCKED, isTrashed: false },
    });
    await tx.systemLog.create({
      data: {
        userId: actorUserId,
        entityId: candidature.userId,
        entityType: 'learner.access',
        event: 'disable_access',
        description: `Accès stagiaire désactivé (candidature ${candidatureId})`,
      },
    });
  });
}
