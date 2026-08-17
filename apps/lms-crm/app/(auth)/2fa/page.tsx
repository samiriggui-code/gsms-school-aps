'use client';

import dynamic from 'next/dynamic';
import { BrandedLayout } from '../layouts/branded';

const TwoFactorPageClient = dynamic(() => import('./2fa-page-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return (
    <BrandedLayout>
      <TwoFactorPageClient />
    </BrandedLayout>
  );
}
