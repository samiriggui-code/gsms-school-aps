'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Bell, Globe, Plug, Settings2, Share2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { useSettings } from './settings-context';
import { useCompanyProfileSettings } from './company-profile-context';

interface SettingsStatsSectionProps {
  variant?: 'grid' | 'row';
  firstMetricTitle?: string;
}

function countFilled(values: unknown[]) {
  return values.filter((v) => v != null && String(v).trim() !== '').length;
}

export function SettingsStatsSection({
  variant = 'row',
  firstMetricTitle = 'Champs renseignés',
}: SettingsStatsSectionProps) {
  const { settings } = useSettings();
  const { profile } = useCompanyProfileSettings();
  const [mounted, setMounted] = useState(false);

  const { data: integrationsData } = useQuery({
    queryKey: ['parametres-integrations'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/securite-configuration/parametres/integrations');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return { items: [] as { connected: boolean }[] };
      return unwrapSectionApiData<{ items: { connected: boolean }[] }>(json);
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const stats = useMemo(() => {
    const profileFields = [
      profile?.companyName,
      profile?.siret,
      profile?.companyAddress,
      profile?.companyCity,
      profile?.ndaNumber,
      profile?.qualiopiCertifications,
      profile?.directorFullName,
      profile?.website,
      profile?.industry,
      profile?.siren,
    ];
    const configured = countFilled(profileFields);

    const notifPairs: [boolean | undefined, boolean | undefined][] = [
      [settings?.notifyStockEmail, settings?.notifyStockWeb],
      [settings?.notifyNewOrderEmail, settings?.notifyNewOrderWeb],
      [settings?.notifyOrderStatusUpdateEmail, settings?.notifyOrderStatusUpdateWeb],
      [settings?.notifyPaymentFailureEmail, settings?.notifyPaymentFailureWeb],
      [settings?.notifySystemErrorFailureEmail, settings?.notifySystemErrorWeb],
    ];
    const activeNotifs = notifPairs.filter(([e, w]) => e || w).length;

    const socialCount = countFilled([
      settings?.socialFacebook,
      settings?.socialTwitter,
      settings?.socialInstagram,
      settings?.socialLinkedIn,
      settings?.socialPinterest,
      settings?.socialYoutube,
    ]);

    const integrationsConnected =
      integrationsData?.items?.filter((i) => i.connected).length ?? 0;

    return [
      {
        icon: Settings2,
        title: firstMetricTitle,
        value: configured,
        subtitle: 'identité & conformité',
      },
      {
        icon: Bell,
        title: 'Notifications',
        value: activeNotifs,
        subtitle: 'types d\'alertes actifs',
      },
      {
        icon: Globe,
        title: 'Plateforme',
        value: settings?.active ? 1 : 0,
        subtitle: settings?.active ? 'Active' : 'Maintenance',
      },
      {
        icon: Share2,
        title: 'Réseaux sociaux',
        value: socialCount,
        subtitle: 'profils renseignés',
      },
      {
        icon: Plug,
        title: 'Intégrations',
        value: integrationsConnected,
        subtitle: 'services connectés',
      },
    ];
  }, [settings, profile, integrationsData, firstMetricTitle]);

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 h-full items-stretch';

  if (!mounted) {
    return (
      <div className={cn(gridClasses, 'mb-5')}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(gridClasses, 'mb-5')}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
        return (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                  accent.box,
                )}
              >
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
