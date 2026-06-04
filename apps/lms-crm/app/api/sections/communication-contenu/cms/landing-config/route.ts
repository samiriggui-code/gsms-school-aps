import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { DEFAULT_LANDING_SECTIONS, normalizeLandingSections } from '@repo/database';

async function getOrCreateConfig() {
  const existing = await prisma.landingConfig.findFirst({ orderBy: { updatedAt: 'desc' } });
  if (existing) return existing;
  return prisma.landingConfig.create({
    data: { sections: DEFAULT_LANDING_SECTIONS, enabled: true },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const row = await getOrCreateConfig();
    const sections = normalizeLandingSections(row.sections);
    return ok({
      id: row.id,
      enabled: row.enabled,
      sections,
      sectionCount: sections.length,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (e) {
    return fail('Impossible de charger la configuration landing.', 500, e);
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: { enabled?: boolean; sections?: unknown } = {};
  if (body.enabled !== undefined) data.enabled = Boolean(body.enabled);
  if (body.sections !== undefined) {
    if (!Array.isArray(body.sections)) return fail('sections doit être un tableau.', 400);
    data.sections = body.sections;
  }

  if (!Object.keys(data).length) return fail('Aucune modification.', 400);

  try {
    const row = await getOrCreateConfig();
    const updated = await prisma.landingConfig.update({
      where: { id: row.id },
      data,
    });
    const sections = normalizeLandingSections(updated.sections);
    return ok({
      id: updated.id,
      enabled: updated.enabled,
      sections,
      sectionCount: sections.length,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}
