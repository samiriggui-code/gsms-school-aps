"use client";

import { useTranslation } from '@/hooks/useTranslation';
import { WelcomeCallout, SecurityHighlightsA, SectionAMenuCards, PilotageStatsDynamic } from './components';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { useModuleLayout } from '@/hooks/use-module-layout';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

export default function SectionALandingPage() {
  const { t } = useTranslation();

  const { title, description } = usePageToolbarMeta('/pilotage-supervision');
  const { isVisible } = useModuleLayout('pilotage-landing');
  const [statsData, setStatsData] = useState<ISecurityHighlightsRow[]>([]);
  const [overallPerformance, setOverallPerformance] = useState({ value: 0, trend: 0 });
  const [categories, setCategories] = useState<ISecurityHighlightsItem[]>([]);
  const [pilotageStats, setPilotageStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/common/stats');
        if (!response.ok) {
          throw new Error(t('sectionLanding.loadError'));
        }
        const data = await response.json();

        if (data.success) {
          setStatsData(data.stats || []);
          setOverallPerformance(data.overallPerformance || { value: 0, trend: 0 });
          setCategories(data.categories || []);
          setPilotageStats(data.data || null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des highlights:', error);
        toast.error(t('sectionLanding.loadError'));
      } finally {
        setLoading(false);
      }
    };

    void fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="container-fluid mx-auto w-full max-w-full min-w-0 px-4 lg:px-5 pb-8">
        <div className="flex min-w-0 items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">{t('sectionLanding.loadingIndicators')}</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
        </Toolbar>
      </Container>
      <Container className="space-y-5 lg:space-y-7.5">
        {isVisible('stats') ? <PilotageStatsDynamic data={pilotageStats} loading={loading} /> : null}

        {(isVisible('stats') || isVisible('welcome')) && (
          <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {isVisible('stats') ? (
              <div className="lg:col-span-1">
                <SecurityHighlightsA
                  limit={5}
                  statsData={statsData}
                  overallPerformance={overallPerformance}
                  categories={categories}
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

        {isVisible('module-tabs') ? <SectionAMenuCards /> : null}
      </Container>
</>
  );
}
