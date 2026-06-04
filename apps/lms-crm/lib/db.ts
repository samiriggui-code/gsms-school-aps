import type { PrismaClient } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { SystemSetting } from '@/app/models/system';
import { getCache, setCache } from '@repo/redis';

/**
 * Checks if a record is unique in a Prisma table.
 * @param table - Table name in Prisma schema.
 * @param fields - Fields to check for uniqueness.
 * @param exclude - Fields to exclude from the check.
 * @returns - `true` if unique, otherwise `false`.
 * @throws - Error if the table does not exist.
 */
export async function isUnique<T extends keyof PrismaClient & string>(
  table: T,
  fields: Record<string, unknown>,
  exclude?: Record<string, unknown>,
): Promise<boolean> {
  if (!(table in prisma)) {
    throw new Error(`Table '${table}' does not exist in Prisma Client.`);
  }

  // Build the `where` clause
  const whereClause: Record<string, unknown> = {
    OR: Object.entries(fields).map(([key, value]) => ({ [key]: value })),
  };

  // Add the exclude clause if provided
  if (exclude) {
    whereClause['NOT'] = Object.entries(exclude).map(([key, value]) => ({
      [key]: value,
    }));
  }

  // Define a type for a Prisma model with a findFirst method.
  type PrismaModel = {
    findFirst(args: { where: unknown }): Promise<unknown | null>;
  };

  // Cast the dynamic model to that type.
  const model = prisma[table as keyof typeof prisma] as unknown as PrismaModel;

  // Now call findFirst.
  const record = await model.findFirst({
    where: whereClause,
  });

  return !record;
}

/**
 * Fetches the first record from the `setting` table.
 * @returns - Settings with related `role` data or `null`.
 */
export async function getSettings(): Promise<SystemSetting | null> {
  const cacheKey = 'system_settings';
  const cached = await getCache<SystemSetting>(cacheKey);
  if (cached) return cached;

  const settings = (await prisma.systemSetting.findFirst()) as unknown as SystemSetting;

  if (settings) {
    await setCache(cacheKey, settings, 86400); // 24h
  }

  return settings;
}
