import { prisma } from '@/lib/prisma';

export type PortalFormationInstructor = {
  id: string;
  displayName: string;
  email: string;
  avatar: string | null;
  headline: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  pedagogicalReferences: string[];
  yearsOfExperience: number | null;
  phone: string | null;
  proEmail: string | null;
  sessionLabel: string | null;
};

function asRecord(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

function stringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && x.trim().length > 0).map((s) => s.trim());
}

function displayNameFromUser(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  const parts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  if (user.name?.trim()) return user.name.trim();
  return user.email;
}

function bioFromProfile(input: {
  qualification: string | null;
  jobFunction: string | null;
  metadata: unknown;
  pedagogicalReferences: unknown;
}): string | null {
  const meta = asRecord(input.metadata);
  const fromMeta =
    (typeof meta.portalBio === 'string' && meta.portalBio.trim()) ||
    (typeof meta.bio === 'string' && meta.bio.trim()) ||
    (typeof meta.parcours === 'string' && meta.parcours.trim());
  if (fromMeta) return fromMeta;

  const refs = stringArray(input.pedagogicalReferences);
  if (refs.length) return refs.join(' ');

  if (input.qualification?.trim()) return input.qualification.trim();
  if (input.jobFunction?.trim()) {
    return `${input.jobFunction.trim()} — formateur référent de votre session.`;
  }
  return null;
}

function headlineFromProfile(input: {
  speciality: string | null;
  specialties: unknown;
  jobFunction: string | null;
  qualification: string | null;
}): string | null {
  if (input.speciality?.trim()) return input.speciality.trim();
  const specs = stringArray(input.specialties);
  if (specs.length) return specs.slice(0, 3).join(' · ');
  if (input.qualification?.trim()) return input.qualification.trim();
  if (input.jobFunction?.trim()) return input.jobFunction.trim();
  return null;
}

const trainerUserSelect = {
  id: true,
  name: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  proEmail: true,
  avatar: true,
  jobFunction: true,
  qualification: true,
  formateurProfile: {
    select: {
      speciality: true,
      specialties: true,
      certifications: true,
      pedagogicalReferences: true,
      yearsOfExperience: true,
      metadata: true,
    },
  },
} as const;

export async function resolvePortalTrainerUserId(input: {
  formationId: string;
  interestedSessionId: string | null;
  userId: string;
}): Promise<{ trainerUserId: string | null; sessionLabel: string | null }> {
  if (input.interestedSessionId) {
    const session = await prisma.formationSession.findFirst({
      where: { id: input.interestedSessionId, formationId: input.formationId },
      select: { trainerUserId: true, dateDisplayLabel: true },
    });
    if (session?.trainerUserId) {
      return {
        trainerUserId: session.trainerUserId,
        sessionLabel: session.dateDisplayLabel?.trim() || null,
      };
    }
  }

  const enrolled = await prisma.formationSessionParticipant.findFirst({
    where: { userId: input.userId, session: { formationId: input.formationId } },
    orderBy: { createdAt: 'desc' },
    select: {
      session: { select: { trainerUserId: true, dateDisplayLabel: true } },
    },
  });
  if (enrolled?.session.trainerUserId) {
    return {
      trainerUserId: enrolled.session.trainerUserId,
      sessionLabel: enrolled.session.dateDisplayLabel?.trim() || null,
    };
  }

  const fallbackSession = await prisma.formationSession.findFirst({
    where: { formationId: input.formationId, trainerUserId: { not: null } },
    orderBy: { sortOrder: 'asc' },
    select: { trainerUserId: true, dateDisplayLabel: true },
  });

  return {
    trainerUserId: fallbackSession?.trainerUserId ?? null,
    sessionLabel: fallbackSession?.dateDisplayLabel?.trim() || null,
  };
}

export async function loadPortalFormationInstructor(
  trainerUserId: string | null,
  sessionLabel: string | null,
): Promise<PortalFormationInstructor | null> {
  if (!trainerUserId) return null;

  const user = await prisma.user.findUnique({
    where: { id: trainerUserId },
    select: trainerUserSelect,
  });
  if (!user) return null;

  const fp = user.formateurProfile;

  return {
    id: user.id,
    displayName: displayNameFromUser(user),
    email: user.proEmail?.trim() || user.email,
    avatar: user.avatar,
    headline: fp
      ? headlineFromProfile({
          speciality: fp.speciality,
          specialties: fp.specialties,
          jobFunction: user.jobFunction,
          qualification: user.qualification,
        })
      : user.qualification?.trim() || user.jobFunction?.trim() || null,
    bio: fp
      ? bioFromProfile({
          qualification: user.qualification,
          jobFunction: user.jobFunction,
          metadata: fp.metadata,
          pedagogicalReferences: fp.pedagogicalReferences,
        })
      : user.qualification?.trim() || null,
    specialties: fp ? stringArray(fp.specialties) : [],
    certifications: fp ? stringArray(fp.certifications) : [],
    pedagogicalReferences: fp ? stringArray(fp.pedagogicalReferences) : [],
    yearsOfExperience: fp?.yearsOfExperience ?? null,
    phone: user.phone,
    proEmail: user.proEmail,
    sessionLabel,
  };
}
