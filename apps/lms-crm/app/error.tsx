'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full p-6 text-center">
      <div className="mb-10">
        <img
          src={toAbsoluteUrl('/media/illustrations/20.svg')}
          className="dark:hidden max-h-[160px]"
          alt="image"
        />
        <img
          src={toAbsoluteUrl('/media/illustrations/20-dark.svg')}
          className="hidden dark:block max-h-[160px]"
          alt="image"
        />
      </div>

      <Badge variant="destructive" className="mb-3">
        Erreur 500
      </Badge>

      <h3 className="text-2xl font-semibold text-mono mb-2">
        Erreur Interne du Serveur
      </h3>

      <div className="text-base text-secondary-foreground mb-10 max-w-md">
        Une erreur s'est produite sur le serveur. Veuillez réessayer plus tard ou &nbsp;
        <a
          href="#"
          className="text-primary font-medium hover:text-primary-active"
        >
          Contactez-nous
        </a>
        &nbsp; pour obtenir de l'aide.
      </div>

      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="outline">
          Réessayer
        </Button>
        <Button asChild>
          <Link href="/">Retour à l'accueil</Link>
        </Button>
      </div>
    </div>
  );
}
