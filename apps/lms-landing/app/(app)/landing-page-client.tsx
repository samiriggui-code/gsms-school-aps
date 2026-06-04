'use client';

import { Suspense, useEffect, useState } from 'react';
import type { LandingSectionConfig } from '@repo/database/browser';
import Header from '@/components/header';
import Hero from '@/components/hero';
import TrustedBrands from '@/components/trusted-brands';
import HowItWorks from '@/components/how-it-works';
import Features from '@/components/features';
import Trainers from '@/components/trainers';
import Testimonials from '@/components/testimonials';
import Pricing from '@/components/pricing';
import FAQ from '@/components/faq';
import CallToAction from '@/components/call-to-action';
import Contact from '@/components/contact';
import Footer from '@/components/footer';
import { CentralPreinscriptionSheet } from '@/components/central-preinscription-sheet';
import { MaintenanceView } from './maintenance-view';
import type { LandingPageConfig } from '@/lib/landing-config-defaults';

type Props = {
  initialConfig: LandingPageConfig;
};

export function LandingPageClient({ initialConfig }: Props) {
  const [config, setConfig] = useState(initialConfig);
  const [isPreinscriptionOpen, setIsPreinscriptionOpen] = useState(false);
  const openPreinscription = () => setIsPreinscriptionOpen(true);

  useEffect(() => {
    void fetch('/api/landing/config', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: LandingPageConfig | null) => {
        if (data) setConfig(data);
      })
      .catch(() => {
        /* garde initialConfig */
      });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const hasTab = params.has('tab');
    const hasHash = window.location.hash.length > 1;

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    if (!hasTab && !hasHash) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  if (!config.enabled) {
    return <MaintenanceView />;
  }

  function renderSection(section: LandingSectionConfig, index: number) {
    if (section.enabled === false) return null;

    switch (section.type) {
      case 'hero':
        return <Hero key={`${section.type}-${index}`} onPrimaryCtaClick={openPreinscription} />;
      case 'trusted-brands':
        return <TrustedBrands key={`${section.type}-${index}`} />;
      case 'how-it-works':
        return (
          <HowItWorks key={`${section.type}-${index}`} onStartJourneyClick={openPreinscription} />
        );
      case 'features':
        return <Features key={`${section.type}-${index}`} />;
      case 'trainers':
        return <Trainers key={`${section.type}-${index}`} />;
      case 'testimonials':
        return <Testimonials key={`${section.type}-${index}`} />;
      case 'catalogue':
      case 'pricing':
        return (
          <Suspense key={`${section.type}-${index}`} fallback={null}>
            <Pricing />
          </Suspense>
        );
      case 'faq':
        return <FAQ key={`${section.type}-${index}`} />;
      case 'call-to-action':
        return <CallToAction key={`${section.type}-${index}`} />;
      case 'contact':
        return <Contact key={`${section.type}-${index}`} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen">
      <Header onSignupClick={openPreinscription} />
      {config.sections.map(renderSection)}
      <Footer />
      <CentralPreinscriptionSheet open={isPreinscriptionOpen} onOpenChange={setIsPreinscriptionOpen} />
    </div>
  );
}
