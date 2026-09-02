'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import type { Session } from 'next-auth';
import { CollaborateurDetailsSheet } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-details-sheet';
import { CandidatureDetailSheet } from '@/app/(protected)/gestion-academique/vie-scolaire/etudiants/components/candidature-detail-sheet';
import { User as CollaborateurModel, UserStatus } from '@/app/models/user';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
  ToolbarActions,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Alert, AlertDescription, AlertTitle } from '@repo/ui/alert';
import { Button } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';

const APPRENTICE_SLUGS = new Set(['candidat', 'eleve']);

/** Déclenche le même flux que les fiches liste RH (`GET collaborateurs/:id` ne filtre pas sur le slug rôle). */
function collaborateurStub(session: Session): CollaborateurModel {
  const u = session.user;
  const now = new Date();
  const slugLower = (u.roleSlug || '').toLowerCase();
  const resolvedSlug =
    slugLower ||
    (u.roleName === 'Formateur' ? 'formateur' : u.roleName === 'Collaborateur' ? 'collaborateur' : 'collaborateur');
  const roleId = u.roleId || '';
  return {
    id: u.id,
    email: u.email,
    name: u.name ?? u.email ?? 'Profil',
    roleId,
    role: {
      id: roleId,
      slug: resolvedSlug,
      name: u.roleName || resolvedSlug || 'Rôle',
      isTrashed: false,
      isProtected: false,
      isDefault: false,
      createdAt: now,
    },
    status: (u.status || 'ACTIVE') as UserStatus,
    createdAt: now,
    updatedAt: now,
    isTrashed: false,
    isProtected: false,
  };
}

export default function MonProfilPage() {
  const { title, description } = usePageToolbarMeta('/mon-profil');
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <Container className="pb-8">
        <div className="space-y-4 py-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[480px] w-full max-w-[1160px]" />
        </div>
      </Container>
    );
  }

  if (status !== 'authenticated' || !session?.user?.id || !session.user.roleId) {
    return (
      <Container className="pb-8">
        <Alert variant="destructive">
          <AlertTitle>Session requise</AlertTitle>
          <AlertDescription>Connectez-vous pour accéder à votre fiche métier.</AlertDescription>
        </Alert>
      </Container>
    );
  }

  const slug = (session.user.roleSlug || '').toLowerCase();

  let body: ReactNode;

  if (APPRENTICE_SLUGS.has(slug)) {
    body = (
      <CandidatureDetailSheet
        presentation="page"
        open
        hubUserId={session.user.id}
        onOpenChange={() => {}}
        initialTab="overview"
      />
    );
  } else {
    const stub = collaborateurStub(session);
    body = (
      <CollaborateurDetailsSheet
        presentation="page"
        open
        collaborateur={stub}
        variant={slug === 'formateur' ? 'formateur' : 'collaborateur'}
        onOpenChange={() => {}}
      />
    );
  }

  return (
    <Container className="pb-8">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{title}</ToolbarTitle>
          <ToolbarDescription>{description}</ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/securite-configuration/acces/users/${session.user.id}`}>
              Mon compte IAM
            </Link>
          </Button>
        </ToolbarActions>
      </Toolbar>
      {body}
    </Container>
  );
}
