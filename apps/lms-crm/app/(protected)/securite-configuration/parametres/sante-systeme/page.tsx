'use client';

import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Button } from '@repo/ui/button';
import { RefreshCw, LayoutGrid, Monitor } from 'lucide-react';
import { SystemStatsCards } from './components/system-stats-cards';
import { SystemUsageCharts } from './components/system-usage-charts';
import { SystemRealtimeCharts } from './components/system-realtime-charts';
import { cn } from '@/lib/utils';

export default function SystemHealthPage() {
  const { title, description } = usePageToolbarMeta('/securite-configuration/parametres/sante-systeme');
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="size-4" />
              Actualiser
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>
      
      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <SystemStatsCards />
        
        <div className="pt-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className={cn('p-2 rounded-lg border bg-rose-500/15 border-rose-500/25 text-rose-600 dark:text-rose-400')}>
              <Monitor className="size-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Monitoring Multi-Spectres</h2>
          </div>
          <SystemRealtimeCharts />
        </div>

        <div className="pt-4">
          <div className="flex items-center gap-3 mb-6 px-1">
            <div className={cn('p-2 rounded-lg border bg-sky-500/15 border-sky-500/25 text-sky-600 dark:text-sky-400')}>
              <LayoutGrid className="size-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Répartition des ressources</h2>
          </div>
          <SystemUsageCharts />
        </div>
      </Container>
    </>
  );
}
