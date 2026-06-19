import { randomUUID } from 'crypto';
import { getServerSession } from 'next-auth/next';
import { setCache } from '@repo/redis';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { fail, ok } from '@/app/api/_shared/http/response';
import { resolveOfficialDocumentAuthor } from '@/lib/reports/official-document-author';
import {
  OFFICIAL_EXPORT_CACHE_PREFIX,
  OFFICIAL_EXPORT_TTL_SECONDS,
  type OfficialExportJob,
  type OfficialExportPreviewRequest,
} from '@/lib/official-export/types';

const ALLOWED_KEYS = new Set<OfficialExportJob['templateKey']>([
  'rh.fiche-collaborateur',
  'rh.fiche-formateur',
  'rh.contrat-travail',
  'academic.fiche-etudiant',
]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  let body: OfficialExportPreviewRequest;
  try {
    body = (await request.json()) as OfficialExportPreviewRequest;
  } catch {
    return fail('Corps de requête invalide', 400);
  }

  if (!body.userId?.trim() || !ALLOWED_KEYS.has(body.templateKey)) {
    return fail('Modèle ou utilisateur invalide', 400);
  }

  const sessionUser = session.user as {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };

  const job: OfficialExportJob = {
    templateKey: body.templateKey,
    userId: body.userId.trim(),
    generatedAt: new Date().toISOString(),
    author: resolveOfficialDocumentAuthor({
      name: sessionUser.name,
      email: sessionUser.email,
      avatar: sessionUser.avatar,
    }),
    options: body.options,
  };

  const token = randomUUID();
  await setCache(`${OFFICIAL_EXPORT_CACHE_PREFIX}${token}`, job, OFFICIAL_EXPORT_TTL_SECONDS);

  const origin = new URL(request.url).origin;
  const printQuery = body.print === false ? '?print=0' : '';
  const previewUrl = `${origin}/export/official/${token}${printQuery}`;

  return ok({ token, previewUrl });
}
