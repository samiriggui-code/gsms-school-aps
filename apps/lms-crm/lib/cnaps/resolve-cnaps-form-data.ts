import { prisma } from '@/lib/prisma';
import { loadSystemSettings } from '@/app/api/_shared/company-profile-get';
import {
  formatBirthDateFr,
  parseBirthPlace,
  parseCandidatureOnboardingMetadata,
  parseCandidatureOnboardingNotes,
} from '@/lib/cnaps/parse-candidature-onboarding';
import {
  resolveCnapsActivityCheckboxes,
  resolveCnapsFormationTypeCheckbox,
} from '@/lib/cnaps/cnaps-activity-mapping';
import type { CNAPS_CHECKBOXES } from '@/lib/cnaps/cnaps-form-coordinates';

export type CnapsFormPayload = {
  candidate: {
    cnapsRequestType: 'PREALABLE' | 'PROVISOIRE';
    civility: 'MME' | 'M' | null;
    lastName: string;
    firstName: string;
    usageName: string | null;
    email: string;
    mobilePhone: string | null;
    landlinePhone: string | null;
    birthDate: string | null;
    birthCity: string | null;
    birthDepartment: string | null;
    birthCountry: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
    isFrenchOrEu: boolean;
  };
  school: {
    name: string;
    siret: string | null;
    cnapsAuthorization: string | null;
    address: string | null;
    postalCode: string | null;
    city: string | null;
  };
  formation: {
    label: string;
    location: string;
    slug: string | null;
  };
  checkboxes: Array<keyof typeof CNAPS_CHECKBOXES>;
  missingFields: string[];
};

function isFrenchOrEuNationality(nationality: string | null): boolean {
  if (!nationality?.trim()) return true;
  const n = nationality.trim().toLowerCase();
  return (
    n.includes('franc') ||
    n.includes('france') ||
    n.includes('ue') ||
    n.includes('eee') ||
    n.includes('union europ') ||
    n.includes('européen') ||
    n.includes('europeen')
  );
}

