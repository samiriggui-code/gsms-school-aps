'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';

/** Redirige vers /account-deactivated si la session indique un compte bloqué. */
export function useAccountAccessGuard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const blocked = Boolean((session?.user as { accessBlocked?: boolean } | undefined)?.accessBlocked);

  useEffect(() => {
    if (status !== 'authenticated' || !blocked) return;
    void signOut({ redirect: false }).then(() => {
      router.replace('/account-deactivated?reason=blocked');
    });
  }, [status, blocked, router]);

  return blocked;
}
