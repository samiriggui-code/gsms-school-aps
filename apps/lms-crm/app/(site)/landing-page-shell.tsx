'use client';

import { DEFAULT_LANDING_PAGE_CONFIG } from '@/lib/landing-config-defaults';
import { LandingPageClient } from './landing-page-client';

export function LandingPageShell() {
  return <LandingPageClient initialConfig={DEFAULT_LANDING_PAGE_CONFIG} />;
}
