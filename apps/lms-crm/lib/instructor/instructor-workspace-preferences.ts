import { z } from 'zod';

export const INSTRUCTOR_WORKSPACE_PREFS_METADATA_KEY = 'workspacePreferences';

export const InstructorWorkspacePreferencesSchema = z.object({
  notificationsInApp: z.boolean(),
  notificationsEmail: z.boolean(),
  notificationsSessionReminders: z.boolean(),
  notificationsAnnouncements: z.boolean(),
  notificationsContentReview: z.boolean(),
  chatEnabled: z.boolean(),
  chatSoundEnabled: z.boolean(),
  chatUnreadBadge: z.boolean(),
  showOnlineStatus: z.boolean(),
});

export type InstructorWorkspacePreferences = z.infer<typeof InstructorWorkspacePreferencesSchema>;

export const InstructorWorkspacePreferencesPatchSchema =
  InstructorWorkspacePreferencesSchema.partial();

export const DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES: InstructorWorkspacePreferences = {
  notificationsInApp: true,
  notificationsEmail: true,
  notificationsSessionReminders: true,
  notificationsAnnouncements: true,
  notificationsContentReview: true,
  chatEnabled: true,
  chatSoundEnabled: false,
  chatUnreadBadge: true,
  showOnlineStatus: true,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function parseInstructorWorkspacePreferences(
  metadata: unknown,
): InstructorWorkspacePreferences {
  const root = asRecord(metadata);
  const raw = asRecord(root?.[INSTRUCTOR_WORKSPACE_PREFS_METADATA_KEY]);
  if (!raw) return { ...DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES };

  const parsed = InstructorWorkspacePreferencesSchema.safeParse({
    ...DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES,
    ...raw,
  });
  return parsed.success ? parsed.data : { ...DEFAULT_INSTRUCTOR_WORKSPACE_PREFERENCES };
}

export function mergeInstructorWorkspacePreferences(
  current: InstructorWorkspacePreferences,
  patch: Partial<InstructorWorkspacePreferences>,
): InstructorWorkspacePreferences {
  const parsed = InstructorWorkspacePreferencesSchema.safeParse({ ...current, ...patch });
  return parsed.success ? parsed.data : current;
}

export type InstructorPreferenceToggleDef = {
  key: keyof InstructorWorkspacePreferences;
  label: string;
  description: string;
};

export const INSTRUCTOR_NOTIFICATION_PREFERENCE_TOGGLES: InstructorPreferenceToggleDef[] = [
  {
    key: 'notificationsInApp',
    label: 'Notifications in-app',
    description: 'Cloche en haut de page, annonces et alertes dans l’espace formateur.',
  },
  {
    key: 'notificationsEmail',
    label: 'Notifications par e-mail',
    description: 'Recevoir une copie e-mail des alertes importantes (sessions, validation contenu).',
  },
  {
    key: 'notificationsSessionReminders',
    label: 'Rappels de sessions',
    description: 'Sessions à venir, feuilles de présence et changements de planning.',
  },
  {
    key: 'notificationsAnnouncements',
    label: 'Annonces stagiaires',
    description: 'Accusés et retours lorsque vous publiez une annonce e-formation.',
  },
  {
    key: 'notificationsContentReview',
    label: 'Validation parcours LMS',
    description: 'Statut de modération de vos UV, activités et quiz soumis à l’administration.',
  },
];

export const INSTRUCTOR_CHAT_PREFERENCE_TOGGLES: InstructorPreferenceToggleDef[] = [
  {
    key: 'chatEnabled',
    label: 'Messagerie interne',
    description: 'Afficher l’icône chat et accéder aux conversations avec l’équipe.',
  },
  {
    key: 'chatUnreadBadge',
    label: 'Pastille messages non lus',
    description: 'Compteur sur l’icône chat lorsque de nouveaux messages arrivent.',
  },
  {
    key: 'chatSoundEnabled',
    label: 'Son à la réception',
    description: 'Signal sonore discret lors d’un nouveau message (navigateur ouvert).',
  },
  {
    key: 'showOnlineStatus',
    label: 'Statut de présence visible',
    description: 'Les autres utilisateurs voient votre statut (en ligne, occupé, absent…).',
  },
];
