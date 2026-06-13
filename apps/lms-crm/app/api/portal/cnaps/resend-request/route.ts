import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isPortalRole } from '@/lib/auth/app-routing';
import {
  buildCnapsPortalSlots,
  isCnapsDossierFullyVerified,
  parseCnapsResendRequests,
  PORTAL_CNAPS_MODULE,
} from '@/lib/portal/cnaps-portal';
import { prisma } from '@/lib/prisma';

const VALID_REASONS = new Set(['LOST_MAIL', 'NOT_DOWNLOADABLE', 'OTHER']);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!isPortalRole(session.user.roleSlug ?? null)) {
    return fail('Espace réservé aux candidats et stagiaires.', 403);
  }

  let body: { reason?: string; note?: string };
  try {
    body = (await request.json()) as { reason?: string; note?: string };
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const reason = String(body.reason || '').trim().toUpperCase();
  const note = typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '';

  if (!VALID_REASONS.has(reason)) {
    return fail('Motif de demande invalide.', 400);
  }

  const candidature = await prisma.candidature.findFirst({
    where: { userId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, metadata: true },
  });

  if (!candidature) return fail('Aucun dossier candidature actif.', 404);

  const files = await prisma.fileAsset.findMany({
    where: {
      module: PORTAL_CNAPS_MODULE,
      entityType: 'User',
      entityId: session.user.id,
      status: 'ACTIVE',
    },
    select: {
      id: true,
      category: true,
      originalName: true,
      url: true,
      mimeType: true,
      createdAt: true,
      metadata: true,
    },
  });

  const slots = buildCnapsPortalSlots(files);
  if (!isCnapsDossierFullyVerified(slots)) {
    return fail(
      'Toutes les pièces doivent être déposées et validées par l’école avant une demande de renvoi.',
      403,
    );
  }

  const existing = parseCnapsResendRequests(candidature.metadata);
  if (existing.some((r) => r.status === 'PENDING')) {
    return fail('Une demande de renvoi est déjà en cours de traitement.', 409);
  }

  const requestedAt = new Date().toISOString();
  const nextRequests = [
    ...existing,
    { requestedAt, reason, note: note || null, status: 'PENDING' as const },
  ];

  const meta =
    candidature.metadata != null &&
    typeof candidature.metadata === 'object' &&
    !Array.isArray(candidature.metadata)
      ? { ...(candidature.metadata as Record<string, unknown>) }
      : {};

  await prisma.candidature.update({
    where: { id: candidature.id },
    data: {
      metadata: { ...meta, cnapsResendRequests: nextRequests },
    },
  });

  return ok({
    message: 'Demande de renvoi enregistrée. Le secrétariat pédagogique vous recontactera.',
    request: nextRequests[nextRequests.length - 1],
  });
}
