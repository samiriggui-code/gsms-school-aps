'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { NavigationLoadingProvider } from '@/providers/navigation-loading-provider';
import { fetchSessionRoleSlug, isInstructorRole, isPortalRole } from '@/lib/auth/app-routing';
import { useAccountAccessGuard } from '@/hooks/use-account-access-guard';
import { Demo1Layout } from '../components/layouts/demo1/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const accessBlocked = useAccountAccessGuard();
  const [allowDevBypass, setAllowDevBypass] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
      return;
    }
    if (status === 'authenticated') {
      const slug = session?.user?.roleSlug;
      if (isPortalRole(slug)) {
        router.replace('/mon-dossier');
        return;
      }
      if (isInstructorRole(slug)) {
        router.replace('/formateur');
        return;
      }
      if (!slug) {
        void fetchSessionRoleSlug(6).then((freshSlug) => {
          if (isPortalRole(freshSlug)) router.replace('/mon-dossier');
          else if (isInstructorRole(freshSlug)) router.replace('/formateur');
        });
      }
    }
  }, [status, session?.user?.roleSlug, router]);

  useEffect(() => {
    if (status !== 'loading') {
      setAllowDevBypass(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        setAllowDevBypass(true);
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  if (status === 'loading' && !allowDevBypass) {
    return <RouteTransitionLoader />;
  }

  if (status === 'unauthenticated' || accessBlocked) {
    return null;
  }

  if (status === 'authenticated' && (isPortalRole(session?.user?.roleSlug) || isInstructorRole(session?.user?.roleSlug))) {
    return null;
  }

  return session || allowDevBypass ? (
    <div className="flex min-h-screen w-full">
      <Suspense fallback={<RouteTransitionLoader />}>
        <NavigationLoadingProvider>
          <Demo1Layout>{children}</Demo1Layout>
        </NavigationLoadingProvider>
      </Suspense>
    </div>
  ) : null;
}
