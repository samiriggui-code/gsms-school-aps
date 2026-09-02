'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/skeleton';
import { UserIamTabs, type UserIamTabKey } from '@/components/users/user-iam-tabs';
import { useUser } from './user-context';
import { useMaxWidthLg } from '@/hooks/use-max-width-lg';

const TAB_KEYS = ['profil', 'roles', 'journal'] as const;

function tabFromQuery(raw: string | null): UserIamTabKey {
  if (raw && (TAB_KEYS as readonly string[]).includes(raw)) {
    return raw as UserIamTabKey;
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

  const [tab, setTab] = useState<UserIamTabKey>(() => tabFromQuery(searchParams.get('tab')));
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

  const onTabChange = (key: UserIamTabKey) => {
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
    <UserIamTabs
      user={user}
      value={tab}
      onValueChange={onTabChange}
      showDangerZone
      onUserUpdated={invalidateUserDetail}
      hideJournalOnNarrow={hideJournalOnNarrow}
    />
  );
}

export default function UserIamProfileTabsWithSuspense() {
  return (
    <Suspense fallback={<UserIamProfileTabsSuspenseFallback />}>
      <UserIamProfileTabsConnected />
    </Suspense>
  );
}
