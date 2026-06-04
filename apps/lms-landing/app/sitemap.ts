import type { MetadataRoute } from 'next';
import { withDbTimeout } from '@repo/database';
import prisma from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();

  const fallback: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  return withDbTimeout(
    (async () => {
      try {
        const [redirects, setting] = await Promise.all([
          prisma.seoRedirect.findMany({
            where: { active: true },
            select: { sourcePath: true, updatedAt: true },
          }),
          prisma.systemSetting.findFirst({ orderBy: { id: 'asc' }, select: { updatedAt: true } }),
        ]);

        const entries: MetadataRoute.Sitemap = [
          {
            url: base,
            lastModified: setting?.updatedAt ?? now,
            changeFrequency: 'weekly',
            priority: 1,
          },
        ];

        for (const r of redirects) {
          if (r.sourcePath === '/') continue;
          entries.push({
            url: `${base}${r.sourcePath}`,
            lastModified: r.updatedAt,
            changeFrequency: 'monthly',
            priority: 0.6,
          });
        }

        return entries;
      } catch {
        return fallback;
      }
    })(),
    3_000,
    fallback,
  );
}
