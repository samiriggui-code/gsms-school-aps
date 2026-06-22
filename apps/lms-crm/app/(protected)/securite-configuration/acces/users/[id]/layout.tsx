'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, MoveLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/common/container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetBody, SheetHeader } from '@/components/ui/sheet';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { UserProvider } from './components/user-context';
import UserHero from './components/user-hero';
import { UserIamHeadline } from './components/user-iam-headline';

export default function UserLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-user', id],
    queryFn: async () => {
      const response = await apiFetch(`/api/sections/securite-configuration/acces/users/${id}`);

      if (response.status == 404) {
        router.push('/securite-configuration/acces/users');
      }

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message);
      }

      const json = await response.json();
      return json;
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const shellClass =
    'flex min-h-0 min-w-0 w-full max-w-[min(100%,1160px)] mx-auto flex-col overflow-hidden rounded-xl border border-border bg-background shadow-sm sm:min-h-[calc(100dvh-9rem)]';

  return (
    <UserProvider user={user} isLoading={isLoading}>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Fiche utilisateur</ToolbarTitle>
            <ToolbarDescription>
              Identité, rôles IAM et historique d&apos;accès pour ce compte.
            </ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            {session?.user?.id === id ?
              <Button asChild variant="outline" size="sm">
                <Link href="/mon-profil">
                  <ExternalLink className="size-4" />
                  Fiche métier
                </Link>
              </Button>
            : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/securite-configuration/acces/users">
                <MoveLeft className="size-4" />
                Retour aux utilisateurs
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>

        <div className={shellClass}>
          <SheetHeader className="flex flex-col gap-1 space-y-0 border-b border-border bg-background px-4 py-3.5 text-start sm:px-5 sm:text-start shrink-0">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
              Compte utilisateur · IAM
            </h2>
          </SheetHeader>

          <UserIamHeadline user={user} isLoading={isLoading} />

          <SheetBody className="p-0 flex-1 overflow-hidden flex flex-col min-h-0 bg-background">
            <ScrollArea
              className="flex-1 min-h-0 mx-1.5"
              viewportClassName="[&>div]:h-full [&>div>div]:h-full"
            >
              <div className="flex flex-wrap lg:flex-nowrap px-3.5 grow pb-8">
                <div className="w-full shrink-0 lg:w-[280px]">
                  <UserHero user={user} isLoading={isLoading} variant="sidebar" />
                </div>

                <div className="grow lg:border-s border-border space-y-5 py-5 lg:ps-5 min-w-0">
                  {children}
                </div>
              </div>
            </ScrollArea>
          </SheetBody>
        </div>
      </Container>
    </UserProvider>
  );
}
