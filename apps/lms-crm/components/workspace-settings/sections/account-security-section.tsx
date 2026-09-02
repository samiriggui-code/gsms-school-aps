'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { KeyRound, Lock } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import { portalMuted } from '@/components/portal/layout/portal-ui';

export function AccountSecuritySection() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? '';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Connexion & sécurité</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className={portalMuted}>
          Email de connexion :{' '}
          <span className="font-medium text-foreground">{email || '—'}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/lockscreen?email=${encodeURIComponent(email)}`}>
              <Lock className="me-2 size-4" />
              Verrouiller la session
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/reset-password">
              <KeyRound className="me-2 size-4" />
              Réinitialiser le mot de passe
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
