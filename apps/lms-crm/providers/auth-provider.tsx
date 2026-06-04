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
  return (
    <SessionProvider session={session} basePath={nextAuthBasePath()}>
      {children}
    </SessionProvider>
  );
}
