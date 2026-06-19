'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Database, FileSearch, Files, HardDrive, ShieldAlert } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type DashboardResponse = {
  stats: {
    filesActive: number;
    volumeMb: number;
    openDemandes: number;
    missingDocumentsDemandes: number;
  };
};

export function GouvernanceWelcomeCallout() {
  const { data } = useQuery({
    queryKey: ['gouvernance-dashboard-callout'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/gouvernance-donnees/dashboard',
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Dashboard load failed');
      return unwrapSectionApiData<DashboardResponse>(json);
    },
    staleTime: 60_000,
  });

  const stats = data?.stats;

  return (
    <Fragment>
      <style>
        {`
          .governance-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .governance-callout-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <Card className="h-full min-w-0 w-full overflow-hidden">
        <CardContent className="governance-callout-bg bg-cover bg-center bg-no-repeat p-4 sm:p-6 lg:p-8">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="shrink-0 rounded-lg bg-primary/10 p-3">
                <Database className="h-8 w-8 text-primary" />
              </div>
              {stats ? (
                <>
                  <Badge variant="secondary">{stats.filesActive} fichiers actifs</Badge>
                  <Badge variant="outline">
                    <HardDrive className="me-1 size-3" />
                    {stats.volumeMb} Mo
                  </Badge>
                  {stats.missingDocumentsDemandes > 0 ? (
                    <Badge variant="warning">{stats.missingDocumentsDemandes} pièces manquantes</Badge>
                  ) : null}
                </>
              ) : null}
            </div>
            <h2 className="text-xl font-semibold text-mono sm:text-2xl">
              Module <span className="text-primary">Gouvernance des données</span>
            </h2>
            <p className="text-sm font-normal leading-relaxed text-secondary-foreground">
              Pilotez le coffre documentaire MinIO, les demandes de pièces candidats et la
              conformité des dépôts.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-start gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/conformite">
              <ShieldAlert className="mr-1 size-4" />
              Conformité
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/storage">
              <Database className="mr-1 size-4" />
              Storage
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/demandes-documents">
              <Files className="mr-1 size-4" />
              Demandes
              {stats && stats.openDemandes > 0 ? (
                <Badge className="ms-1.5" variant="secondary">
                  {stats.openDemandes}
                </Badge>
              ) : null}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/corbeille-archivage">
              <Archive className="mr-1 size-4" />
              Archivage
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/securite-configuration/gouvernance-donnees/audit-documentaire">
              <FileSearch className="mr-1 size-4" />
              Audit
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </Fragment>
  );
}
