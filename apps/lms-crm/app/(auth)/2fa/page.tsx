'use client';

import dynamic from 'next/dynamic';

const TwoFactorPage = dynamic(() => import('./2fa-page-with-layout'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return <TwoFactorPage />;
}
