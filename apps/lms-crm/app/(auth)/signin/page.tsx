'use client';

import dynamic from 'next/dynamic';
import { BrandedLayout } from '../layouts/branded';

const SigninPageClient = dynamic(() => import('./signin-page-client'), {
  ssr: false,
  loading: () => <div className="min-h-screen w-full" aria-busy="true" />,
});

export default function Page() {
  return (
    <BrandedLayout>
      <SigninPageClient />
    </BrandedLayout>
  );
}
