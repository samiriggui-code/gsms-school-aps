import type { PrismaClient } from '@repo/database';
import { permissionForModuleKey } from './notification-audience';

export type CrmResourceEmailInput = {
  eventType: string;
  moduleKey: string;
  title: string;
  body: string;
  href?: string | null;
  detailLines?: string[];
  actorUserId?: string | null;
  eyebrow?: string;
};

async function resolveStaffEmails(
  prisma: PrismaClient,
  moduleKey: string,
  excludeUserId?: string | null,
): Promise<string[]> {
  const permission = permissionForModuleKey(moduleKey);
  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      isTrashed: false,
      ...(permission
        ? {
            role: {
              permissions: {
                some: { permission: { slug: permission } },
              },
            },
          }
        : {}),
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: { email: true },
    take: 80,
  });

  const emails = users.map((u) => u.email).filter(Boolean) as string[];
  if (emails.length > 0) return emails;

  const superadmins = await prisma.user.findMany({
    where: { status: 'ACTIVE', isTrashed: false, role: { slug: 'superadmin' } },
    select: { email: true },
    take: 10,
  });
  return superadmins.map((u) => u.email).filter(Boolean) as string[];
}

/** Envoie l’e-mail ops associé à un événement CRM ressources (après notification in-app). */
export async function sendCrmResourceEventEmails(
  prisma: PrismaClient,
  input: CrmResourceEmailInput,
): Promise<void> {
  const recipientEmails = await resolveStaffEmails(
    prisma,
    input.moduleKey,
    input.actorUserId,
  );
  const { sendResourceOpsEmails } = await import('@repo/mail');
  await sendResourceOpsEmails({
    eventType: input.eventType,
    title: input.title,
    body: input.body,
    href: input.href,
    detailLines: input.detailLines,
    recipientEmails,
    eyebrow: input.eyebrow,
  });
}
