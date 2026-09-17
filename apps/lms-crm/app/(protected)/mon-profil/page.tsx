'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { Card, CardContent } from '@repo/ui/card';
import { Button } from '@repo/ui/button';

/** Profil staff CRM — version allégée (plus de sheets RH/candidature imbriqués). */
export default function MonProfilPage() {
  const { data: session, status } = useSession();
  const name = session?.user?.name || session?.user?.email || '…';

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Mon profil</ToolbarTitle>
            <ToolbarDescription>Compte staff connecté au CRM.</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container className="pb-8">
        <Card>
          <CardContent className="space-y-3 py-8">
            {status === 'loading' ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : (
              <>
                <p className="text-sm">
                  <span className="text-muted-foreground">Connecté : </span>
                  {name}
                </p>
                <p className="text-xs text-muted-foreground font-mono">
                  {session?.user?.roleSlug || 'rôle inconnu'}
                </p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/accueil">Retour accueil</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
