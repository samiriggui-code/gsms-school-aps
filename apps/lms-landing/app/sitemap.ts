import type { MetadataRoute } from 'next';
import { withDbTimeout } from '@repo/database';
import prisma from '@/lib/prisma';

/** Généré à la requête (pas au `next build`) — évite prisma:error si Postgres absent en CI/Docker. */
export const dynamic = 'force-dynamic';

function buildFallback(base: string, now: Date): MetadataRoute.Sitemap {
  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();

  const fallback = buildFallback(base, now);

  if (!process.env.DATABASE_URL?.trim()) {
    return fallback;
  }

  return withDbTimeout(
    (async () => {
      try {
        const redirects = await prisma.seoRedirect.findMany({
          where: { active: true },
          select: { sourcePath: true, updatedAt: true },
        });

        const entries: MetadataRoute.Sitemap = [
          {
            url: base,
            lastModified: now,
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
