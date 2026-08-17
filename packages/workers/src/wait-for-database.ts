import type { PrismaClient } from '@repo/database';

const STARTUP_CODES = new Set(['57P03', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']);

function isDatabaseStartingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const cause = (error as { cause?: { code?: string; originalCode?: string } }).cause;
  const code = cause?.code ?? cause?.originalCode;
  if (code && STARTUP_CODES.has(code)) return true;
  const message = String((error as { message?: string }).message ?? '');
  return message.includes('57P03') || message.includes('se lance');
}

/** Attend que PostgreSQL accepte les connexions (ex. Laragon en cours de démarrage). */
export async function waitForDatabase(
  prisma: PrismaClient,
  {
    maxAttempts = 30,
    delayMs = 2_000,
  }: { maxAttempts?: number; delayMs?: number } = {},
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      if (attempt > 1) {
        console.log(`[Worker] Base de données prête (tentative ${attempt}/${maxAttempts}).`);
      }
      return;
    } catch (error) {
      if (!isDatabaseStartingError(error) || attempt === maxAttempts) {
        throw error;
      }
      console.warn(
        `[Worker] PostgreSQL pas encore prêt (${attempt}/${maxAttempts}) — nouvelle tentative dans ${delayMs / 1000}s…`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
