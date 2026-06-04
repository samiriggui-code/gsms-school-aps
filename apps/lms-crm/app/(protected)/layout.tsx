'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { RouteTransitionLoader } from '@/components/common/route-transition-loader';
import { NavigationLoadingProvider } from '@/providers/navigation-loading-provider';
import { Demo1Layout } from '../components/layouts/demo1/layout';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [allowDevBypass, setAllowDevBypass] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [status, router]);

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

  if (status === 'unauthenticated') {
    return null;
  }

  return session || allowDevBypass ? (
    <Suspense fallback={<RouteTransitionLoader />}>
      <NavigationLoadingProvider>
        <Demo1Layout>{children}</Demo1Layout>
      </NavigationLoadingProvider>
    </Suspense>
  ) : null;
}
