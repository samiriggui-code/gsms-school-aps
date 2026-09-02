'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Info, Settings } from 'lucide-react';
import { User as CollaborateurModel } from '@/app/models/user';
import { CollaborateurDetailsOverview } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/components/collaborateur-details-overview';
import { UserAvatar } from '@/components/common/user-avatar';
import { apiFetch } from '@/lib/api';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { portalMuted } from '@/components/portal/layout/portal-ui';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';
import { getCollaborateurStatusProps } from '@/app/(protected)/gestion-ressources/rh/collaborateurs/constants/status';

export function InstructorProfilPage() {
  const query = useQuery({
    queryKey: ['instructor-profile'],
    queryFn: async () => {
      const res = await apiFetch('/api/instructor/profile');
      const json = (await res.json()) as {
        success?: boolean;
        data?: { profile: CollaborateurModel };
      };
      if (!res.ok || !json.success || !json.data?.profile) {
        throw new Error('Profil indisponible');
      }
      return json.data.profile;
    },
  });

  if (query.isLoading) {
    return (
      <PortalPageShell>
        <Skeleton className="h-10 w-64" />
        <Skeleton className="mt-6 h-[480px] w-full" />
      </PortalPageShell>
    );
  }

  if (query.isError || !query.data) {
    return (
      <PortalPageShell>
        <p className={portalMuted}>Impossible de charger votre profil.</p>
      </PortalPageShell>
    );
  }

  const profile = query.data;
  const statusProps = getCollaborateurStatusProps(profile.status);

  return (
    <PortalPageShell width="full">
      <PortalPageHero
        title="Mon profil"
        description="Consultation de votre fiche formateur — les modifications passent par l’administration / les RH."
        badge="Lecture seule"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/formateur/parametres">
              <Settings className="me-2 size-4" />
              Paramètres du compte
            </Link>
          </Button>
        }
      />

      <Alert variant="secondary" appearance="outline" className="mt-4 border-primary/20 bg-primary/5">
        <AlertIcon>
          <Info className="size-4 text-primary" />
        </AlertIcon>
        <AlertTitle className="text-sm font-semibold">Mode consultation</AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Cette page reprend les informations visibles dans le CRM RH, sans actions d’édition. Pour mettre à jour
          vos coordonnées, documents ou agréments, contactez l’administration. Les{' '}
          <Link href="/formateur/parametres" className="font-medium text-primary underline-offset-2 hover:underline">
            paramètres du compte
          </Link>{' '}
          (session, mot de passe) restent disponibles séparément.
        </AlertDescription>
      </Alert>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:p-5">
          <UserAvatar
            avatar={profile.avatar}
            className="size-16 shrink-0 rounded-full border border-border"
            fallback="/media/avatars/300-1.png"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">{profile.name}</h2>
              <Badge variant={statusProps.variant as 'success' | 'warning' | 'destructive' | 'secondary'} appearance="light" size="sm">
                {statusProps.label}
              </Badge>
              <Badge variant="default" appearance="light" size="sm">
                Formateur
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{profile.email}</p>
            {profile.proEmail ? (
              <p className="text-xs text-muted-foreground">Pro : {profile.proEmail}</p>
            ) : null}
            {profile.jobFunction ? (
              <p className="mt-1 text-xs text-muted-foreground">Fonction : {profile.jobFunction}</p>
            ) : null}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <CollaborateurDetailsOverview
            collaborateur={profile}
            overviewVariant="formateur"
            showRecentActivity={false}
          />
        </div>
      </div>
    </PortalPageShell>
  );
}
