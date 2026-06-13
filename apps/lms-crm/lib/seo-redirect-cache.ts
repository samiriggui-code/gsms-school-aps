import { getCache, setCache, delCache } from '@repo/redis';

const REDIRECT_MAP_KEY = 'lms:seo:redirects:map';
const REDIRECT_ENTRY_PREFIX = 'lms:seo:redirect:';
const TTL_SECONDS = 300;

export type SeoRedirectEntry = { target: string; type: number };

export async function getSeoRedirectFromCache(sourcePath: string): Promise<SeoRedirectEntry | null> {
  try {
    const cached = await getCache<SeoRedirectEntry>(`${REDIRECT_ENTRY_PREFIX}${sourcePath}`);
    return cached;
  } catch {
    return null;
  }
}

export async function setSeoRedirectCache(sourcePath: string, entry: SeoRedirectEntry): Promise<void> {
  await setCache(`${REDIRECT_ENTRY_PREFIX}${sourcePath}`, entry, TTL_SECONDS);
}

export async function invalidateSeoRedirectCache(sourcePath?: string): Promise<void> {
  if (sourcePath) {
    await delCache(`${REDIRECT_ENTRY_PREFIX}${sourcePath}`);
  }
  await delCache(REDIRECT_MAP_KEY);
}

/** @deprecated Alias historique — préférer invalidateSeoRedirectCache */
export const invalidateLandingSeoRedirectCache = invalidateSeoRedirectCache;
