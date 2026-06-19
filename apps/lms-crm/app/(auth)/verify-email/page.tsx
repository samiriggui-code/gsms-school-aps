'use client';

import dynamic from 'next/dynamic';

const VerifyEmailPage = dynamic(() => import('./verify-email-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return <VerifyEmailPage />;
}
