import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { getClientIP } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok } from '@/app/api/_shared/http/response';
import { getCompanyProfileGET, loadSystemSettings } from '@/app/api/_shared/company-profile-get';
import { CompanyProfileSchema } from '@/app/(protected)/gestion-ressources/compagnie/profil/forms/company-profile-schema';
import { systemLog } from '@/services/system-log';
import { saveCompanyLogoLocal } from '@/app/api/_shared/save-company-logo-local';
import { saveCompanyProfileImageLocal } from '@/app/api/_shared/save-company-profile-image-local';
import { UserStatus } from '@/app/models/user';

/** Route dédiée : évite le proxy interne `[...path]` → `fetch` (sources de 405) et clarifie le « tenant » comme alias compagnie (`SystemSetting`). */

export async function GET() {
  return getCompanyProfileGET();
}

export async function HEAD() {
  const res = await getCompanyProfileGET();
  return new NextResponse(null, { status: res.status });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: 'GET, HEAD, POST, OPTIONS',
    },
  });
}

function optionalTrimmed(s: string | null | undefined): string | null {
  const t = s?.trim();
  return t ? t : null;
}

/** Parse `YYYY-MM-DD` → date à midi UTC (évite décalage fuseau sur champ date seul). */
function parseOptionalDeclarationDate(s: string | null | undefined): Date | null {
  const t = s?.trim();
  if (!t) return null;
  const d = new Date(`${t}T12:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseOptionalPositiveInt(s: string | null | undefined): number | null {
  const t = s?.trim();
  if (!t) return null;
  const n = Number.parseInt(t.replace(/\s/g, ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Mise à jour profil compagnie (`application/json` ou `multipart/form-data` avec `payload` + fichier logo). */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const settings = await loadSystemSettings();
    if (!settings) {
      return NextResponse.json({ message: 'Settings not found.' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') ?? '';

    let raw: Record<string, unknown>;
    let uploadedLogoFile: File | null = null;
    let uploadedDirectorAvatarFile: File | null = null;
    let uploadedAdminAvatarFile: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const payload = formData.get('payload');
      if (typeof payload !== 'string') {
        return NextResponse.json({ message: 'Champ « payload » JSON manquant.' }, { status: 400 });
      }
      try {
        raw = JSON.parse(payload) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ message: 'Payload JSON invalide.' }, { status: 400 });
      }
      const lf = formData.get('logoFile');
      uploadedLogoFile = lf instanceof File && lf.size > 0 ? lf : null;
      const daf = formData.get('directorAvatarFile');
      uploadedDirectorAvatarFile = daf instanceof File && daf.size > 0 ? daf : null;
      const aaf = formData.get('adminAvatarFile');
      uploadedAdminAvatarFile = aaf instanceof File && aaf.size > 0 ? aaf : null;
    } else if (contentType.includes('application/json')) {
      raw = (await request.json()) as Record<string, unknown>;
    } else {
      return NextResponse.json(
        { message: 'Content-Type : application/json ou multipart/form-data.' },
        { status: 400 },
      );
    }

    const parsed = CompanyProfileSchema.omit({
      logoFile: true,
      directorAvatarFile: true,
      adminAvatarFile: true,
    }).safeParse({
      ...raw,
      logoFile: undefined,
      directorAvatarFile: undefined,
      adminAvatarFile: undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: parsed.error.flatten() }, { status: 400 });
    }

    const d = parsed.data;

    const street = d.companyAddress?.trim() ?? '';
    const postal = d.companyPostalCode?.trim() ?? '';
    const city = d.companyCity?.trim() ?? '';
    const mergedAddress =
      [street, [postal, city].filter(Boolean).join(' ')].filter(Boolean).join(', ') || null;

    let logoUpdate: { logo?: string | null } = {};
    if (d.logoAction === 'remove') {
      logoUpdate = { logo: null };
    } else if (uploadedLogoFile) {
      try {
        logoUpdate = { logo: await saveCompanyLogoLocal(uploadedLogoFile) };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Échec enregistrement du logo.';
        return NextResponse.json({ message: msg }, { status: 400 });
      }
    } else if (d.logo !== undefined) {
      const t = String(d.logo).trim();
      logoUpdate = { logo: t ? t : null };
    }

    let directorAvatarUpdate: { directorAvatar?: string | null } = {};
    if (d.directorAvatarAction === 'remove') {
      directorAvatarUpdate = { directorAvatar: null };
    } else if (uploadedDirectorAvatarFile) {
      try {
        directorAvatarUpdate = {
          directorAvatar: await saveCompanyProfileImageLocal(uploadedDirectorAvatarFile, 'director'),
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Échec enregistrement de la photo dirigeant.';
        return NextResponse.json({ message: msg }, { status: 400 });
      }
    } else if (d.directorAvatar !== undefined) {
      const next = optionalTrimmed(d.directorAvatar ?? undefined) ?? null;
      if (next !== (settings.directorAvatar ?? null)) {
        directorAvatarUpdate = { directorAvatar: next };
      }
    }

    await prisma.systemSetting.update({
      where: { id: settings.id },
      data: {
        name: d.companyName?.trim() ? d.companyName.trim() : settings.name,
        ...logoUpdate,
        ...directorAvatarUpdate,
        siret: optionalTrimmed(d.siret ?? undefined),
        cnaps: optionalTrimmed(d.cnaps ?? undefined),
        industry: optionalTrimmed(d.industry ?? undefined),
        companyType: optionalTrimmed(d.companyType ?? undefined),
        companySize: optionalTrimmed(d.companySize ?? undefined),
        companyRegion: optionalTrimmed(d.companyRegion ?? undefined),
        ndaNumber: optionalTrimmed(d.ndaNumber ?? undefined),
        ndaSpecialty: optionalTrimmed(d.ndaSpecialty ?? undefined),
        ndaDeclaredAt: parseOptionalDeclarationDate(d.ndaDeclarationDate ?? undefined),
        ndaRegion: optionalTrimmed(d.ndaRegion ?? undefined),
        ndaTrainingActions: optionalTrimmed(d.ndaTrainingActions ?? undefined),
        qualiopiCertifications: optionalTrimmed(d.qualiopiCertifications ?? undefined),
        siren: optionalTrimmed(d.siren ?? undefined),
        establishmentNic: optionalTrimmed(d.establishmentNic ?? undefined),
        vatIntracommunityNumber: optionalTrimmed(d.vatIntracommunityNumber ?? undefined),
        eoriNumber: optionalTrimmed(d.eoriNumber ?? undefined),
        nafApeCode: optionalTrimmed(d.nafApeCode ?? undefined),
        naf2025Code: optionalTrimmed(d.naf2025Code ?? undefined),
        mainActivityDescription: optionalTrimmed(d.mainActivityDescription ?? undefined),
        legalFormDetailed: optionalTrimmed(d.legalFormDetailed ?? undefined),
        companyCreationDate: parseOptionalDeclarationDate(d.companyCreationDate ?? undefined),
        establishmentCreationDate: parseOptionalDeclarationDate(d.establishmentCreationDate ?? undefined),
        inseeRegistrationDate: parseOptionalDeclarationDate(d.inseeRegistrationDate ?? undefined),
        rneExtractDate: parseOptionalDeclarationDate(d.rneExtractDate ?? undefined),
        employeeSituationNote: optionalTrimmed(d.employeeSituationNote ?? undefined),
        companySizeCategoryNote: optionalTrimmed(d.companySizeCategoryNote ?? undefined),
        directorRole: optionalTrimmed(d.directorRole ?? undefined),
        collectiveAgreementNote: optionalTrimmed(d.collectiveAgreementNote ?? undefined),
        inpiCompanySummary: optionalTrimmed(d.inpiCompanySummary ?? undefined),
        shareCapitalEuros: parseOptionalPositiveInt(d.shareCapitalEuros ?? undefined),
        rcsRegistryCity: optionalTrimmed(d.rcsRegistryCity ?? undefined),
        agreementAdef: optionalTrimmed(d.agreementAdef ?? undefined),
        agreementQualianor: optionalTrimmed(d.agreementQualianor ?? undefined),
        agreementQualiopiRef: optionalTrimmed(d.agreementQualiopiRef ?? undefined),
        agreementSsiap: optionalTrimmed(d.agreementSsiap ?? undefined),
        directorFullName: optionalTrimmed(d.directorFullName ?? undefined),
        websiteURL: optionalTrimmed(d.website ?? undefined),
        address: mergedAddress,
        companyCity: city || null,
        companyPostalCode: postal || null,
        supportEmail: optionalTrimmed(d.directorEmail ?? undefined),
        supportPhone: optionalTrimmed(d.directorPhone ?? undefined),
      },
    });

    const primaryAdmin = await prisma.user.findFirst({
      where: {
        status: UserStatus.ACTIVE,
        isTrashed: false,
        role: { slug: { in: ['admin', 'superadmin'] } },
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, avatar: true },
    });

    if (primaryAdmin) {
      let nextAvatar: string | null | undefined = undefined;
      if (d.adminAvatarAction === 'remove') {
        nextAvatar = null;
      } else if (uploadedAdminAvatarFile) {
        try {
          nextAvatar = await saveCompanyProfileImageLocal(uploadedAdminAvatarFile, 'admin');
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Échec enregistrement de la photo administrateur.';
          return NextResponse.json({ message: msg }, { status: 400 });
        }
      } else if (d.adminAvatar !== undefined) {
        const next = optionalTrimmed(d.adminAvatar ?? undefined) ?? null;
        if (next !== (primaryAdmin.avatar ?? null)) {
          nextAvatar = next;
        }
      }
      if (nextAvatar !== undefined) {
        await prisma.user.update({
          where: { id: primaryAdmin.id },
          data: { avatar: nextAvatar },
        });
      }
    }

    await systemLog({
      event: 'update',
      userId: session.user.id,
      entityId: settings.id,
      entityType: 'tenant.company_profile',
      description: 'Company profile updated (administration-facturation/tenant/profile).',
      ipAddress: getClientIP(request),
    });

    return ok({ updated: true });
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
