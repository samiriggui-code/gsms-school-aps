import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { isPortalRole } from '@/lib/auth/app-routing';
import { candidateUploadableCategories, PORTAL_CNAPS_MODULE } from '@/lib/portal/cnaps-portal';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return fail('Unauthorized request', 401);
  if (!isPortalRole(session.user.roleSlug ?? null)) {
    return fail('Espace réservé aux candidats et stagiaires.', 403);
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const category = String(formData.get('category') || '').trim().toUpperCase();

    if (!(file instanceof File)) return fail('Fichier requis.', 400);
    if (!category) return fail('Catégorie requise.', 400);

    const allowed = candidateUploadableCategories().map((c) => c.toUpperCase());
    if (!allowed.includes(category)) {
      return fail('Cette pièce est déposée et validée par l’école.', 403);
    }

    const uploaded = await uploadFile({
      file,
      module: PORTAL_CNAPS_MODULE,
      entityType: 'User',
      entityId: session.user.id,
      category,
      visibility: 'private',
    });

    const asset = await prisma.fileAsset.create({
      data: {
        module: PORTAL_CNAPS_MODULE,
        entityType: 'User',
        entityId: session.user.id,
        category,
        originalName: uploaded.originalName,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
        storageKey: uploaded.key,
        url: uploaded.url,
        visibility: 'PRIVATE',
        provider: 's3',
        createdById: session.user.id,
        metadata: { schoolVerified: false },
      },
      select: {
        id: true,
        originalName: true,
        url: true,
        mimeType: true,
        createdAt: true,
        metadata: true,
      },
    });

    return ok({
      file: {
        id: asset.id,
        name: asset.originalName,
        url: asset.url,
        mimeType: asset.mimeType,
        uploadedAt: asset.createdAt.toISOString(),
        verified: false,
        verifiedAt: null,
      },
    });
  } catch (e) {
    console.error('[portal/cnaps/upload]', e);
    return fail(e instanceof Error ? e.message : 'Échec du téléversement.', 500);
  }
}
