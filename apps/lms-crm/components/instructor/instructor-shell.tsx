'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { isCrmBackofficeRole, isInstructorRole, isPortalRole } from '@/lib/auth/app-routing';
import { NavigationLoadingProvider } from '@/providers/navigation-loading-provider';
import { useAccountAccessGuard } from '@/hooks/use-account-access-guard';
import { InstructorLayout } from './layout/instructor-layout';

export function InstructorShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const accessBlocked = useAccountAccessGuard();

  useEffect(() => {
    if (status === 'loading') return;

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
  }, [status, session?.user?.roleSlug, router]);

  if (status === 'loading') {
    return <RouteTransitionLoader />;
  }

  if (status === 'unauthenticated' || !isInstructorRole(session?.user?.roleSlug) || accessBlocked) {
    return null;
  }

  return (
    <NavigationLoadingProvider>
      <InstructorLayout>{children}</InstructorLayout>
    </NavigationLoadingProvider>
  );
}
