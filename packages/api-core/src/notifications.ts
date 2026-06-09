import type { InAppNotificationCategory, PrismaClient } from '@repo/database';

/**
 * Catégories in-app (Prisma `InAppNotificationCategory`) :
 * - SYSTEM — maintenance, bienvenue, paramètres
 * - TICKET — création / assignation support
 * - FINANCE — devis, facturation
 * - ACADEMIC — candidatures, sessions, dossiers
 * - TEAM — équipes RH
 */
export const IN_APP_NOTIFICATION_CATEGORIES = [
  'SYSTEM',
  'TICKET',
  'FINANCE',
  'ACADEMIC',
  'TEAM',
] as const satisfies readonly InAppNotificationCategory[];

export type EmitNotificationInput = {
  userId: string;
  category: InAppNotificationCategory;
  title: string;
  body: string;
  href?: string | null;
  metadata?: Record<string, unknown>;
  /** Si fourni, évite les doublons (upsert logique via findFirst + skip) */
  dedupeKey?: string;
};

export class NotificationService {
  constructor(private readonly prisma: PrismaClient) {}

  async emit(input: EmitNotificationInput) {
    if (input.dedupeKey) {
      const existing = await this.prisma.inAppNotification.findFirst({
        where: {
          userId: input.userId,
          metadata: { path: ['dedupeKey'], equals: input.dedupeKey },
        },
        select: { id: true },
      });
      if (existing) return existing;
    }

    return this.prisma.inAppNotification.create({
      data: {
        userId: input.userId,
        category: input.category,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        metadata: {
          ...(input.metadata ?? {}),
          ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
        },
      },
    });
  }

  /** Notifie plusieurs utilisateurs (ex. admins) */
  async emitMany(userIds: string[], input: Omit<EmitNotificationInput, 'userId'>) {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    return Promise.all(
      unique.map((userId) => this.emit({ ...input, userId })),
    );
  }
}
