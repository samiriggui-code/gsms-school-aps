import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  isSuiviUploadCategory,
  storeSessionDocumentUpload,
} from '@/lib/suivi-formations/session-document-store';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth?.user?.id) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId } = await context.params;

  const formData = await request.formData();
  const file = formData.get('file');
  const categoryRaw = String(formData.get('category') || 'general').trim();
  const dayDate = String(formData.get('dayDate') || '').trim() || null;

  if (!(file instanceof File)) return fail('file est requis.', 400);
  if (!isSuiviUploadCategory(categoryRaw)) {
    return fail('category invalide.', 422);
  }

  const allowed = [
    'application/pdf',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  if (!allowed.includes(file.type)) {
    return fail('Format accepté : PDF, CSV, Excel, JPEG, PNG, WebP.', 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const asset = await storeSessionDocumentUpload({
      sessionId,
      buffer,
      filename: file.name,
      mimeType: file.type,
      category: categoryRaw,
      createdById: sessionAuth.user.id,
      dayDate,
    });

    return ok({
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
      category: categoryRaw,
    });
  } catch (error) {
    return fail('Impossible d’archiver le document.', 500, error);
  }
}
