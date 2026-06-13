'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { accountBlockMessage, type AccountBlockReason } from '@/lib/auth/account-access';
import { Button } from '@/components/ui/button';
import { toAbsoluteUrl } from '@/lib/helpers';

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
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <img
        src={toAbsoluteUrl('/media/illustrations/23.svg')}
        className="mb-8 max-h-[140px] dark:hidden"
        alt=""
      />
      <img
        src={toAbsoluteUrl('/media/illustrations/23-dark.svg')}
        className="mb-8 hidden max-h-[140px] dark:block"
        alt=""
      />
      <h1 className="text-xl font-semibold tracking-tight">Compte désactivé</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {accountBlockMessage(reason)}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" asChild>
          <Link href="/">Retour au site</Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => signOut({ callbackUrl: '/signin' })}
        >
          Se déconnecter
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Besoin d’aide ?{' '}
        <Link href="/" className="text-primary underline-offset-2 hover:underline">
          Contactez l’établissement
        </Link>
      </p>
    </div>
  );
}
