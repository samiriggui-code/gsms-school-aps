'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { ProfilStats } from './components/profil-stats';
import { Skeleton } from '@repo/ui/skeleton';
import { Button } from '@repo/ui/button';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
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
import {
  COMPANY_PROFILE_READONLY_API,
  COMPANY_PROFILE_SETTINGS_HREF,
  type CompanyProfileView,
  type PrimaryAdminContactPayload,
  type SchoolStatsPayload,
} from '@/lib/company-profile';
import { RiErrorWarningFill } from '@remixicon/react';
import { Settings } from 'lucide-react';

const EMPTY_COMPANY_PROFILE: CompanyProfileView = {};

type CompanyProfileApiData = {
  companyProfile?: CompanyProfileView;
  schoolStats?: SchoolStatsPayload;
  primaryAdminContact?: PrimaryAdminContactPayload | null;
};

export default function Page() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/compagnie/profil');
  const {
    data: profilePayload,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['company-profile'],
    queryFn: async () => {
      const response = await apiFetch(COMPANY_PROFILE_READONLY_API);
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
            <Button variant="primary" asChild className="gap-2">
              <Link href={COMPANY_PROFILE_SETTINGS_HREF}>
                <Settings className="size-4" />
                Modifier le profil
              </Link>
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5">
        <Alert variant="mono" icon="primary" size="md">
          <AlertIcon />
          <AlertTitle className="text-sm font-normal">
            Vue lecture seule — KPIs et identité légale. Les modifications se font dans{' '}
            <Link
              href={COMPANY_PROFILE_SETTINGS_HREF}
              className="font-medium underline underline-offset-4"
            >
              Paramètres système → Réglages établissement
            </Link>
            .
          </AlertTitle>
        </Alert>

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
        ) : isError ? null : (
          <ProfilDetailsOverviews
            profil={profile}
            primaryAdminContact={profilePayload?.primaryAdminContact ?? null}
          />
        )}
      </Container>
    </>
  );
}
