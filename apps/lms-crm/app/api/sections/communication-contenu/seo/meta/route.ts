import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


const META_FIELDS = ['name', 'companyCity', 'siret', 'directorFullName', 'mainActivityDescription'] as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.communicationView)) {
    return fail('Forbidden', 403);
  }

  try {
    const [setting, landing] = await Promise.all([
      prisma.systemSetting.findFirst({ orderBy: { id: 'asc' } }),
      prisma.landingConfig.findFirst({ orderBy: { updatedAt: 'desc' }, select: { enabled: true, updatedAt: true } }),
    ]);

    return ok({
      meta: {
        name: setting?.name ?? '',
        companyCity: setting?.companyCity ?? '',
        siret: setting?.siret ?? '',
        directorFullName: setting?.directorFullName ?? '',
        mainActivityDescription: setting?.mainActivityDescription ?? '',
      },
      landing: {
        enabled: landing?.enabled ?? true,
        updatedAt: landing?.updatedAt?.toISOString() ?? null,
      },
      siteUrl: process.env.NEXT_PUBLIC_LANDING_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? '',
      sitemapPath: '/sitemap.xml',
      robotsPath: '/robots.txt',
    });
  } catch (e) {
    return fail('Impossible de charger les meta SEO.', 500, e);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.communicationEdit)) {
    return fail('Forbidden', 403);
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, string | null> = {};
  for (const key of META_FIELDS) {
    if (body[key] !== undefined) {
      const v = String(body[key]).trim();
      data[key] = v || null;
    }
  }

  if (!Object.keys(data).length) return fail('Aucune modification.', 400);

  try {
    const existing = await prisma.systemSetting.findFirst({ orderBy: { id: 'asc' } });
    if (!existing) return fail('SystemSetting introuvable.', 404);

    await prisma.systemSetting.update({ where: { id: existing.id }, data });
    return ok({ updated: true });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}
