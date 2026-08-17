'use client';

import dynamic from 'next/dynamic';
import { BrandedLayout } from '../layouts/branded';

const ResetPasswordPageClient = dynamic(() => import('./reset-password-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return (
    <BrandedLayout>
      <ResetPasswordPageClient />
    </BrandedLayout>
  );
}
