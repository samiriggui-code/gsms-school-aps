import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

type RedisGlobal = {
  redis?: Redis;
  memoryFallbackActive?: boolean;
  memoryFallbackWarned?: boolean;
  memoryClient?: Redis;
};

const globalForRedis = global as unknown as { __gsmsRedis?: RedisGlobal };

function redisGlobal(): RedisGlobal {
  if (!globalForRedis.__gsmsRedis) {
    globalForRedis.__gsmsRedis = {};
  }
  return globalForRedis.__gsmsRedis;
}

/** Dev local : pas de connexion à redis-server (cache stats en mémoire dans le process Node). */
export function isRedisCacheDisabled(): boolean {
  const v = process.env.REDIS_CACHE_DISABLED?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes' || v === 'on';
}

export function isRedisMemoryFallbackActive(): boolean {
  return isRedisCacheDisabled() || Boolean(redisGlobal().memoryFallbackActive);
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

function isRedisConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Connection is closed') ||
    message.includes('ECONNREFUSED') ||
    message.includes('ENOTFOUND') ||
    message.includes('ETIMEDOUT') ||
    message.includes('Redis get timeout') ||
    message.includes('Redis set timeout') ||
    message.includes('Stream isn\'t writeable') ||
    message.includes('enableOfflineQueue')
  );
}

function warnMemoryFallbackOnce(reason: string): void {
  const g = redisGlobal();
  if (g.memoryFallbackWarned) return;
  g.memoryFallbackWarned = true;
  console.warn(
    `[Redis] ${reason} — cache mémoire activé pour cette session. ` +
      'Définissez REDIS_CACHE_DISABLED=1 en dev ou démarrez redis-server.',
  );
}

function activateMemoryFallback(reason: string): void {
  const g = redisGlobal();
  if (isRedisCacheDisabled() || g.memoryFallbackActive) return;
  g.memoryFallbackActive = true;
  disposeRedisClient();
  warnMemoryFallbackOnce(reason);
}

function disposeRedisClient(): void {
  const g = redisGlobal();
  if (!g.redis) return;
  try {
    g.redis.disconnect();
  } catch {
    // ignore
  }
  g.redis = undefined;
}

function isRedisClientAlive(client: Redis): boolean {
  const status = client.status;
  return status !== 'end' && status !== 'close';
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

function getMemoryRedisClient(): Redis {
  const g = redisGlobal();
  g.memoryClient ??= createMemoryRedisClient();
  return g.memoryClient;
}

function createLiveRedisClient(): Redis {
  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 2,
    connectTimeout: 2_000,
    commandTimeout: 2_000,
    lazyConnect: true,
    retryStrategy: (times) => (times > 2 ? null : Math.min(times * 200, 800)),
  });

  client.on('error', () => {
    // ioredis émet souvent en dev sans Redis — le fallback mémoire gère les commandes.
  });

  client.on('close', () => {
    const g = redisGlobal();
    if (g.redis === client) {
      g.redis = undefined;
    }
  });

  return client;
}

function resolveRedisClient(): Redis {
  if (isRedisMemoryFallbackActive()) {
    return getMemoryRedisClient();
  }

  const g = redisGlobal();
  if (g.redis && isRedisClientAlive(g.redis)) {
    return g.redis;
  }

  disposeRedisClient();
  g.redis = createLiveRedisClient();
  return g.redis;
}

/** Client Redis effectif (réel ou stub mémoire si indisponible). */
export function getRedis(): Redis {
  if (isRedisCacheDisabled()) {
    return getMemoryRedisClient();
  }
  return resolveRedisClient();
}

export const redis: Redis = getRedis();

export default redis;

async function runRedisGet(key: string, timeoutMs: number): Promise<string | null> {
  const client = resolveRedisClient();
  return Promise.race([
    client.get(key),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis get timeout')), timeoutMs);
    }),
  ]);
}

async function runRedisSet(key: string, data: string, ttlSeconds: number): Promise<void> {
  const client = resolveRedisClient();
  await Promise.race([
    client.set(key, data, 'EX', ttlSeconds),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Redis set timeout')), 2_500);
    }),
  ]);
}

/**
 * Helper simple pour le cache
 */
export async function getCache<T>(key: string, timeoutMs = 2_500): Promise<T | null> {
  try {
    if (isRedisMemoryFallbackActive()) {
      const data = memoryGetRaw(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    }

    const data = await runRedisGet(key, timeoutMs);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    if (isRedisConnectionError(error)) {
      activateMemoryFallback(
        error instanceof Error ? error.message : 'Connexion Redis perdue',
      );
      const data = memoryGetRaw(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return null;
      }
    }
    console.error(`[Redis] Error getting cache for key ${key}:`, error);
    return null;
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
  const data = JSON.stringify(value);
  try {
    if (isRedisMemoryFallbackActive()) {
      memorySetRaw(key, data, ttlSeconds);
      return;
    }

    await runRedisSet(key, data, ttlSeconds);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes('MISCONF') ||
      message.includes('stop-writes-on-bgsave-error') ||
      isRedisConnectionError(error)
    ) {
      if (isRedisConnectionError(error)) {
        activateMemoryFallback(message);
      } else {
        warnMemoryFallbackOnce('Persistance Redis refusée (MISCONF)');
        memorySetRaw(key, data, ttlSeconds);
        return;
      }
      memorySetRaw(key, data, ttlSeconds);
      return;
    }
    console.error(`[Redis] Error setting cache for key ${key}:`, error);
  }
}

export async function delCache(key: string): Promise<void> {
  try {
    if (isRedisMemoryFallbackActive()) {
      memoryDelRaw(key);
      return;
    }
    await resolveRedisClient().del(key);
  } catch (error) {
    if (isRedisConnectionError(error)) {
      activateMemoryFallback(
        error instanceof Error ? error.message : 'Connexion Redis perdue',
      );
      memoryDelRaw(key);
      return;
    }
    console.error(`[Redis] Error deleting cache for key ${key}:`, error);
  }
}

/**
 * Rate limiting simple
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const now = Math.floor(Date.now() / 1000);
  const reset = now + windowSeconds;

  try {
    const client = resolveRedisClient();
    const multi = client.multi();
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
  } catch (error) {
    if (isRedisConnectionError(error)) {
      activateMemoryFallback(
        error instanceof Error ? error.message : 'Connexion Redis perdue',
      );
      const current = Number(memoryGetRaw(key) ?? '0') + 1;
      memorySetRaw(key, String(current), windowSeconds);
      return {
        success: current <= limit,
        limit,
        remaining: Math.max(0, limit - current),
        reset,
      };
    }
    throw error;
  }
}
