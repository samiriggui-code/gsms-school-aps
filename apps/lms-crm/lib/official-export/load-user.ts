import { prisma } from '@/lib/prisma';
import { qualificationMetierLabel } from '@/lib/rh-qualification-metier';

function splitName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function teachingSpecialtiesFromProfile(profile: { specialties?: unknown; speciality?: string | null } | null) {
  if (!profile) return [] as string[];
  if (Array.isArray(profile.specialties)) {
    return profile.specialties.filter((s): s is string => typeof s === 'string' && s.trim() !== '');
  }
  return profile.speciality?.trim() ? [profile.speciality.trim()] : [];
}

export async function loadUserForOfficialExport(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, isTrashed: false },
    include: {
      role: { select: { id: true, name: true, slug: true } },
      formateurProfile: {
        select: { speciality: true, specialties: true, schoolInternalService: true },
      },
      collaborateurProfile: {
        select: {
          qualification: true,
          jobFunction: true,
          schoolInternalService: true,
          managerUserId: true,
        },
      },
    },
  });

  if (!user) return null;

  const names = splitName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  const qualificationMetier =
    qualificationMetierLabel({
      qualification: user.qualification,
      jobFunction: user.jobFunction,
      roleSlug: user.role?.slug,
      collaborateurProfile: user.collaborateurProfile,
      formateurProfile: user.formateurProfile,
    }) || null;

  return {
    ...user,
    name:
      user.name ||
      [user.firstName || names.firstName, user.lastName || names.lastName].filter(Boolean).join(' ').trim(),
    firstName: user.firstName || names.firstName,
    lastName: user.lastName || names.lastName,
    userCategory: user.userCategory || 'INTERNAL',
    qualification: qualificationMetier,
    jobFunction: user.jobFunction || user.collaborateurProfile?.jobFunction || null,
    teachingSpecialties: teachingSpecialtiesFromProfile(user.formateurProfile),
    role: user.role,
  };
}
