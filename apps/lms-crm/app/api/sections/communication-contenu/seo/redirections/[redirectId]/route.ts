import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { invalidateLandingSeoRedirectCache } from '@/lib/seo-redirect-cache';

type Ctx = { params: Promise<{ redirectId: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { redirectId } = await context.params;
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const data: Record<string, unknown> = {};
  if (body.sourcePath !== undefined) data.sourcePath = String(body.sourcePath).trim();
  if (body.targetPath !== undefined) data.targetPath = String(body.targetPath).trim();
  if (body.redirectType !== undefined) data.redirectType = Number(body.redirectType) === 301 ? 301 : 302;
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.notes !== undefined) data.notes = String(body.notes).trim() || null;

  try {
    const existing = await prisma.seoRedirect.findUnique({ where: { id: redirectId } });
    await prisma.seoRedirect.update({ where: { id: redirectId }, data });
    if (existing) await invalidateLandingSeoRedirectCache(existing.sourcePath);
    if (body.sourcePath !== undefined && String(body.sourcePath).trim() !== existing?.sourcePath) {
      await invalidateLandingSeoRedirectCache(String(body.sourcePath).trim());
    }
    return ok({ updated: true });
  } catch (e) {
    return fail('Mise à jour impossible.', 500, e);
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { redirectId } = await context.params;
  try {
    const existing = await prisma.seoRedirect.findUnique({ where: { id: redirectId } });
    await prisma.seoRedirect.delete({ where: { id: redirectId } });
    if (existing) await invalidateLandingSeoRedirectCache(existing.sourcePath);
    return ok({ deleted: true });
  } catch (e) {
    return fail('Suppression impossible.', 500, e);
  }
}
