import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const globalForRedis = global as unknown as { redis: Redis | undefined };

/** Dev local : pas de connexion à redis-server (cache stats en mémoire dans le process Node). */
export function isRedisCacheDisabled(): boolean {
  const v = process.env.REDIS_CACHE_DISABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

type MemoryEntry = { value: string; expiresAt: number };

const memoryStore = new Map<string, MemoryEntry>();

function memoryGetRaw(key: string): string | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.value;
}

function memorySetRaw(key: string, value: string, ttlSeconds: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

function memoryDelRaw(key: string): void {
  memoryStore.delete(key);
}

function createMemoryRedisClient(): Redis {
  const stub = {
    async ping() {
      return 'PONG';
    },
    async get(key: string) {
      return memoryGetRaw(key);
    },
    async set(key: string, value: string, ...args: unknown[]) {
      let ttlSeconds = 3600;
      const exIndex = args.indexOf('EX');
      if (exIndex >= 0 && typeof args[exIndex + 1] === 'number') {
        ttlSeconds = args[exIndex + 1] as number;
      }
      memorySetRaw(key, value, ttlSeconds);
      return 'OK';
    },
    async del(key: string) {
      memoryDelRaw(key);
      return 1;
    },
    async info() {
      return [
        '# Server',
        'redis_mode:standalone',
        'used_memory_human:0B (in-process cache)',
        'connected_clients:0',
        'uptime_in_days:0',
      ].join('\r\n');
    },
    multi() {
      const ops: Array<{ type: 'incr' | 'expire'; key: string; ttl?: number }> = [];
      const chain = {
        incr(k: string) {
          ops.push({ type: 'incr', key: k });
          return chain;
        },
        expire(k: string, ttl: number) {
          ops.push({ type: 'expire', key: k, ttl });
          return chain;
        },
        async exec() {
          const results: [null, number][] = [];
          for (const op of ops) {
            if (op.type === 'incr') {
              const current = Number(memoryGetRaw(op.key) ?? '0') + 1;
              const ttl =
                ops.find((o) => o.type === 'expire' && o.key === op.key)?.ttl ?? 3600;
              memorySetRaw(op.key, String(current), ttl);
              results.push([null, current]);
            } else if (op.type === 'expire') {
              const entry = memoryStore.get(op.key);
              if (entry && op.ttl) {
                entry.expiresAt = Date.now() + op.ttl * 1000;
              }
              results.push([null, 1]);
            }
          }
          return results;
        },
      };
      return chain;
    },
  };

  return stub as unknown as Redis;
}

function createRedisClient(): Redis {
  return (
    globalForRedis.redis ??
    new Redis(redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  );
}

export const redis: Redis = isRedisCacheDisabled()
  ? createMemoryRedisClient()
  : createRedisClient();

if (!isRedisCacheDisabled() && process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

export default redis;

/**
 * Helper simple pour le cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    if (isRedisCacheDisabled()) {
      const data = memoryGetRaw(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    }
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`[Redis] Error getting cache for key ${key}:`, error);
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
  const data = JSON.stringify(value);
  try {
    if (isRedisCacheDisabled()) {
      memorySetRaw(key, data, ttlSeconds);
      return;
    }
    await redis.set(key, data, 'EX', ttlSeconds);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('MISCONF') || message.includes('stop-writes-on-bgsave-error')) {
      memorySetRaw(key, data, ttlSeconds);
      console.warn(
        `[Redis] Écriture impossible (persistance disque) — cache mémoire pour ${key}. ` +
          'Corrigez Redis ou définissez REDIS_CACHE_DISABLED=1 en dev.',
      );
      return;
    }
    console.error(`[Redis] Error setting cache for key ${key}:`, error);
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    if (isRedisCacheDisabled()) {
      memoryDelRaw(key);
      return;
    }
    await redis.del(key);
  } catch (error) {
    console.error(`[Redis] Error deleting cache for key ${key}:`, error);
  }
}

/**
 * Rate limiting simple
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Math.floor(Date.now() / 1000);
  const reset = now + windowSeconds;

  const multi = redis.multi();
  multi.incr(key);
  multi.expire(key, windowSeconds);

  const results = await multi.exec();
  const count = (results?.[0]?.[1] as number) || 0;

  return {
    success: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    reset,
  };
}
