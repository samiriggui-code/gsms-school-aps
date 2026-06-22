'use client';

import { UserIcon } from 'lucide-react';
import { getAvatarUrl } from '@/lib/helpers';
import type { User } from '@/app/models/user';
import { IamUserSheetSidebarSummary } from './iam-user-sheet-sidebar-summary';

/** Colonne gauche fiche IAM — même structure que `RhStaffSheetSidebarSummary` (RH). */
export function IamUserSheetSidebar({ user }: { user: User }) {
  const avatarUrl = user.avatar ? getAvatarUrl(user.avatar) : null;

  return (
    <>
      <div className="w-full h-[240px] bg-muted/10 border border-border rounded-lg flex items-center justify-center overflow-hidden relative">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.name || ''}
            className="size-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2">
            <UserIcon className="size-[40px] text-muted-foreground/60" />
            <span className="text-xs text-muted-foreground font-medium">Pas de photo</span>
          </div>
        )}
      </div>

      <IamUserSheetSidebarSummary user={user} />

      <div className="bg-muted/10 border border-border/50 rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between text-2sm">
          <span className="text-muted-foreground">Rôle IAM</span>
          <span className="font-semibold text-foreground truncate max-w-[150px]">
            {user.role?.name || '—'}
          </span>
        </div>
        <div className="flex items-center justify-between text-2sm">
          <span className="text-muted-foreground">Compte vérifié</span>
          <span className="font-semibold text-foreground">
            {user.emailVerifiedAt ? 'Oui' : 'Non'}
          </span>
        </div>
      </div>
    </>
  );
}
