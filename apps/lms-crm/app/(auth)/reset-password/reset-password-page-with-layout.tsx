'use client';

import { BrandedLayout } from '../layouts/branded';
import ResetPasswordPageClient from './reset-password-client';

export default function ResetPasswordPageWithLayout() {
  return (
    <BrandedLayout>
      <ResetPasswordPageClient />
    </BrandedLayout>
  );
}
