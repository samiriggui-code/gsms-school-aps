'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { toAbsoluteUrl } from '@/lib/helpers';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="antialiased flex h-full text-base text-foreground bg-background items-center justify-center p-6">
        <div className="flex flex-col items-center justify-center max-w-md text-center mx-auto">
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

          <h2 className="text-2xl font-semibold mb-4">Une erreur critique est survenue</h2>
          <p className="text-secondary-foreground mb-8 text-base">
            L'application a rencontré un problème inattendu. Nous avons été informés et nous travaillons à sa résolution.
          </p>
          
          <button 
            onClick={() => reset()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
