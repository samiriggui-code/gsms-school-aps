import { prisma } from '@/lib/prisma';
import type { Prisma } from '@repo/database';
import {
  DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES,
  INSTRUCTOR_WORKSPACE_PREFS_METADATA_KEY,
  mergeInstructorWorkspacePreferences,
  parseInstructorWorkspacePreferences,
  type InstructorWorkspacePreferences,
} from '@/lib/instructor/instructor-workspace-preferences';

function metadataWithPreferences(
  existing: unknown,
  preferences: InstructorWorkspacePreferences,
): Record<string, unknown> {
  const base =
    existing != null && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  return {
    ...base,
    [INSTRUCTOR_WORKSPACE_PREFS_METADATA_KEY]: preferences,
  };
}

export async function getInstructorWorkspacePreferences(
  userId: string,
): Promise<InstructorWorkspacePreferences | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isTrashed: false },
    select: {
      role: { select: { slug: true } },
      formateurProfile: { select: { metadata: true } },
    },
  });

  if (!user || user.role?.slug !== 'formateur') return null;

  if (!user.formateurProfile) {
    return { ...DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES };
  }

  return parseInstructorWorkspacePreferences(user.formateurProfile.metadata);
}

export async function updateInstructorWorkspacePreferences(
  userId: string,
  patch: Partial<InstructorWorkspacePreferences>,
): Promise<InstructorWorkspacePreferences | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isTrashed: false },
    select: {
      role: { select: { slug: true } },
      formateurProfile: { select: { id: true, metadata: true } },
    },
  });

  if (!user || user.role?.slug !== 'formateur') return null;

  const current = user.formateurProfile
    ? parseInstructorWorkspacePreferences(user.formateurProfile.metadata)
    : { ...DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES };

  const next = mergeInstructorWorkspacePreferences(current, patch);

  if (user.formateurProfile) {
    await prisma.formateurProfile.update({
      where: { id: user.formateurProfile.id },
      data: {
        metadata: metadataWithPreferences(user.formateurProfile.metadata, next) as Prisma.InputJsonValue,
      },
    });
  } else {
    await prisma.formateurProfile.create({
      data: {
        userId,
        metadata: metadataWithPreferences({}, next) as Prisma.InputJsonValue,
      },
    });
  }

  return next;
}
