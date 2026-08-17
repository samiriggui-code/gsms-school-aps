import { NextRequest } from 'next/server';

import { getServerSession } from 'next-auth/next';

import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

import { ok, fail } from '@/app/api/_shared/http/response';

import { prisma } from '@/lib/prisma';

import { storeSessionDocumentUpload } from '@/lib/suivi-formations/session-document-store';

import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

import {

  categoryRequiresSessionDay,

  categoryRequiresSlot,

  defaultDocumentKind,

  isSuiviDocumentKind,

  isSuiviUploadCategory,

  type SuiviDocumentKind,

} from '@/lib/suivi-formations/session-upload-metadata';

import type { FormationSessionDaySlot } from '@repo/database';



type Ctx = { params: Promise<{ sessionId: string }> };



const ALLOWED_MIME = [

  'application/pdf',

  'text/csv',

  'application/vnd.ms-excel',

  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  'image/jpeg',

  'image/png',

  'image/webp',

];



function parseSlot(value: string | null): FormationSessionDaySlot | null {

  if (value === 'MORNING' || value === 'EVENING') return value;

  return null;

}



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

  const documentKindRaw = String(formData.get('documentKind') || '').trim();

  const title = String(formData.get('title') || '').trim();

  const notes = String(formData.get('notes') || '').trim();

  const dayId = String(formData.get('dayId') || '').trim() || null;

  const dayDate = String(formData.get('dayDate') || '').trim() || null;

  const slot = parseSlot(String(formData.get('slot') || '').trim() || null);

  const legalHold = String(formData.get('legalHold') || '') === '1';



  if (!(file instanceof File)) return fail('file est requis.', 400);

  if (!isSuiviUploadCategory(categoryRaw)) {

    return fail('category invalide.', 422);

  }



  const documentKind: SuiviDocumentKind = isSuiviDocumentKind(documentKindRaw)

    ? documentKindRaw

    : defaultDocumentKind(categoryRaw);



  if (!ALLOWED_MIME.includes(file.type)) {

    return fail('Format accepté : PDF, CSV, Excel, JPEG, PNG, WebP.', 400);

  }



  if (categoryRequiresSessionDay(categoryRaw) && !dayId) {

    return fail('Sélectionnez le jour de session concerné.', 422);

  }



  if (categoryRequiresSlot(categoryRaw, documentKind) && !slot) {

    return fail('Sélectionnez le créneau (matin ou après-midi).', 422);

  }



  try {

    const sessionRow = await prisma.formationSession.findUnique({

      where: { id: sessionId },

      select: { id: true },

    });

    if (!sessionRow) return fail('Session introuvable.', 404);



    if (dayId) {

      const dayRow = await prisma.formationSessionDay.findFirst({

        where: { id: dayId, sessionId },

        select: { id: true, dayDate: true },

      });

      if (!dayRow) return fail('Jour de session invalide.', 422);

    }



    const buffer = Buffer.from(await file.arrayBuffer());

    const asset = await storeSessionDocumentUpload({

      sessionId,

      buffer,

      filename: file.name,

      mimeType: file.type,

      category: categoryRaw,

      createdById: sessionAuth.user.id,

      dayId,

      dayDate,

      slot,

      documentKind,

      title: title || null,

      notes: notes || null,

      legalHold: legalHold || categoryRaw === 'archives',

    });



    return ok({

      id: asset.id,

      url: asset.url,

      originalName: asset.originalName,

      category: categoryRaw,

      documentKind,

      title,

    });

  } catch (error) {

    return fail('Impossible d’archiver le document.', 500, error);

  }

}


