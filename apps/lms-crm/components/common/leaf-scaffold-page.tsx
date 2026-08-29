'use client';

import { Construction } from 'lucide-react';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
  ToolbarActions,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import {
  ModuleLandingStatGradientCard,
  MODULE_LANDING_STATS_GRID_ROW,
} from '@/components/common/stat-card-metric-layout';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export type LeafScaffoldStat = {
  label: string;
  value?: string;
  detail?: string;
};

type LeafScaffoldPageProps = {
  path: string;
  chantierId: string;
  summary: string;
  nextSteps?: string[];
  /** 3–5 KPI placeholders (souvent 0 tant que le CRUD n’existe pas) */
  stats?: LeafScaffoldStat[];
  backHref?: string;
  backLabel?: string;
};

/**
 * Feuille « en construction » — pattern Type A allégé :
 * Toolbar + bandeau KPI + carte liste (vide / chantier). Pas un bloc Accéder seul.
 */
export function LeafScaffoldPage({
  path,
  chantierId,
  summary,
  nextSteps = [],
  stats = [
    { label: 'Total', value: '0', detail: 'À brancher' },
    { label: 'Actifs', value: '0', detail: 'À brancher' },
    { label: 'En attente', value: '0', detail: 'À brancher' },
  ],
  backHref,
  backLabel = 'Retour module',
}: LeafScaffoldPageProps) {
  const { title, description } = usePageToolbarMeta(path);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          {backHref ? (
            <ToolbarActions>
              <Button variant="outline" size="sm" asChild>
                <Link href={backHref}>{backLabel}</Link>
              </Button>
            </ToolbarActions>
          ) : null}
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {stats.map((stat) => (
            <ModuleLandingStatGradientCard
              key={stat.label}
              icon={Construction}
              tone="warning"
              label={stat.label}
              value={stat.value ?? '0'}
              detail={stat.detail ?? 'En construction'}
              trend="neutral"
            />
          ))}
        </div>

        <Card className="border-dashed">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-dashed py-3.5">
            <CardTitle className="text-base font-bold uppercase text-foreground">
              Liste — {title}
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="warning">En construction</Badge>
              <Badge variant="secondary">{chantierId}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            <p className="text-sm leading-relaxed text-secondary-foreground">{summary}</p>
            {nextSteps.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            ) : null}
            <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-sm text-muted-foreground">
              DataGrid à brancher — arborescence et URL figées
            </div>
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
