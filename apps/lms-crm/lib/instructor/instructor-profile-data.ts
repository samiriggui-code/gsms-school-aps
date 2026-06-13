import { prisma } from '@/lib/prisma';

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function teachingSpecialtiesFromProfile(fp: {
  specialties?: unknown;
  speciality?: string | null;
} | null) {
  if (!fp) return [] as string[];
  const arr = Array.isArray(fp.specialties)
    ? fp.specialties.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
  if (arr.length) return arr;
  const one = typeof fp.speciality === 'string' ? fp.speciality.trim() : '';
  return one ? [one] : [];
}

function qualificationMetierLabel(input: {
  qualification?: string | null;
  jobFunction?: string | null;
  roleSlug?: string | null;
  collaborateurProfile?: { qualification?: string | null; jobFunction?: string | null } | null;
  formateurProfile?: { speciality?: string | null; specialties?: unknown } | null;
}): string {
  const trim = (s: unknown) => (s == null ? '' : String(s).trim());
  let v = trim(input.qualification);
  if (v) return v;
  v = trim(input.collaborateurProfile?.qualification);
  if (v) return v;
  if (input.roleSlug === 'formateur') {
    const specs = teachingSpecialtiesFromProfile(input.formateurProfile ?? null);
    if (specs.length) return specs.join(', ');
  }
  v = trim(input.collaborateurProfile?.jobFunction);
  if (v) return v;
  return trim(input.jobFunction);
}

export async function getInstructorProfileReadOnly(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isTrashed: false },
    include: {
      role: true,
      formateurProfile: {
        select: {
          speciality: true,
          specialties: true,
          schoolInternalService: true,
          isInternal: true,
        },
      },
      collaborateurProfile: {
        select: {
          qualification: true,
          jobFunction: true,
          schoolInternalService: true,
          managerUserId: true,
          manager: {
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
              role: { select: { slug: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!user || user.role?.slug !== 'formateur') return null;

  const names = splitName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  const teachingSpecialties = teachingSpecialtiesFromProfile(user.formateurProfile);

  return {
    ...user,
    firstName: user.firstName || names.firstName,
    lastName: user.lastName || names.lastName,
    userCategory: user.userCategory || 'INTERNAL',
    qualification:
      qualificationMetierLabel({
        qualification: user.qualification,
        jobFunction: user.jobFunction,
        roleSlug: user.role?.slug,
        collaborateurProfile: user.collaborateurProfile,
        formateurProfile: user.formateurProfile,
      }) || null,
    jobFunction: user.jobFunction || null,
    teachingSpecialties,
    emailVerified: Boolean(user.emailVerifiedAt),
  };
}
