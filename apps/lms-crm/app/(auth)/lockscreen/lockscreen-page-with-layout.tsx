'use client';

import { BrandedLayout } from '../layouts/branded';
import LockscreenPageClient from './lockscreen-page-client';

export default function LockscreenPageWithLayout() {
  return (
    <BrandedLayout>
      <LockscreenPageClient />
    </BrandedLayout>
  );
}
