'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { cmsCatalogQueryKey, LandingCatalogList, LandingCatalogSearch } from './components/landing-catalog-list';

type Stats = {
  total: number;
  landingVisible: number;
  active: number;
  draft: number;
  archived: number;
};

export default function CmsContenusPage() {
  const { title, description } = usePageToolbarMeta('/communication-contenu/cms/contenus');
  const [search, setSearch] = useState('');

  const { data: stats } = useQuery({
    queryKey: [...cmsCatalogQueryKey, 'stats', search] as const,
    queryFn: async (): Promise<Stats> => {
      const sp = new URLSearchParams({ scope: 'all' });
      if (search.trim()) sp.set('q', search.trim());
      const res = await apiFetch(`/api/sections/communication-contenu/cms/contenus?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Erreur');
      const payload = unwrapSectionApiData<{ stats: Stats }>(json);
      return payload?.stats ?? { total: 0, landingVisible: 0, active: 0, draft: 0, archived: 0 };
    },
  });

  const kpi = [
    { label: 'Offres catalogue', value: stats?.total ?? 0, subtitle: 'Fiches avec offre CRM' },
    { label: 'Landing', value: stats?.landingVisible ?? 0, subtitle: 'Visibles sur #pricing' },
    { label: 'Actives', value: stats?.active ?? 0, subtitle: 'Statut catalogue ACTIVE' },
    { label: 'Brouillons', value: stats?.draft ?? 0, subtitle: 'Hors publication' },
    { label: 'Archivées', value: stats?.archived ?? 0, subtitle: 'Suspendues du catalogue' },
  ];

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {kpi.map((s, i) => {
            const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
            return (
              <div
                key={s.label}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.subtitle}</p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground max-w-xl">
              Prix, sessions et financement dans{' '}
              <span className="font-medium text-foreground">Vie scolaire → Formations</span>. Cliquez
              sur le badge de statut (vert = landing, orange = partiel, gris = inactif) pour publier ou
              retirer une formation du CRM et du landing.
            </p>
            <LandingCatalogSearch onSearch={setSearch} />
          </CardHeader>
          <CardContent className="pt-5">
            <LandingCatalogList search={search} />
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
