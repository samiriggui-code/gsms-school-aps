'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CollaborateurDetailsPermissions } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-details-permissions';
import UserProfile from './user-profile';
import UserDangerZone from './user-danger-zone';
import { UserIamSystemLogs } from './user-iam-system-logs';
import { useUser } from './user-context';
import { useMaxWidthLg } from '@/hooks/use-max-width-lg';

const TAB_KEYS = ['profil', 'roles', 'journal'] as const;
type ProfileTabKey = (typeof TAB_KEYS)[number];

function tabFromQuery(raw: string | null): ProfileTabKey {
  if (raw && (TAB_KEYS as readonly string[]).includes(raw)) {
    return raw as ProfileTabKey;
  }
  return 'profil';
}

function UserIamTabsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-[280px] w-full" />
    </div>
  );
}

export function UserIamProfileTabsSuspenseFallback() {
  return <UserIamTabsSkeleton />;
}

export function UserIamProfileTabsConnected() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<ProfileTabKey>(() =>
    tabFromQuery(searchParams.get('tab')),
  );
  const hideJournalOnNarrow = useMaxWidthLg();

  useEffect(() => {
    setTab(tabFromQuery(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (!hideJournalOnNarrow || tab !== 'journal') return;
    setTab('profil');
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete('tab');
    const q = qs.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [hideJournalOnNarrow, tab, pathname, router, searchParams]);

  const onTabChange = (value: string) => {
    const key = tabFromQuery(value);
    setTab(key);
    const qs = new URLSearchParams(searchParams.toString());
    if (key === 'profil') qs.delete('tab');
    else qs.set('tab', key);
    const q = qs.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const invalidateUserDetail = () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['user-user', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-users'] });
    }
  };

  if (isLoading || !user) {
    return <UserIamTabsSkeleton />;
  }

  return (
    <Tabs value={tab} onValueChange={onTabChange} className="w-full text-sm text-muted-foreground">
      <TabsList variant="line" className="mb-4 inline-flex h-auto max-w-full flex-wrap gap-y-1">
        <TabsTrigger value="profil" className="whitespace-nowrap">
          Profil
        </TabsTrigger>
        <TabsTrigger value="roles" className="whitespace-nowrap">
          Rôles &amp; permissions
        </TabsTrigger>
        <TabsTrigger value="journal" className="hidden whitespace-nowrap lg:inline-flex">
          Journal d&apos;activité
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profil" className="mt-0 space-y-10 focus-visible:ring-0">
        <UserProfile user={user} isLoading={false} onUserUpdated={invalidateUserDetail} />
        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wide text-destructive">Zone critique</p>
        <UserDangerZone user={user} isLoading={false} />
      </TabsContent>

      <TabsContent value="roles" className="mt-0 space-y-6 focus-visible:ring-0">
        <div className="rounded-lg border border-border/60 bg-muted/10 px-4 py-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rôle IAM</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{user.role?.name ?? '—'}</span>
            {user.role?.slug ?
              <Badge variant="secondary" appearance="light" className="text-[10px] uppercase">
                {user.role.slug}
              </Badge>
            : null}
            {user.role?.isProtected ?
              <Badge variant="outline" appearance="light" className="text-[10px]">
                Système
              </Badge>
            : null}
          </div>
        </div>
        <CollaborateurDetailsPermissions collaborateur={user} />
      </TabsContent>

      <TabsContent value="journal" className="mt-0 hidden focus-visible:ring-0 lg:block">
        <UserIamSystemLogs userId={user.id} />
      </TabsContent>
    </Tabs>
  );
}

export default function UserIamProfileTabsWithSuspense() {
  return (
    <Suspense fallback={<UserIamProfileTabsSuspenseFallback />}>
      <UserIamProfileTabsConnected />
    </Suspense>
  );
}
