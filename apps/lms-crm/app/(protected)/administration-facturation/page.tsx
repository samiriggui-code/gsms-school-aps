'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { AdminStatsDynamic, AdminWelcomeCallout, SecurityHighlightsI, AdminMenuCards } from './components';
import { CrmWiredLeaf } from '@/components/crm/crm-wired-leaf';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ISecurityHighlightsRow {
  icon: string;
  text: string;
  total: number | string;
  stats: number;
  trend?: 'up' | 'down' | 'neutral';
  unit?: string;
}

interface ISecurityHighlightsItem {
  badgeColor: string;
  label: string;
}

export default function SectionILandingPage() {
  const { t } = useTranslation();

  const [statsData, setStatsData] = useState<ISecurityHighlightsRow[]>([]);
  const [dynamicStats, setDynamicStats] = useState<any>(null);
  const [overallPerformance, setOverallPerformance] = useState<{ value: number; trend: number }>({
    value: 0,
    trend: 0,
  });
  const [categories, setCategories] = useState<ISecurityHighlightsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats?section=facturation');
        if (!response.ok) {
          throw new Error(t('sectionLanding.loadError'));
        }
        const data = await response.json();
        setStatsData(data.stats || []);
        setDynamicStats(data.data || null);
        setOverallPerformance(data.overallPerformance || { value: 0, trend: 0 });
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        toast.error(t('sectionLanding.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid mx-auto w-full max-w-full min-w-0 px-4 lg:px-5 py-5">
        <div className="flex min-w-0 items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t('sectionLanding.loadingIndicators')}</span>
        </div>
      </div>
    );
  }
  return (
    <CrmWiredLeaf path="/administration-facturation" level="section">
      <div className="space-y-5 lg:space-y-7.5 pb-8">
        <AdminStatsDynamic data={dynamicStats} isLoading={loading} />

        <div className="grid min-w-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-8 items-stretch">
          <div className="min-w-0 lg:col-span-1">
            <SecurityHighlightsI
              limit={5}
              statsData={statsData}
              overallPerformance={overallPerformance}
              categories={categories}
            />
          </div>

          <div className="min-w-0 lg:col-span-2">
            <AdminWelcomeCallout />
          </div>
        </div>

        <AdminMenuCards />
      </div>
    </CrmWiredLeaf>
  );
}
