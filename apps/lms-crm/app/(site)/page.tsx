'use client';

import dynamic from 'next/dynamic';

const LandingPageShell = dynamic(
  () => import('./landing-page-shell').then((m) => m.LandingPageShell),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen w-full bg-background" data-landing aria-busy="true" />
    ),
  },
);

export default function Page() {
  return <LandingPageShell />;
}
