import { NextRequest } from 'next/server';
import { verifyN8nInternalAuth, fetchSessionTimeline } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> },
) {
  if (!verifyN8nInternalAuth(request.headers)) {
    return fail('Unauthorized request', 401);
  }

  const { sessionId } = await context.params;
  if (!sessionId?.trim()) {
    return fail('sessionId requis', 400);
  }

  const timeline = await fetchSessionTimeline(prisma, sessionId.trim());
  if (!timeline) {
    return fail('Session introuvable', 404);
  }

  return ok(timeline);
}
