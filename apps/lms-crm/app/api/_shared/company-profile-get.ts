import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok } from '@/app/api/_shared/http/response';
import { UserStatus } from '@/app/models/user';

const DEFAULT_SETTINGS_ID = 'default-system-setting';

function adminDisplayName(u: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
}): string {
  const fromParts = [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  if (fromParts) return fromParts;
  if (u.name?.trim()) return u.name.trim();
  return '—';
}

export async function loadSystemSettings() {
  const canonical = await prisma.systemSetting.findUnique({
    where: { id: DEFAULT_SETTINGS_ID },
  });
  if (canonical) return canonical;
  // Fallback: return any SystemSetting row (singleton table)
  return prisma.systemSetting.findFirst();
}

function dateToInputValue(d: Date | null | undefined): string {
  if (!d) return '';
  return d.toISOString().slice(0, 10);
}

/**
 * Profil « compagnie / école » : `SystemSetting` (+ repli `ClientSite` si nom/adresse vides) + compteurs + admin.
 * Auth : à la charge de la route appelante (`tenant/profile`, etc.).
 */
export async function getCompanyProfileGET(): Promise<NextResponse> {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      settings,
      siteFallback,
      trainersCount,
      activeFormationsCount,
      sessionsTotalCount,
      sessionsUpcomingCount,
      roomsAvailableCount,
      primaryAdmin,
    ] = await Promise.all([
      loadSystemSettings(),
      prisma.clientSite.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        select: { name: true, address: true, city: true },
      }),
      prisma.user.count({
        where: {
          status: UserStatus.ACTIVE,
          isTrashed: false,
          formateurProfile: { isNot: null },
        },
      }),
      prisma.formation.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.formationSession.count(),
      prisma.formationSession.count({
        where: {
          OR: [
            { startDate: { gte: startOfToday } },
            {
              AND: [
                { startDate: null },
                {
                  OR: [{ endDate: null }, { endDate: { gte: startOfToday } }],
                },
              ],
            },
          ],
        },
      }),
      prisma.formationVenueRoom.count({
        where: { isActive: true },
      }),
      prisma.user.findFirst({
        where: {
          status: UserStatus.ACTIVE,
          isTrashed: false,
          role: { slug: { in: ['admin', 'superadmin'] } },
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      }),
    ]);

    const nameFromSettings = settings?.name?.trim() ?? '';
    const addressFromSettings = settings?.address?.trim() ?? '';
    const cityFromSettings = settings?.companyCity?.trim() ?? '';
    const postalFromSettings = settings?.companyPostalCode?.trim() ?? '';

    const name =
      nameFromSettings ||
      siteFallback?.name?.trim() ||
      'My Company';

    const addressLineFromSite = [siteFallback?.address?.trim(), siteFallback?.city?.trim()]
      .filter(Boolean)
      .join(', ')
      .trim();

    const companyAddress =
      addressFromSettings ||
      addressLineFromSite ||
      '';

    const companyCity = cityFromSettings || siteFallback?.city?.trim() || '';
    const companyPostalCode = postalFromSettings;

    const companyProfile = {
      companyName: name,
      siret: settings?.siret ?? '',
      cnaps: settings?.cnaps ?? '',
      companyType: settings?.companyType ?? '',
      industry: settings?.industry ?? '',
      companySize: settings?.companySize ?? '',
      website: settings?.websiteURL ?? '',
      companyAddress,
      companyCity,
      companyPostalCode,
      companyCountry: 'FR',
      companyRegion: settings?.companyRegion ?? '',
      ndaNumber: settings?.ndaNumber ?? '',
      ndaSpecialty: settings?.ndaSpecialty ?? '',
      ndaDeclarationDate: dateToInputValue(settings?.ndaDeclaredAt ?? null),
      ndaRegion: settings?.ndaRegion ?? '',
      ndaTrainingActions: settings?.ndaTrainingActions ?? '',
      qualiopiCertifications: settings?.qualiopiCertifications ?? '',
      siren: settings?.siren ?? '',
      establishmentNic: settings?.establishmentNic ?? '',
      vatIntracommunityNumber: settings?.vatIntracommunityNumber ?? '',
      eoriNumber: settings?.eoriNumber ?? '',
      nafApeCode: settings?.nafApeCode ?? '',
      naf2025Code: settings?.naf2025Code ?? '',
      mainActivityDescription: settings?.mainActivityDescription ?? '',
      legalFormDetailed: settings?.legalFormDetailed ?? '',
      companyCreationDate: dateToInputValue(settings?.companyCreationDate ?? null),
      establishmentCreationDate: dateToInputValue(settings?.establishmentCreationDate ?? null),
      inseeRegistrationDate: dateToInputValue(settings?.inseeRegistrationDate ?? null),
      rneExtractDate: dateToInputValue(settings?.rneExtractDate ?? null),
      employeeSituationNote: settings?.employeeSituationNote ?? '',
      companySizeCategoryNote: settings?.companySizeCategoryNote ?? '',
      directorRole: settings?.directorRole ?? '',
      collectiveAgreementNote: settings?.collectiveAgreementNote ?? '',
      inpiCompanySummary: settings?.inpiCompanySummary ?? '',
      shareCapitalEuros:
        settings?.shareCapitalEuros != null ? String(settings.shareCapitalEuros) : '',
      rcsRegistryCity: settings?.rcsRegistryCity ?? '',
      agreementAdef: settings?.agreementAdef ?? '',
      agreementQualianor: settings?.agreementQualianor ?? '',
      agreementQualiopiRef: settings?.agreementQualiopiRef ?? '',
      agreementSsiap: settings?.agreementSsiap ?? '',
      directorFullName: settings?.directorFullName ?? '',
      directorEmail: settings?.supportEmail ?? '',
      directorPhone: settings?.supportPhone ?? '',
      logo: settings?.logo ?? null,
      directorAvatar: settings?.directorAvatar ?? null,
    };

    const schoolStats = {
      trainersCount,
      activeFormationsCount,
      sessionsTotalCount,
      sessionsUpcomingOrUndatedCount: sessionsUpcomingCount,
      roomsAvailableCount,
    };

    const primaryAdminContact = primaryAdmin
      ? {
          id: primaryAdmin.id,
          displayName: adminDisplayName(primaryAdmin),
          email: primaryAdmin.email,
          phone: primaryAdmin.phone ?? null,
          avatar: primaryAdmin.avatar ?? null,
        }
      : null;

    return ok({
      companyProfile,
      tenant: { name },
      schoolStats,
      primaryAdminContact,
    });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
