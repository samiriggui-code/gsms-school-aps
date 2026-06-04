'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  LANDING_FORMATIONS_CATALOG,
  LANDING_FORMATION_SORT_ORDER,
  type LandingFormationCategory,
} from '@/lib/landing-formations-catalog';
import { translateFormation, type TranslatedFormation } from '@/lib/use-landing-formation-text';
import { CustomerDetailsSheet } from '@/components/customer-details-sheet';
import { CATALOG_SLUG } from '@/lib/catalog-formation-slugs';
import { MacApsDetailsSheet } from '@/components/mac-aps-details-sheet';
import { AsraDetailsSheet } from '@/components/asra-details-sheet';
import { OvtDetailsSheet } from '@/components/ovt-details-sheet';
import { MacOvtDetailsSheet } from '@/components/mac-ovt-details-sheet';
import { CynophileDetailsSheet } from '@/components/cynophile-details-sheet';
import { SsiapDetailsSheet } from '@/components/ssiap-details-sheet';
import { BsBeDetailsSheet } from '@/components/bs-be-details-sheet';

import { HabilitationDetailsSheet } from '@/components/habilitation-details-sheet';
import { SstDetailsSheet } from '@/components/sst-details-sheet';
import { EntrepriseDetailsSheet, EntrepriseType } from '@/components/entreprise-details-sheet';
import { AutresDetailsSheet, AutresType } from '@/components/autres-details-sheet';

type Formation = TranslatedFormation;

const PRICING_TABS: LandingFormationCategory[] = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
];

