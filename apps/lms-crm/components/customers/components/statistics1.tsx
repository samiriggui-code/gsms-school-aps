'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import { TrendingUp } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { useTranslation } from '@/hooks/useTranslation';

type CatalogFormationStats = {
  hoursDisplay: string;
  traineesDisplay: string;
  priceAmountText: string;
  priceFormatted: string;
  successDisplay: string;
};

type BadgeTone = 'success' | 'warning';

type StatRowItem = {
  total: string;
  label: string;
  badgeLabel: string;
  badgeColor: BadgeTone;
  text: string;
  number: string;
  icon: ReactNode;
};

export type Statistics1StaticPreset = 'tfp-aps' | 'asc-cynophile';

function buildStaticItems(
  t: (key: string) => string,
  preset: Statistics1StaticPreset,
): StatRowItem[] {
  const icon = <TrendingUp />;
  if (preset === 'asc-cynophile') {
    return [
      {
        total: '—',
        label: t('landing.sheets.stats.ascHours.label'),
        badgeLabel: t('landing.sheets.stats.ascHours.badge'),
        badgeColor: 'success',
        text: t('landing.sheets.stats.ascHours.text'),
        number: '',
        icon,
      },
      {
        total: '—',
        label: t('landing.sheets.stats.ascTrainees.label'),
        badgeLabel: t('landing.sheets.stats.ascTrainees.badge'),
        badgeColor: 'success',
        text: t('landing.sheets.stats.ascTrainees.text'),
        number: '',
        icon,
      },
      {
        total: '—',
        label: t('landing.sheets.stats.ascPrice.label'),
        badgeLabel: t('landing.sheets.stats.ascPrice.badge'),
        badgeColor: 'warning',
        text: t('landing.sheets.stats.ascPrice.text'),
        number: '',
        icon,
      },
      {
        total: '—',
        label: t('landing.sheets.stats.ascSuccess.label'),
        badgeLabel: t('landing.sheets.stats.ascSuccess.badge'),
        badgeColor: 'success',
        text: t('landing.sheets.stats.ascSuccess.text'),
        number: '',
        icon,
      },
    ];
  }

  return [
    {
      total: '175h',
      label: t('landing.sheets.stats.hours.label'),
      badgeLabel: t('landing.sheets.stats.hours.badge'),
      badgeColor: 'success',
      text: t('landing.sheets.stats.hours.text'),
      number: '',
      icon,
    },
    {
      total: '4-12',
      label: t('landing.sheets.stats.trainees.label'),
      badgeLabel: t('landing.sheets.stats.trainees.badge'),
      badgeColor: 'success',
      text: t('landing.sheets.stats.trainees.text'),
      number: '',
      icon,
    },
    {
      total: '1190',
      label: t('landing.sheets.stats.price.label'),
      badgeLabel: t('landing.sheets.stats.price.badge'),
      badgeColor: 'warning',
      text: t('landing.sheets.stats.price.text'),
      number: '€',
      icon,
    },
    {
      total: '97%',
      label: t('landing.sheets.stats.success.label'),
      badgeLabel: t('landing.sheets.stats.success.badge'),
      badgeColor: 'success',
      text: t('landing.sheets.stats.success.text'),
      number: '',
      icon,
    },
  ];
}

export function Statistics1({
  catalogSlug,
  staticPreset = 'tfp-aps',
  preloadedStats,
}: {
  catalogSlug?: string | null;
  staticPreset?: Statistics1StaticPreset;
  preloadedStats?: CatalogFormationStats | null;
}) {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CatalogFormationStats | null>(preloadedStats ?? null);
  const [loading, setLoading] = useState(false);

  const useCatalog = Boolean(catalogSlug?.trim());

  useEffect(() => {
    if (preloadedStats) {
      setStats(preloadedStats);
      setLoading(false);
      return;
    }
    setStats(null);
    if (!catalogSlug?.trim()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch(
          `/api/catalog/formation?slug=${encodeURIComponent(catalogSlug.trim())}`,
          { cache: 'no-store' },
        );
        const json = (await res.json()) as {
          stats: CatalogFormationStats | null;
          catalogInactive?: boolean;
        };
        if (!cancelled && json.stats && !json.catalogInactive) {
          setStats(json.stats);
        }
      } catch {
        /* garde les valeurs neutres */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [catalogSlug, preloadedStats]);

  const priceText = t('landing.sheets.stats.price.text');

  const items = useMemo(() => {
    if (useCatalog && loading) {
      return [
        { total: '…', label: '', badgeLabel: '', badgeColor: 'success' as const, text: '', number: '', icon: <TrendingUp /> },
        { total: '…', label: '', badgeLabel: '', badgeColor: 'success' as const, text: '', number: '', icon: <TrendingUp /> },
        { total: '…', label: '', badgeLabel: '', badgeColor: 'warning' as const, text: '', number: '', icon: <TrendingUp /> },
        { total: '…', label: '', badgeLabel: '', badgeColor: 'success' as const, text: '', number: '', icon: <TrendingUp /> },
      ];
    }

    const base = useCatalog && !stats
      ? buildStaticItems(t, staticPreset).map((i) => ({ ...i, total: '—', number: '' }))
      : buildStaticItems(t, staticPreset);
    const row = base.map((i) => ({ ...i }));
    if (!stats) return row;

    if (stats.hoursDisplay) {
      row[0] = { ...row[0], total: stats.hoursDisplay };
    }
    if (stats.traineesDisplay) {
      row[1] = { ...row[1], total: stats.traineesDisplay };
    }
    if (stats.priceAmountText) {
      row[2] = {
        ...row[2],
        total: stats.priceAmountText,
        number: '€',
        badgeLabel: t('landing.sheets.stats.price.badge'),
        text: priceText,
      };
    } else if (stats.priceFormatted) {
      row[2] = {
        ...row[2],
        total: stats.priceFormatted,
        number: '',
        badgeLabel: t('landing.sheets.stats.price.badge'),
        text: priceText,
      };
    }
    if (stats.successDisplay) {
      row[3] = { ...row[3], total: stats.successDisplay };
    }
    return row;
  }, [stats, staticPreset, t, priceText, useCatalog, loading]);

  return (
    <Card className="mb-5 rounded-md bg-accent/70 p-1">
      <CardContent className="rounded-md border border-border bg-background p-0">
        <div className="grid md:grid-cols-4 lg:gap-5">
          {items.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col justify-between gap-5 p-4.5 pb-3.5 ${index > 0 ? 'border-border md:border-s' : ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-semibold text-foreground lg:text-2xl">
                  {item.total}
                  <span className="text-xl font-semibold text-secondary-foreground/30 lg:text-2xl">
                    {item.number}
                  </span>
                </span>
                <span className="text-xs font-normal text-secondary-foreground/70">{item.label}</span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant={item.badgeColor} size="sm" appearance="light" className="w-fit">
                  {item.icon} {item.badgeLabel}
                </Badge>
                <span className="text-xs font-normal text-secondary-foreground">{item.text}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
