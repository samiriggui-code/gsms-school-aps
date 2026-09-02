'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/dist/client/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import { LoaderCircleIcon } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [message, setMessage] = useState<string | null>('Verification en cours...');
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (token: string) => {
      try {
        const res = await apiFetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (res.status === 200) {
          setError(null);
          setMessage('Votre email a ete verifie avec succes !');
          setTimeout(() => {
            router.push('/signin');
          }, 2000);
        } else {
          setMessage(null);
          setError(data.message || 'La verification a echoue.');
        }
      } catch {
        setMessage(null);
        setError('Une erreur est survenue pendant la verification.');
      }
    },
    [router],
  );

  useEffect(() => {
    const token = searchParams?.get('token');

    if (!token) {
      setMessage(null);
      setError('Token invalide ou manquant.');
      return;
    }

    verify(token);
  }, [searchParams, verify]);

  return (
    <Suspense>
      <div className="w-full space-y-6">
        <h1 className="text-2x font-semibold">Verification de l'email</h1>
        {error && (
          <>
            <Alert variant="destructive">
              <AlertIcon>
                <AlertCircle />
              </AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>

            <Button asChild>
              <Link href="/signin" className="text-primary">
                Retour a la connexion
              </Link>
            </Button>
          </>
        )}

        {message && (
          <Alert>
            <AlertIcon>
              <LoaderCircleIcon className="size-4 animate-spin stroke-muted-foreground" />
            </AlertIcon>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        )}
      </div>
    </Suspense>
  );
}
