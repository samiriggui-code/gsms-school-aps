import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isPortalRole } from '@/lib/auth/app-routing';
import {
  buildCnapsPortalSlots,
  getCnapsAuthorizationFile,
  getCnapsSchoolFormFile,
  isCnapsDossierComplete,
  isCnapsDossierFullyVerified,
  parseCnapsResendRequests,
  PORTAL_CNAPS_MODULE,
} from '@/lib/portal/cnaps-portal';
import { prisma } from '@/lib/prisma';

const CNAPS_FORMULAIRE_URL =
  'https://www.cnaps.interieur.gouv.fr/contenu/telechargement/5034/42210/file/20260210%20Formulaire%20d%27autorisation%20pr%C3%A9alable%20ou%20provisoire%20d%27entr%C3%A9e%20en%20formation.pdf';

async function requirePortalUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { ok: false as const, response: fail('Unauthorized request', 401) };
  if (!isPortalRole(session.user.roleSlug ?? null)) {
    return { ok: false as const, response: fail('Espace réservé aux candidats et stagiaires.', 403) };
  }
  return { ok: true as const, userId: session.user.id };
}

export async function GET() {
  const auth = await requirePortalUser();
  if (!auth.ok) return auth.response;

  const [candidature, files] = await Promise.all([
    prisma.candidature.findFirst({
      where: { userId: auth.userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        status: true,
        metadata: true,
        cnapsSubmittedAt: true,
        cnapsReference: true,
        cnapsPrefavorable: true,
        cnapsDecisionAt: true,
        formation: { select: { name: true } },
      },
    }),
    prisma.fileAsset.findMany({
      where: {
        entityType: 'User',
        entityId: auth.userId,
        status: 'ACTIVE',
        OR: [
          { module: PORTAL_CNAPS_MODULE },
          { category: { startsWith: 'CNAPS_' } },
        ],
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
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const slots = buildCnapsPortalSlots(files);
  const complete = isCnapsDossierComplete(slots);
  const fullyVerified = isCnapsDossierFullyVerified(slots);
  const authorizationFile = getCnapsAuthorizationFile(slots);
  const schoolFormFile = getCnapsSchoolFormFile(slots);
  const resendRequests = candidature ? parseCnapsResendRequests(candidature.metadata) : [];
  const pendingResend = resendRequests.some((r) => r.status === 'PENDING');

  return ok({
    candidature: candidature
      ? {
          id: candidature.id,
          formationName: candidature.formation?.name ?? null,
          cnapsSubmittedAt: candidature.cnapsSubmittedAt?.toISOString() ?? null,
          cnapsReference: candidature.cnapsReference,
          cnapsPrefavorable: candidature.cnapsPrefavorable,
          cnapsDecisionAt: candidature.cnapsDecisionAt?.toISOString() ?? null,
        }
      : null,
    slots,
    summary: {
      uploadedCount: slots.filter((s) => s.uploaded).length,
      totalSlots: slots.length,
      verifiedCount: slots.filter((s) => s.verified).length,
      complete,
      fullyVerified,
    },
    authorizationFile,
    schoolFormFile,
    officialFormUrl: CNAPS_FORMULAIRE_URL,
    canDownloadAuthorization: Boolean(authorizationFile?.url),
    canRequestResend: fullyVerified && !pendingResend,
    resendRequests,
  });
}
