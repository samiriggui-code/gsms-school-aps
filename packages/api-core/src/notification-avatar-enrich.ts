import type { InAppNotificationCategory, Prisma, PrismaClient } from '@repo/database';

/** Client Prisma ou transaction ($transaction) — mêmes délégués modèles. */
type NotificationEnrichDb = PrismaClient | Prisma.TransactionClient;

/** Avatars par défaut (chemins `/media/...` servis par Next). */
export const NOTIFICATION_CATEGORY_AVATARS: Record<InAppNotificationCategory, string> = {
  SYSTEM: '/media/app/mini-logo-circle-primary.svg',
  TICKET: '/media/brand-logos/zoom.svg',
  FINANCE: '/media/brand-logos/stripe.svg',
  ACADEMIC: '/media/brand-logos/google-webdev.svg',
  TEAM: '/media/avatars/300-14.png',
};

export type NotificationAvatarKind =
  | 'user'
  | 'venue_room'
  | 'equipment'
  | 'category_default'
  | 'custom';

export type NotificationAvatarFields = {
  actorAvatar?: string | null;
  entityImageUrl?: string | null;
  avatarKind?: NotificationAvatarKind | null;
};

function readMeta(metadata: unknown): Record<string, unknown> {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata as Record<string, unknown>;
  }
  return {};
}

/** Enrichit metadata avant création (salles, acteur, défaut catégorie). */
export async function enrichNotificationMetadata(
  prisma: NotificationEnrichDb,
  category: InAppNotificationCategory,
  metadata: Record<string, unknown>,
): Promise<Prisma.InputJsonObject> {
  const meta = { ...metadata };

  if (meta.entityImageUrl || meta.actorAvatar) {
    return meta as Prisma.InputJsonObject;
  }

  const roomId = typeof meta.roomId === 'string' ? meta.roomId : null;
  if (roomId) {
    const room = await prisma.formationVenueRoom.findUnique({
      where: { id: roomId },
      select: { imageUrl: true },
    });
    if (room?.imageUrl?.trim()) {
      meta.entityImageUrl = room.imageUrl.trim();
      meta.avatarKind = 'venue_room';
      return meta as Prisma.InputJsonObject;
    }
  }

  const equipmentId = typeof meta.equipmentId === 'string' ? meta.equipmentId : null;
  if (equipmentId) {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { avatar: true, metadata: true },
    });
    const fromMeta =
      equipment?.metadata &&
      typeof equipment.metadata === 'object' &&
      !Array.isArray(equipment.metadata)
        ? (equipment.metadata as { avatar?: string }).avatar
        : null;
    const avatar = equipment?.avatar?.trim() || fromMeta?.trim() || null;
    if (avatar) {
      meta.entityImageUrl = avatar;
      meta.avatarKind = 'equipment';
      return meta as Prisma.InputJsonObject;
    }
  }

  const actorUserId =
    typeof meta.actorUserId === 'string'
      ? meta.actorUserId
      : typeof meta.actorId === 'string'
        ? meta.actorId
        : null;
  if (actorUserId && !meta.actorAvatar) {
    const user = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { avatar: true, name: true, firstName: true, lastName: true },
    });
    if (user?.avatar?.trim()) {
      meta.actorAvatar = user.avatar.trim();
      meta.avatarKind = 'user';
      if (!meta.actorName) {
        meta.actorName =
          user.name?.trim() ||
          [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
          null;
      }
      return meta as Prisma.InputJsonObject;
    }
  }

  meta.entityImageUrl = NOTIFICATION_CATEGORY_AVATARS[category];
  meta.avatarKind = 'category_default';
  return meta as Prisma.InputJsonObject;
}

