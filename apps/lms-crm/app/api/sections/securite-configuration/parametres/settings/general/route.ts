import { NextRequest, NextResponse } from 'next/server';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { deleteFromS3, uploadToS3 } from '@/lib/s3-upload';
import { systemLog } from '@/services/system-log';
import { GeneralSettingsSchema } from '@/app/(protected)/securite-configuration/parametres/settings/forms/general-settings-schema';
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

    const formData = await request.formData();

    const parsedData = {
      name: formData.get('name'),
      logoFile: formData.get('logoFile'),
      logoAction: formData.get('logoAction'),
      active: formData.get('active') === 'true',
      address: formData.get('address'),
      websiteURL: formData.get('websiteURL'),
      supportEmail: formData.get('supportEmail'),
      supportPhone: formData.get('supportPhone'),
      language: formData.get('language'),
      timezone: formData.get('timezone'),
      currency: formData.get('currency'),
      currencyFormat: formData.get('currencyFormat'),
    };

    const validationResult = GeneralSettingsSchema.safeParse(parsedData);
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid input. Please check your data and try again.' },
        { status: 400 },
      );
    }

    const {
      name,
      logoFile,
      logoAction,
      active,
      address,
      websiteURL,
      supportEmail,
      supportPhone,
      language,
      timezone,
      currency,
      currencyFormat,
    } = validationResult.data;

    const currentSettings = await prisma.systemSetting.findUnique({
      where: { id: settings.id },
    });

    if (logoAction === 'remove' && currentSettings?.logo) {
      try {
        await deleteFromS3(currentSettings.logo);
      } catch (error) {
        console.error('Failed to remove logo from S3:', error);
      }
    }

    let logoUrl = currentSettings?.logo || null;
    if (
      logoAction === 'save' &&
      logoFile &&
      logoFile instanceof File &&
      logoFile.size > 0
    ) {
      try {
        const fileCompatible: File = new File(
          [await logoFile.arrayBuffer()],
          logoFile.name,
          { type: logoFile.type },
        );
        logoUrl = await uploadToS3(fileCompatible, 'misc');
      } catch {
        return NextResponse.json({ message: 'Failed to upload logo.' }, { status: 500 });
      }
    }

    await prisma.systemSetting.update({
      where: { id: settings.id },
      data: {
        name,
        active,
        address,
        websiteURL,
        supportEmail,
        supportPhone,
        language,
        timezone,
        currency,
        currencyFormat,
        logo:
          logoAction === 'remove' ? null : logoAction === 'save' ? logoUrl : undefined,
      },
    });

    await systemLog({
      event: 'update',
      userId: session.user.id,
      entityId: session.user.id,
      entityType: 'system.settings',
      description: 'System settings updated.',
      ipAddress: clientIp,
    });

    return NextResponse.json({ message: 'Settings updated successfully' }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          "Oops! Something didn't go as planned. Please try again in a moment." + error,
      },
      { status: 500 },
    );
  }
}
