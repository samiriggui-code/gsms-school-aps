import type { User } from '@/app/models/user';
import { userIamLoginSubtitle } from '@/lib/user-email-routing';

export type RhStaffSidebarVariant = 'collaborateur' | 'formateur';

type RhStaffSidebarUser = Pick<
  User,
  'name' | 'email' | 'proEmail' | 'userCategory' | 'jobFunction' | 'id'
>;

/** Lignes résumé colonne gauche fiches RH (collaborateur / formateur). */
export function buildRhStaffSidebarRows(
  user: RhStaffSidebarUser,
  variant: RhStaffSidebarVariant = 'collaborateur',
) {
  return [
    { label: 'Nom complet', value: user.name },
    { label: 'Email professionnel', value: userIamLoginSubtitle(user) },
    { label: 'Catégorie', value: user.userCategory },
    { label: 'Fonction', value: user.jobFunction || '-' },
    {
      label: variant === 'formateur' ? 'ID formateur' : 'ID Collaborateur',
      value: user.id.substring(0, 8),
    },
  ] as const;
}
