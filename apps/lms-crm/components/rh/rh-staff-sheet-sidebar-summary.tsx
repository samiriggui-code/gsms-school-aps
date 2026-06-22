'use client';

import { User as RhUser } from '@/app/models/user';
import { userIamLoginSubtitle, userPersonalMailbox } from '@/lib/user-email-routing';
import { SCHOOL_USER_CATEGORY_LABELS } from '@/lib/rh-school-profile-fields';

type RhStaffSheetSidebarSummaryProps = {
  user: RhUser;
  /** Ex. « ID Collaborateur » ou « ID formateur » */
  idLabel: string;
};

function formatCategory(user: RhUser): string {
  if (user.userCategory && user.userCategory in SCHOOL_USER_CATEGORY_LABELS) {
    return SCHOOL_USER_CATEGORY_LABELS[user.userCategory as keyof typeof SCHOOL_USER_CATEGORY_LABELS];
  }
  return user.userCategory || '—';
}

/** Bloc résumé gauche des fiches RH (collaborateur / formateur) — emails alignés métier. */
export function RhStaffSheetSidebarSummary({ user, idLabel }: RhStaffSheetSidebarSummaryProps) {
  const rows = [
    { label: 'Nom complet', value: user.name || '—' },
    { label: 'Email pro. (connexion)', value: userIamLoginSubtitle(user) },
    { label: 'Email personnel', value: userPersonalMailbox(user) ?? '—' },
    { label: 'Catégorie', value: formatCategory(user) },
    { label: 'Fonction', value: user.jobFunction || '—' },
    { label: idLabel, value: user.id.substring(0, 8) },
  ];

  return (
    <div className="space-y-3">
      {rows.map((item) => (
        <div key={item.label} className="flex justify-between items-center gap-2 text-2sm">
          <span className="text-muted-foreground shrink-0">{item.label}</span>
          <span
            className="font-semibold text-foreground truncate max-w-[150px]"
            title={item.value}
          >
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
