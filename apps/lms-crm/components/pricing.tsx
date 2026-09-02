'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/toggle-group';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  isLandingPricingTab,
  LANDING_PRICING_TAB_EVENT,
  type LandingPricingTab,
} from '@/lib/landing-pricing-navigation';
import { CustomTitle } from './custom/title';
import { CustomSubtitle } from './custom/subtitle';
import { CustomBadge } from './custom/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import {
  LANDING_FORMATION_SORT_ORDER,
  type LandingFormationCategory,
} from '@/lib/landing-formations-catalog';
import type { TranslatedFormation } from '@/lib/use-landing-formation-text';
import dynamic from 'next/dynamic';
import type { PublicCatalogFormationItem } from '@/lib/catalog-public-types';

const CustomerDetailsSheet = dynamic(
  () => import('@/components/customer-details-sheet').then((m) => m.CustomerDetailsSheet),
  { ssr: false, loading: () => null },
);

type Formation = TranslatedFormation;

const PRICING_TABS: LandingFormationCategory[] = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
];

function mapCatalogItemToFormation(item: PublicCatalogFormationItem): Formation {
  return {
    id: item.slug,
    category: item.track,
    featured: item.featured,
    name: item.name,
    tag: item.tag,
    duration: item.duration,
    description: item.description,
    modules: item.modules,
    outcomes: item.outcomes,
  };
}

