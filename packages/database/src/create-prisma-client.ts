import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/client';

type PrismaGlobal = typeof globalThis & {
  __lmsPrismaClients?: Record<string, PrismaClient>;
  __lmsPgPools?: Record<string, Pool>;
};

const POOL_OPTIONS = {
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 30_000,
  max: 10,
  allowExitOnIdle: true,
} as const;

/** Délégués requis — si absents, le singleton dev est recréé (après `pnpm db:generate`). */
const REQUIRED_DELEGATES = ['quizAttempt'] as const;

function isStalePrismaClient(client: PrismaClient): boolean {
  return REQUIRED_DELEGATES.some((key) => !(key in client));
}

async function disposePrismaClient(client: PrismaClient, pool?: Pool) {
  await client.$disconnect().catch(() => undefined);
  if (pool) await pool.end().catch(() => undefined);
}

export function createPrismaClient(scope: string): PrismaClient {
  const globalRef = globalThis as PrismaGlobal;
  const clients = globalRef.__lmsPrismaClients ?? {};
  const pools = globalRef.__lmsPgPools ?? {};

  if (clients[scope] && isStalePrismaClient(clients[scope])) {
    const staleClient = clients[scope];
    const stalePool = pools[scope];
    delete clients[scope];
    delete pools[scope];
    void disposePrismaClient(staleClient, stalePool);
  }

  if (!clients[scope]) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const pool = new Pool({ connectionString, ...POOL_OPTIONS });
    const adapter = new PrismaPg(pool);
    clients[scope] = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    pools[scope] = pool;
  }

  if (process.env.NODE_ENV !== 'production') {
    globalRef.__lmsPrismaClients = clients;
    globalRef.__lmsPgPools = pools;
  }

  return clients[scope];
}

/** Coupe une promesse Prisma après `ms` — évite les pages bloquées des minutes. */
export async function withDbTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
