'use client';

import type { User } from '@/app/models/user';
import { userIamLoginSubtitle, userPersonalMailbox } from '@/lib/user-email-routing';
import { getUserStatusProps } from '@/app/(protected)/securite-configuration/acces/users/constants/status';
import type { UserStatus } from '@/app/models/user';

/** Résumé compte IAM (pas de fonction, qualification, catégorie métier). */
export function IamUserSheetSidebarSummary({ user }: { user: User }) {
  const statusLabel = getUserStatusProps(user.status as UserStatus).label;

  const rows = [
    { label: 'Nom complet', value: user.name || '—' },
    { label: 'Email pro. (connexion)', value: userIamLoginSubtitle(user) },
    { label: 'Email personnel', value: userPersonalMailbox(user) ?? '—' },
    { label: 'Téléphone', value: user.phone?.trim() || '—' },
    { label: 'Rôle IAM', value: user.role?.name || '—' },
    { label: 'ID utilisateur', value: user.id.substring(0, 8) },
    { label: 'Statut compte', value: statusLabel },
    { label: 'Email vérifié', value: user.emailVerifiedAt ? 'Oui' : 'Non' },
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
