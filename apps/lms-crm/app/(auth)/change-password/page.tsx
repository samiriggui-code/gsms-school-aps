'use client';

import dynamic from 'next/dynamic';
import { BrandedLayout } from '../layouts/branded';

const ChangePasswordPageClient = dynamic(() => import('./change-password-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return (
    <BrandedLayout>
      <ChangePasswordPageClient />
    </BrandedLayout>
  );
}
