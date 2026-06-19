'use client';

import { Suspense } from 'react';
import { BrandedLayout } from '../layouts/branded';
import TwoFactorPageClient from './2fa-page-client';

export default function TwoFactorPageWithLayout() {
  return (
    <BrandedLayout>
      <Suspense fallback={<div className="w-full py-8 text-center text-sm text-muted-foreground">…</div>}>
        <TwoFactorPageClient />
      </Suspense>
    </BrandedLayout>
  );
}
