'use client';

import { BrandedLayout } from '../layouts/branded';
import SigninPageClient from './signin-page-client';

export default function SigninPageWithLayout() {
  return (
    <BrandedLayout>
      <SigninPageClient />
    </BrandedLayout>
  );
}
