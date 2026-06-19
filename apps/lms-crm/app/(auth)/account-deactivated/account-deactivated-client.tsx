'use client';

import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AccountAccessBlockedShell } from '@/components/auth/account-access-blocked-dialog';
import type { AccountBlockReason } from '@/lib/auth/account-access';

const VALID_REASONS = new Set<AccountBlockReason>([
  'pending',
  'inactive',
  'blocked',
  'banned',
  'archived',
]);

export default function AccountDeactivatedPage() {
  const params = useSearchParams();
  const raw = params.get('reason') ?? 'inactive';
  const reason: AccountBlockReason = VALID_REASONS.has(raw as AccountBlockReason)
    ? (raw as AccountBlockReason)
    : 'inactive';

  return (
    <AccountAccessBlockedShell
      blocked
      reason={reason}
      onAcknowledge={() => {
        void signOut({ callbackUrl: '/signin' });
      }}
      className="min-h-[70vh]"
    >
      <div className="min-h-[70vh]" aria-hidden />
    </AccountAccessBlockedShell>
  );
}
