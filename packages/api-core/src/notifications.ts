import type { InAppNotificationCategory, PrismaClient } from '@repo/database';
import { triggerUserNotification } from '@repo/realtime';
import { enrichNotificationMetadata } from './notification-avatar-enrich';
import { resolveNotificationChannel } from './notification-channel';

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
  /** Canal UX explicite ; sinon déduit automatiquement. */
  channel?: import('@repo/database').InAppNotificationChannel;
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

    const enrichedMetadata = await enrichNotificationMetadata(
      this.prisma,
      input.category,
      {
        ...(input.metadata ?? {}),
        ...(input.dedupeKey ? { dedupeKey: input.dedupeKey } : {}),
      },
    );

    const channel =
      input.channel ??
      resolveNotificationChannel({
        category: input.category,
        href: input.href,
        metadata: enrichedMetadata as Record<string, unknown>,
      });

    const row = await this.prisma.inAppNotification.create({
      data: {
        userId: input.userId,
        category: input.category,
        channel,
        title: input.title,
        body: input.body,
        href: input.href ?? null,
        metadata: enrichedMetadata,
      },
    });

    void triggerUserNotification(input.userId, {
      id: row.id,
      category: row.category,
      title: row.title,
      body: row.body,
      href: row.href,
      createdAt: row.createdAt.toISOString(),
    });

    return row;
  }

  /** Notifie plusieurs utilisateurs (ex. admins) */
  async emitMany(userIds: string[], input: Omit<EmitNotificationInput, 'userId'>) {
    const unique = Array.from(new Set(userIds.filter(Boolean)));
    const rows = [];
    for (const userId of unique) {
      rows.push(await this.emit({ ...input, userId }));
    }
    return rows;
  }
}
