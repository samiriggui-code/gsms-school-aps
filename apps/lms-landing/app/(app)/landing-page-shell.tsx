'use client';

import dynamic from 'next/dynamic';
import { DEFAULT_LANDING_PAGE_CONFIG } from '@/lib/landing-config-defaults';

const LandingPageClient = dynamic(
  () => import('./landing-page-client').then((mod) => mod.LandingPageClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    ),
  },
);

export function LandingPageShell() {
  return <LandingPageClient initialConfig={DEFAULT_LANDING_PAGE_CONFIG} />;
}
