'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { Separator } from '@repo/ui/separator';
import { Badge } from '@repo/ui/badge';
import type { User } from '@/app/models/user';
import { CollaborateurDetailsPermissions } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-details-permissions';
import UserProfile from '@/app/(protected)/securite-configuration/acces/users/[id]/components/user-profile';
import UserDangerZone from '@/app/(protected)/securite-configuration/acces/users/[id]/components/user-danger-zone';
import { UserIamSystemLogs } from '@/app/(protected)/securite-configuration/acces/users/[id]/components/user-iam-system-logs';

export type UserIamTabKey = 'profil' | 'roles' | 'journal';

type UserIamTabsProps = {
  user: User;
  value: UserIamTabKey;
  onValueChange: (tab: UserIamTabKey) => void;
  /** Zone critique (suppression) — page IAM uniquement. */
  showDangerZone?: boolean;
  onUserUpdated?: () => void;
  hideJournalOnNarrow?: boolean;
};

/** Onglets compte IAM — identité, rôles, journal (sans métier RH). */
export function UserIamTabs({
  user,
  value,
  onValueChange,
  showDangerZone = false,
  onUserUpdated,
  hideJournalOnNarrow = false,
}: UserIamTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as UserIamTabKey)}
      className="w-full min-w-0 max-w-full text-sm text-muted-foreground"
    >
      <TabsList
        variant={showDangerZone ? 'line' : 'default'}
        className="mb-2.5 inline-flex h-auto w-auto max-w-full flex-wrap items-center gap-1"
      >
        <TabsTrigger value="profil" className="whitespace-nowrap">
          Compte
        </TabsTrigger>
        <TabsTrigger value="roles" className="whitespace-nowrap">
          Rôles &amp; permissions
        </TabsTrigger>
        <TabsTrigger
          value="journal"
          className={hideJournalOnNarrow ? 'hidden whitespace-nowrap lg:inline-flex' : 'whitespace-nowrap'}
        >
          Journal d&apos;activité
        </TabsTrigger>
      </TabsList>

      <div className="mt-4 min-w-0 max-w-full">
        <TabsContent value="profil" className="m-0 min-w-0 space-y-10">
          <UserProfile user={user} isLoading={false} onUserUpdated={onUserUpdated} />
          {showDangerZone ? (
            <>
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Zone critique</p>
              <UserDangerZone user={user} isLoading={false} />
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="roles" className="m-0 min-w-0 space-y-6">
          <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rôle IAM</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">{user.role?.name ?? '—'}</span>
              {user.role?.slug ? (
                <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
                  {user.role.slug}
                </Badge>
              ) : null}
              {user.role?.isProtected ? (
                <Badge variant="outline" appearance="light" className="text-[10px]">
                  Système
                </Badge>
              ) : null}
            </div>
          </div>
          <CollaborateurDetailsPermissions collaborateur={user} />
        </TabsContent>

        <TabsContent
          value="journal"
          className={hideJournalOnNarrow ? 'm-0 hidden min-w-0 lg:block' : 'm-0 min-w-0'}
        >
          <UserIamSystemLogs userId={user.id} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
