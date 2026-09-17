'use client';

import { WelcomeCallout, SectionBMenuCards, SupportStats } from './components';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { SectionSecurityHighlightsCard } from '@/components/common/section-security-highlights-card';
import { useModuleLayout } from '@/hooks/use-module-layout';
import { useSupportQualiteStats } from './hooks/use-support-qualite-stats';

export default function SectionBLandingPage() {
  const { isVisible } = useModuleLayout('support-landing');
  const { kpis } = useSupportQualiteStats();

  const ouverts = Number(kpis.find((k) => k.label === 'Tickets ouverts')?.value ?? 0);
  const resolus = Number(kpis.find((k) => k.label === 'Résolus')?.value ?? 0);
  const total = ouverts + resolus || 1;
  const resolutionRate = Math.round((resolus / total) * 100);

  return (
    <CrmWiredLeaf path="/support-qualite" level="section">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        {isVisible('stats') ? <SupportStats /> : null}

        {(isVisible('stats') || isVisible('welcome')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {isVisible('stats') ? (
              <div className="min-w-0 lg:col-span-1">
                <SectionSecurityHighlightsCard
                  titleKey="sections.supportQualite.securityHighlightsTitle"
                  limit={5}
                  overallPerformance={{ value: resolutionRate, trend: 0 }}
                  categories={[
                    { badgeColor: 'bg-emerald-500', label: 'Résolus' },
                    { badgeColor: 'bg-red-500', label: 'Urgents' },
                  ]}
                  statsData={kpis.map((k) => ({
                    icon: k.icon ?? 'MessageSquare',
                    text: k.label,
                    total: k.value,
                    stats: 0,
                    trend: k.trend as 'up' | 'down' | 'neutral' | undefined,
                  }))}
                />
              </div>
            ) : null}
            {isVisible('welcome') ? (
              <div className={`min-w-0 ${isVisible('stats') ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                <WelcomeCallout className="h-full" />
              </div>
            ) : null}
          </div>
        )}

        {isVisible('menu-cards') ? <SectionBMenuCards /> : null}
      </div>
    </CrmWiredLeaf>
  );
}
