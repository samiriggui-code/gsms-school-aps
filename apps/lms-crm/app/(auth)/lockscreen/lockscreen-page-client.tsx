'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertCircle, LoaderCircleIcon } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';

export default function LockscreenPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const avatar = searchParams?.get('avatar') || '/media/avatars/300-2.png';
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onUnlock() {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (response?.error) {
        const errorData = JSON.parse(response.error);
        setError(errorData.message);
      } else {
        router.push('/accueil');
      }
    } catch {
      setError('Impossible de deverrouiller la session.');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="w-full space-y-5">
      <div className="text-center space-y-1 pb-2">
        <div className="flex justify-center pb-2">
          <img
            src={avatar}
            alt="Avatar utilisateur"
            className="size-16 rounded-full border border-border object-cover"
          />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Ecran verrouille</h1>
        <p className="text-sm text-muted-foreground">
          Saisissez votre mot de passe pour reprendre la session.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertIcon>
            <AlertCircle />
          </AlertIcon>
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Compte</p>
        <Input value={email} disabled readOnly />
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Mot de passe</p>
        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Votre mot de passe"
        />
      </div>

      <div className="flex flex-col gap-2.5">
        <Button type="button" onClick={onUnlock} disabled={isProcessing || !email}>
          {isProcessing ? <LoaderCircleIcon className="size-4 animate-spin" /> : null}
          Deverrouiller
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/signin">Retour a la connexion</Link>
        </Button>
      </div>
    </div>
  );
}
