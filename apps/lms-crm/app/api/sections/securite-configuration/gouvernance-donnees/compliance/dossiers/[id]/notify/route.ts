import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { ComplianceService } from '@repo/api-core';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await context.params;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const message = typeof body.message === 'string' ? body.message : undefined;
  const dueAtRaw = typeof body.dueAt === 'string' ? body.dueAt : undefined;
  const dueAt = dueAtRaw ? new Date(dueAtRaw) : undefined;

  try {
    const service = new ComplianceService(prisma);
    const result = await service.notifyDossierMissingDocuments({
      dossierId: id,
      message,
      dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
      requestedById: session.user?.id ?? null,
    });

    return ok({
      ...result,
      emailError: result.emailError ?? null,
    });
  } catch (e) {
    const messageText = e instanceof Error ? e.message : String(e);
    if (
      messageText.includes('introuvable') ||
      messageText.includes('Aucune') ||
      messageText.includes('e-mail')
    ) {
      return fail(messageText, 400, e);
    }
    return fail('Impossible d’envoyer la demande documentaire.', 500, e);
  }
}