export async function resolveCnapsFormPayload(input: {
  userId: string;
  candidatureId?: string | null;
}): Promise<CnapsFormPayload> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: {
      firstName: true,
      lastName: true,
      name: true,
      email: true,
      phone: true,
      birthDate: true,
      birthPlace: true,
      nationality: true,
      address: true,
      postalCode: true,
      city: true,
      country: true,
    },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  const candidature = await prisma.candidature.findFirst({
    where: input.candidatureId
      ? { id: input.candidatureId, userId: input.userId }
      : { userId: input.userId, status: { not: 'ARCHIVED' } },
    ...(input.candidatureId ? {} : { orderBy: { updatedAt: 'desc' as const } }),
    select: {
      id: true,
      notes: true,
      metadata: true,
      formation: {
        select: {
          name: true,
          slug: true,
          track: true,
          parcoursSpecialite: true,
        },
      },
      interestedSession: {
        select: { location: true, dateDisplayLabel: true },
      },
    },
  });

  const fromNotes = parseCandidatureOnboardingNotes(candidature?.notes);
  const fromMeta = parseCandidatureOnboardingMetadata(candidature?.metadata);

  const mergedBirthCity =
    fromMeta.birthCity ?? fromNotes.birthCity ?? parseBirthPlace(user.birthPlace).birthCity;
  const mergedBirthDepartment =
    fromMeta.birthDepartment ??
    fromNotes.birthDepartment ??
    parseBirthPlace(user.birthPlace).birthDepartment;
  const mergedBirthCountry =
    fromMeta.birthCountry ?? fromNotes.birthCountry ?? parseBirthPlace(user.birthPlace).birthCountry;

  const settings = await loadSystemSettings();
  const schoolName = settings?.name?.trim() || 'Organisme de formation';

  const lastName = user.lastName?.trim() || user.name?.split(' ').slice(-1)[0] || '';
  const firstName =
    user.firstName?.trim() || user.name?.trim()?.split(' ').slice(0, -1).join(' ') || user.name || '';

  const nationality = user.nationality?.trim() || fromMeta.nationality || fromNotes.nationality || null;
  const birthDate =
    formatBirthDateFr(user.birthDate) ??
    formatBirthDateFr(fromMeta.birthDate) ??
    formatBirthDateFr(fromNotes.birthDate);

  const payload: CnapsFormPayload = {
    candidate: {
      cnapsRequestType: fromMeta.cnapsRequestType ?? 'PREALABLE',
      civility: fromMeta.civility ?? fromNotes.civility,
      lastName,
      firstName,
      usageName: fromMeta.usageName ?? null,
      email: user.email,
      mobilePhone: user.phone,
      landlinePhone: null,
      birthDate,
      birthCity: mergedBirthCity,
      birthDepartment: mergedBirthDepartment,
      birthCountry: mergedBirthCountry ?? nationality,
      address: user.address ?? fromMeta.address ?? fromNotes.address,
      postalCode: user.postalCode ?? fromMeta.postalCode ?? fromNotes.postalCode,
      city: user.city ?? fromMeta.city ?? fromNotes.city,
      isFrenchOrEu: isFrenchOrEuNationality(nationality),
    },
    school: {
      name: schoolName,
      siret: settings?.siret?.trim() || null,
      cnapsAuthorization: settings?.cnaps?.trim() || null,
      address: settings?.address?.trim() || null,
      postalCode: settings?.companyPostalCode?.trim() || null,
      city: settings?.companyCity?.trim() || null,
    },
    formation: {
      label: candidature?.formation?.name?.trim() || 'Formation visée (à renseigner dans le dossier)',
      location:
        candidature?.interestedSession?.location?.trim() ||
        [settings?.address, settings?.companyPostalCode, settings?.companyCity].filter(Boolean).join(', ') ||
        '—',
      slug: candidature?.formation?.slug ?? null,
    },
    checkboxes: [],
    missingFields: [],
  };

  if (payload.candidate.cnapsRequestType === 'PROVISOIRE') {
    payload.checkboxes.push('requestProvisoire');
  } else {
    payload.checkboxes.push('requestPrealable');
  }

  if (payload.candidate.civility === 'MME') {
    payload.checkboxes.push('civilityMadame');
  } else if (payload.candidate.civility === 'M') {
    payload.checkboxes.push('civilityMonsieur');
  }

  payload.checkboxes.push('authorizeContact');

  payload.checkboxes.push(
    ...resolveCnapsActivityCheckboxes({
      formationSlug: payload.formation.slug,
      track: candidature?.formation?.track ?? null,
      parcoursSpecialite: candidature?.formation?.parcoursSpecialite ?? null,
    }),
  );

  payload.checkboxes.push(
    resolveCnapsFormationTypeCheckbox({
      formationSlug: payload.formation.slug,
      parcoursSpecialite: candidature?.formation?.parcoursSpecialite ?? null,
    }),
  );

  if (payload.candidate.isFrenchOrEu) {
    payload.checkboxes.push('identityCniRectoVerso');
  }

  if (!payload.candidate.cnapsRequestType) payload.missingFields.push('Type de demande CNAPS');
  if (!payload.candidate.civility) payload.missingFields.push('Civilite (M./Mme - onboarding)');
  if (!payload.candidate.lastName) payload.missingFields.push('Nom');
  if (!payload.candidate.firstName) payload.missingFields.push('Prénom');
  if (!payload.candidate.birthDate) payload.missingFields.push('Date de naissance');
  if (!payload.candidate.birthCity) payload.missingFields.push('Ville de naissance');
  if (!payload.candidate.birthDepartment && payload.candidate.birthCountry?.toLowerCase().includes('france')) {
    payload.missingFields.push('Département de naissance');
  }
  if (!payload.candidate.address) payload.missingFields.push('Adresse');
  if (!payload.candidate.postalCode) payload.missingFields.push('Code postal');
  if (!payload.candidate.city) payload.missingFields.push('Commune');
  if (!payload.school.siret) payload.missingFields.push('SIRET école (Paramètres)');
  if (!payload.school.cnapsAuthorization) payload.missingFields.push('N° agrément CNAPS école (Paramètres)');

  return payload;
}
