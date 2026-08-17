import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

export async function POST(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteEdit);
  if (!auth.ok) return auth.response;

  let body: { administrativeDossier?: unknown };
  try {
    body = (await request.json()) as { administrativeDossier?: unknown };
  } catch {
    return NextResponse.json({ message: 'Corps JSON invalide.' }, { status: 400 });
  }

  const payload = body.administrativeDossier;
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json(
      { message: 'administrativeDossier doit être un objet JSON.' },
      { status: 400 },
    );
  }

  const settings = await prisma.systemSetting.findFirst();
  if (!settings) {
    return NextResponse.json({ message: 'SystemSetting introuvable.' }, { status: 404 });
  }

  await prisma.systemSetting.update({
    where: { id: settings.id },
    data: { administrativeDossier: payload as object },
  });

  return NextResponse.json({ message: 'Dossier administratif enregistré.' });
}
