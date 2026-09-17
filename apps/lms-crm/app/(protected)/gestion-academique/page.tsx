'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { WelcomeCallout, GestionAcademiqueModuleMenuCards } from './components';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { HubSectionStatsRow, type HubSectionStats } from '@/components/common/hub-section-stats-row';
import { SectionSecurityHighlightsCard } from '@/components/common/section-security-highlights-card';
import { useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock, FileX, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function SectionBLandingPage() {
  const { t } = useTranslation();

  const [dynamicStats, setDynamicStats] = useState<HubSectionStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats?section=academique');
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

  return (
    <CrmWiredLeaf path="/gestion-academique" level="section">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <HubSectionStatsRow
          data={dynamicStats}
          isLoading={loading}
          buildCards={(data) => [
            { icon: Users, tone: 'primary', label: 'Candidatures', value: data.totalCollaborators, detail: 'Toutes périodes' },
            { icon: CheckCircle2, tone: 'success', label: 'Validées', value: data.activeCollaborators, detail: 'Aptes en session', trend: 'up' },
            { icon: Clock, tone: 'info', label: 'En instruction', value: data.absentCollaborators, detail: 'Pièces en cours' },
            { icon: FileX, tone: 'destructive', label: 'Rejetées', value: data.complianceIssues, detail: `${data.complianceRate}% traitement positif`, trend: data.complianceIssues > 0 ? 'down' : 'neutral' },
            {
              icon: CalendarClock,
              tone: 'warning',
              label: 'Sessions actives',
              value: data.categoryDistribution.find((c) => c.name === 'Sessions actives')?.count ?? 0,
              detail: 'En cours aujourd\'hui',
            },
          ]}
        />

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 lg:col-span-1">
            <SectionSecurityHighlightsCard
              titleKey="sections.gestionAcademique.securityHighlightsTitle"
              limit={5}
              overallPerformance={{ value: dynamicStats?.complianceRate ?? 0, trend: 0 }}
              categories={[
                { badgeColor: 'bg-emerald-500', label: 'Validées' },
                { badgeColor: 'bg-sky-500', label: 'En instruction' },
                { badgeColor: 'bg-red-500', label: 'Rejetées' },
              ]}
              statsData={
                dynamicStats
                  ? dynamicStats.categoryDistribution.map((c) => ({
                      icon: 'ClipboardCheck',
                      text: c.name,
                      total: c.count,
                      stats: Math.round((c.count / (dynamicStats.totalCollaborators || 1)) * 100),
                    }))
                  : []
              }
            />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <WelcomeCallout className="h-full" />
          </div>
        </div>

        <GestionAcademiqueModuleMenuCards />
      </div>
    </CrmWiredLeaf>
  );
}
