'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { isCrmRole, isInstructorRole, isPortalRole } from '@/lib/auth/app-routing';
import { useAccountAccessGuard } from '@/hooks/use-account-access-guard';
import { PortalLayout } from './layout/portal-layout';
import { NavigationLoadingProvider } from '@/providers/navigation-loading-provider';

export function PortalShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const accessBlocked = useAccountAccessGuard();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      router.replace('/signin?callbackUrl=/mon-dossier');
      return;
    }
    if (status === 'authenticated') {
      const slug = session?.user?.roleSlug;
      if (isInstructorRole(slug)) {
        router.replace('/formateur');
        return;
      }
      if (isCrmRole(slug)) {
        router.replace('/accueil');
        return;
      }
      if (!isPortalRole(slug)) {
        router.replace('/signin');
      }
    }
  }, [status, session?.user?.roleSlug, router]);

  if (status === 'loading') {
    return <RouteTransitionLoader />;
  }

  if (status === 'unauthenticated' || !isPortalRole(session?.user?.roleSlug) || accessBlocked) {
    return null;
  }

  return (
    <NavigationLoadingProvider>
      <PortalLayout>{children}</PortalLayout>
    </NavigationLoadingProvider>
  );
}
