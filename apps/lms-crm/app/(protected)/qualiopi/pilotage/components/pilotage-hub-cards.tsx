'use client';

import Link from 'next/link';
import { AlertTriangle, BarChart3, FileDown, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { useModuleWorkspaceQuery } from '@/hooks/use-module-workspace-query';
import { useTranslation } from '@/hooks/useTranslation';
import type { ModuleWorkspaceViewKey } from '@repo/api-core';
import { Skeleton } from '@repo/ui/skeleton';

const HUB: {
  href: string;
  viewKey: ModuleWorkspaceViewKey;
  icon: typeof AlertTriangle;
}[] = [
  { href: '/pilotage-supervision/pilotage/alertes', viewKey: 'pilotage-alertes', icon: AlertTriangle },
  { href: '/pilotage-supervision/pilotage/indicateurs', viewKey: 'pilotage-indicateurs', icon: BarChart3 },
  { href: '/pilotage-supervision/pilotage/rapports', viewKey: 'pilotage-rapports', icon: FileDown },
  { href: '/pilotage-supervision/pilotage/risques', viewKey: 'pilotage-risques', icon: ShieldAlert },
];

function HubCard({
  href,
  viewKey,
  icon: Icon,
}: (typeof HUB)[number]) {
  const { t } = useTranslation();
  const { data, isLoading } = useModuleWorkspaceQuery({ viewKey, page: 1, limit: 1 });
  const title = t(`workspace.${viewKey}.title`);
  const description = t(`workspace.${viewKey}.description`);
  const headline = data?.kpis?.[0];

  return (
    <Link href={href} className="group block h-full">
      <Card className="h-full border-dashed transition-colors hover:border-primary/40 hover:bg-muted/20">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : headline ? (
              <span className="text-2xl font-bold tabular-nums text-foreground">{headline.value}</span>
            ) : null}
          </div>
          <CardTitle className="text-base group-hover:text-primary">{title}</CardTitle>
          <CardDescription className="line-clamp-2 text-xs">{description}</CardDescription>
        </CardHeader>
        {headline?.subtitle ? (
          <CardContent className="pt-0">
            <p className="text-2xs uppercase tracking-wide text-muted-foreground">{headline.subtitle}</p>
          </CardContent>
        ) : null}
      </Card>
    </Link>
  );
}

export function PilotageHubCards() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {HUB.map((item) => (
        <HubCard key={item.href} {...item} />
      ))}
    </div>
  );
}
