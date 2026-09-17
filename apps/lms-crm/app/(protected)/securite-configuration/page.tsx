'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { WelcomeCallout, SectionBMenuCards } from './components';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { HubSectionStatsRow, type HubSectionStats } from '@/components/common/hub-section-stats-row';
import { SectionSecurityHighlightsCard } from '@/components/common/section-security-highlights-card';
import { useEffect, useState } from 'react';
import { KeyRound, ShieldCheck, Tag, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

export default function SectionBLandingPage() {
  const { t } = useTranslation();

  const [dynamicStats, setDynamicStats] = useState<HubSectionStats | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats?section=securite');
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
    <CrmWiredLeaf path="/securite-configuration" level="section">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <HubSectionStatsRow
          data={dynamicStats}
          isLoading={loading}
          buildCards={(data) => {
            const roles = data.categoryDistribution.find((c) => c.name === 'Rôles définis')?.count ?? 0;
            const permissions = data.categoryDistribution.find((c) => c.name === 'Permissions')?.count ?? 0;
            return [
              { icon: ShieldCheck, tone: 'primary', label: 'Comptes total', value: data.totalCollaborators, detail: 'Utilisateurs CRM' },
              { icon: UserCheck, tone: 'success', label: 'Comptes actifs', value: data.activeCollaborators, detail: `${data.complianceRate}% du total`, trend: 'up' },
              { icon: UserX, tone: 'warning', label: 'Comptes inactifs', value: data.absentCollaborators, detail: 'Désactivés ou en attente' },
              { icon: Tag, tone: 'info', label: 'Rôles définis', value: roles, detail: 'Rôles applicatifs' },
              { icon: KeyRound, tone: 'destructive', label: 'Permissions', value: permissions, detail: 'Droits fins accordés' },
            ];
          }}
        />

        <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <div className="min-w-0 lg:col-span-1">
            <SectionSecurityHighlightsCard
              titleKey="sections.securiteConfiguration.securityHighlightsTitle"
              limit={5}
              overallPerformance={{ value: dynamicStats?.complianceRate ?? 0, trend: 0 }}
              categories={[
                { badgeColor: 'bg-emerald-500', label: 'Comptes actifs' },
                { badgeColor: 'bg-sky-500', label: 'Rôles' },
                { badgeColor: 'bg-indigo-500', label: 'Permissions' },
              ]}
              statsData={
                dynamicStats
                  ? [
                      {
                        icon: 'UserCheck',
                        text: 'Comptes actifs',
                        total: dynamicStats.activeCollaborators,
                        stats: dynamicStats.complianceRate,
                        trend: 'up' as const,
                      },
                      {
                        icon: 'UserCheck',
                        text: 'Comptes inactifs',
                        total: dynamicStats.absentCollaborators,
                        stats: Math.round((dynamicStats.absentCollaborators / (dynamicStats.totalCollaborators || 1)) * 100),
                        trend: 'neutral' as const,
                      },
                      ...dynamicStats.categoryDistribution
                        .filter((c) => c.name !== 'Comptes actifs')
                        .map((c) => ({
                          icon: 'ShieldCheck',
                          text: c.name,
                          total: c.count,
                          stats: 0,
                          trend: 'neutral' as const,
                        })),
                    ]
                  : []
              }
            />
          </div>
          <div className="min-w-0 lg:col-span-2">
            <WelcomeCallout className="h-full" />
          </div>
        </div>

        <SectionBMenuCards />
      </div>
    </CrmWiredLeaf>
  );
}
