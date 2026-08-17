import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

/** GET SystemSetting + rôles pour l’UI Paramètres système. */
export async function GET() {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteView);
  if (!auth.ok) return auth.response;

  try {
    const settings = await prisma.systemSetting.findFirst();

    const roles = await prisma.userRole.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ settings, roles });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
