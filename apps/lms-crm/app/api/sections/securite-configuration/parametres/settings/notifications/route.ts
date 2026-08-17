import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { systemLog } from '@/services/system-log';
import { NotificationSettingsSchema } from '@/app/(protected)/securite-configuration/parametres/settings/forms/notification-settings-schema';
import { requireCrmApiAuth } from '@/lib/auth/require-permission';
import { CRM_PERMISSION } from '@/lib/auth/crm-permissions';

export async function POST(request: NextRequest) {
  const auth = await requireCrmApiAuth(CRM_PERMISSION.securiteEdit);
  if (!auth.ok) return auth.response;

  try {
    const session = auth.session;
    const clientIp = getClientIP(request);
    const settings = await prisma.systemSetting.findFirst();
    if (!settings) {
      return NextResponse.json({ message: 'Settings not found.' }, { status: 404 });
    }

    const body = await request.json();
    const parsedData = NotificationSettingsSchema.safeParse(body);
    if (!parsedData.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 },
      );
    }

    const updatedSettings = await prisma.systemSetting.update({
      where: { id: settings.id },
      data: parsedData.data,
    });

    await systemLog({
      event: 'update',
      userId: session.user.id,
      entityId: session.user.id,
      entityType: 'system.settings',
      description: 'System notifications updated.',
      ipAddress: clientIp,
    });

    return NextResponse.json(
      {
        message: 'Notification settings updated successfully',
        data: updatedSettings,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { message: 'An error occurred while updating the notification settings.' },
      { status: 500 },
    );
  }
}
