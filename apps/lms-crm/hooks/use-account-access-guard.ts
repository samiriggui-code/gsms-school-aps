'use client';

import { useSession } from 'next-auth/react';
import type { AccountBlockReason } from '@/lib/auth/account-access';

const VALID_REASONS = new Set<AccountBlockReason>([
  'pending',
  'inactive',
  'blocked',
  'banned',
  'archived',
]);

function parseBlockReason(value: unknown): AccountBlockReason {
  if (typeof value === 'string' && VALID_REASONS.has(value as AccountBlockReason)) {
    return value as AccountBlockReason;
  }
  return 'inactive';
}

/** Détecte un compte suspendu / désactivé via la session (rafraîchie côté serveur). */
export function useAccountAccessGuard() {
  const { data: session, status } = useSession();
  const blocked =
    status === 'authenticated' &&
    Boolean((session?.user as { accessBlocked?: boolean } | undefined)?.accessBlocked);

  const reason = parseBlockReason(
    (session?.user as { accessBlockReason?: string } | undefined)?.accessBlockReason,
  );

  return { blocked, reason };
}
