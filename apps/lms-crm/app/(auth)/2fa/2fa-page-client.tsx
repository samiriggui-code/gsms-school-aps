'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Alert, AlertIcon, AlertTitle, AlertDescription } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import { useTranslation } from '@/hooks/useTranslation';

/**
 * 2FA UI volontairement désactivée tant que OTP (verify/resend) n’est pas branché.
 * Évite une fausse sensation de sécurité (stubs 501 / code 000000).
 */
export default function TwoFactorPageClient() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') ?? '/signin';

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-4 py-10">
      <Link href="/" className="mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={toAbsoluteUrl('/media/app/mini-logo.svg')}
          alt="Logo"
          className="h-8 dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={toAbsoluteUrl('/media/app/mini-logo-dark.svg')}
          alt="Logo"
          className="hidden h-8 dark:block"
        />
      </Link>

      <Alert variant="warning" appearance="light" className="max-w-md">
        <AlertIcon>
          <AlertCircle className="size-4" />
        </AlertIcon>
        <AlertTitle>{t('auth.twoFactor.title')}</AlertTitle>
        <AlertDescription>
          La double authentification n’est pas encore activée. Connectez-vous avec votre e-mail
          professionnel et votre mot de passe.
        </AlertDescription>
      </Alert>

      <Button asChild className="w-full max-w-md">
        <Link href={callbackUrl.startsWith('/') ? callbackUrl : '/signin'}>
          {t('auth.twoFactor.backToSignIn')}
        </Link>
      </Button>
    </div>
  );
}
