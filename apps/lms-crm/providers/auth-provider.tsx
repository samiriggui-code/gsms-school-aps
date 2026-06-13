'use client';

import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';

interface AuthProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

function nextAuthBasePath(): string {
  const prefix = nextPublicPathPrefix();
  return prefix ? `${prefix}/api/auth` : '/api/auth';
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <SessionProvider
      session={session}
      basePath={nextAuthBasePath()}
      // En dev Turbopack peut bloquer /api/auth/session plusieurs secondes au redémarrage.
      refetchOnWindowFocus={!isDev}
      refetchInterval={isDev ? 0 : 5 * 60}
    >
      {children}
    </SessionProvider>
  );
}
