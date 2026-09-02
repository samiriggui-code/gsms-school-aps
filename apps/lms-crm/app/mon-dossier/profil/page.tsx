'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Settings } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalProfileCard, type PortalProfileData } from '@/components/portal/portal-profile-card';
import { Button } from '@repo/ui/button';
import { Skeleton } from '@repo/ui/skeleton';
import { portalMuted } from '@/components/portal/layout/portal-ui';

type ApiProfile = Omit<PortalProfileData, 'roleName'> & {
  accountCreatedAt?: string;
};

export default function MonDossierProfilPage() {
  const { data: session } = useSession();

  const query = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await apiFetch('/api/portal/profile');
      const json = (await res.json()) as { success?: boolean; data?: { profile: ApiProfile } };
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
        <Skeleton className="mt-6 h-64 w-full" />
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

  const profile: PortalProfileData = {
    ...query.data,
    roleName: session?.user?.roleName ?? 'Candidat',
    accountCreatedAt: query.data.accountCreatedAt ?? new Date().toISOString(),
  };

  return (
    <PortalPageShell width="wide">
      <PortalPageHero
        title="Mon profil"
        description="Coordonnées de votre dossier candidat / stagiaire."
        badge="Mon dossier"
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href="/mon-dossier/parametres">
              <Settings className="me-2 size-4" />
              Paramètres du compte
            </Link>
          </Button>
        }
      />
      <div className="mt-6">
        <PortalProfileCard profile={profile} />
      </div>
    </PortalPageShell>
  );
}
