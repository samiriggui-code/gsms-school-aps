import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import { SocialSettingsSchema } from '@/app/(protected)/securite-configuration/parametres/settings/forms/social-settings-schema';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

export async function POST(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteEdit);
  if (!auth.ok) return auth.response;

  try {
    const session = auth.session;
    const clientIp = getClientIP(request);
    const body = await request.json();

    const settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      return NextResponse.json({ message: 'Settings not found.' }, { status: 404 });
    }

    const validationResult = SocialSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 },
      );
    }

    await prisma.systemSetting.update({
      where: { id: settings.id },
      data: validationResult.data,
    });

    await systemLog({
      event: 'update',
      userId: session.user.id,
      entityId: session.user.id,
      entityType: 'system.settings',
      description: 'System settings updated.',
      ipAddress: clientIp,
    });

    return NextResponse.json(
      { message: 'Social settings updated successfully' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