const Pricing = () => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [activeTrack, setActiveTrack] = useState('surete');

  const tabFromUrl = searchParams.get('tab');

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

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMacApsDetailsOpen, setIsMacApsDetailsOpen] = useState(false);
  const [isAsraDetailsOpen, setIsAsraDetailsOpen] = useState(false);
  const [isOvtDetailsOpen, setIsOvtDetailsOpen] = useState(false);
  const [isMacOvtDetailsOpen, setIsMacOvtDetailsOpen] = useState(false);
  const [isAscCynophileOpen, setIsAscCynophileOpen] = useState(false);
  
  // SSIAP States
  const [isSsiap1InitialOpen, setIsSsiap1InitialOpen] = useState(false);
  const [isSsiap1RecyclageOpen, setIsSsiap1RecyclageOpen] = useState(false);
  const [isSsiap1RanOpen, setIsSsiap1RanOpen] = useState(false);
  const [isSsiap2InitialOpen, setIsSsiap2InitialOpen] = useState(false);
  const [isSsiap2RecyclageOpen, setIsSsiap2RecyclageOpen] = useState(false);
  const [isSsiap2RanOpen, setIsSsiap2RanOpen] = useState(false);
  const [isSsiap3InitialOpen, setIsSsiap3InitialOpen] = useState(false);
  const [isSsiap3RecyclageOpen, setIsSsiap3RecyclageOpen] = useState(false);
  const [isSsiap3RanOpen, setIsSsiap3RanOpen] = useState(false);
  
  // Habilitation States
  const [isH0B0Open, setIsH0B0Open] = useState(false);
  const [isBrOpen, setIsBrOpen] = useState(false);
  const [isBsBeOpen, setIsBsBeOpen] = useState(false);

  // SST States
  const [isSstInitialOpen, setIsSstInitialOpen] = useState(false);
  const [isMacSstOpen, setIsMacSstOpen] = useState(false);
  const [isStuOpen, setIsStuOpen] = useState(false);
  const [isSstEntrepriseOpen, setIsSstEntrepriseOpen] = useState(false);

  // Entreprise States
  const [isGuideFileOpen, setIsGuideFileOpen] = useState(false);
  const [isAriOpen, setIsAriOpen] = useState(false);
  const [isManipulationExtincteurOpen, setIsManipulationExtincteurOpen] = useState(false);
  const [isEsiOpen, setIsEsiOpen] = useState(false);
  const [isSsiOpen, setIsSsiOpen] = useState(false);
  const [isCssiOpen, setIsCssiOpen] = useState(false);
  const [isEvacuationIncendieOpen, setIsEvacuationIncendieOpen] = useState(false);
  const [isEpiOpen, setIsEpiOpen] = useState(false);

  // Autres States
  const [isCommissionSecuriteOpen, setIsCommissionSecuriteOpen] = useState(false);
  const [isIntraEntrepriseOpen, setIsIntraEntrepriseOpen] = useState(false);

  const formations = useMemo(
    () =>
      LANDING_FORMATIONS_CATALOG.map((entry) =>
        translateFormation(t, entry.id, entry.category, entry.featured),
      ),
    [t],
  );

  const filteredFormations = formations.filter(
    (formation) => formation.category === activeTrack
  );

  const openFormationSheet = useCallback(
    (id: string) => {
      const openers: Record<string, () => void> = {
        'tfp-aps': () => setIsDetailsOpen(true),
        'mac-aps': () => setIsMacApsDetailsOpen(true),
        'asra-d': () => setIsAsraDetailsOpen(true),
        ovt: () => setIsOvtDetailsOpen(true),
        'mac-ovt': () => setIsMacOvtDetailsOpen(true),
        'asc-cynophile': () => setIsAscCynophileOpen(true),
        'h0-b0': () => setIsH0B0Open(true),
        'bs-be-manoeuvre': () => setIsBsBeOpen(true),
        br: () => setIsBrOpen(true),
        'sst-initial': () => setIsSstInitialOpen(true),
        'mac-sst': () => setIsMacSstOpen(true),
        stu: () => setIsStuOpen(true),
        'sst-entreprise': () => setIsSstEntrepriseOpen(true),
        'ssiap-1-initial': () => setIsSsiap1InitialOpen(true),
        'ssiap-1-recyclage': () => setIsSsiap1RecyclageOpen(true),
        'ssiap-1-ran': () => setIsSsiap1RanOpen(true),
        'ssiap-2-initial': () => setIsSsiap2InitialOpen(true),
        'ssiap-2-recyclage': () => setIsSsiap2RecyclageOpen(true),
        'ssiap-2-ran': () => setIsSsiap2RanOpen(true),
        'ssiap-3-initial': () => setIsSsiap3InitialOpen(true),
        'ssiap-3-recyclage': () => setIsSsiap3RecyclageOpen(true),
        'ssiap-3-ran': () => setIsSsiap3RanOpen(true),
        'guide-file': () => setIsGuideFileOpen(true),
        ari: () => setIsAriOpen(true),
        'manipulation-extincteur': () => setIsManipulationExtincteurOpen(true),
        esi: () => setIsEsiOpen(true),
        ssi: () => setIsSsiOpen(true),
        cssi: () => setIsCssiOpen(true),
        'evacuation-incendie': () => setIsEvacuationIncendieOpen(true),
        epi: () => setIsEpiOpen(true),
        'commission-securite': () => setIsCommissionSecuriteOpen(true),
        'intra-entreprise': () => setIsIntraEntrepriseOpen(true),
      };
      openers[id]?.();
    },
    [],
  );

  const orderedFormations = (() => {
    const sortOrder = LANDING_FORMATION_SORT_ORDER[activeTrack as LandingFormationCategory];
    if (sortOrder) {
      return filteredFormations.sort(
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
        {/* Header */}
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

          <ToggleGroup
            type="single"
            value={activeTrack}
            onValueChange={(value) => value && setActiveTrack(value)}
            className="mb-14 flex w-full max-w-5xl flex-wrap justify-center bg-accent rounded-2xl gap-2 p-2"
          >
            {PRICING_TABS.map((tab) => (
              <ToggleGroupItem
                key={tab}
                value={tab}
                className="min-w-[130px] px-4 py-2 text-base data-[state=on]:bg-background"
              >
                {t(`landing.pricing.tabs.${tab}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </motion.div>

        <div className={cn(
          "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto",
          (activeTrack === 'incendie' || activeTrack === 'habilitation' || activeTrack === 'sst' || activeTrack === 'entreprise' || activeTrack === 'autres') && "md:grid-cols-3 grid-cols-1"
        )}>
          {orderedFormations.map((formation, index) => (
            <motion.div
              key={formation.id}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className={cn(
                "flex flex-col",
                (activeTrack === 'incendie' || activeTrack === 'habilitation' || activeTrack === 'sst') && index % 3 === 0 && "md:col-start-1"
              )}
            >
              <Card className="h-full relative border-border hover:border-indigo-500 transition-all duration-300 group"
              >
                <CardHeader className="text-center py-6 border-b-0">
                  <div className="mb-3">
                    <Badge variant="outline">{formation.tag}</Badge>
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">{formation.name}</CardTitle>
                  <CardDescription className="text-muted-foreground mb-5">
                    {formation.description}
                  </CardDescription>
                  <p className="text-sm font-semibold text-foreground">
                    {t('landing.pricing.card.durationPrefix')} {formation.duration}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 flex flex-col flex-1">
                  <p className="text-sm font-medium">{t('landing.pricing.card.modulesLabel')}</p>
                  <ul className="space-y-3">
                    {formation.modules.map((module, moduleIndex) => (
                      <li key={moduleIndex} className="flex items-center">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-muted-foreground">{module}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2">
                    <p className="text-sm font-medium mb-2">{t('landing.pricing.card.outcomesLabel')}</p>
                    <div className="flex flex-wrap gap-2">
                      {formation.outcomes.map((outcome) => (
                        <Badge key={outcome} variant="secondary">{outcome}</Badge>
                      ))}
                    </div>
                  </div>
                  
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
                        onClick={() => openFormationSheet(formation.id)}
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
      </div>

      <CustomerDetailsSheet
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        formationName="TFP APS"
        catalogSlug={CATALOG_SLUG.TFP_APS}
      />

      <MacApsDetailsSheet
        open={isMacApsDetailsOpen}
        onOpenChange={setIsMacApsDetailsOpen}
      />

      <AsraDetailsSheet
        open={isAsraDetailsOpen}
        onOpenChange={setIsAsraDetailsOpen}
      />

      <OvtDetailsSheet
        open={isOvtDetailsOpen}
        onOpenChange={setIsOvtDetailsOpen}
      />

      <MacOvtDetailsSheet
        open={isMacOvtDetailsOpen}
        onOpenChange={setIsMacOvtDetailsOpen}
      />

      <CynophileDetailsSheet
        open={isAscCynophileOpen}
        onOpenChange={setIsAscCynophileOpen}
      />

      {/* Habilitation Sheets */}
      <HabilitationDetailsSheet type="H0/B0" open={isH0B0Open} onOpenChange={setIsH0B0Open} />
      <HabilitationDetailsSheet type="BS / BE Manoeuvre" open={isBsBeOpen} onOpenChange={setIsBsBeOpen} />
      <HabilitationDetailsSheet type="BR" open={isBrOpen} onOpenChange={setIsBrOpen} />

      {/* SST Sheets */}
      <SstDetailsSheet type="SST Initial" open={isSstInitialOpen} onOpenChange={setIsSstInitialOpen} />
      <SstDetailsSheet type="MAC SST" open={isMacSstOpen} onOpenChange={setIsMacSstOpen} />
      <SstDetailsSheet type="STU" open={isStuOpen} onOpenChange={setIsStuOpen} />
      <SstDetailsSheet type="SST Entreprise" open={isSstEntrepriseOpen} onOpenChange={setIsSstEntrepriseOpen} />

      {/* SSIAP Sheets */}
      <SsiapDetailsSheet level={1} type="initial" open={isSsiap1InitialOpen} onOpenChange={setIsSsiap1InitialOpen} />
      <SsiapDetailsSheet level={1} type="recyclage" open={isSsiap1RecyclageOpen} onOpenChange={setIsSsiap1RecyclageOpen} />
      <SsiapDetailsSheet level={1} type="ran" open={isSsiap1RanOpen} onOpenChange={setIsSsiap1RanOpen} />
      
      <SsiapDetailsSheet level={2} type="initial" open={isSsiap2InitialOpen} onOpenChange={setIsSsiap2InitialOpen} />
      <SsiapDetailsSheet level={2} type="recyclage" open={isSsiap2RecyclageOpen} onOpenChange={setIsSsiap2RecyclageOpen} />
      <SsiapDetailsSheet level={2} type="ran" open={isSsiap2RanOpen} onOpenChange={setIsSsiap2RanOpen} />
      
      <SsiapDetailsSheet level={3} type="initial" open={isSsiap3InitialOpen} onOpenChange={setIsSsiap3InitialOpen} />
      <SsiapDetailsSheet level={3} type="recyclage" open={isSsiap3RecyclageOpen} onOpenChange={setIsSsiap3RecyclageOpen} />
      <SsiapDetailsSheet level={3} type="ran" open={isSsiap3RanOpen} onOpenChange={setIsSsiap3RanOpen} />

      {/* Entreprise Sheets */}
      <EntrepriseDetailsSheet type="Guide File / Serre File" open={isGuideFileOpen} onOpenChange={setIsGuideFileOpen} />
      <EntrepriseDetailsSheet type="ARI" open={isAriOpen} onOpenChange={setIsAriOpen} />
      <EntrepriseDetailsSheet type="Manipulation Extincteur" open={isManipulationExtincteurOpen} onOpenChange={setIsManipulationExtincteurOpen} />
      <EntrepriseDetailsSheet type="ESI" open={isEsiOpen} onOpenChange={setIsEsiOpen} />
      <EntrepriseDetailsSheet type="SSI" open={isSsiOpen} onOpenChange={setIsSsiOpen} />
      <EntrepriseDetailsSheet type="CSSI" open={isCssiOpen} onOpenChange={setIsCssiOpen} />
      <EntrepriseDetailsSheet type="Evacuation Incendie" open={isEvacuationIncendieOpen} onOpenChange={setIsEvacuationIncendieOpen} />
      <EntrepriseDetailsSheet type="EPI" open={isEpiOpen} onOpenChange={setIsEpiOpen} />

      {/* Autres Sheets */}
      <AutresDetailsSheet type="Commission de securite" open={isCommissionSecuriteOpen} onOpenChange={setIsCommissionSecuriteOpen} />
      <AutresDetailsSheet type="Formation intra-entreprise securite" open={isIntraEntrepriseOpen} onOpenChange={setIsIntraEntrepriseOpen} />
    </section>
  );
};

export default Pricing;

