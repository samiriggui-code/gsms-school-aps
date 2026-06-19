import type { InAppNotificationItem } from '@/lib/topbar-api';
import { getAvatarUrl } from '@/lib/helpers';

/** Défauts alignés sur `packages/api-core/src/notification-avatar-enrich.ts`. */
export const NOTIFICATION_CATEGORY_AVATARS: Record<string, string> = {
  SYSTEM: '/media/app/mini-logo-circle-primary.svg',
  TICKET: '/media/brand-logos/zoom.svg',
  FINANCE: '/media/brand-logos/stripe.svg',
  ACADEMIC: '/media/brand-logos/google-webdev.svg',
  TEAM: '/media/avatars/300-14.png',
};

/** URL d'image à afficher pour une notification (salle, équipement, user ou défaut). */
export function resolveNotificationImageUrl(item: InAppNotificationItem): string {
  const raw =
    item.entityImageUrl?.trim() ||
    item.actorAvatar?.trim() ||
    NOTIFICATION_CATEGORY_AVATARS[item.category] ||
    NOTIFICATION_CATEGORY_AVATARS.SYSTEM;
  return getAvatarUrl(raw);
}

export function notificationShowsUserPresence(item: InAppNotificationItem): boolean {
  return (
    item.avatarKind === 'user' ||
    (!!item.actorId &&
      item.avatarKind !== 'venue_room' &&
      item.avatarKind !== 'equipment' &&
      item.avatarKind !== 'category_default')
  );
}
