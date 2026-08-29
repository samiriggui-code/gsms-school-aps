import { randomUUID } from 'crypto';
import type { PrismaClient, SessionConventionStatus } from '@repo/database';
import { isEmailConfigured, sendConventionReminderEmail } from '@repo/mail';

const REMINDABLE: SessionConventionStatus[] = ['SENT', 'VIEWED'];

/** Upsert convention participant après génération / envoi PDF. */
export async function upsertSessionConvention(
  prisma: PrismaClient,
  input: {
    sessionId: string;
    participantId: string;
    status: SessionConventionStatus;
    fileAssetId?: string | null;
  },
) {
  const now = new Date();
  const existing = await prisma.formationSessionConvention.findUnique({
    where: {
      sessionId_participantId: {
        sessionId: input.sessionId,
        participantId: input.participantId,
      },
    },
  });

  if (!existing) {
    return prisma.formationSessionConvention.create({
      data: {
        sessionId: input.sessionId,
        participantId: input.participantId,
        status: input.status,
        fileAssetId: input.fileAssetId ?? null,
        publicToken: randomUUID(),
        sentAt: input.status === 'SENT' || input.status === 'VIEWED' ? now : null,
        viewedAt: input.status === 'VIEWED' ? now : null,
        signedAt: input.status === 'SIGNED' ? now : null,
      },
    });
  }

  const data: {
    status?: SessionConventionStatus;
    fileAssetId?: string | null;
    sentAt?: Date | null;
    viewedAt?: Date | null;
    signedAt?: Date | null;
    publicToken?: string;
  } = {};

  if (input.fileAssetId) data.fileAssetId = input.fileAssetId;
  if (!existing.publicToken) data.publicToken = randomUUID();

  const rank: Record<SessionConventionStatus, number> = {
    GENERATED: 0,
    SENT: 1,
    VIEWED: 2,
    SIGNED: 3,
    ARCHIVED: 4,
  };
  if (rank[input.status] >= rank[existing.status]) {
    data.status = input.status;
    if (input.status === 'SENT' && !existing.sentAt) data.sentAt = now;
    if (input.status === 'VIEWED' && !existing.viewedAt) data.viewedAt = now;
    if (input.status === 'SIGNED' && !existing.signedAt) data.signedAt = now;
  }

  return prisma.formationSessionConvention.update({
    where: { id: existing.id },
    data,
  });
}

/**
 * WF-08 — relances J+2 / J+5 pour conventions SENT/VIEWED non signées.
 * J+2 : reminderCount 0 → 1 ; J+5 : reminderCount 1 → 2.
 */
export async function processConventionReminders(prisma: PrismaClient): Promise<{
  remindedJ2: number;
  remindedJ5: number;
  skipped: number;
}> {
  const now = Date.now();
  const day2 = now - 2 * 24 * 60 * 60 * 1000;
  const day5 = now - 5 * 24 * 60 * 60 * 1000;

  const rows = await prisma.formationSessionConvention.findMany({
    where: {
      status: { in: REMINDABLE },
      sentAt: { not: null },
      reminderCount: { lt: 2 },
    },
    take: 80,
    orderBy: { sentAt: 'asc' },
    include: {
      participant: {
        include: { user: { select: { email: true, name: true, firstName: true, lastName: true } } },
      },
      session: {
        select: {
          dateDisplayLabel: true,
          formation: { select: { name: true } },
        },
      },
    },
  });

  let remindedJ2 = 0;
  let remindedJ5 = 0;
  let skipped = 0;
  const mailOk = isEmailConfigured();

  for (const row of rows) {
    const sentMs = row.sentAt?.getTime() ?? 0;
    const email = row.participant.user.email?.trim();
    if (!email || !mailOk) {
      skipped += 1;
      continue;
    }

    const name =
      row.participant.user.name?.trim() ||
      [row.participant.user.firstName, row.participant.user.lastName].filter(Boolean).join(' ').trim() ||
      email;

    let reminderDay: 2 | 5 | null = null;
    if (row.reminderCount === 0 && sentMs <= day2) reminderDay = 2;
    else if (row.reminderCount === 1 && sentMs <= day5) reminderDay = 5;
    if (!reminderDay) continue;

    await sendConventionReminderEmail({
      to: email,
      participantName: name,
      formationName: row.session.formation.name,
      sessionLabel: row.session.dateDisplayLabel,
      reminderDay,
    });

    await prisma.formationSessionConvention.update({
      where: { id: row.id },
      data: {
        reminderCount: row.reminderCount + 1,
        lastReminderAt: new Date(),
      },
    });

    if (reminderDay === 2) remindedJ2 += 1;
    else remindedJ5 += 1;
  }

  return { remindedJ2, remindedJ5, skipped };
}
