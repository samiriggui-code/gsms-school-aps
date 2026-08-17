'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import type { CrmDashboardPayload } from '@/lib/crm/crm-dashboard-types';
import { crmDashboardKpis } from '@/lib/crm/crm-kpi-stats';
import { MenuCardsSection } from '@/app/(protected)/accueil/components/menu-cards-section';
import { Skeleton } from '@/components/ui/skeleton';
import { CrmDashboardHighlights } from './crm-dashboard-highlights';
import { CrmWelcomeCallout } from './crm-welcome-callout';
import { useDashboardLayout } from '@/hooks/use-dashboard-layout';

const CRM_DASHBOARD_API = '/api/crm/dashboard';

export function CrmDashboard() {
  const { isVisible } = useDashboardLayout('crm-dashboard');
  const [data, setData] = useState<
    (CrmDashboardPayload & { user?: { name: string | null; roleName?: string | null } }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(CRM_DASHBOARD_API);
        const json = (await res.json()) as {
          success?: boolean;
          data?: CrmDashboardPayload & { user?: { name: string | null; roleName?: string | null } };
          error?: { message?: string };
        };
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message ?? 'Chargement impossible.');
        }
        if (!cancelled && json.data) setData(json.data);
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

  const displayName = data?.user?.name?.split(' ')[0] ?? 'Admin';
  const roleLabel = data?.user?.roleName ?? 'CRM';

  return (
    <div className="space-y-5 lg:space-y-9">
      {loading ? (
        <div className="space-y-5 lg:space-y-7.5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            <Skeleton className="h-48 rounded-xl lg:col-span-1" />
            <Skeleton className="h-48 rounded-xl lg:col-span-2" />
          </div>
        </div>
      ) : error || !data ? (
        <p className="text-[13px] text-destructive">{error ?? 'Données indisponibles.'}</p>
      ) : (
        <div className="space-y-5 lg:space-y-7.5">
          {isVisible('kpis') && <ModuleKpiStatsRow items={crmDashboardKpis(data.stats)} />}

          {(isVisible('highlights') || isVisible('welcome')) && (
            <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {isVisible('highlights') && (
                <div className="min-w-0 lg:col-span-1">
                  <CrmDashboardHighlights highlights={data.highlights} />
                </div>
              )}
              {isVisible('welcome') && (
                <div className={isVisible('highlights') ? 'min-w-0 lg:col-span-2' : 'min-w-0 lg:col-span-3'}>
                  <CrmWelcomeCallout
                    displayName={displayName}
                    roleLabel={roleLabel}
                    stats={data.stats}
                    nextSession={data.nextSession}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {isVisible('menu-cards') && <MenuCardsSection />}
    </div>
  );
}
