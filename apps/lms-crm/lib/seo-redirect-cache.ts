import { delCache } from '@repo/redis';
import { prisma } from '@/lib/prisma';

const REDIRECT_ENTRY_PREFIX = 'lms:seo:redirect:';

/** Invalide le cache Redis des redirections SEO landing. */
export async function invalidateLandingSeoRedirectCache(sourcePath?: string) {
  try {
    if (sourcePath) {
      await delCache(`${REDIRECT_ENTRY_PREFIX}${sourcePath}`);
      return;
    }
    const rows = await prisma.seoRedirect.findMany({ select: { sourcePath: true } });
    await Promise.all(rows.map((r) => delCache(`${REDIRECT_ENTRY_PREFIX}${r.sourcePath}`)));
  } catch (e) {
    console.warn('[seo-cache-invalidate]', e);
  }
}