/** Hydrate une liste déjà persistée (notifications sans avatar en metadata). */
export async function hydrateNotificationAvatarFields(
  prisma: NotificationEnrichDb,
  rows: Array<{
    category: string;
    metadata?: unknown;
  }>,
): Promise<Map<number, NotificationAvatarFields>> {
  const result = new Map<number, NotificationAvatarFields>();
  const roomIds = new Set<string>();
  const equipmentIds = new Set<string>();
  const actorIds = new Set<string>();
  const needsHydrate: number[] = [];

  rows.forEach((row, index) => {
    const meta = readMeta(row.metadata);
    if (meta.entityImageUrl || meta.actorAvatar) {
      result.set(index, {
        actorAvatar: typeof meta.actorAvatar === 'string' ? meta.actorAvatar : null,
        entityImageUrl:
          typeof meta.entityImageUrl === 'string' ? meta.entityImageUrl : null,
        avatarKind:
          typeof meta.avatarKind === 'string'
            ? (meta.avatarKind as NotificationAvatarKind)
            : null,
      });
      return;
    }
    needsHydrate.push(index);
    if (typeof meta.roomId === 'string') roomIds.add(meta.roomId);
    if (typeof meta.equipmentId === 'string') equipmentIds.add(meta.equipmentId);
    const actor =
      typeof meta.actorUserId === 'string'
        ? meta.actorUserId
        : typeof meta.actorId === 'string'
          ? meta.actorId
          : null;
    if (actor) actorIds.add(actor);
  });

  const [rooms, equipments, users] = await Promise.all([
    roomIds.size
      ? prisma.formationVenueRoom.findMany({
          where: { id: { in: [...roomIds] } },
          select: { id: true, imageUrl: true },
        })
      : [],
    equipmentIds.size
      ? prisma.equipment.findMany({
          where: { id: { in: [...equipmentIds] } },
          select: { id: true, avatar: true, metadata: true },
        })
      : [],
    actorIds.size
      ? prisma.user.findMany({
          where: { id: { in: [...actorIds] } },
          select: { id: true, avatar: true },
        })
      : [],
  ]);

  const roomMap = new Map(rooms.map((r) => [r.id, r.imageUrl]));
  const equipMap = new Map(
    equipments.map((e) => {
      const meta =
        e.metadata && typeof e.metadata === 'object' && !Array.isArray(e.metadata)
          ? (e.metadata as { avatar?: string })
          : {};
      return [e.id, e.avatar?.trim() || meta.avatar?.trim() || null] as const;
    }),
  );
  const userMap = new Map(users.map((u) => [u.id, u.avatar]));

  for (const index of needsHydrate) {
    const row = rows[index];
    const meta = readMeta(row.metadata);
    const category = row.category as InAppNotificationCategory;

    const roomId = typeof meta.roomId === 'string' ? meta.roomId : null;
    if (roomId) {
      const imageUrl = roomMap.get(roomId);
      if (imageUrl?.trim()) {
        result.set(index, {
          entityImageUrl: imageUrl.trim(),
          avatarKind: 'venue_room',
        });
        continue;
      }
    }

    const equipmentId = typeof meta.equipmentId === 'string' ? meta.equipmentId : null;
    if (equipmentId) {
      const imageUrl = equipMap.get(equipmentId);
      if (imageUrl) {
        result.set(index, {
          entityImageUrl: imageUrl,
          avatarKind: 'equipment',
        });
        continue;
      }
    }

    const actorId =
      typeof meta.actorUserId === 'string'
        ? meta.actorUserId
        : typeof meta.actorId === 'string'
          ? meta.actorId
          : null;
    if (actorId) {
      const avatar = userMap.get(actorId);
      if (avatar?.trim()) {
        result.set(index, {
          actorAvatar: avatar.trim(),
          avatarKind: 'user',
        });
        continue;
      }
    }

    result.set(index, {
      entityImageUrl: NOTIFICATION_CATEGORY_AVATARS[category] ?? NOTIFICATION_CATEGORY_AVATARS.SYSTEM,
      avatarKind: 'category_default',
    });
  }

  return result;
}
