'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ProfilSettings } from './components/profil-settings';
import { ProfilStats } from './components/profil-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Edit3, Eye } from 'lucide-react';
import { ProfilDetailsOverviews } from './components/profil-details-overviews';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import type { CompanyProfileView } from './types/company-profile-view';

/** Référence stable pour éviter un nouvel objet `{}` à chaque rendu (réinitialisations du formulaire). */
const EMPTY_COMPANY_PROFILE: CompanyProfileView = {};
import type { PrimaryAdminContactPayload, SchoolStatsPayload } from './types/school-stats';
import { RiErrorWarningFill } from '@remixicon/react';

type CompanyProfileApiData = {
  companyProfile?: CompanyProfileView;
  schoolStats?: SchoolStatsPayload;
  primaryAdminContact?: PrimaryAdminContactPayload | null;
};

export default function Page() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/compagnie/profil');
  const [isEditing, setIsEditing] = useState(false);
  const {
    data: profilePayload,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/compagnie/profil');
      if (!response.ok) throw new Error('fetch');
      const json = (await response.json()) as { data?: CompanyProfileApiData };
      return json.data;
    },
  });

  const profile: CompanyProfileView =
    profilePayload?.companyProfile ?? EMPTY_COMPANY_PROFILE;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button
              variant={isEditing ? 'outline' : 'primary'}
              onClick={() => setIsEditing(!isEditing)}
              className="gap-2"
            >
              {isEditing ? (
                <>
                  <Eye className="size-4" /> Afficher la vue lecture seule
                </>
              ) : (
                <>
                  <Edit3 className="size-4" /> Modifier
                </>
              )}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <ProfilStats
          variant="row"
          stats={profilePayload?.schoolStats}
          isLoading={isLoading}
        />

        {isError ? (
          <Alert variant="destructive" appearance="light" icon="destructive" size="md">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle className="flex flex-wrap items-center gap-2">
              Impossible de charger le profil compagnie.
              <button
                type="button"
                className="text-xs font-semibold text-destructive underline underline-offset-4"
                onClick={() => void refetch()}
              >
                Réessayer
              </button>
            </AlertTitle>
          </Alert>
        ) : null}

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        ) : isError ? null : isEditing ? (
          <ProfilSettings
            profile={profile}
            primaryAdminContact={profilePayload?.primaryAdminContact ?? null}
          />
        ) : (
          <ProfilDetailsOverviews
            profil={profile}
            primaryAdminContact={profilePayload?.primaryAdminContact ?? null}
          />
        )}
      </Container>
    </>
  );
}
