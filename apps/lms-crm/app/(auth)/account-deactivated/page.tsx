'use client';

import dynamic from 'next/dynamic';

const AccountDeactivatedPage = dynamic(() => import('./account-deactivated-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return <AccountDeactivatedPage />;
}
