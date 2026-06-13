import { getCache, setCache } from '@repo/redis';
import type { UserPresenceStatus } from '@/components/common/user-presence-ui';

export type { UserPresenceStatus };

const PRESENCE_TTL_SECONDS = 60 * 60 * 24; // 24 h
const KEY_PREFIX = 'lms:user-presence:';

/** Fallback process-local si Redis indisponible (dev sans redis-server). */
const processPresence = new Map<string, UserPresenceStatus>();

function isValidPresence(value: unknown): value is UserPresenceStatus {
  return value === 'online' || value === 'busy' || value === 'away' || value === 'offline';
}

export function presenceCacheKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export async function getUserPresence(userId: string): Promise<UserPresenceStatus> {
  const local = processPresence.get(userId);
  if (local) return local;

  const raw = await getCache<UserPresenceStatus>(presenceCacheKey(userId));
  if (isValidPresence(raw)) {
    processPresence.set(userId, raw);
    return raw;
  }
  return 'online';
}

export async function setUserPresence(userId: string, status: UserPresenceStatus): Promise<void> {
  processPresence.set(userId, status);
  await setCache(presenceCacheKey(userId), status, PRESENCE_TTL_SECONDS);
}