const Pricing = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTrack, setActiveTrack] = useState<LandingFormationCategory>('surete');
  const [catalogItems, setCatalogItems] = useState<PublicCatalogFormationItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSlug, setDetailSlug] = useState<string | null>(null);
  const [detailName, setDetailName] = useState('');

  const tabFromUrl = searchParams.get('tab');

  useEffect(() => {
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError(false);
    void fetch('/api/catalog/formations', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('fetch failed'))))
      .then((data: { items?: PublicCatalogFormationItem[] }) => {
        if (cancelled) return;
        setCatalogItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true);
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const formations = useMemo(
    () => catalogItems.map(mapCatalogItemToFormation),
    [catalogItems],
  );

  const visibleTabs = useMemo(() => {
    const tracks = new Set(formations.map((f) => f.category));
    return PRICING_TABS.filter((tab) => tracks.has(tab));
  }, [formations]);

  useEffect(() => {
    if (!tabFromUrl || !isLandingPricingTab(tabFromUrl)) return;
    setActiveTrack(tabFromUrl);
  }, [tabFromUrl]);

  useEffect(() => {
    const onTab = (event: Event) => {
      const tab = (event as CustomEvent<LandingPricingTab>).detail;
      if (isLandingPricingTab(tab)) setActiveTrack(tab);
    };
    window.addEventListener(LANDING_PRICING_TAB_EVENT, onTab);
    return () => window.removeEventListener(LANDING_PRICING_TAB_EVENT, onTab);
  }, []);

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.includes(activeTrack)) {
      setActiveTrack(visibleTabs[0]!);
    }
  }, [visibleTabs, activeTrack]);

  const filteredFormations = formations.filter((formation) => formation.category === activeTrack);

  const openFormationSheet = useCallback((slug: string, name: string) => {
    setDetailSlug(slug);
    setDetailName(name);
    setDetailOpen(true);
  }, []);

  const orderedFormations = (() => {
    const sortOrder = LANDING_FORMATION_SORT_ORDER[activeTrack];
    if (sortOrder) {
      return [...filteredFormations].sort(
        (a, b) => sortOrder.indexOf(a.id) - sortOrder.indexOf(b.id),
      );
    }

    const list = [...filteredFormations];
    const featuredIndex = list.findIndex((formation) => formation.featured);
    if (featuredIndex === -1 || list.length < 3) return list;
    const [featured] = list.splice(featuredIndex, 1);
    const middleIndex = Math.floor(list.length / 2);
    list.splice(middleIndex, 0, featured);
    return list;
  })();

  return (
    <section id="pricing" className="scroll-mt-24 py-24 bg-background border-b border-border/50">
      <div className="container mx-auto px-6">
        <motion.div
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center gap-5 text-center"
        >
          <CustomBadge>{t('landing.pricing.badge')}</CustomBadge>
          <CustomTitle>{t('landing.pricing.title')}</CustomTitle>
          <CustomSubtitle className="mb-10">{t('landing.pricing.subtitle')}</CustomSubtitle>

          {visibleTabs.length > 0 ? (
            <ToggleGroup
              type="single"
              value={activeTrack}
              onValueChange={(value) => value && setActiveTrack(value as LandingFormationCategory)}
              className="mb-14 flex w-full max-w-5xl flex-wrap justify-center bg-accent rounded-2xl gap-2 p-2"
            >
              {visibleTabs.map((tab) => (
                <ToggleGroupItem
                  key={tab}
                  value={tab}
                  className="min-w-[130px] px-4 py-2 text-base data-[state=on]:bg-background"
                >
                  {t(`landing.pricing.tabs.${tab}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          ) : null}
        </motion.div>

        {catalogLoading ? (
          <div className="flex justify-center py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" aria-hidden />
            <span className="sr-only">Chargement du catalogue…</span>
          </div>
        ) : catalogError ? (
          <p className="py-16 text-center text-muted-foreground">
            Catalogue temporairement indisponible. Réessayez plus tard.
          </p>
        ) : formations.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            Aucune formation publiée pour le moment.
          </p>
        ) : (
          <div
            className={cn(
              'grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto',
              (activeTrack === 'incendie' ||
                activeTrack === 'habilitation' ||
                activeTrack === 'sst' ||
                activeTrack === 'entreprise' ||
                activeTrack === 'autres') &&
                'md:grid-cols-3 grid-cols-1',
            )}
          >
            {orderedFormations.map((formation, index) => (
              <motion.div
                key={formation.id}
                initial={false}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={cn(
                  'flex flex-col',
                  (activeTrack === 'incendie' ||
                    activeTrack === 'habilitation' ||
                    activeTrack === 'sst') &&
                    index % 3 === 0 &&
                    'md:col-start-1',
                )}
              >
                <Card className="h-full relative border-border hover:border-indigo-500 transition-all duration-300 group">
                  <CardHeader className="text-center py-6 border-b-0">
                    <div className="mb-3">
                      <Badge variant="outline">{formation.tag}</Badge>
                    </div>
                    <CardTitle className="text-2xl font-bold text-foreground">
                      {formation.name}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground mb-5">
                      {formation.description}
                    </CardDescription>
                    <p className="text-sm font-semibold text-foreground">
                      {t('landing.pricing.card.durationPrefix')} {formation.duration}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4 flex flex-col flex-1">
                    {formation.modules.length > 0 ? (
                      <>
                        <p className="text-sm font-medium">
                          {t('landing.pricing.card.modulesLabel')}
                        </p>
                        <ul className="space-y-3">
                          {formation.modules.map((module, moduleIndex) => (
                            <li key={moduleIndex} className="flex items-center">
                              <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                              <span className="text-muted-foreground">{module}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}

                    {formation.outcomes.length > 0 ? (
                      <div className="pt-2">
                        <p className="text-sm font-medium mb-2">
                          {t('landing.pricing.card.outcomesLabel')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {formation.outcomes.map((outcome) => (
                            <Badge key={outcome} variant="secondary">
                              {outcome}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-auto pt-6">
                      <motion.div
                        initial={false}
                        whileHover={{ scale: 1.025 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className="w-full cursor-pointer bg-black hover:bg-black/90 text-white dark:bg-white dark:text-black dark:hover:bg-white/90"
                          size="lg"
                          variant="primary"
                          onClick={() => openFormationSheet(formation.id, formation.name)}
                        >
                          {t('landing.pricing.card.cta')}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {detailSlug ? (
        <CustomerDetailsSheet
          open={detailOpen}
          onOpenChange={setDetailOpen}
          formationName={detailName}
          catalogSlug={detailSlug}
        />
      ) : null}
    </section>
  );
};

export default Pricing;
