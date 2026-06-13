'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { INSTRUCTOR_DASHBOARD_API } from '@/lib/instructor/instructor-paths';
import { normalizeInstructorDashboardPayload } from '@/lib/instructor/instructor-dashboard-normalize';
import type { InstructorDashboardPayload } from '@/lib/instructor/instructor-types';
import { instructorDashboardKpis } from '@/lib/instructor/instructor-kpi-stats';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { InstructorDashboardAlerts } from './instructor-dashboard-alerts';
import { InstructorDashboardHighlights } from './instructor-dashboard-highlights';
import { InstructorDashboardOverviewTable } from './instructor-dashboard-overview-table';
import { InstructorDashboardActivityChart } from './instructor-dashboard-activity-chart';
import { InstructorSessionsDonut } from './instructor-sessions-donut';
import { InstructorWelcomeCallout } from './instructor-welcome-callout';

export function InstructorDashboard() {
  const [data, setData] = useState<
    (InstructorDashboardPayload & { user?: { name: string | null } }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(INSTRUCTOR_DASHBOARD_API);
        const json = (await res.json()) as {
          success?: boolean;
          data?: InstructorDashboardPayload & { user?: { name: string | null } };
          error?: { message?: string };
        };
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? 'Chargement impossible.');
        }
        if (!cancelled && json.data) {
          setData({
            ...normalizeInstructorDashboardPayload(json.data),
            user: json.data.user,
          });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inattendue.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <PortalPageShell>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </PortalPageShell>
    );
  }

  if (error || !data) {
    return (
      <PortalPageShell width="narrow">
        <p className="text-[13px] text-destructive">{error ?? 'Données indisponibles.'}</p>
      </PortalPageShell>
    );
  }

  const { stats, charts, activity, highlights, alerts, overview, nextSession, user } = data;
  const sessionSlices = charts?.sessionsByStatus ?? [];
  const displayName = user?.name?.split(' ')[0] ?? 'Formateur';

  return (
    <PortalPageShell>
      <div className="space-y-5 lg:space-y-7.5">
        <ModuleKpiStatsRow items={instructorDashboardKpis(stats)} />

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 lg:col-span-1">
            <InstructorDashboardHighlights highlights={highlights} />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <InstructorWelcomeCallout
              displayName={displayName}
              stats={stats}
              nextSession={nextSession}
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 lg:col-span-1">
            <InstructorSessionsDonut slices={sessionSlices} />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <InstructorDashboardActivityChart activity={activity} />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 lg:col-span-1">
            <InstructorDashboardAlerts alerts={alerts} />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <InstructorDashboardOverviewTable overview={overview} />
          </div>
        </div>
      </div>
    </PortalPageShell>
  );
}
