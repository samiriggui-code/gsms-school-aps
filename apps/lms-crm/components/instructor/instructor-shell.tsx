'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { isCrmBackofficeRole, isInstructorRole, isPortalRole } from '@/lib/auth/app-routing';
import { NavigationLoadingProvider } from '@/providers/navigation-loading-provider';
import { useAccountAccessGuard } from '@/hooks/use-account-access-guard';
import { AccountAccessBlockedShell } from '@/components/auth/account-access-blocked-dialog';
import { InstructorLayout } from './layout/instructor-layout';

export function InstructorShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { blocked, reason } = useAccountAccessGuard();

  useEffect(() => {
    if (status === 'loading' || blocked) return;

    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/formateur');
      return;
    }
    if (status === 'authenticated') {
      const slug = session?.user?.roleSlug;
      if (isPortalRole(slug)) {
        router.replace('/mon-dossier');
        return;
      }
      if (isCrmBackofficeRole(slug)) {
        router.replace('/accueil');
        return;
      }
      if (!isInstructorRole(slug)) {
        router.replace('/signin');
      }
    }
  }, [status, session?.user?.roleSlug, router, blocked]);

  const handleBlockedAcknowledge = () => {
    void signOut({
      callbackUrl: `/signin?accountBlocked=${encodeURIComponent(reason)}`,
    });
  };

  if (status === 'loading') {
    return <RouteTransitionLoader />;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  if (!isInstructorRole(session?.user?.roleSlug) && !blocked) {
    return null;
  }

  return (
    <AccountAccessBlockedShell
      blocked={blocked}
      reason={reason}
      onAcknowledge={handleBlockedAcknowledge}
    >
      <NavigationLoadingProvider>
        <InstructorLayout>{children}</InstructorLayout>
      </NavigationLoadingProvider>
    </AccountAccessBlockedShell>
  );
}
