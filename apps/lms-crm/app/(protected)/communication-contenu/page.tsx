'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { WelcomeCallout, SectionBMenuCards } from './components';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { HubSectionStatsRow, type HubSectionStats } from '@/components/common/hub-section-stats-row';
import { SectionSecurityHighlightsCard } from '@/components/common/section-security-highlights-card';
import { useModuleLayout } from '@/hooks/use-module-layout';
import { useEffect, useState } from 'react';
import { LayoutTemplate, Megaphone, Search, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SectionBLandingPage() {
  const { t } = useTranslation();

  const { isVisible } = useModuleLayout('communication-landing');
  const [dynamicStats, setDynamicStats] = useState<HubSectionStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats?section=communication');
        if (!response.ok) {
          throw new Error(t('sectionLanding.loadError'));
        }
        const result = await response.json();

        if (result.success) {
          setDynamicStats(result.data ?? undefined);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des highlights:', error);
        toast.error(t('sectionLanding.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, []);

  const cms = dynamicStats?.categoryDistribution.find((c) => c.name === 'CMS')?.count ?? 0;
  const marketing = dynamicStats?.categoryDistribution.find((c) => c.name === 'Marketing')?.count ?? 0;
  const seo = dynamicStats?.categoryDistribution.find((c) => c.name === 'SEO')?.count ?? 0;

  return (
    <CrmWiredLeaf path="/communication-contenu" level="section">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        {isVisible('stats') ? (
          <HubSectionStatsRow
            data={dynamicStats}
            isLoading={loading}
            buildCards={(data) => [
              { icon: LayoutTemplate, tone: 'info', label: 'Pages CMS', value: cms, detail: 'Formations publiées' },
              { icon: Megaphone, tone: 'primary', label: 'Marketing', value: marketing, detail: 'Leads + campagnes' },
              { icon: Search, tone: 'warning', label: 'SEO', value: seo, detail: 'Redirections gérées' },
              { icon: Users, tone: 'success', label: 'Actifs', value: data.activeCollaborators, detail: 'Contenus + campagnes actifs' },
              { icon: UserPlus, tone: 'destructive', label: 'Prospects', value: data.absentCollaborators, detail: 'Leads entrants' },
            ]}
          />
        ) : null}

        {(isVisible('stats') || isVisible('welcome')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {isVisible('stats') ? (
              <div className="min-w-0 lg:col-span-1">
                <SectionSecurityHighlightsCard
                  titleKey="sections.communicationContenu.securityHighlightsTitle"
                  limit={5}
                  overallPerformance={{ value: dynamicStats?.complianceRate ?? 0, trend: 0 }}
                  categories={[
                    { badgeColor: 'bg-sky-500', label: 'CMS' },
                    { badgeColor: 'bg-fuchsia-500', label: 'Marketing' },
                    { badgeColor: 'bg-teal-500', label: 'SEO' },
                  ]}
                  statsData={[
                    { icon: 'BookOpenCheck', text: 'Pages CMS', total: cms, stats: dynamicStats ? Math.round((cms / (dynamicStats.totalCollaborators || 1)) * 100) : 0 },
                    { icon: 'ClipboardCheck', text: 'Marketing (leads + campagnes)', total: marketing, stats: dynamicStats ? Math.round((marketing / (dynamicStats.totalCollaborators || 1)) * 100) : 0 },
                    { icon: 'AlertCircle', text: 'Redirections SEO', total: seo, stats: dynamicStats ? Math.round((seo / (dynamicStats.totalCollaborators || 1)) * 100) : 0 },
                  ]}
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
